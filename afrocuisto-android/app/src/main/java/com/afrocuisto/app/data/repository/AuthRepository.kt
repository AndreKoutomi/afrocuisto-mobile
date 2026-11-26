package com.afrocuisto.app.data.repository

import android.content.Context
import android.net.Uri
import android.util.Base64
import android.util.Patterns
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.afrocuisto.app.BuildConfig
import com.afrocuisto.app.data.model.MarketCurrency
import com.afrocuisto.app.data.model.ShoppingItem
import com.afrocuisto.app.data.security.SecureTokenVault
import com.afrocuisto.app.ui.screens.aichef.GeminiVoicePreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.put
import okhttp3.ConnectionSpec
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.util.Locale
import java.util.concurrent.TimeUnit

private val Context.afroAuthDataStore by preferencesDataStore(name = "afrocuisto_auth_session")

enum class AuthStatus(val id: String) {
    GUEST("guest"),
    AUTHENTICATED("authenticated");

    companion object {
        fun fromId(id: String?): AuthStatus =
            entries.firstOrNull { it.id == id } ?: GUEST
    }
}

data class AuthSessionState(
    val status: AuthStatus = AuthStatus.GUEST,
    val userId: String = "",
    val email: String = "",
    val displayName: String = "",
    val accessToken: String = "",
    val refreshToken: String = "",
    val expiresAtEpochSec: Long = 0L,
    val hasCompletedAuthGate: Boolean = false,
    val isEmailVerified: Boolean = true
) {
    val isAuthenticated: Boolean
        get() = status == AuthStatus.AUTHENTICATED && accessToken.isNotBlank() && userId.isNotBlank()
}

sealed interface AuthResult {
    data class Success(val session: AuthSessionState, val message: String? = null) : AuthResult
    data class EmailConfirmationRequired(val email: String, val message: String) : AuthResult
    data class Error(val message: String) : AuthResult
}

enum class PasswordStrength(val level: Int, val label: String) {
    EMPTY(0, ""),
    WEAK(1, "Faible"),
    MEDIUM(2, "Moyen"),
    STRONG(3, "Maximale")
}

data class PasswordCriteria(
    val hasMinLength: Boolean = false,
    val hasUpperAndLower: Boolean = false,
    val hasDigit: Boolean = false,
    val hasSpecialChar: Boolean = false,
    val isNotCommon: Boolean = true
) {
    val metCount: Int
        get() = listOf(hasMinLength, hasUpperAndLower, hasDigit, hasSpecialChar).count { it }

    val isStrongEnough: Boolean
        get() = hasMinLength && hasUpperAndLower && hasDigit && hasSpecialChar && isNotCommon
}

object AuthValidation {
    private val emailRegex = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
    private val controlOrHtmlRegex = Regex("[<>\\p{Cntrl}]")

    private val commonCompromisedPasswords = setOf(
        "12345678", "123456789", "1234567890", "password", "password1", "password123",
        "azerty123", "azertyuiop", "qwerty123", "afrocuisto", "afrocuisto1", "afrocuisto123",
        "motdepasse", "motdepasse1", "bienvenue1", "admin123", "iloveyou1", "00000000"
    )

    fun normalizeEmail(email: String): String = email.trim().lowercase(Locale.ROOT)

    fun sanitizeDisplayName(name: String): String =
        name.replace(controlOrHtmlRegex, "").trim().take(60)

    fun isValidEmail(email: String): Boolean {
        val normalized = normalizeEmail(email)
        if (normalized.isEmpty() || normalized.length > 254) return false
        val pattern = Patterns.EMAIL_ADDRESS
        return if (pattern != null) {
            pattern.matcher(normalized).matches()
        } else {
            emailRegex.matches(normalized)
        }
    }

    fun inspectPasswordCriteria(
        password: String,
        email: String = "",
        displayName: String = ""
    ): PasswordCriteria {
        if (password.isEmpty()) return PasswordCriteria()
        val lowerPwd = password.lowercase(Locale.ROOT)
        val emailLocal = normalizeEmail(email).substringBefore("@").takeIf { it.length >= 3 }
        val cleanName = sanitizeDisplayName(displayName).lowercase(Locale.ROOT).takeIf { it.length >= 3 }
        val allSameChar = password.length >= 4 && password.all { it == password.first() }

        val compromised = lowerPwd in commonCompromisedPasswords ||
            allSameChar ||
            (emailLocal != null && emailLocal in lowerPwd) ||
            (cleanName != null && cleanName in lowerPwd)

        return PasswordCriteria(
            hasMinLength = password.length in 8..128,
            hasUpperAndLower = password.any { it.isUpperCase() } && password.any { it.isLowerCase() },
            hasDigit = password.any { it.isDigit() },
            hasSpecialChar = password.any { !it.isLetterOrDigit() && !it.isWhitespace() },
            isNotCommon = !compromised
        )
    }

    fun evaluatePasswordStrength(
        password: String,
        email: String = "",
        displayName: String = ""
    ): PasswordStrength {
        if (password.isEmpty()) return PasswordStrength.EMPTY
        val criteria = inspectPasswordCriteria(password, email, displayName)
        if (!criteria.isNotCommon || password.length < 8) return PasswordStrength.WEAK
        return when {
            criteria.metCount <= 2 -> PasswordStrength.WEAK
            criteria.metCount == 3 -> PasswordStrength.MEDIUM
            else -> PasswordStrength.STRONG
        }
    }

    fun validateRegistrationPassword(
        password: String,
        email: String,
        displayName: String
    ): String? {
        if (password.length < 8) {
            return "8 caractères minimum requis pour protéger votre compte."
        }
        if (password.length > 128) {
            return "Le mot de passe ne doit pas dépasser 128 caractères."
        }
        if (password.any { it.isWhitespace() }) {
            return "Le mot de passe ne doit pas contenir d'espaces."
        }
        val criteria = inspectPasswordCriteria(password, email, displayName)
        if (!criteria.hasUpperAndLower) {
            return "Ajoutez au moins une lettre majuscule et une minuscule."
        }
        if (!criteria.hasDigit) {
            return "Ajoutez au moins un chiffre."
        }
        if (!criteria.hasSpecialChar) {
            return "Ajoutez au moins un caractère spécial (ex : ! @ # $ % *)."
        }
        if (!criteria.isNotCommon) {
            return "Ce mot de passe est trop prévisible ou contient votre nom/e-mail."
        }
        return null
    }

    fun mapSupabaseError(rawBody: String?, statusCode: Int): String {
        val lower = rawBody.orEmpty().lowercase(Locale.ROOT)
        return when {
            "invalid login credentials" in lower || "invalid_credentials" in lower ->
                "Identifiants incorrects. Vérifiez votre adresse e-mail et votre mot de passe."
            "email not confirmed" in lower || "email_not_confirmed" in lower ->
                "Votre adresse e-mail n'est pas encore confirmée. Ouvrez le lien reçu par e-mail."
            "user already registered" in lower || "already been registered" in lower || "user_already_exists" in lower ->
                "Un compte existe déjà avec cette adresse e-mail."
            "weak_password" in lower || "pwned" in lower || "compromised" in lower ->
                "Ce mot de passe est trop courant. Choisissez un mot de passe unique et robuste."
            "unable to validate email" in lower || "invalid_email" in lower ->
                "Veuillez saisir une adresse e-mail valide."
            "rate limit" in lower || "over_email_send_rate_limit" in lower || statusCode == 429 ->
                "Trop de tentatives rapprochées. Patientez une minute par mesure de sécurité."
            statusCode in 500..599 ->
                "Le service est momentanément indisponible. Réessayez dans un instant."
            else -> "Impossible de finaliser l'opération. Vérifiez vos informations et réessayez."
        }
    }
}

class AuthRepository(
    context: Context,
    private val userPreferencesRepository: UserPreferencesRepository
) {
    private val appContext = context.applicationContext
    private val json = Json { ignoreUnknownKeys = true }
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    private val refreshMutex = Mutex()

    // Hardened HTTPS-only OkHttpClient using TLS 1.3 / modern AEAD cipher suites & zero HTTP caching
    private val httpClient = OkHttpClient.Builder()
        .connectionSpecs(listOf(ConnectionSpec.RESTRICTED_TLS, ConnectionSpec.MODERN_TLS))
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .retryOnConnectionFailure(false)
        .cache(null)
        .build()

    private object Keys {
        val STATUS = stringPreferencesKey("auth_status")
        val USER_ID = stringPreferencesKey("auth_user_id")
        val EMAIL = stringPreferencesKey("auth_email")
        val DISPLAY_NAME = stringPreferencesKey("auth_display_name")
        val ACCESS_TOKEN_ENC = stringPreferencesKey("auth_access_token_v1_enc")
        val REFRESH_TOKEN_ENC = stringPreferencesKey("auth_refresh_token_v1_enc")
        val EXPIRES_AT_SEC = longPreferencesKey("auth_expires_at_sec")
        val AUTH_GATE_COMPLETED = booleanPreferencesKey("auth_gate_completed")
        val EMAIL_VERIFIED = booleanPreferencesKey("auth_email_verified")
        val FAILED_ATTEMPTS = intPreferencesKey("auth_failed_attempts")
        val LOCKOUT_UNTIL_MS = longPreferencesKey("auth_lockout_until_ms")
        val LAST_RESET_MS = longPreferencesKey("auth_last_pw_reset_ms")
        val PKCE_VERIFIER_ENC = stringPreferencesKey("auth_pkce_verifier_v1_enc")
        val PKCE_CREATED_AT_MS = longPreferencesKey("auth_pkce_created_at_ms")
    }

    val sessionFlow: Flow<AuthSessionState> = appContext.afroAuthDataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs ->
            val decryptedAccess = SecureTokenVault.decrypt(prefs[Keys.ACCESS_TOKEN_ENC])
            val decryptedRefresh = SecureTokenVault.decrypt(prefs[Keys.REFRESH_TOKEN_ENC])
            val rawStatus = AuthStatus.fromId(prefs[Keys.STATUS])
            val effectiveStatus = if (rawStatus == AuthStatus.AUTHENTICATED && decryptedAccess.isBlank()) {
                AuthStatus.GUEST
            } else {
                rawStatus
            }
            AuthSessionState(
                status = effectiveStatus,
                userId = prefs[Keys.USER_ID].orEmpty(),
                email = prefs[Keys.EMAIL].orEmpty(),
                displayName = prefs[Keys.DISPLAY_NAME].orEmpty(),
                accessToken = decryptedAccess,
                refreshToken = decryptedRefresh,
                expiresAtEpochSec = prefs[Keys.EXPIRES_AT_SEC] ?: 0L,
                hasCompletedAuthGate = prefs[Keys.AUTH_GATE_COMPLETED] ?: hasCompletedAuthGateSync(),
                isEmailVerified = prefs[Keys.EMAIL_VERIFIED] ?: true
            )
        }

    fun hasCompletedAuthGateSync(): Boolean =
        appContext.getSharedPreferences(SYNC_PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(SYNC_KEY_AUTH_GATE, false) &&
            appContext.getSharedPreferences(SYNC_PREFS_NAME, Context.MODE_PRIVATE)
                .getBoolean(SYNC_KEY_IS_AUTHENTICATED, false)

    private fun setAuthGateSync(completed: Boolean) {
        appContext.getSharedPreferences(SYNC_PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(SYNC_KEY_AUTH_GATE, completed)
            .putBoolean(SYNC_KEY_IS_AUTHENTICATED, completed)
            .apply()
    }

    private fun secureBaseUrl(): String? {
        val raw = BuildConfig.SUPABASE_URL.trim().trimEnd('/')
        if (!raw.startsWith("https://") || BuildConfig.SUPABASE_ANON_KEY.isBlank()) return null
        return raw
    }

    suspend fun getRemainingLockoutSeconds(): Int {
        val prefs = appContext.afroAuthDataStore.data.catch { emit(emptyPreferences()) }.first()
        val until = prefs[Keys.LOCKOUT_UNTIL_MS] ?: 0L
        val remainingMs = until - System.currentTimeMillis()
        return if (remainingMs > 0L) ((remainingMs + 999L) / 1000L).toInt() else 0
    }

    private suspend fun recordFailedSignInAttempt(): Int {
        var lockoutSec = 0
        appContext.afroAuthDataStore.edit { prefs ->
            val attempts = (prefs[Keys.FAILED_ATTEMPTS] ?: 0) + 1
            prefs[Keys.FAILED_ATTEMPTS] = attempts
            if (attempts >= MAX_FREE_ATTEMPTS) {
                val tier = (attempts - MAX_FREE_ATTEMPTS).coerceAtMost(3)
                lockoutSec = 30 * (1 shl tier) // 30s -> 60s -> 120s -> 240s
                prefs[Keys.LOCKOUT_UNTIL_MS] = System.currentTimeMillis() + lockoutSec * 1000L
            }
        }
        return lockoutSec
    }

    private suspend fun clearFailedSignInAttempts() {
        appContext.afroAuthDataStore.edit { prefs ->
            prefs.remove(Keys.FAILED_ATTEMPTS)
            prefs.remove(Keys.LOCKOUT_UNTIL_MS)
        }
    }

    suspend fun continueAsGuest() {
        setAuthGateSync(true)
        appContext.afroAuthDataStore.edit { prefs ->
            prefs[Keys.STATUS] = AuthStatus.GUEST.id
            prefs[Keys.AUTH_GATE_COMPLETED] = true
        }
    }

    suspend fun signIn(email: String, password: String): AuthResult = withContext(Dispatchers.IO) {
        val remainingLock = getRemainingLockoutSeconds()
        if (remainingLock > 0) {
            return@withContext AuthResult.Error(
                "Compte temporairement protégé après plusieurs échecs. Réessayez dans ${remainingLock}s."
            )
        }

        val cleanEmail = AuthValidation.normalizeEmail(email)
        if (!AuthValidation.isValidEmail(cleanEmail)) {
            return@withContext AuthResult.Error("Veuillez saisir une adresse e-mail valide.")
        }
        if (password.isBlank() || password.length > 128) {
            return@withContext AuthResult.Error("Veuillez saisir votre mot de passe.")
        }
        val baseUrl = secureBaseUrl()
            ?: return@withContext AuthResult.Error("Connexion sécurisée indisponible sur cette version.")

        val payload = buildJsonObject {
            put("email", cleanEmail)
            put("password", password)
        }.toString()

        val request = Request.Builder()
            .url("$baseUrl/auth/v1/token?grant_type=password")
            .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .addHeader("Content-Type", "application/json")
            .addHeader("Cache-Control", "no-store")
            .addHeader("Pragma", "no-cache")
            .addHeader("X-Client-Info", "afrocuisto-android")
            .post(payload.toRequestBody(jsonMediaType))
            .build()

        try {
            httpClient.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string()
                if (!response.isSuccessful || bodyStr.isNullOrBlank()) {
                    if (response.code in listOf(400, 401, 403)) {
                        val lockSec = recordFailedSignInAttempt()
                        if (lockSec > 0) {
                            return@withContext AuthResult.Error(
                                "Trop d'essais incorrects. Accès verrouillé pendant ${lockSec}s par sécurité."
                            )
                        }
                    }
                    return@withContext AuthResult.Error(
                        AuthValidation.mapSupabaseError(bodyStr, response.code)
                    )
                }

                val session = parseAuthenticatedSession(bodyStr, cleanEmail, fallbackName = null)
                    ?: return@withContext AuthResult.Error("Réponse d'authentification incomplète.")

                clearFailedSignInAttempts()
                persistSession(session)
                val allowed = syncProfileFromRemote(session)
                if (!allowed) {
                    wipeLocalSession()
                    return@withContext AuthResult.Error("Ce compte est suspendu. Contactez l'équipe AfroCuisto.")
                }

                AuthResult.Success(session, "Connexion sécurisée réussie")
            }
        } catch (_: IOException) {
            AuthResult.Error("Hors ligne")
        } catch (_: Exception) {
            AuthResult.Error("Impossible de vérifier vos identifiants pour le moment.")
        }
    }

    suspend fun signUp(
        name: String,
        email: String,
        password: String,
        roleTitle: String,
        favoriteTerroir: String,
        diasporaSubstitutesFirst: Boolean
    ): AuthResult = withContext(Dispatchers.IO) {
        val cleanName = AuthValidation.sanitizeDisplayName(name)
        val cleanEmail = AuthValidation.normalizeEmail(email)
        val cleanRole = AuthValidation.sanitizeDisplayName(roleTitle).ifBlank { "Gourmet Passionné" }
        val cleanTerroir = AuthValidation.sanitizeDisplayName(favoriteTerroir).ifBlank { "Bénin" }

        if (cleanName.length < 2) {
            return@withContext AuthResult.Error("Saisissez un nom ou pseudo valide (2 caractères min.).")
        }
        if (!AuthValidation.isValidEmail(cleanEmail)) {
            return@withContext AuthResult.Error("Veuillez saisir une adresse e-mail valide.")
        }
        val passwordValidationError = AuthValidation.validateRegistrationPassword(
            password = password,
            email = cleanEmail,
            displayName = cleanName
        )
        if (passwordValidationError != null) {
            return@withContext AuthResult.Error(passwordValidationError)
        }
        val baseUrl = secureBaseUrl()
            ?: return@withContext AuthResult.Error("Service d'inscription indisponible sur cette version.")

        val payload = buildJsonObject {
            put("email", cleanEmail)
            put("password", password)
            put(
                "data",
                buildJsonObject {
                    put("display_name", cleanName)
                    put("name", cleanName)
                    put("role_title", cleanRole)
                    put("favorite_terroir", cleanTerroir)
                    put("diaspora_substitutes_first", diasporaSubstitutesFirst)
                }
            )
        }.toString()

        val request = Request.Builder()
            .url("$baseUrl/auth/v1/signup")
            .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .addHeader("Content-Type", "application/json")
            .addHeader("Cache-Control", "no-store")
            .addHeader("Pragma", "no-cache")
            .addHeader("X-Client-Info", "afrocuisto-android")
            .post(payload.toRequestBody(jsonMediaType))
            .build()

        try {
            httpClient.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string()
                if (!response.isSuccessful || bodyStr.isNullOrBlank()) {
                    return@withContext AuthResult.Error(
                        AuthValidation.mapSupabaseError(bodyStr, response.code)
                    )
                }

                applyRegistrationPreferencesLocally(
                    name = cleanName,
                    roleTitle = cleanRole,
                    favoriteTerroir = cleanTerroir,
                    diasporaSubstitutesFirst = diasporaSubstitutesFirst
                )

                val session = parseAuthenticatedSession(bodyStr, cleanEmail, fallbackName = cleanName)
                if (session != null) {
                    clearFailedSignInAttempts()
                    persistSession(session)
                    AuthResult.Success(session, "Compte créé avec succès !")
                } else {
                    AuthResult.EmailConfirmationRequired(
                        email = cleanEmail,
                        message = "Un lien de vérification sécurisé vient d'être envoyé à $cleanEmail. Confirmez votre adresse puis connectez-vous."
                    )
                }
            }
        } catch (_: IOException) {
            AuthResult.Error("Hors ligne")
        } catch (_: Exception) {
            AuthResult.Error("Impossible de finaliser la création du compte pour le moment.")
        }
    }

    suspend fun sendPasswordReset(email: String): AuthResult = withContext(Dispatchers.IO) {
        val cleanEmail = AuthValidation.normalizeEmail(email)
        if (!AuthValidation.isValidEmail(cleanEmail)) {
            return@withContext AuthResult.Error("Veuillez saisir une adresse e-mail valide.")
        }
        val baseUrl = secureBaseUrl()
            ?: return@withContext AuthResult.Error("Service momentanément indisponible.")

        val prefs = appContext.afroAuthDataStore.data.catch { emit(emptyPreferences()) }.first()
        val lastReset = prefs[Keys.LAST_RESET_MS] ?: 0L
        val elapsedSec = (System.currentTimeMillis() - lastReset) / 1000L
        if (elapsedSec in 0..59) {
            return@withContext AuthResult.Error(
                "Veuillez patienter ${60 - elapsedSec}s avant de demander un nouveau lien."
            )
        }

        val payload = buildJsonObject {
            put("email", cleanEmail)
        }.toString()

        val request = Request.Builder()
            .url("$baseUrl/auth/v1/recover")
            .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .addHeader("Content-Type", "application/json")
            .addHeader("Cache-Control", "no-store")
            .post(payload.toRequestBody(jsonMediaType))
            .build()

        try {
            httpClient.newCall(request).execute().use { response ->
                if (response.code == 429) {
                    return@withContext AuthResult.Error(
                        "Trop de demandes de réinitialisation. Réessayez dans quelques minutes."
                    )
                }
                appContext.afroAuthDataStore.edit { p ->
                    p[Keys.LAST_RESET_MS] = System.currentTimeMillis()
                }
                // Anti-enumeration response: identical message whether account exists or not
                AuthResult.Success(
                    session = sessionFlow.first(),
                    message = "Si un compte est associé à $cleanEmail, un lien sécurisé de réinitialisation vient d'être envoyé."
                )
            }
        } catch (_: IOException) {
            AuthResult.Error("Hors ligne")
        } catch (_: Exception) {
            AuthResult.Error("Impossible d'envoyer la demande pour le moment.")
        }
    }

    /**
     * Exchanges a Google OIDC `id_token` (+ raw nonce) obtained from Android `CredentialManager`
     * with Supabase Auth (`/auth/v1/token?grant_type=id_token`).
     */
    suspend fun signInWithGoogleIdToken(
        idToken: String,
        rawNonce: String?,
        fallbackName: String? = null,
        fallbackAvatarUrl: String? = null
    ): AuthResult = withContext(Dispatchers.IO) {
        if (idToken.isBlank()) {
            return@withContext AuthResult.Error("Jeton Google invalide.")
        }
        val baseUrl = secureBaseUrl()
            ?: return@withContext AuthResult.Error("Connexion sécurisée indisponible sur cette version.")

        val payload = buildJsonObject {
            put("provider", "google")
            put("id_token", idToken)
            if (!rawNonce.isNullOrBlank()) {
                put("nonce", rawNonce)
            }
        }.toString()

        val request = Request.Builder()
            .url("$baseUrl/auth/v1/token?grant_type=id_token")
            .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .addHeader("Content-Type", "application/json")
            .addHeader("Cache-Control", "no-store")
            .addHeader("Pragma", "no-cache")
            .addHeader("X-Client-Info", "afrocuisto-android")
            .post(payload.toRequestBody(jsonMediaType))
            .build()

        try {
            httpClient.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string()
                if (!response.isSuccessful || bodyStr.isNullOrBlank()) {
                    return@withContext AuthResult.Error(
                        AuthValidation.mapSupabaseError(bodyStr, response.code)
                    )
                }

                val session = parseAuthenticatedSession(
                    bodyStr = bodyStr,
                    fallbackEmail = "",
                    fallbackName = fallbackName
                ) ?: return@withContext AuthResult.Error("Réponse d'authentification Google incomplète.")

                clearFailedSignInAttempts()
                persistSession(session)
                val allowed = syncProfileFromRemote(
                    session = session,
                    fallbackAvatarUrl = fallbackAvatarUrl ?: extractMetadataAvatar(bodyStr)
                )
                if (!allowed) {
                    wipeLocalSession()
                    return@withContext AuthResult.Error("Ce compte est suspendu. Contactez l'équipe AfroCuisto.")
                }

                AuthResult.Success(session, "Connecté avec Google")
            }
        } catch (_: IOException) {
            AuthResult.Error("Hors ligne")
        } catch (_: Exception) {
            AuthResult.Error("Impossible de finaliser la connexion Google pour le moment.")
        }
    }

    /**
     * Generates an RFC 7636 PKCE `code_verifier` (encrypted via Android Keystore AES-256-GCM)
     * and returns the Supabase Google OAuth 2.0 `S256` authorization URI.
     */
    suspend fun prepareGooglePkceAuthorizeUri(): Uri? = withContext(Dispatchers.IO) {
        val baseUrl = secureBaseUrl() ?: return@withContext null
        val verifierBytes = ByteArray(32)
        SecureRandom().nextBytes(verifierBytes)
        val codeVerifier = Base64.encodeToString(
            verifierBytes,
            Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
        )
        val challengeBytes = MessageDigest.getInstance("SHA-256")
            .digest(codeVerifier.toByteArray(Charsets.US_ASCII))
        val codeChallenge = Base64.encodeToString(
            challengeBytes,
            Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
        )

        val encryptedVerifier = SecureTokenVault.encrypt(codeVerifier)
        if (encryptedVerifier.isBlank()) return@withContext null

        appContext.afroAuthDataStore.edit { prefs ->
            prefs[Keys.PKCE_VERIFIER_ENC] = encryptedVerifier
            prefs[Keys.PKCE_CREATED_AT_MS] = System.currentTimeMillis()
        }

        Uri.parse("$baseUrl/auth/v1/authorize")
            .buildUpon()
            .appendQueryParameter("provider", "google")
            .appendQueryParameter("redirect_to", OAUTH_REDIRECT_URI)
            .appendQueryParameter("code_challenge", codeChallenge)
            .appendQueryParameter("code_challenge_method", "s256")
            .appendQueryParameter("prompt", "select_account")
            .build()
    }

    /**
     * Completes an incoming OAuth deep-link callback (`com.afrocuisto.app://auth-callback`)
     * using single-use PKCE code exchange (`grant_type=pkce`) or verified token fragment fallback.
     */
    suspend fun completeOAuthCallback(callbackUri: Uri): AuthResult = withContext(Dispatchers.IO) {
        val baseUrl = secureBaseUrl()
            ?: return@withContext AuthResult.Error("Connexion sécurisée indisponible.")

        val prefs = appContext.afroAuthDataStore.data.catch { emit(emptyPreferences()) }.first()
        val storedVerifier = SecureTokenVault.decrypt(prefs[Keys.PKCE_VERIFIER_ENC])
        val createdAtMs = prefs[Keys.PKCE_CREATED_AT_MS] ?: 0L

        // Single-use: immediately wipe PKCE verifier from storage
        appContext.afroAuthDataStore.edit { p ->
            p.remove(Keys.PKCE_VERIFIER_ENC)
            p.remove(Keys.PKCE_CREATED_AT_MS)
        }

        val errorParam = callbackUri.getQueryParameter("error_description")
            ?: callbackUri.getQueryParameter("error")
        if (!errorParam.isNullOrBlank()) {
            return@withContext AuthResult.Error("Connexion Google annulée ou refusée.")
        }

        val authCode = callbackUri.getQueryParameter("code")
        if (!authCode.isNullOrBlank()) {
            val isFresh = System.currentTimeMillis() - createdAtMs <= 10 * 60 * 1000L
            if (storedVerifier.isBlank() || !isFresh) {
                return@withContext AuthResult.Error("La session d'authentification Google a expiré. Veuillez réessayer.")
            }

            val payload = buildJsonObject {
                put("auth_code", authCode)
                put("code_verifier", storedVerifier)
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/auth/v1/token?grant_type=pkce")
                .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                .addHeader("Content-Type", "application/json")
                .addHeader("Cache-Control", "no-store")
                .addHeader("Pragma", "no-cache")
                .addHeader("X-Client-Info", "afrocuisto-android")
                .post(payload.toRequestBody(jsonMediaType))
                .build()

            return@withContext try {
                httpClient.newCall(request).execute().use { response ->
                    val bodyStr = response.body?.string()
                    if (!response.isSuccessful || bodyStr.isNullOrBlank()) {
                        return@use AuthResult.Error(
                            AuthValidation.mapSupabaseError(bodyStr, response.code)
                        )
                    }
                    val session = parseAuthenticatedSession(bodyStr, fallbackEmail = "", fallbackName = null)
                        ?: return@use AuthResult.Error("Réponse OAuth Google incomplète.")

                    clearFailedSignInAttempts()
                    persistSession(session)
                    val allowed = syncProfileFromRemote(
                        session = session,
                        fallbackAvatarUrl = extractMetadataAvatar(bodyStr)
                    )
                    if (!allowed) {
                        wipeLocalSession()
                        return@use AuthResult.Error("Ce compte est suspendu. Contactez l'équipe AfroCuisto.")
                    }
                    AuthResult.Success(session, "Connecté avec Google")
                }
            } catch (_: IOException) {
                AuthResult.Error("Hors ligne")
            } catch (_: Exception) {
                AuthResult.Error("Impossible de finaliser la connexion Google.")
            }
        }

        // Fallback if Supabase returned implicit hash fragment (#access_token=...&refresh_token=...)
        val fragment = callbackUri.fragment.orEmpty()
        if ("access_token=" in fragment) {
            val fragUri = Uri.parse("afrocuisto://fragment?$fragment")
            val accessToken = fragUri.getQueryParameter("access_token").orEmpty()
            val refreshToken = fragUri.getQueryParameter("refresh_token").orEmpty()
            val expiresIn = fragUri.getQueryParameter("expires_in")?.toLongOrNull() ?: 3600L

            if (accessToken.isNotBlank()) {
                val userReq = Request.Builder()
                    .url("$baseUrl/auth/v1/user")
                    .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                    .addHeader("Authorization", "Bearer $accessToken")
                    .addHeader("Cache-Control", "no-store")
                    .get()
                    .build()

                return@withContext try {
                    httpClient.newCall(userReq).execute().use { resp ->
                        val userBody = resp.body?.string()
                        if (!resp.isSuccessful || userBody.isNullOrBlank()) {
                            return@use AuthResult.Error("Impossible de vérifier la session Google.")
                        }
                        val userJson = json.parseToJsonElement(userBody).jsonObject
                        val synthetic = buildJsonObject {
                            put("access_token", accessToken)
                            put("refresh_token", refreshToken)
                            put("expires_in", expiresIn)
                            put("user", userJson)
                        }.toString()

                        val session = parseAuthenticatedSession(synthetic, fallbackEmail = "", fallbackName = null)
                            ?: return@use AuthResult.Error("Session Google invalide.")

                        clearFailedSignInAttempts()
                        persistSession(session)
                        val allowed = syncProfileFromRemote(
                            session = session,
                            fallbackAvatarUrl = extractMetadataAvatar(synthetic)
                        )
                        if (!allowed) {
                            wipeLocalSession()
                            return@use AuthResult.Error("Ce compte est suspendu. Contactez l'équipe AfroCuisto.")
                        }
                        AuthResult.Success(session, "Connecté avec Google")
                    }
                } catch (_: Exception) {
                    AuthResult.Error("Impossible de vérifier la session Google.")
                }
            }
        }

        AuthResult.Error("Lien de retour Google incomplet.")
    }

    /**
     * Ensures a fresh, un-expired JWT `access_token`, transparently rotating the `refresh_token`
     * under a single-flight `Mutex` when within 60s of expiry or after a 401 response.
     */
    private suspend fun getValidSessionOrRefresh(forceRefresh: Boolean = false): AuthSessionState? =
        refreshMutex.withLock {
            val current = sessionFlow.first()
            if (!current.isAuthenticated) return@withLock null
            val nowSec = System.currentTimeMillis() / 1000L
            val needsRefresh = forceRefresh ||
                (current.expiresAtEpochSec > 0L && nowSec >= current.expiresAtEpochSec - 60L)
            if (!needsRefresh) return@withLock current

            val baseUrl = secureBaseUrl() ?: return@withLock current
            if (current.refreshToken.isBlank()) {
                wipeLocalSession()
                return@withLock null
            }

            val payload = buildJsonObject {
                put("refresh_token", current.refreshToken)
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/auth/v1/token?grant_type=refresh_token")
                .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                .addHeader("Content-Type", "application/json")
                .addHeader("Cache-Control", "no-store")
                .post(payload.toRequestBody(jsonMediaType))
                .build()

            return@withLock try {
                httpClient.newCall(request).execute().use { response ->
                    val bodyStr = response.body?.string()
                    if (!response.isSuccessful || bodyStr.isNullOrBlank()) {
                        if (response.code in listOf(400, 401, 403)) {
                            wipeLocalSession()
                            null
                        } else {
                            current
                        }
                    } else {
                        val refreshed = parseAuthenticatedSession(
                            bodyStr = bodyStr,
                            fallbackEmail = current.email,
                            fallbackName = current.displayName
                        )
                        if (refreshed != null) {
                            persistSession(refreshed)
                            refreshed
                        } else {
                            current
                        }
                    }
                }
            } catch (_: IOException) {
                current
            }
        }

    private suspend inline fun <T> withAuthenticatedToken(
        block: (baseUrl: String, session: AuthSessionState) -> T?
    ): T? {
        val baseUrl = secureBaseUrl() ?: return null
        val session = getValidSessionOrRefresh(forceRefresh = false) ?: return null
        return block(baseUrl, session)
    }

    suspend fun syncIdentityToRemote(
        displayName: String,
        favoriteTerroir: String,
        bio: String
    ) = withContext(Dispatchers.IO) {
        val cleanName = AuthValidation.sanitizeDisplayName(displayName).ifBlank { "Gourmet Afro" }
        val cleanTerroir = AuthValidation.sanitizeDisplayName(favoriteTerroir).ifBlank { "Bénin" }
        val cleanBio = bio.replace(Regex("[<>\\p{Cntrl}]"), "").trim().take(280)

        withAuthenticatedToken { baseUrl, session ->
            val payload = buildJsonObject {
                put("display_name", cleanName)
                put("favorite_terroir", cleanTerroir)
                put("bio", cleanBio)
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/rest/v1/profiles?id=eq.${Uri.encode(session.userId)}")
                .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                .addHeader("Authorization", "Bearer ${session.accessToken}")
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=minimal")
                .patch(payload.toRequestBody(jsonMediaType))
                .build()

            runCatching {
                httpClient.newCall(request).execute().use { resp ->
                    if (resp.code == 401) {
                        getValidSessionOrRefresh(forceRefresh = true)
                    }
                }
            }
            appContext.afroAuthDataStore.edit { prefs ->
                prefs[Keys.DISPLAY_NAME] = cleanName
            }
        }
    }

    suspend fun hydrateUserBundle(
        recipeRepository: RecipeRepository,
        shoppingRepository: ShoppingRepository,
        voicePreferences: GeminiVoicePreferences
    ): Boolean = withContext(Dispatchers.IO) {
        withAuthenticatedToken { baseUrl, session ->
            val request = Request.Builder()
                .url("$baseUrl/rest/v1/rpc/get_my_user_bundle")
                .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                .addHeader("Authorization", "Bearer ${session.accessToken}")
                .addHeader("Content-Type", "application/json")
                .post("{}".toRequestBody(jsonMediaType))
                .build()

            runCatching {
                httpClient.newCall(request).execute().use { response ->
                    if (response.code == 401) {
                        val refreshed = getValidSessionOrRefresh(forceRefresh = true) ?: return@use false
                        val retryRequest = Request.Builder()
                            .url("$baseUrl/rest/v1/rpc/get_my_user_bundle")
                            .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                            .addHeader("Authorization", "Bearer ${refreshed.accessToken}")
                            .addHeader("Content-Type", "application/json")
                            .post("{}".toRequestBody(jsonMediaType))
                            .build()
                        httpClient.newCall(retryRequest).execute().use { retryResponse ->
                            if (!retryResponse.isSuccessful) return@use false
                            val retryBody = retryResponse.body?.string() ?: return@use false
                            return@use applyHydratedBundleJson(
                                body = retryBody,
                                recipeRepository = recipeRepository,
                                shoppingRepository = shoppingRepository,
                                voicePreferences = voicePreferences
                            )
                        }
                    }
                    if (response.code == 403) {
                        wipeLocalSession()
                        return@use false
                    }
                    if (!response.isSuccessful) return@use false
                    val body = response.body?.string() ?: return@use false
                    applyHydratedBundleJson(
                        body = body,
                        recipeRepository = recipeRepository,
                        shoppingRepository = shoppingRepository,
                        voicePreferences = voicePreferences
                    )
                }
            }.getOrDefault(false)
        } ?: false
    }

    private suspend fun applyHydratedBundleJson(
        body: String,
        recipeRepository: RecipeRepository,
        shoppingRepository: ShoppingRepository,
        voicePreferences: GeminiVoicePreferences
    ): Boolean {
        val root = json.parseToJsonElement(body).jsonObject

                    val profileObj = root["profile"]?.takeIf { it is JsonObject }?.jsonObject
                    val prefsObj = root["preferences"]?.takeIf { it is JsonObject }?.jsonObject
                    val favoritesArr = root["favorites"]?.jsonArray
                    val shoppingArr = root["shopping_items"]?.jsonArray

                    if (profileObj?.get("is_banned")?.jsonPrimitive?.booleanOrNull == true) {
                        wipeLocalSession()
                        return false
                    }

                    val remoteCooked = profileObj?.get("cooked_recipe_ids")?.jsonArray
                        ?.mapNotNull { it.jsonPrimitive.contentOrNull }
                        ?.toSet()

                    userPreferencesRepository.applyRemoteBundle(
                        displayName = profileObj?.get("display_name")?.jsonPrimitive?.contentOrNull,
                        roleTitle = profileObj?.get("role_title")?.jsonPrimitive?.contentOrNull,
                        bio = profileObj?.get("bio")?.jsonPrimitive?.contentOrNull,
                        avatarUrl = profileObj?.get("avatar_url")?.jsonPrimitive?.contentOrNull,
                        favoriteTerroir = profileObj?.get("favorite_terroir")?.jsonPrimitive?.contentOrNull,
                        culinaryLevel = null,
                        spiceTolerance = null,
                        dietaryTags = null,
                        cookedRecipeIds = remoteCooked?.takeIf { it.isNotEmpty() },
                        defaultServings = prefsObj?.get("default_servings")?.jsonPrimitive?.intOrNull,
                        measurementMode = null,
                        diasporaSubstitutesFirst = prefsObj?.get("diaspora_substitutes_first")?.jsonPrimitive?.booleanOrNull,
                        keepScreenOnInRecipe = prefsObj?.get("keep_screen_on_in_recipe")?.jsonPrimitive?.booleanOrNull,
                        themeMode = prefsObj?.get("theme_mode")?.jsonPrimitive?.contentOrNull
                            ?.let { AppThemeMode.fromId(it) },
                        carouselAutoScroll = prefsObj?.get("carousel_auto_scroll")?.jsonPrimitive?.booleanOrNull,
                        timerVibrationEnabled = prefsObj?.get("timer_vibration_enabled")?.jsonPrimitive?.booleanOrNull
                    )

                    prefsObj?.get("ai_voice_id")?.jsonPrimitive?.contentOrNull
                        ?.takeIf { it.isNotBlank() }
                        ?.let { voicePreferences.setSelectedVoice(it) }

                    if (favoritesArr != null && favoritesArr.isNotEmpty()) {
                        val favSet = favoritesArr.mapNotNull { it.jsonPrimitive.contentOrNull }.toSet()
                        recipeRepository.setFavorites(favSet)
                    }

                    if (shoppingArr != null && shoppingArr.isNotEmpty()) {
                        val parsed = shoppingArr.mapNotNull { elem ->
                            val obj = elem.jsonObject
                            val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return@mapNotNull null
                            val name = obj["name"]?.jsonPrimitive?.contentOrNull ?: return@mapNotNull null
                            ShoppingItem(
                                id = id,
                                name = name,
                                quantity = obj["quantity"]?.jsonPrimitive?.contentOrNull ?: "1",
                                category = obj["category"]?.jsonPrimitive?.contentOrNull ?: "Épices & Terroir",
                                recipeName = obj["recipeName"]?.jsonPrimitive?.contentOrNull,
                                isChecked = obj["isChecked"]?.jsonPrimitive?.booleanOrNull ?: false,
                                price = obj["price"]?.jsonPrimitive?.doubleOrNull,
                                archivedAt = obj["archivedAt"]?.jsonPrimitive?.longOrNull,
                                archiveBatchLabel = obj["archiveBatchLabel"]?.jsonPrimitive?.contentOrNull
                            )
                        }
                        val active = parsed.filter { it.archivedAt == null }
                        val archived = parsed.filter { it.archivedAt != null }
                        val currencyStr = shoppingArr.firstOrNull()?.jsonObject
                            ?.get("currency")?.jsonPrimitive?.contentOrNull
                        val currency = if (currencyStr == "EUR") MarketCurrency.EUR else MarketCurrency.FCFA
                        shoppingRepository.replaceAllFromRemote(active, archived, currency)
                    }
        return true
    }

    suspend fun syncPreferencesToRemote(
        prefs: UserPreferencesState,
        aiVoiceId: String
    ) = withContext(Dispatchers.IO) {
        withAuthenticatedToken { baseUrl, session ->
            val payload = buildJsonObject {
                put(
                    "p_payload",
                    buildJsonObject {
                        put("display_name", AuthValidation.sanitizeDisplayName(prefs.displayName))
                        put("role_title", AuthValidation.sanitizeDisplayName(prefs.roleTitle))
                        put("bio", prefs.bio.take(280))
                        put("avatar_url", prefs.avatarUrl)
                        put("favorite_terroir", AuthValidation.sanitizeDisplayName(prefs.favoriteTerroir))
                        put("default_servings", prefs.defaultServings.coerceIn(1, 20))
                        put("diaspora_substitutes_first", prefs.diasporaSubstitutesFirst)
                        put("keep_screen_on_in_recipe", prefs.keepScreenOnInRecipe)
                        put("theme_mode", prefs.themeMode.id)
                        put("carousel_auto_scroll", prefs.carouselAutoScroll)
                        put("timer_vibration_enabled", prefs.timerVibrationEnabled)
                        put("ai_voice_id", aiVoiceId)
                    }
                )
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/rest/v1/rpc/sync_my_preferences")
                .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                .addHeader("Authorization", "Bearer ${session.accessToken}")
                .addHeader("Content-Type", "application/json")
                .post(payload.toRequestBody(jsonMediaType))
                .build()

            runCatching { httpClient.newCall(request).execute().close() }
        }
    }

    suspend fun toggleFavoriteRemote(recipeId: String) = withContext(Dispatchers.IO) {
        val cleanId = recipeId.trim()
        if (cleanId.isEmpty()) return@withContext
        withAuthenticatedToken { baseUrl, session ->
            val checkReq = Request.Builder()
                .url("$baseUrl/rest/v1/user_favorites?user_id=eq.${Uri.encode(session.userId)}&recipe_id=eq.${Uri.encode(cleanId)}&select=recipe_id")
                .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                .addHeader("Authorization", "Bearer ${session.accessToken}")
                .get()
                .build()

            runCatching {
                val exists = httpClient.newCall(checkReq).execute().use { resp ->
                    val body = resp.body?.string().orEmpty()
                    resp.isSuccessful && body.contains(cleanId)
                }
                if (exists) {
                    val delReq = Request.Builder()
                        .url("$baseUrl/rest/v1/user_favorites?user_id=eq.${Uri.encode(session.userId)}&recipe_id=eq.${Uri.encode(cleanId)}")
                        .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                        .addHeader("Authorization", "Bearer ${session.accessToken}")
                        .delete()
                        .build()
                    httpClient.newCall(delReq).execute().close()
                } else {
                    val body = buildJsonObject {
                        put("user_id", session.userId)
                        put("recipe_id", cleanId)
                    }.toString()
                    val insReq = Request.Builder()
                        .url("$baseUrl/rest/v1/user_favorites")
                        .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                        .addHeader("Authorization", "Bearer ${session.accessToken}")
                        .addHeader("Content-Type", "application/json")
                        .addHeader("Prefer", "resolution=ignore-duplicates,return=minimal")
                        .post(body.toRequestBody(jsonMediaType))
                        .build()
                    httpClient.newCall(insReq).execute().close()
                }
            }
        }
    }

    suspend fun markRecipeCookedRemote(recipeId: String) = withContext(Dispatchers.IO) {
        val cleanId = recipeId.trim()
        if (cleanId.isEmpty()) return@withContext
        withAuthenticatedToken { baseUrl, session ->
            val payload = buildJsonObject {
                put("p_recipe_id", cleanId)
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/rest/v1/rpc/mark_recipe_cooked")
                .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                .addHeader("Authorization", "Bearer ${session.accessToken}")
                .addHeader("Content-Type", "application/json")
                .post(payload.toRequestBody(jsonMediaType))
                .build()

            runCatching { httpClient.newCall(request).execute().close() }
        }
    }

    suspend fun syncShoppingItemsRemote(
        activeItems: List<ShoppingItem>,
        archivedItems: List<ShoppingItem>,
        currency: MarketCurrency
    ) = withContext(Dispatchers.IO) {
        withAuthenticatedToken { baseUrl, session ->
            val allItems = (activeItems + archivedItems).take(300)
            runCatching {
                val delReq = Request.Builder()
                    .url("$baseUrl/rest/v1/user_shopping_items?user_id=eq.${Uri.encode(session.userId)}")
                    .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                    .addHeader("Authorization", "Bearer ${session.accessToken}")
                    .delete()
                    .build()
                httpClient.newCall(delReq).execute().close()

                if (allItems.isNotEmpty()) {
                    val arrPayload = buildJsonArray {
                        allItems.forEach { item ->
                            add(
                                buildJsonObject {
                                    put("user_id", session.userId)
                                    put("name", item.name.take(120))
                                    put("quantity", item.quantity.take(40))
                                    put("category", item.category.take(60))
                                    item.recipeName?.let { put("recipe_name", it.take(120)) }
                                    put("is_checked", item.isChecked)
                                    item.price?.let { put("price", it) }
                                    put("currency", currency.name)
                                    item.archivedAt?.let {
                                        put("archived_at", Instant.ofEpochMilli(it).toString())
                                    }
                                    item.archiveBatchLabel?.let { put("archive_batch_label", it.take(80)) }
                                }
                            )
                        }
                    }.toString()

                    val insReq = Request.Builder()
                        .url("$baseUrl/rest/v1/user_shopping_items")
                        .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                        .addHeader("Authorization", "Bearer ${session.accessToken}")
                        .addHeader("Content-Type", "application/json")
                        .addHeader("Prefer", "return=minimal")
                        .post(arrPayload.toRequestBody(jsonMediaType))
                        .build()
                    httpClient.newCall(insReq).execute().close()
                }
            }
        }
    }

    suspend fun signOut() = withContext(Dispatchers.IO) {
        val current = sessionFlow.first()
        val baseUrl = secureBaseUrl()
        if (current.accessToken.isNotBlank() && baseUrl != null) {
            val request = Request.Builder()
                .url("$baseUrl/auth/v1/logout?scope=local")
                .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
                .addHeader("Authorization", "Bearer ${current.accessToken}")
                .post("{}".toRequestBody(jsonMediaType))
                .build()
            runCatching { httpClient.newCall(request).execute().close() }
        }
        wipeLocalSession()
    }

    private suspend fun wipeLocalSession() {
        setAuthGateSync(false)
        appContext.afroAuthDataStore.edit { prefs ->
            prefs[Keys.STATUS] = AuthStatus.GUEST.id
            prefs.remove(Keys.USER_ID)
            prefs.remove(Keys.EMAIL)
            prefs.remove(Keys.DISPLAY_NAME)
            prefs.remove(Keys.ACCESS_TOKEN_ENC)
            prefs.remove(Keys.REFRESH_TOKEN_ENC)
            prefs.remove(Keys.EXPIRES_AT_SEC)
            prefs.remove(Keys.PKCE_VERIFIER_ENC)
            prefs.remove(Keys.PKCE_CREATED_AT_MS)
            prefs[Keys.AUTH_GATE_COMPLETED] = false
        }
    }

    private fun extractMetadataAvatar(bodyStr: String): String? {
        val root = runCatching { json.parseToJsonElement(bodyStr).jsonObject }.getOrNull() ?: return null
        val userObj = root["user"]?.takeIf { it is JsonObject }?.jsonObject ?: root
        val metaObj = userObj["user_metadata"]?.takeIf { it is JsonObject }?.jsonObject ?: return null
        val raw = metaObj["avatar_url"]?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }
            ?: metaObj["picture"]?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }
        return raw?.takeIf { it.startsWith("https://") }?.take(1024)
    }

    private fun parseAuthenticatedSession(
        bodyStr: String,
        fallbackEmail: String,
        fallbackName: String?
    ): AuthSessionState? {
        val root = runCatching { json.parseToJsonElement(bodyStr).jsonObject }.getOrNull() ?: return null
        val accessToken = root["access_token"]?.jsonPrimitive?.contentOrNull.orEmpty()
        val refreshToken = root["refresh_token"]?.jsonPrimitive?.contentOrNull.orEmpty()
        val expiresAt = root["expires_at"]?.jsonPrimitive?.longOrNull
            ?: root["expires_in"]?.jsonPrimitive?.longOrNull?.let { (System.currentTimeMillis() / 1000L) + it }
            ?: ((System.currentTimeMillis() / 1000L) + 3600L)

        val userObj = root["user"]?.takeIf { it is JsonObject }?.jsonObject ?: root
        val userId = userObj["id"]?.jsonPrimitive?.contentOrNull.orEmpty()
        if (accessToken.isBlank() || userId.isBlank()) return null

        val userEmail = userObj["email"]?.jsonPrimitive?.contentOrNull ?: fallbackEmail
        val metaObj = userObj["user_metadata"]?.takeIf { it is JsonObject }?.jsonObject
        val metaName = metaObj?.get("display_name")?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }
            ?: metaObj?.get("full_name")?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }
            ?: metaObj?.get("name")?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }
            ?: fallbackName
            ?: userEmail.substringBefore("@").replaceFirstChar { it.uppercase() }
        val emailConfirmed = userObj["email_confirmed_at"]?.jsonPrimitive?.contentOrNull != null

        return AuthSessionState(
            status = AuthStatus.AUTHENTICATED,
            userId = userId,
            email = userEmail,
            displayName = AuthValidation.sanitizeDisplayName(metaName),
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresAtEpochSec = expiresAt,
            hasCompletedAuthGate = true,
            isEmailVerified = emailConfirmed
        )
    }

    private suspend fun persistSession(session: AuthSessionState) {
        val encryptedAccess = SecureTokenVault.encrypt(session.accessToken)
        val encryptedRefresh = SecureTokenVault.encrypt(session.refreshToken)
        if (encryptedAccess.isBlank()) return

        setAuthGateSync(session.hasCompletedAuthGate)
        appContext.afroAuthDataStore.edit { prefs ->
            prefs[Keys.STATUS] = session.status.id
            prefs[Keys.USER_ID] = session.userId
            prefs[Keys.EMAIL] = session.email
            prefs[Keys.DISPLAY_NAME] = session.displayName
            prefs[Keys.ACCESS_TOKEN_ENC] = encryptedAccess
            prefs[Keys.REFRESH_TOKEN_ENC] = encryptedRefresh
            prefs[Keys.EXPIRES_AT_SEC] = session.expiresAtEpochSec
            prefs[Keys.AUTH_GATE_COMPLETED] = session.hasCompletedAuthGate
            prefs[Keys.EMAIL_VERIFIED] = session.isEmailVerified
        }
    }

    private suspend fun applyRegistrationPreferencesLocally(
        name: String,
        roleTitle: String,
        favoriteTerroir: String,
        diasporaSubstitutesFirst: Boolean
    ) {
        val currentPrefs = userPreferencesRepository.preferencesFlow.first()
        userPreferencesRepository.updateIdentity(
            displayName = name,
            roleTitle = roleTitle,
            bio = currentPrefs.bio,
            favoriteTerroir = favoriteTerroir,
            avatarUrl = currentPrefs.avatarUrl
        )
        userPreferencesRepository.setDiasporaSubstitutesFirst(diasporaSubstitutesFirst)
    }

    private suspend fun syncProfileFromRemote(
        session: AuthSessionState,
        fallbackAvatarUrl: String? = null
    ): Boolean {
        val baseUrl = secureBaseUrl() ?: return true
        val request = Request.Builder()
            .url("$baseUrl/rest/v1/profiles?id=eq.${Uri.encode(session.userId)}&select=display_name,role_title,favorite_terroir,bio,avatar_url,is_banned")
            .addHeader("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .addHeader("Authorization", "Bearer ${session.accessToken}")
            .get()
            .build()

        return runCatching {
            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@use true
                val body = response.body?.string() ?: return@use true
                val arr = json.parseToJsonElement(body).jsonArray
                val profileObj: JsonObject = arr.firstOrNull()?.jsonObject ?: return@use true
                if (profileObj["is_banned"]?.jsonPrimitive?.booleanOrNull == true) {
                    return@use false
                }

                val remoteName = profileObj["display_name"]?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }
                val remoteRole = profileObj["role_title"]?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }
                val remoteTerroir = profileObj["favorite_terroir"]?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }
                val remoteBio = profileObj["bio"]?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }
                val remoteAvatar = profileObj["avatar_url"]?.jsonPrimitive?.contentOrNull
                    ?.takeIf { it.startsWith("https://") }

                val currentPrefs = userPreferencesRepository.preferencesFlow.first()
                val resolvedAvatar = currentPrefs.avatarUrl.takeIf { it.isNotBlank() }
                    ?: remoteAvatar
                    ?: fallbackAvatarUrl?.takeIf { it.startsWith("https://") }.orEmpty()

                userPreferencesRepository.updateIdentity(
                    displayName = remoteName ?: session.displayName,
                    roleTitle = remoteRole ?: currentPrefs.roleTitle,
                    bio = remoteBio ?: currentPrefs.bio,
                    favoriteTerroir = remoteTerroir ?: currentPrefs.favoriteTerroir,
                    avatarUrl = resolvedAvatar
                )
                true
            }
        }.getOrDefault(true)
    }

    companion object {
        private const val SYNC_PREFS_NAME = "afrocuisto_auth_sync"
        private const val SYNC_KEY_AUTH_GATE = "auth_gate_completed"
        private const val SYNC_KEY_IS_AUTHENTICATED = "auth_is_authenticated"
        private const val MAX_FREE_ATTEMPTS = 5
        const val OAUTH_REDIRECT_URI = "com.afrocuisto.app://auth-callback"

        fun isOAuthCallbackUri(uri: Uri?): Boolean {
            if (uri == null) return false
            val scheme = uri.scheme?.lowercase(Locale.ROOT)
            val host = uri.host?.lowercase(Locale.ROOT)
            return (scheme == "com.afrocuisto.app" || scheme == "afrocuisto") && host == "auth-callback"
        }
    }
}

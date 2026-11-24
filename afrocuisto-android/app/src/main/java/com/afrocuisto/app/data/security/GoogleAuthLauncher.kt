package com.afrocuisto.app.data.security

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.graphics.Color as AndroidColor
import android.net.Uri
import android.util.Base64
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.afrocuisto.app.BuildConfig
import com.afrocuisto.app.data.repository.AuthRepository
import com.afrocuisto.app.data.repository.AuthResult
import com.afrocuisto.app.data.repository.AuthSessionState
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import java.security.MessageDigest
import java.security.SecureRandom

sealed interface GoogleSignInOutcome {
    data class Authenticated(val session: AuthSessionState) : GoogleSignInOutcome
    data object RedirectedToBrowser : GoogleSignInOutcome
    data object Cancelled : GoogleSignInOutcome
    data class Failed(val message: String) : GoogleSignInOutcome
}

object GoogleAuthLauncher {

    private tailrec fun Context.findActivity(): Activity? = when (this) {
        is Activity -> this
        is ContextWrapper -> baseContext.findActivity()
        else -> null
    }

    private fun generateRawNonce(): String {
        val bytes = ByteArray(24)
        SecureRandom().nextBytes(bytes)
        return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
    }

    private fun sha256Hex(input: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }

    /**
     * Dual-engine Google Sign-In:
     * 1. Attempts native Android `CredentialManager` (`GetSignInWithGoogleOption` + SHA-256 nonce)
     *    for instant bottom-sheet One-Tap sign-in (`grant_type=id_token`).
     * 2. If native Play Services / SHA-1 client config is unavailable on this build/device,
     *    seamlessly falls back to Chrome Custom Tabs OAuth 2.0 + PKCE (`S256`).
     */
    suspend fun signIn(
        uiContext: Context,
        authRepository: AuthRepository
    ): GoogleSignInOutcome {
        val activity = uiContext.findActivity()
        val webClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID.trim()

        if (activity != null && webClientId.endsWith(".apps.googleusercontent.com")) {
            val rawNonce = generateRawNonce()
            val hashedNonce = sha256Hex(rawNonce)

            try {
                val googleOption = GetSignInWithGoogleOption.Builder(webClientId)
                    .setNonce(hashedNonce)
                    .build()

                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(googleOption)
                    .build()

                val credentialManager = CredentialManager.create(activity)
                val result = credentialManager.getCredential(
                    request = request,
                    context = activity
                )

                val credential = result.credential
                if (credential is CustomCredential &&
                    credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
                ) {
                    val googleCred = GoogleIdTokenCredential.createFrom(credential.data)
                    return when (
                        val authRes = authRepository.signInWithGoogleIdToken(
                            idToken = googleCred.idToken,
                            rawNonce = rawNonce,
                            fallbackName = googleCred.displayName,
                            fallbackAvatarUrl = googleCred.profilePictureUri?.toString()
                        )
                    ) {
                        is AuthResult.Success -> GoogleSignInOutcome.Authenticated(authRes.session)
                        is AuthResult.Error -> GoogleSignInOutcome.Failed(authRes.message)
                        is AuthResult.EmailConfirmationRequired -> GoogleSignInOutcome.Failed(authRes.message)
                    }
                }
            } catch (_: GetCredentialCancellationException) {
                return GoogleSignInOutcome.Cancelled
            } catch (_: GetCredentialException) {
                // Native Android OAuth SHA-1 or Play Services provider not available -> fallback to PKCE Custom Tab
            } catch (_: Throwable) {
                // Fallback to PKCE Custom Tab
            }
        }

        val authorizeUri = authRepository.prepareGooglePkceAuthorizeUri()
            ?: return GoogleSignInOutcome.Failed("Configuration Google OAuth indisponible.")

        return if (openSecureCustomTab(activity ?: uiContext, authorizeUri)) {
            GoogleSignInOutcome.RedirectedToBrowser
        } else {
            GoogleSignInOutcome.Failed("Aucun navigateur sécurisé disponible pour ouvrir la connexion Google.")
        }
    }

    private fun openSecureCustomTab(context: Context, uri: Uri): Boolean {
        return try {
            val sheetHeightPx = (context.resources.displayMetrics.heightPixels * 0.78f)
                .toInt()
                .coerceAtLeast(1)
            val darkColors = CustomTabColorSchemeParams.Builder()
                .setToolbarColor(AndroidColor.BLACK)
                .setNavigationBarColor(AndroidColor.BLACK)
                .build()
            val customTabsIntent = CustomTabsIntent.Builder()
                .setShowTitle(true)
                .setShareState(CustomTabsIntent.SHARE_STATE_OFF)
                .setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK)
                .setDefaultColorSchemeParams(darkColors)
                .setInitialActivityHeightPx(sheetHeightPx)
                .setToolbarCornerRadiusDp(28)
                .build()
            if (context !is Activity) {
                customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            customTabsIntent.launchUrl(context, uri)
            true
        } catch (_: Throwable) {
            try {
                val viewIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                    if (context !is Activity) addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(viewIntent)
                true
            } catch (_: Throwable) {
                false
            }
        }
    }
}

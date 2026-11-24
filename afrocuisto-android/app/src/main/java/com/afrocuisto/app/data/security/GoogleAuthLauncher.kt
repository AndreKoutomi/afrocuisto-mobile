package com.afrocuisto.app.data.security

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.util.Base64
import android.util.Log
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
     * Native Android `CredentialManager` Google Sign-In (`GetSignInWithGoogleOption` + SHA-256 nonce)
     * exchanged directly with Supabase Auth (`/auth/v1/token?grant_type=id_token`).
     */
    suspend fun signIn(
        uiContext: Context,
        authRepository: AuthRepository
    ): GoogleSignInOutcome {
        val activity = uiContext.findActivity()
            ?: return GoogleSignInOutcome.Failed("Impossible d'ouvrir le sélecteur Google depuis cet écran.")
        val webClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID.trim()
        if (!webClientId.endsWith(".apps.googleusercontent.com")) {
            return GoogleSignInOutcome.Failed("Client Google OAuth non configuré.")
        }

        val rawNonce = generateRawNonce()
        val hashedNonce = sha256Hex(rawNonce)

        return try {
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
            Log.d("AfroGoogleAuth", "Credential received: type=${credential.type}")
            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val googleCred = GoogleIdTokenCredential.createFrom(credential.data)
                Log.d("AfroGoogleAuth", "Google ID token parsed for ${googleCred.id}")
                when (
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
            } else {
                GoogleSignInOutcome.Failed("Format d'identifiant Google non pris en charge.")
            }
        } catch (e: GetCredentialCancellationException) {
            Log.w("AfroGoogleAuth", "Cancelled: type=${e.type}, msg=${e.errorMessage}")
            val msg = e.errorMessage?.toString().orEmpty()
            if (msg.contains("16") || msg.contains("reauth", ignoreCase = true) || msg.contains("developer", ignoreCase = true)) {
                GoogleSignInOutcome.Failed(
                    "Connexion Google bloquée par Google Cloud : enregistrez l'empreinte SHA-1 de l'app Android."
                )
            } else {
                GoogleSignInOutcome.Cancelled
            }
        } catch (e: GetCredentialException) {
            Log.e("AfroGoogleAuth", "GetCredentialException: ${e::class.java.simpleName}, type=${e.type}, msg=${e.errorMessage}", e)
            GoogleSignInOutcome.Failed("Connexion Google impossible (${e::class.java.simpleName} : ${e.errorMessage ?: e.type}).")
        } catch (t: Throwable) {
            Log.e("AfroGoogleAuth", "Unexpected Google Sign-In failure", t)
            GoogleSignInOutcome.Failed("Impossible de finaliser la connexion Google.")
        }
    }
}

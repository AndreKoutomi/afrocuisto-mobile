package com.afrocuisto.app.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.util.Base64
import com.afrocuisto.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import okhttp3.ConnectionSpec
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.util.concurrent.TimeUnit

enum class BugSeverity(val label: String, val hint: String) {
    BLOQUANT("Bloquant", "Crash ou blocage total"),
    MAJEUR("Majeur", "Fonctionnalité inutilisable"),
    MINEUR("Mineur", "Gêne contournable"),
    COSMETIQUE("Cosmétique", "Détail visuel ou texte")
}

@Serializable
data class SubmittedBugReport(
    val id: String,
    val title: String,
    val category: String,
    val severity: String,
    val status: String = "Nouveau",
    val createdAtMs: Long = System.currentTimeMillis()
)

sealed interface BugSubmitResult {
    data class Success(val message: String) : BugSubmitResult
    data class Error(val message: String) : BugSubmitResult
}

class BugReportRepository(context: Context) {

    private val appContext = context.applicationContext
    private val json = Json { ignoreUnknownKeys = true }
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    private val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val httpClient = OkHttpClient.Builder()
        .connectionSpecs(listOf(ConnectionSpec.RESTRICTED_TLS, ConnectionSpec.MODERN_TLS))
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .retryOnConnectionFailure(false)
        .build()

    private val _submittedReports = MutableStateFlow(loadLocalReports())
    val submittedReports: Flow<List<SubmittedBugReport>> = _submittedReports.asStateFlow()

    fun buildDeviceInfo(): String {
        val manufacturer = Build.MANUFACTURER.replaceFirstChar { it.uppercase() }
        val model = Build.MODEL
        val fullModel = if (model.startsWith(manufacturer, ignoreCase = true)) model else "$manufacturer $model"
        return "$fullModel · Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
    }

    fun buildAppVersion(): String = "${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})"

    suspend fun encodeScreenshotDataUri(uri: Uri): String? = withContext(Dispatchers.IO) {
        runCatching {
            val resolver = appContext.contentResolver
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return@withContext null

            var sampleSize = 1
            while (bounds.outWidth / sampleSize > 960 || bounds.outHeight / sampleSize > 960) {
                sampleSize *= 2
            }

            val bitmap = resolver.openInputStream(uri)?.use { stream ->
                BitmapFactory.decodeStream(
                    stream,
                    null,
                    BitmapFactory.Options().apply { inSampleSize = sampleSize }
                )
            } ?: return@withContext null

            var quality = 82
            val out = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
            while (out.size() > MAX_SCREENSHOT_BYTES && quality > 42) {
                out.reset()
                quality -= 12
                bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
            }
            bitmap.recycle()

            val encoded = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
            "data:image/jpeg;base64,$encoded"
        }.getOrNull()
    }

    suspend fun submitBugReport(
        title: String,
        description: String,
        stepsToReproduce: String,
        severity: BugSeverity,
        category: String,
        userName: String,
        userEmail: String,
        screenshotDataUri: String?,
        session: AuthSessionState
    ): BugSubmitResult = withContext(Dispatchers.IO) {
        val cleanTitle = title.trim().take(160)
        val cleanDesc = description.trim().take(3000)
        val cleanSteps = stepsToReproduce.trim().take(2000).ifBlank { null }
        val cleanCategory = category.trim().ifBlank { "Autre" }
        val cleanName = userName.trim().ifBlank { "Utilisateur AfroCuisto" }.take(80)
        val cleanEmail = userEmail.trim().ifBlank { "Non renseigné" }.take(120)
        val deviceInfo = buildDeviceInfo()
        val appVersion = buildAppVersion()

        if (cleanTitle.length < 4) {
            return@withContext BugSubmitResult.Error("Veuillez saisir un titre plus précis (4 caractères min.).")
        }
        if (cleanDesc.length < 10) {
            return@withContext BugSubmitResult.Error("Décrivez le problème en quelques mots (10 caractères min.).")
        }

        val baseUrl = BuildConfig.SUPABASE_URL.trim().trimEnd('/')
        val anonKey = BuildConfig.SUPABASE_ANON_KEY
        if (!baseUrl.startsWith("https://") || anonKey.isBlank()) {
            return@withContext BugSubmitResult.Error("Service de signalement indisponible sur cette version.")
        }

        val bearerToken = if (session.isAuthenticated) session.accessToken else anonKey

        val fullPayload = buildJsonObject {
            if (session.isAuthenticated) {
                put("user_id", session.userId)
            }
            put("user_name", cleanName)
            put("user_email", cleanEmail)
            put("title", cleanTitle)
            put("description", cleanDesc)
            cleanSteps?.let { put("steps_to_reproduce", it) }
            put("severity", severity.label)
            put("category", cleanCategory)
            put("status", "Nouveau")
            put("device_info", deviceInfo)
            put("app_version", appVersion)
            screenshotDataUri?.let { put("screenshot", it) }
        }.toString()

        try {
            val primaryCode = postBugPayload(baseUrl, anonKey, bearerToken, fullPayload)
            if (primaryCode in 200..299) {
                saveLocalReport(cleanTitle, cleanCategory, severity.label)
                return@withContext BugSubmitResult.Success("Rapport envoyé à l'équipe AfroCuisto !")
            }

            // Fallback pour un schéma Supabase antérieur à la migration 08
            if (primaryCode == 400 || primaryCode == 422) {
                val enrichedDescription = buildString {
                    append("[").append(severity.label).append(" · ").append(cleanCategory).append("]\n")
                    append(cleanDesc)
                    if (!cleanSteps.isNullOrBlank()) {
                        append("\n\nÉtapes pour reproduire :\n").append(cleanSteps)
                    }
                    append("\n\nContact : ").append(cleanName).append(" (").append(cleanEmail).append(")")
                }
                val legacyPayload = buildJsonObject {
                    if (session.isAuthenticated) {
                        put("user_id", session.userId)
                    }
                    put("title", cleanTitle)
                    put("description", enrichedDescription)
                    put("device_info", deviceInfo)
                    put("app_version", appVersion)
                    put("status", "open")
                }.toString()

                val fallbackCode = postBugPayload(baseUrl, anonKey, bearerToken, legacyPayload)
                if (fallbackCode in 200..299) {
                    saveLocalReport(cleanTitle, cleanCategory, severity.label)
                    return@withContext BugSubmitResult.Success("Rapport envoyé à l'équipe AfroCuisto !")
                }
            }

            BugSubmitResult.Error("Impossible d'envoyer le rapport (code $primaryCode). Réessayez.")
        } catch (_: IOException) {
            BugSubmitResult.Error("Connexion internet requise pour envoyer le rapport.")
        } catch (_: Exception) {
            BugSubmitResult.Error("Une erreur est survenue lors de l'envoi du rapport.")
        }
    }

    private fun postBugPayload(
        baseUrl: String,
        anonKey: String,
        bearerToken: String,
        payload: String
    ): Int {
        val request = Request.Builder()
            .url("$baseUrl/rest/v1/bug_reports")
            .addHeader("apikey", anonKey)
            .addHeader("Authorization", "Bearer $bearerToken")
            .addHeader("Content-Type", "application/json")
            .addHeader("Prefer", "return=minimal")
            .post(payload.toRequestBody(jsonMediaType))
            .build()

        return httpClient.newCall(request).execute().use { it.code }
    }

    private fun saveLocalReport(title: String, category: String, severity: String) {
        val entry = SubmittedBugReport(
            id = "${System.currentTimeMillis()}_${title.hashCode()}",
            title = title,
            category = category,
            severity = severity,
            status = "Nouveau",
            createdAtMs = System.currentTimeMillis()
        )
        val updated = (listOf(entry) + _submittedReports.value).take(15)
        _submittedReports.value = updated
        runCatching {
            prefs.edit().putString(KEY_LOCAL_REPORTS, json.encodeToString(updated)).apply()
        }
    }

    private fun loadLocalReports(): List<SubmittedBugReport> {
        val raw = prefs.getString(KEY_LOCAL_REPORTS, null) ?: return emptyList()
        return runCatching { json.decodeFromString<List<SubmittedBugReport>>(raw) }.getOrDefault(emptyList())
    }

    companion object {
        private const val PREFS_NAME = "afrocuisto_bug_reports_local"
        private const val KEY_LOCAL_REPORTS = "submitted_reports"
        private const val MAX_SCREENSHOT_BYTES = 180 * 1024

        val CATEGORIES = listOf(
            "Recettes",
            "Chef IA",
            "Marché",
            "Communauté",
            "Minuteur",
            "Interface",
            "Connexion",
            "Performance",
            "Autre"
        )
    }
}

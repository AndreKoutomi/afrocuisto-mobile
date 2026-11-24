package com.afrocuisto.app.data.ota

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.afrocuisto.app.BuildConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.RandomAccessFile
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicLong

data class OtaReleaseInfo(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val releaseNotes: String,
    val sizeBytes: Long = 0L,
    val channel: String = "",
    val applicationId: String = ""
)

enum class OtaStatus {
    IDLE,
    CHECKING,
    UP_TO_DATE,
    UPDATE_AVAILABLE,
    DOWNLOADING,
    READY_TO_INSTALL,
    ERROR
}

data class OtaUiState(
    val status: OtaStatus = OtaStatus.IDLE,
    val currentVersionName: String = BuildConfig.VERSION_NAME,
    val currentVersionCode: Int = BuildConfig.VERSION_CODE,
    val availableRelease: OtaReleaseInfo? = null,
    val downloadedBytes: Long = 0L,
    val totalBytes: Long = 0L,
    val speedBytesPerSec: Long = 0L,
    val parallelStreamsActive: Int = 1,
    val downloadedApkPath: String? = null,
    val message: String = "Appuyez pour vérifier si une nouveauté est disponible."
) {
    val progress: Float
        get() = if (totalBytes > 0L) (downloadedBytes.toFloat() / totalBytes.toFloat()).coerceIn(0f, 1f) else 0f
}

/**
 * High-speed In-App Android OTA Manager backed by Firebase:
 * - Queries the configured Firebase OTA endpoint (`BuildConfig.FIREBASE_OTA_URL`, supporting
 *   Firebase Hosting / Storage JSON manifests, Firebase Realtime Database `.json`, and
 *   Cloud Firestore REST documents).
 * - Downloads the signed APK from Firebase Storage / Hosting via OkHttp HTTP/2 using 4 parallel
 *   HTTP Range streams when supported (with 256 KB buffered single-stream fallback) and live Mo/s speed.
 * - Launches the native Android PackageInstaller via `FileProvider` (`REQUEST_INSTALL_PACKAGES`).
 */
class OtaUpdateManager(private val context: Context) {

    private val appContext = context.applicationContext
    private val json = Json { ignoreUnknownKeys = true }

    private val client = OkHttpClient.Builder()
        .connectTimeout(12, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    private val _state = MutableStateFlow(OtaUiState())
    val state: StateFlow<OtaUiState> = _state.asStateFlow()

    private var activeJob: Job? = null

    fun checkForUpdates(scope: CoroutineScope) {
        activeJob?.cancel()
        activeJob = scope.launch {
            val firebaseEndpoint = BuildConfig.FIREBASE_OTA_URL.trim()
            _state.update {
                it.copy(
                    status = OtaStatus.CHECKING,
                    message = "Recherche des nouveautés en cours..."
                )
            }

            try {
                val release = withContext(Dispatchers.IO) { fetchFirebaseRelease(firebaseEndpoint) }
                if (release == null) {
                    _state.update {
                        it.copy(
                            status = OtaStatus.UP_TO_DATE,
                            availableRelease = null,
                            message = "Vous profitez déjà de la dernière version d'AfroCuisto."
                        )
                    }
                    return@launch
                }

                val isNewer = release.versionCode > BuildConfig.VERSION_CODE ||
                    compareSemVer(release.versionName, BuildConfig.VERSION_NAME) > 0
                val isMatchingChannel = isCompatibleRelease(release)

                if (isNewer && isMatchingChannel && release.apkUrl.isNotBlank()) {
                    _state.update {
                        it.copy(
                            status = OtaStatus.UPDATE_AVAILABLE,
                            availableRelease = release,
                            totalBytes = release.sizeBytes,
                            downloadedBytes = 0L,
                            message = "La version ${release.versionName} est prête à être installée."
                        )
                    }
                } else {
                    _state.update {
                        it.copy(
                            status = OtaStatus.UP_TO_DATE,
                            availableRelease = null,
                            message = "Vous profitez déjà de la dernière version d'AfroCuisto."
                        )
                    }
                }
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: OtaNotPublishedException) {
                _state.update {
                    it.copy(
                        status = OtaStatus.UP_TO_DATE,
                        availableRelease = null,
                        message = "Vous profitez déjà de la dernière version d'AfroCuisto (${BuildConfig.VERSION_NAME})."
                    )
                }
            } catch (_: Throwable) {
                _state.update {
                    it.copy(
                        status = OtaStatus.ERROR,
                        message = "Impossible de vérifier pour le moment. Vérifiez votre connexion Internet et réessayez."
                    )
                }
            }
        }
    }

    fun startHighSpeedDownload(scope: CoroutineScope) {
        val release = _state.value.availableRelease ?: return
        activeJob?.cancel()
        activeJob = scope.launch {
            _state.update {
                it.copy(
                    status = OtaStatus.DOWNLOADING,
                    downloadedBytes = 0L,
                    totalBytes = release.sizeBytes,
                    speedBytesPerSec = 0L,
                    message = "Téléchargement rapide en cours..."
                )
            }

            try {
                val otaDir = File(appContext.cacheDir, "ota_updates").apply { mkdirs() }
                otaDir.listFiles()?.forEach { it.delete() }
                val targetFile = File(otaDir, "AfroCuisto-${release.versionName}.apk")

                withContext(Dispatchers.IO) {
                    downloadApkHighSpeed(release.apkUrl, targetFile)
                }

                _state.update {
                    it.copy(
                        status = OtaStatus.READY_TO_INSTALL,
                        downloadedApkPath = targetFile.absolutePath,
                        speedBytesPerSec = 0L,
                        message = "Mise à jour prête à être installée (${formatBytes(targetFile.length())})"
                    )
                }
            } catch (ce: CancellationException) {
                _state.update {
                    it.copy(
                        status = OtaStatus.UPDATE_AVAILABLE,
                        speedBytesPerSec = 0L,
                        message = "Téléchargement mis en pause."
                    )
                }
                throw ce
            } catch (_: Throwable) {
                _state.update {
                    it.copy(
                        status = OtaStatus.ERROR,
                        speedBytesPerSec = 0L,
                        message = "Le téléchargement a été interrompu. Vérifiez votre connexion Internet et réessayez."
                    )
                }
            }
        }
    }

    fun cancelDownload() {
        activeJob?.cancel()
        activeJob = null
    }

    fun canInstallPackages(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            appContext.packageManager.canRequestPackageInstalls()
        } else {
            true
        }
    }

    fun launchInstall(activityContext: Context): Boolean {
        val path = _state.value.downloadedApkPath ?: return false
        val apkFile = File(path)
        if (!apkFile.exists()) return false

        // Safety check: verify the downloaded APK's packageName strictly matches this app (Beta vs Production)
        @Suppress("DEPRECATION")
        val archivePackage = appContext.packageManager
            .getPackageArchiveInfo(apkFile.absolutePath, 0)
            ?.packageName
        if (!archivePackage.isNullOrBlank() && archivePackage != appContext.packageName) {
            apkFile.delete()
            _state.update {
                it.copy(
                    status = OtaStatus.ERROR,
                    downloadedApkPath = null,
                    message = "Mise à jour ignorée : le paquet ne correspond pas à cette version de l'application."
                )
            }
            return false
        }

        if (!canInstallPackages() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val permIntent = Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:${activityContext.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            activityContext.startActivity(permIntent)
            return false
        }

        val uri = FileProvider.getUriForFile(
            activityContext,
            "${activityContext.packageName}.fileprovider",
            apkFile
        )
        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        activityContext.startActivity(installIntent)
        return true
    }

    private class OtaNotPublishedException : Exception()

    private fun fetchFirebaseRelease(url: String): OtaReleaseInfo? {
        if (url.isBlank()) return null
        val req = Request.Builder()
            .url(url)
            .header("Accept", "application/json")
            .header("Cache-Control", "no-cache, no-store")
            .header("Pragma", "no-cache")
            .header("User-Agent", "AfroCuisto-Android/${BuildConfig.VERSION_NAME}")
            .build()

        client.newCall(req).execute().use { resp ->
            if (resp.code == 404) throw OtaNotPublishedException()
            check(resp.isSuccessful) { "HTTP ${resp.code}" }
            val body = resp.body?.string()?.trim().orEmpty()
            if (body.isEmpty() || body == "null") return null
            val root = json.parseToJsonElement(body).jsonObject

            // 1. Firebase Firestore REST document (`fields: { versionCode: { integerValue }, ... }`)
            val firestoreFields = root["fields"]?.jsonObject
            if (firestoreFields != null) {
                return parseFirestoreRelease(firestoreFields)
            }

            // 2. Firebase Hosting / Firebase Storage / Firebase Realtime Database JSON
            val apkUrl = root["apkUrl"]?.jsonPrimitive?.contentOrNull
                ?: root["apk_url"]?.jsonPrimitive?.contentOrNull
                ?: root["downloadUrl"]?.jsonPrimitive?.contentOrNull
                ?: return null

            return OtaReleaseInfo(
                versionCode = root["versionCode"]?.jsonPrimitive?.intOrNull
                    ?: root["version_code"]?.jsonPrimitive?.intOrNull
                    ?: BuildConfig.VERSION_CODE,
                versionName = root["versionName"]?.jsonPrimitive?.contentOrNull
                    ?: root["version_name"]?.jsonPrimitive?.contentOrNull
                    ?: BuildConfig.VERSION_NAME,
                apkUrl = apkUrl,
                releaseNotes = root["releaseNotes"]?.jsonPrimitive?.contentOrNull
                    ?: root["release_notes"]?.jsonPrimitive?.contentOrNull
                    ?: "Améliorations de performance et nouvelles fonctionnalités.",
                sizeBytes = root["sizeBytes"]?.jsonPrimitive?.longOrNull
                    ?: root["size_bytes"]?.jsonPrimitive?.longOrNull
                    ?: 0L,
                channel = root["channel"]?.jsonPrimitive?.contentOrNull.orEmpty().trim().lowercase(),
                applicationId = root["applicationId"]?.jsonPrimitive?.contentOrNull
                    ?: root["application_id"]?.jsonPrimitive?.contentOrNull.orEmpty().trim()
            )
        }
    }

    private fun isCompatibleRelease(release: OtaReleaseInfo): Boolean {
        val expectedChannel = BuildConfig.APP_CHANNEL.trim().lowercase()
        val expectedPackage = appContext.packageName
        if (release.channel.isNotBlank() && release.channel != expectedChannel) return false
        if (release.applicationId.isNotBlank() && release.applicationId != expectedPackage) return false
        val lowerUrl = release.apkUrl.lowercase()
        if (expectedChannel == "production" && ("-beta-" in lowerUrl || ".beta." in lowerUrl)) return false
        if (expectedChannel == "beta" && "-production-" in lowerUrl) return false
        return true
    }

    private fun parseFirestoreRelease(fields: JsonObject): OtaReleaseInfo? {
        val apkUrl = fields["apkUrl"]?.jsonObject?.get("stringValue")?.jsonPrimitive?.contentOrNull
            ?: fields["apk_url"]?.jsonObject?.get("stringValue")?.jsonPrimitive?.contentOrNull
            ?: return null
        val vCode = fields["versionCode"]?.jsonObject?.get("integerValue")?.jsonPrimitive?.contentOrNull?.toIntOrNull()
            ?: fields["version_code"]?.jsonObject?.get("integerValue")?.jsonPrimitive?.contentOrNull?.toIntOrNull()
            ?: BuildConfig.VERSION_CODE
        val vName = fields["versionName"]?.jsonObject?.get("stringValue")?.jsonPrimitive?.contentOrNull
            ?: fields["version_name"]?.jsonObject?.get("stringValue")?.jsonPrimitive?.contentOrNull
            ?: BuildConfig.VERSION_NAME
        val notes = fields["releaseNotes"]?.jsonObject?.get("stringValue")?.jsonPrimitive?.contentOrNull
            ?: fields["release_notes"]?.jsonObject?.get("stringValue")?.jsonPrimitive?.contentOrNull
            ?: "Nouvelle mise à jour AfroCuisto disponible."
        val size = fields["sizeBytes"]?.jsonObject?.get("integerValue")?.jsonPrimitive?.contentOrNull?.toLongOrNull()
            ?: 0L

        return OtaReleaseInfo(
            versionCode = vCode,
            versionName = vName,
            apkUrl = apkUrl,
            releaseNotes = notes,
            sizeBytes = size
        )
    }

    private suspend fun downloadApkHighSpeed(apkUrl: String, destFile: File) {
        val headReq = Request.Builder().url(apkUrl).head().build()
        var contentLength = -1L
        var supportsRanges = false
        try {
            client.newCall(headReq).execute().use { resp ->
                if (resp.isSuccessful) {
                    contentLength = resp.header("Content-Length")?.toLongOrNull() ?: -1L
                    supportsRanges = resp.header("Accept-Ranges")?.contains("bytes", ignoreCase = true) == true
                }
            }
        } catch (_: Throwable) {
        }

        val streamCount = if (supportsRanges && contentLength > 2L * 1024L * 1024L) 4 else 1
        _state.update {
            it.copy(
                totalBytes = contentLength.coerceAtLeast(it.totalBytes),
                parallelStreamsActive = streamCount
            )
        }

        val downloadedCounter = AtomicLong(0L)
        val startTimeNs = System.nanoTime()
        val lastUiEmitNs = AtomicLong(startTimeNs)

        fun reportProgress(total: Long) {
            val now = System.nanoTime()
            val prev = lastUiEmitNs.get()
            if (now - prev >= 120_000_000L && lastUiEmitNs.compareAndSet(prev, now)) {
                val elapsedSec = ((now - startTimeNs) / 1_000_000_000.0).coerceAtLeast(0.1)
                val done = downloadedCounter.get()
                val speed = (done / elapsedSec).toLong()
                _state.update {
                    it.copy(
                        downloadedBytes = done,
                        totalBytes = total.coerceAtLeast(done),
                        speedBytesPerSec = speed,
                        message = "Téléchargement rapide en cours..."
                    )
                }
            }
        }

        if (streamCount > 1 && contentLength > 0L) {
            RandomAccessFile(destFile, "rw").use { raf ->
                raf.setLength(contentLength)
            }
            val chunkSize = contentLength / streamCount
            coroutineScope {
                val jobs = (0 until streamCount).map { idx ->
                    val rangeStart = idx * chunkSize
                    val rangeEnd = if (idx == streamCount - 1) contentLength - 1L else (rangeStart + chunkSize - 1L)
                    async(Dispatchers.IO) {
                        val req = Request.Builder()
                            .url(apkUrl)
                            .header("Range", "bytes=$rangeStart-$rangeEnd")
                            .build()
                        client.newCall(req).execute().use { resp ->
                            check(resp.isSuccessful) { "HTTP ${resp.code}" }
                            val input = resp.body?.byteStream() ?: error("Empty stream")
                            val buffer = ByteArray(256 * 1024)
                            RandomAccessFile(destFile, "rw").use { raf ->
                                raf.seek(rangeStart)
                                var read: Int
                                while (input.read(buffer).also { read = it } != -1) {
                                    raf.write(buffer, 0, read)
                                    downloadedCounter.addAndGet(read.toLong())
                                    reportProgress(contentLength)
                                }
                            }
                        }
                    }
                }
                jobs.awaitAll()
            }
            _state.update {
                it.copy(downloadedBytes = contentLength, totalBytes = contentLength)
            }
        } else {
            val req = Request.Builder().url(apkUrl).build()
            client.newCall(req).execute().use { resp ->
                check(resp.isSuccessful) { "HTTP ${resp.code}" }
                val body = resp.body ?: error("Empty response body")
                val total = body.contentLength().takeIf { it > 0L } ?: contentLength
                val buffer = ByteArray(256 * 1024)
                destFile.outputStream().use { out ->
                    body.byteStream().use { input ->
                        var read: Int
                        while (input.read(buffer).also { read = it } != -1) {
                            out.write(buffer, 0, read)
                            downloadedCounter.addAndGet(read.toLong())
                            reportProgress(total)
                        }
                    }
                }
                _state.update {
                    val finalSize = destFile.length()
                    it.copy(downloadedBytes = finalSize, totalBytes = finalSize)
                }
            }
        }
    }

    private fun compareSemVer(remote: String, local: String): Int {
        val rParts = remote.split(".", "-", "_").mapNotNull { it.toIntOrNull() }
        val lParts = local.split(".", "-", "_").mapNotNull { it.toIntOrNull() }
        val maxLen = maxOf(rParts.size, lParts.size)
        for (i in 0 until maxLen) {
            val r = rParts.getOrElse(i) { 0 }
            val l = lParts.getOrElse(i) { 0 }
            if (r != l) return r.compareTo(l)
        }
        return 0
    }

    companion object {
        fun formatBytes(bytes: Long): String {
            if (bytes <= 0L) return "0 Mo"
            val mb = bytes / (1024.0 * 1024.0)
            return if (mb >= 1.0) {
                String.format(java.util.Locale.FRANCE, "%.1f Mo", mb)
            } else {
                "${(bytes / 1024L).coerceAtLeast(1L)} Ko"
            }
        }

        fun formatSpeed(bytesPerSec: Long): String {
            if (bytesPerSec <= 0L) return "0 Ko/s"
            val mbps = bytesPerSec / (1024.0 * 1024.0)
            return if (mbps >= 1.0) {
                String.format(java.util.Locale.FRANCE, "%.1f Mo/s", mbps)
            } else {
                "${(bytesPerSec / 1024L).coerceAtLeast(1L)} Ko/s"
            }
        }
    }
}

package com.afrocuisto.app.ui.screens.aichef

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import android.util.Base64
import android.util.Log
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.abs
import kotlin.math.sin
import kotlin.math.sqrt

enum class ActiveVoiceEngineBadge {
    GEMINI_3_8_CLOUD,
    GOOGLE_NEURAL_NET,
    GOOGLE_NEURAL_LOCAL
}

data class SpeechPhraseSegment(
    val text: String,
    val startOffset: Int,
    val trailingPauseMs: Long,
    val pitchMultiplier: Float,
    val rateMultiplier: Float
)

/**
 * Dual-tier realistic Gemini Live Voice Synthesis Engine:
 *
 * Tier 1 — Authentic Google Gemini 3.8 Expressive Neural TTS (`gemini-3.8-flash-lite-tts` via
 *          Interactions API `POST /v1beta/interactions`) streaming 24kHz PCM directly to AudioTrack
 *          with real-time waveform RMS amplitude extraction.
 *
 * Tier 2 — Instant zero-key Google Speech Services (`com.google.android.tts`) Neural/Network
 *          high-definition French voice ranking + conversational clause-by-clause prosody engine
 *          (natural micro-pauses, warm pitch inflection, assistant speech audio equalization).
 */
class GeminiVoiceEngine(
    private val context: Context,
    private val scope: CoroutineScope,
    private val onEngineBadgeChanged: (ActiveVoiceEngineBadge) -> Unit
) {
    companion object {
        private const val TAG = "GeminiVoiceEngine"
        private const val GOOGLE_TTS_PACKAGE = "com.google.android.tts"
        private const val INTERACTIONS_ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/interactions"
        private const val GEMINI_TTS_MODEL = "gemini-3.8-flash-lite-tts"
        private const val DEFAULT_PCM_SAMPLE_RATE = 24000
    }

    private val json = Json { ignoreUnknownKeys = true }

    private var tts: TextToSpeech? = null
    private var isTtsReady = false
    private var availableFrenchVoices: List<Voice> = emptyList()
    private var currentVoiceProfile: GeminiLiveVoiceProfile = GeminiVoiceCatalog.voices.first()
    private var apiKey: String = ""

    private var activePlaybackJob: Job? = null
    private var activeEnvelopeJob: Job? = null
    private var activeAudioTrack: AudioTrack? = null
    private val isStopped = AtomicBoolean(false)
    private var isReleased = false

    // Active phrase tracking for local/network Google Neural TTS callbacks
    private var currentPhraseOffsets: Map<String, Int> = emptyMap()
    private var currentFinalUtteranceId: String? = null
    private var currentOnProgress: ((Int) -> Unit)? = null
    private var currentOnAmplitude: ((Float) -> Unit)? = null
    private var currentOnDone: (() -> Unit)? = null
    private var pendingTtsInvocation: (() -> Unit)? = null
    private var syllableImpulse = 0f

    init {
        initGoogleTtsEngine(useGooglePackage = true)
    }

    fun updateApiKey(key: String) {
        apiKey = key.trim()
        if (apiKey.isNotEmpty()) {
            onEngineBadgeChanged(ActiveVoiceEngineBadge.GEMINI_3_8_CLOUD)
        } else {
            refreshLocalBadge()
        }
    }

    fun selectVoiceProfile(profile: GeminiLiveVoiceProfile) {
        currentVoiceProfile = profile
        if (isTtsReady) {
            applyBestVoiceForProfile(profile)
        }
    }

    private fun initGoogleTtsEngine(useGooglePackage: Boolean) {
        try {
            val listener = TextToSpeech.OnInitListener { status ->
                if (isReleased) return@OnInitListener
                if (status == TextToSpeech.SUCCESS) {
                    onTtsInitialized()
                } else if (useGooglePackage) {
                    // Fallback to system default engine if Google TTS package isn't directly bindable
                    initGoogleTtsEngine(useGooglePackage = false)
                }
            }
            tts = if (useGooglePackage) {
                TextToSpeech(context.applicationContext, listener, GOOGLE_TTS_PACKAGE)
            } else {
                TextToSpeech(context.applicationContext, listener)
            }
        } catch (t: Throwable) {
            Log.w(TAG, "TTS init error (useGoogle=$useGooglePackage): ${t.message}")
            if (useGooglePackage) {
                initGoogleTtsEngine(useGooglePackage = false)
            }
        }
    }

    private fun onTtsInitialized() {
        val engine = tts ?: return
        try {
            engine.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ASSISTANT)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
        } catch (_: Throwable) {
        }

        val langRes = engine.setLanguage(Locale.FRANCE)
        if (langRes == TextToSpeech.LANG_MISSING_DATA || langRes == TextToSpeech.LANG_NOT_SUPPORTED) {
            engine.setLanguage(Locale.FRENCH)
        }

        discoverAndRankFrenchVoices(engine)
        applyBestVoiceForProfile(currentVoiceProfile)

        engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                if (isReleased || isStopped.get()) return
                syllableImpulse = 0.28f
            }

            override fun onRangeStart(utteranceId: String?, start: Int, end: Int, frame: Int) {
                if (isReleased || isStopped.get()) return
                val baseOffset = currentPhraseOffsets[utteranceId] ?: 0
                syllableImpulse = 0.34f
                currentOnProgress?.invoke(baseOffset + end)
            }

            override fun onDone(utteranceId: String?) {
                if (isReleased || isStopped.get()) return
                if (utteranceId != null && utteranceId == currentFinalUtteranceId) {
                    activeEnvelopeJob?.cancel()
                    currentOnDone?.invoke()
                }
            }

            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) {
                if (isReleased || isStopped.get()) return
                if (utteranceId == null || utteranceId == currentFinalUtteranceId) {
                    activeEnvelopeJob?.cancel()
                    currentOnDone?.invoke()
                }
            }

            override fun onError(utteranceId: String?, errorCode: Int) {
                if (isReleased || isStopped.get()) return
                if (utteranceId == null || utteranceId == currentFinalUtteranceId) {
                    activeEnvelopeJob?.cancel()
                    currentOnDone?.invoke()
                }
            }
        })

        isTtsReady = true
        pendingTtsInvocation?.let { pending ->
            pendingTtsInvocation = null
            pending.invoke()
        }
    }

    private fun discoverAndRankFrenchVoices(engine: TextToSpeech) {
        val allVoices = try {
            engine.voices.orEmpty()
        } catch (_: Throwable) {
            emptySet()
        }

        val frenchInstalled = allVoices
            .filter { voice ->
                voice.locale.language.equals("fr", ignoreCase = true) &&
                    (voice.features == null || !voice.features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED))
            }
            .sortedByDescending { scoreGoogleVoice(it) }

        availableFrenchVoices = frenchInstalled
        Log.d(
            TAG,
            "Discovered ${frenchInstalled.size} French voices; top 6: " +
                frenchInstalled.take(6).joinToString { v ->
                    "${v.name}(q=${v.quality},net=${v.isNetworkConnectionRequired},score=${scoreGoogleVoice(v)})"
                }
        )
    }

    /**
     * Ranks Google Speech Services voices so Neural/WaveNet Network & Pixel HD neural voices
     * dramatically beat flat legacy offline voices.
     */
    private fun scoreGoogleVoice(voice: Voice): Int {
        var score = 0
        val name = voice.name.lowercase(Locale.US)
        if (voice.isNetworkConnectionRequired) score += 220
        when {
            voice.quality >= Voice.QUALITY_VERY_HIGH -> score += 140
            voice.quality >= Voice.QUALITY_HIGH -> score += 90
            voice.quality >= Voice.QUALITY_NORMAL -> score += 35
        }
        if (voice.locale.country.equals("FR", ignoreCase = true)) score += 60
        // Google's newer neural French studio/WaveNet voices (vlf, frd, frb, frc) sound far more lifelike
        if (name.contains("-vlf-") || name.contains("-vlg-")) score += 55
        if (name.contains("-frd-") || name.contains("-frb-") || name.contains("-frc-")) score += 42
        if (name.contains("network")) score += 30
        if (name.contains("neural") || name.contains("wavenet") || name.contains("studio")) score += 80
        // Slightly deprioritize older flat legacy voice when neural voices exist
        if (name.contains("-fra-local")) score -= 25
        return score
    }

    private fun applyBestVoiceForProfile(profile: GeminiLiveVoiceProfile) {
        val engine = tts ?: return
        if (availableFrenchVoices.isEmpty()) {
            refreshLocalBadge()
            return
        }

        // First try matching one of this persona's preferred Google neural tokens (e.g. vlf, frc, frd, frb)
        val preferredVoice = profile.preferredGoogleVoiceTokens
            .firstNotNullOfOrNull { token ->
                availableFrenchVoices.firstOrNull { v ->
                    v.name.lowercase(Locale.US).contains("-$token-")
                }
            }
            ?: availableFrenchVoices.first()

        try {
            engine.voice = preferredVoice
            engine.setSpeechRate(profile.speechRate)
            engine.setPitch(profile.pitch)
            Log.d(
                TAG,
                "Applied voice '${preferredVoice.name}' (net=${preferredVoice.isNetworkConnectionRequired}, q=${preferredVoice.quality}) for profile ${profile.displayName}"
            )
        } catch (t: Throwable) {
            Log.w(TAG, "Failed setting voice ${preferredVoice.name}: ${t.message}")
        }
        refreshLocalBadge()
    }

    private fun refreshLocalBadge() {
        if (apiKey.isNotEmpty()) {
            onEngineBadgeChanged(ActiveVoiceEngineBadge.GEMINI_3_8_CLOUD)
            return
        }
        val activeVoice = try {
            tts?.voice
        } catch (_: Throwable) {
            null
        }
        val badge = if (activeVoice?.isNetworkConnectionRequired == true) {
            ActiveVoiceEngineBadge.GOOGLE_NEURAL_NET
        } else {
            ActiveVoiceEngineBadge.GOOGLE_NEURAL_LOCAL
        }
        onEngineBadgeChanged(badge)
    }

    /**
     * Speaks a response using:
     * 1. Real Gemini 3.8 Expressive Neural TTS (`gemini-3.8-flash-lite-tts`) if an API key is configured.
     * 2. Automatic seamless fallback to Pixel Google Neural/Network TTS with conversational breathing & prosody.
     */
    fun speak(
        rawText: String,
        profile: GeminiLiveVoiceProfile,
        onCharProgress: (Int) -> Unit,
        onAmplitude: (Float) -> Unit,
        onFinished: () -> Unit
    ) {
        if (isReleased) return
        stop()
        isStopped.set(false)
        currentVoiceProfile = profile
        currentOnProgress = onCharProgress
        currentOnAmplitude = onAmplitude
        currentOnDone = onFinished

        val cleanText = rawText
            .replace(Regex("[*#`_]"), "")
            .replace("\n", " ")
            .replace(Regex("\\s+"), " ")
            .trim()

        if (cleanText.isEmpty()) {
            onFinished()
            return
        }

        val configuredKey = apiKey.trim()
        if (configuredKey.isNotEmpty()) {
            activePlaybackJob = scope.launch {
                val playedViaCloud = tryPlayGemini38CloudAudio(
                    apiKey = configuredKey,
                    text = cleanText,
                    profile = profile,
                    onCharProgress = onCharProgress,
                    onAmplitude = onAmplitude
                )
                if (isReleased || isStopped.get()) return@launch
                if (playedViaCloud) {
                    onEngineBadgeChanged(ActiveVoiceEngineBadge.GEMINI_3_8_CLOUD)
                    onCharProgress(cleanText.length)
                    onFinished()
                } else {
                    // Seamless zero-error fallback to Google Neural TTS if offline or key invalid
                    speakViaGoogleNeuralTts(cleanText, profile, onCharProgress, onAmplitude, onFinished)
                }
            }
        } else {
            speakViaGoogleNeuralTts(cleanText, profile, onCharProgress, onAmplitude, onFinished)
        }
    }

    /**
     * Calls Google Gemini 3.8 Expressive Neural TTS (`gemini-3.8-flash-lite-tts`) via the
     * Interactions API and streams 24kHz PCM audio to AudioTrack while computing true RMS amplitude.
     */
    private suspend fun tryPlayGemini38CloudAudio(
        apiKey: String,
        text: String,
        profile: GeminiLiveVoiceProfile,
        onCharProgress: (Int) -> Unit,
        onAmplitude: (Float) -> Unit
    ): Boolean {
        val expressiveTranscript = injectNaturalGeminiPauses(text)
        val audioPayload = withContext(Dispatchers.IO) {
            requestGemini38TtsBytes(apiKey, expressiveTranscript, profile)
        } ?: return false

        if (isReleased || isStopped.get()) return false

        return withContext(Dispatchers.IO) {
            playPcmWithLiveRms(
                rawBytes = audioPayload.first,
                mimeType = audioPayload.second,
                totalTextLength = text.length,
                onCharProgress = onCharProgress,
                onAmplitude = onAmplitude
            )
        }
    }

    private fun injectNaturalGeminiPauses(text: String): String {
        return text
            .replace(". ", ". <short pause> ")
            .replace("! ", "! <short pause> ")
            .replace("? ", "? <short pause> ")
    }

    private fun requestGemini38TtsBytes(
        apiKey: String,
        transcript: String,
        profile: GeminiLiveVoiceProfile
    ): Pair<ByteArray, String>? {
        var connection: HttpURLConnection? = null
        return try {
            val payload = buildJsonObject {
                put("model", GEMINI_TTS_MODEL)
                put(
                    "input",
                    buildJsonArray {
                        add(
                            buildJsonObject {
                                put("type", "user_input")
                                put(
                                    "content",
                                    buildJsonArray {
                                        add(
                                            buildJsonObject {
                                                put("type", "text")
                                                put("text", transcript)
                                                put(
                                                    "annotations",
                                                    buildJsonArray {
                                                        add(
                                                            buildJsonObject {
                                                                put("type", "speech_metadata")
                                                                put("style", profile.geminiStylePrompt)
                                                            }
                                                        )
                                                    }
                                                )
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    }
                )
                put(
                    "response_format",
                    buildJsonObject {
                        put("type", "audio")
                        put("mime_type", "audio/wav")
                    }
                )
                put(
                    "generation_config",
                    buildJsonObject {
                        put(
                            "speech_config",
                            buildJsonArray {
                                add(
                                    buildJsonObject {
                                        put("voice", profile.geminiApiVoice)
                                    }
                                )
                            }
                        )
                    }
                )
            }

            connection = (URL(INTERACTIONS_ENDPOINT).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 9000
                readTimeout = 16000
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                setRequestProperty("x-goog-api-key", apiKey)
                setRequestProperty("Api-Revision", "2026-05-20")
            }

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(payload.toString())
            }

            val code = connection.responseCode
            if (code !in 200..299) {
                val errBody = connection.errorStream?.bufferedReader()?.use { it.readText() }
                Log.w(TAG, "Gemini 3.8 TTS HTTP $code: ${errBody?.take(220)}")
                return null
            }

            val responseBody = connection.inputStream.bufferedReader().use { it.readText() }
            val root = json.parseToJsonElement(responseBody).jsonObject
            extractAudioFromInteraction(root)
        } catch (ce: CancellationException) {
            throw ce
        } catch (t: Throwable) {
            Log.w(TAG, "Gemini 3.8 TTS call failed: ${t.message}")
            null
        } finally {
            connection?.disconnect()
        }
    }

    private fun extractAudioFromInteraction(root: JsonObject): Pair<ByteArray, String>? {
        val steps: JsonArray = root["steps"]?.jsonArray ?: return null
        for (i in steps.lastIndex downTo 0) {
            val stepObj = steps[i].jsonObject
            val contentArray = stepObj["content"]?.jsonArray ?: continue
            for (part in contentArray) {
                val partObj = part.jsonObject
                if (partObj["type"]?.jsonPrimitive?.contentOrNull == "audio") {
                    val b64 = partObj["data"]?.jsonPrimitive?.contentOrNull ?: continue
                    val mime = partObj["mime_type"]?.jsonPrimitive?.contentOrNull ?: "audio/wav"
                    val bytes = Base64.decode(b64, Base64.DEFAULT)
                    if (bytes.isNotEmpty()) return bytes to mime
                }
            }
        }
        return null
    }

    private fun playPcmWithLiveRms(
        rawBytes: ByteArray,
        mimeType: String,
        totalTextLength: Int,
        onCharProgress: (Int) -> Unit,
        onAmplitude: (Float) -> Unit
    ): Boolean {
        var sampleRate = DEFAULT_PCM_SAMPLE_RATE
        var pcmOffset = 0

        // Parse standard RIFF WAV header if present (Gemini 3.8 TTS default audio/wav)
        if (rawBytes.size > 44 &&
            rawBytes[0] == 'R'.code.toByte() &&
            rawBytes[1] == 'I'.code.toByte() &&
            rawBytes[2] == 'F'.code.toByte() &&
            rawBytes[3] == 'F'.code.toByte()
        ) {
            sampleRate = ByteBuffer.wrap(rawBytes, 24, 4).order(ByteOrder.LITTLE_ENDIAN).int
                .takeIf { it in 8000..48000 } ?: DEFAULT_PCM_SAMPLE_RATE
            // Locate "data" subchunk cleanly
            var pos = 12
            while (pos + 8 <= rawBytes.size) {
                val isData = rawBytes[pos] == 'd'.code.toByte() &&
                    rawBytes[pos + 1] == 'a'.code.toByte() &&
                    rawBytes[pos + 2] == 't'.code.toByte() &&
                    rawBytes[pos + 3] == 'a'.code.toByte()
                val chunkSize = ByteBuffer.wrap(rawBytes, pos + 4, 4).order(ByteOrder.LITTLE_ENDIAN).int
                if (isData) {
                    pcmOffset = pos + 8
                    break
                }
                if (chunkSize <= 0) break
                pos += 8 + chunkSize
            }
            if (pcmOffset == 0) pcmOffset = 44
        } else if (mimeType.contains("rate=")) {
            Regex("rate=(\\d+)").find(mimeType)?.groupValues?.getOrNull(1)?.toIntOrNull()?.let {
                sampleRate = it
            }
        }

        val totalPcmBytes = (rawBytes.size - pcmOffset).coerceAtLeast(0)
        if (totalPcmBytes <= 0) return false

        val minBuf = AudioTrack.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        ).coerceAtLeast(4096)

        val track = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ASSISTANT)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(sampleRate)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(minBuf * 2)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()

        activeAudioTrack = track

        return try {
            track.play()
            val chunkSize = (sampleRate / 25) * 2 // ~40ms of 16-bit mono PCM per RMS frame
            var cursor = pcmOffset
            var smoothRms = 0.22f

            while (cursor < rawBytes.size && !isStopped.get() && !isReleased) {
                val len = minOf(chunkSize, rawBytes.size - cursor)
                val written = track.write(rawBytes, cursor, len)
                if (written <= 0) break

                // Compute real RMS acoustic energy directly from the 16-bit PCM samples
                var sumSq = 0.0
                var sampleCount = 0
                var i = cursor
                while (i + 1 < cursor + written) {
                    val sample = ((rawBytes[i + 1].toInt() shl 8) or (rawBytes[i].toInt() and 0xFF)).toShort()
                    val norm = sample / 32768.0
                    sumSq += norm * norm
                    sampleCount++
                    i += 2
                }
                if (sampleCount > 0) {
                    val rms = sqrt(sumSq / sampleCount).toFloat()
                    val boosted = (rms * 3.8f).coerceIn(0.12f, 1.0f)
                    smoothRms = smoothRms * 0.45f + boosted * 0.55f
                    onAmplitude(smoothRms)
                }

                cursor += written
                val progress = ((cursor - pcmOffset).toFloat() / totalPcmBytes).coerceIn(0f, 1f)
                onCharProgress((totalTextLength * progress).toInt())
            }

            true
        } catch (t: Throwable) {
            Log.w(TAG, "AudioTrack playback error: ${t.message}")
            false
        } finally {
            try {
                track.pause()
                track.flush()
                track.stop()
                track.release()
            } catch (_: Throwable) {
            }
            if (activeAudioTrack === track) {
                activeAudioTrack = null
            }
        }
    }

    /**
     * Speaks via Pixel's Google Speech Services Neural/Network voice with human conversational
     * sentence segmentation, micro-breathing pauses, and expressive inflection.
     */
    private fun speakViaGoogleNeuralTts(
        cleanText: String,
        profile: GeminiLiveVoiceProfile,
        onCharProgress: (Int) -> Unit,
        onAmplitude: (Float) -> Unit,
        onFinished: () -> Unit
    ) {
        if (!isTtsReady || tts == null) {
            pendingTtsInvocation = {
                if (!isStopped.get() && !isReleased) {
                    speakViaGoogleNeuralTts(cleanText, profile, onCharProgress, onAmplitude, onFinished)
                }
            }
            startFallbackCaptionTimer(cleanText, onCharProgress, onAmplitude, onFinished)
            return
        }

        val engine = tts ?: return
        applyBestVoiceForProfile(profile)

        val phrases = segmentIntoConversationalPhrases(cleanText)
        val batchPrefix = "gvoice_${System.currentTimeMillis()}"
        val offsetMap = mutableMapOf<String, Int>()
        var lastId = ""

        val params = Bundle().apply {
            putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
        }

        phrases.forEachIndexed { index, phrase ->
            val utteranceId = "${batchPrefix}_$index"
            offsetMap[utteranceId] = phrase.startOffset
            lastId = utteranceId

            // Subtle natural conversational prosody variation per sentence punctuation
            engine.setPitch((profile.pitch * phrase.pitchMultiplier).coerceIn(0.84f, 1.15f))
            engine.setSpeechRate((profile.speechRate * phrase.rateMultiplier).coerceIn(0.88f, 1.14f))

            val queueMode = if (index == 0) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD
            val result = engine.speak(phrase.text, queueMode, params, utteranceId)
            if (result != TextToSpeech.SUCCESS) {
                startFallbackCaptionTimer(cleanText, onCharProgress, onAmplitude, onFinished)
                return
            }

            if (phrase.trailingPauseMs > 0L && index < phrases.lastIndex) {
                engine.playSilentUtterance(
                    phrase.trailingPauseMs,
                    TextToSpeech.QUEUE_ADD,
                    "${batchPrefix}_pause_$index"
                )
            }
        }

        currentPhraseOffsets = offsetMap
        currentFinalUtteranceId = lastId
        startNaturalVocalEnvelope(onAmplitude)
    }

    /**
     * Splits text into natural breathing clauses so Google Neural TTS paces with authentic
     * conversational pauses and lively intonation instead of monotonic GPS-style reading.
     */
    private fun segmentIntoConversationalPhrases(text: String): List<SpeechPhraseSegment> {
        val result = mutableListOf<SpeechPhraseSegment>()
        val regex = Regex("[^.!?]+[.!?]*")
        for (match in regex.findAll(text)) {
            val raw = match.value
            val trimmed = raw.trim()
            if (trimmed.isEmpty()) continue
            val leadingSpaces = raw.indexOfFirst { !it.isWhitespace() }.coerceAtLeast(0)
            val startIdx = match.range.first + leadingSpaces

            val (pauseMs, pitchMul, rateMul) = when {
                trimmed.endsWith("!") -> Triple(135L, 1.03f, 1.02f)
                trimmed.endsWith("?") -> Triple(165L, 1.04f, 0.99f)
                trimmed.endsWith(".") -> Triple(175L, 0.995f, 1.0f)
                else -> Triple(110L, 1.0f, 1.0f)
            }

            result += SpeechPhraseSegment(
                text = trimmed,
                startOffset = startIdx,
                trailingPauseMs = pauseMs,
                pitchMultiplier = pitchMul,
                rateMultiplier = rateMul
            )
        }
        return result.ifEmpty {
            listOf(SpeechPhraseSegment(text, 0, 0L, 1.0f, 1.0f))
        }
    }

    private fun startNaturalVocalEnvelope(onAmplitude: (Float) -> Unit) {
        activeEnvelopeJob?.cancel()
        activeEnvelopeJob = scope.launch {
            var tick = 0f
            while (isActive && !isReleased && !isStopped.get()) {
                tick += 0.21f
                syllableImpulse = (syllableImpulse * 0.76f).coerceAtLeast(0f)
                val envelope = (
                    0.34f +
                        0.26f * abs(sin(tick * 1.4f)) +
                        0.16f * abs(sin(tick * 2.85f + 0.6f)) +
                        syllableImpulse
                    ).coerceIn(0.16f, 1.0f)
                onAmplitude(envelope)
                delay(42L)
            }
        }
    }

    private fun startFallbackCaptionTimer(
        cleanText: String,
        onCharProgress: (Int) -> Unit,
        onAmplitude: (Float) -> Unit,
        onFinished: () -> Unit
    ) {
        activeEnvelopeJob?.cancel()
        activeEnvelopeJob = scope.launch {
            val totalChars = cleanText.length.coerceAtLeast(1)
            val totalDurationMs = (totalChars * 46L).coerceIn(2200L, 6500L)
            var elapsed = 0L
            var tick = 0f
            while (isActive && !isReleased && !isStopped.get() && elapsed < totalDurationMs) {
                if (isTtsReady && tts?.isSpeaking == true) return@launch
                tick += 0.22f
                elapsed += 50L
                val progress = (elapsed.toFloat() / totalDurationMs).coerceIn(0f, 1f)
                onCharProgress((totalChars * progress).toInt())
                onAmplitude((0.36f + 0.34f * abs(sin(tick * 1.5f))).coerceIn(0.18f, 0.95f))
                delay(50L)
            }
            if (!isReleased && !isStopped.get()) {
                onCharProgress(cleanText.length)
                onFinished()
            }
        }
    }

    fun stop() {
        isStopped.set(true)
        pendingTtsInvocation = null
        activePlaybackJob?.cancel()
        activePlaybackJob = null
        activeEnvelopeJob?.cancel()
        activeEnvelopeJob = null
        try {
            activeAudioTrack?.let { track ->
                track.pause()
                track.flush()
                track.stop()
            }
        } catch (_: Throwable) {
        }
        try {
            tts?.stop()
        } catch (_: Throwable) {
        }
    }

    fun release() {
        if (isReleased) return
        isReleased = true
        stop()
        try {
            tts?.shutdown()
        } catch (_: Throwable) {
        }
        tts = null
    }
}

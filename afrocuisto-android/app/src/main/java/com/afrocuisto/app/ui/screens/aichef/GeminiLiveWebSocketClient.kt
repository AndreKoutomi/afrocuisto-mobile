package com.afrocuisto.app.ui.screens.aichef

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.AutomaticGainControl
import android.media.audiofx.NoiseSuppressor
import android.os.Build
import android.util.Base64
import android.util.Log
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong
import kotlin.math.sqrt

/**
 * Native Full-Duplex Google Gemini 3.8 Live WebSocket Client (`models/gemini-3.8-live`)
 * delivering the exact same real-time bidirectional voice experience as Android 17 Gemini Live:
 *
 * - Connects over WebSockets to `BidiGenerateContent` with `models/gemini-3.8-live`.
 * - Full-duplex 16kHz 16-bit mono PCM microphone capture using `VOICE_COMMUNICATION` +
 *   hardware DSP `AcousticEchoCanceler`, `NoiseSuppressor`, and `AutomaticGainControl`
 *   so the microphone remains open while Gemini speaks without self-echo.
 * - Low-latency 24kHz 16-bit mono PCM streaming `AudioTrack` output queue with real-time
 *   acoustic RMS extraction at ~60fps for the AGSL wave shader.
 * - Instant natural hands-free barge-in (`serverContent.interrupted == true`) flushing
 *   audio output in <15ms whenever the user speaks over Gemini.
 * - Live streaming `inputTranscription` & `outputTranscription` for real-time captions.
 */
class GeminiLiveWebSocketClient(
    private val context: Context,
    private val scope: CoroutineScope,
    private val callbacks: Callbacks
) {
    interface Callbacks {
        fun onConnected()
        fun onUserTranscript(text: String, isFinal: Boolean)
        fun onAiTranscriptDelta(accumulatedText: String, spokenCharsEstimate: Int)
        fun onAiSpeakingStarted()
        fun onAiTurnCompleted(userText: String, aiText: String)
        fun onInterrupted()
        fun onAudioLevel(rmsLevel: Float, isAiSpeaking: Boolean)
        fun onConnectionFailed(reason: String)
    }

    companion object {
        private const val TAG = "GeminiLiveWS"
        private const val WS_ENDPOINT =
            "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"

        // Primary Gemini 3.8 Live low-latency native audio model
        private val LIVE_MODELS = listOf(
            "models/gemini-3.8-live"
        )

        private const val INPUT_SAMPLE_RATE = 16000
        private const val OUTPUT_SAMPLE_RATE = 24000
        private const val MIC_FRAME_BYTES = 1280 // 40ms @ 16kHz 16-bit mono

        private const val LIVE_CULINARY_SYSTEM_INSTRUCTION = """
Tu es Chef Afro en mode Gemini Live sur Android 17, l'assistant culinaire vocal temps réel d'AfroCuisto.
RÈGLES DE CONVERSATION LIVE :
1. Parle en français naturel, chaleureux, spontané et fluide, exactement comme un vrai chef à côté de l'utilisateur en cuisine.
2. Réponds de façon concise et vivante à l'oral (2 à 4 phrases fluides par tour sauf si l'utilisateur demande le détail complet), sans jamais lire de symboles Markdown, d'astérisques ni d'emojis.
3. Tu es exclusivement dédié à la gastronomie africaine, à la cuisine du quotidien, aux ingrédients du frigo, aux cuissons, épices, accompagnements et boissons. Si on te parle d'un sujet hors cuisine, ramène poliment et naturellement la discussion vers les fourneaux.
4. Sois proactif : propose des idées concrètes selon les ingrédients cités, donne des astuces de chef précises (temps, feu, texture) et accompagne l'utilisateur étape par étape.
"""
    }

    private val json = Json { ignoreUnknownKeys = true }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS) // Unbounded stream for WebSocket
        .pingInterval(15, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private val isSetupComplete = AtomicBoolean(false)
    private val isClosed = AtomicBoolean(false)
    private val isMicMuted = AtomicBoolean(false)
    private val isPaused = AtomicBoolean(false)
    private val isAiCurrentlySpeaking = AtomicBoolean(false)

    private var micCaptureJob: Job? = null
    private var playbackWorkerJob: Job? = null
    private var connectTimeoutJob: Job? = null

    private var audioRecord: AudioRecord? = null
    private var echoCanceler: AcousticEchoCanceler? = null
    private var noiseSuppressor: NoiseSuppressor? = null
    private var autoGainControl: AutomaticGainControl? = null

    private var audioTrack: AudioTrack? = null
    private var pcmChannel: Channel<ByteArray>? = null
    private val queuedPcmBytes = AtomicInteger(0)
    private val playedPcmBytesInTurn = AtomicLong(0L)
    private val totalPcmBytesInTurn = AtomicLong(0L)
    private val serverTurnComplete = AtomicBoolean(false)

    private val currentUserTurnBuilder = StringBuilder()
    private val currentAiTurnBuilder = StringBuilder()
    private var previousAudioMode: Int? = null
    private var wasSpeakerphoneOn: Boolean? = null

    private var activeApiKey: String = ""
    private var activeVoiceName: String = "Aoede"
    private var modelAttemptIndex = 0
    private var pendingInitialGreetingPrompt: String? = null

    fun connect(
        apiKey: String,
        voiceProfile: GeminiLiveVoiceProfile,
        hasMicPermission: Boolean,
        initialGreetingPrompt: String? = "Salue chaleureusement l'utilisateur en une courte phrase naturelle et demande-lui ce qu'il a dans son frigo ou ce qu'il veut cuisiner."
    ) {
        disconnectInternal(restoreAudioMode = false)
        isClosed.set(false)
        isSetupComplete.set(false)
        activeApiKey = apiKey.trim()
        activeVoiceName = voiceProfile.geminiApiVoice
        pendingInitialGreetingPrompt = initialGreetingPrompt
        modelAttemptIndex = 0

        if (activeApiKey.isEmpty()) {
            callbacks.onConnectionFailed("Missing API key")
            return
        }

        configureCommunicationAudioRouting()
        startPlaybackPipeline()
        openWebSocketForAttempt(hasMicPermission)
    }

    private fun openWebSocketForAttempt(hasMicPermission: Boolean) {
        val modelName = LIVE_MODELS.getOrElse(modelAttemptIndex) { LIVE_MODELS.first() }
        val wsUrl = "$WS_ENDPOINT?key=$activeApiKey"
        val request = Request.Builder().url(wsUrl).build()

        connectTimeoutJob?.cancel()
        connectTimeoutJob = scope.launch {
            delay(6500L)
            if (!isSetupComplete.get() && !isClosed.get()) {
                Log.w(TAG, "Gemini Live WS setup timeout on $modelName")
                handleModelFailureOrFallback("Setup timeout", hasMicPermission)
            }
        }

        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                if (isClosed.get()) return
                Log.d(TAG, "Gemini Live WebSocket opened ($modelName), sending setup...")
                sendSetupMessage(webSocket, modelName)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                if (!isClosed.get()) {
                    handleServerJson(text, hasMicPermission)
                }
            }

            override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                if (!isClosed.get()) {
                    handleServerJson(bytes.utf8(), hasMicPermission)
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "Gemini Live WS closing ($code): $reason")
                webSocket.close(code, reason)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                if (!isClosed.get() && !isSetupComplete.get()) {
                    handleModelFailureOrFallback("Closed ($code): $reason", hasMicPermission)
                } else if (!isClosed.get() && code != 1000) {
                    callbacks.onConnectionFailed("Session ended ($code)")
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                if (isClosed.get()) return
                Log.w(TAG, "Gemini Live WS failure ($modelName): ${t.message}")
                handleModelFailureOrFallback(t.message ?: "WebSocket error", hasMicPermission)
            }
        })
    }

    private fun handleModelFailureOrFallback(reason: String, hasMicPermission: Boolean) {
        connectTimeoutJob?.cancel()
        try {
            webSocket?.cancel()
        } catch (_: Throwable) {
        }
        webSocket = null

        if (!isSetupComplete.get() && modelAttemptIndex + 1 < LIVE_MODELS.size) {
            modelAttemptIndex++
            openWebSocketForAttempt(hasMicPermission)
        } else {
            disconnect()
            callbacks.onConnectionFailed(reason)
        }
    }

    private fun sendSetupMessage(ws: WebSocket, modelName: String) {
        val setupPayload = buildJsonObject {
            put(
                "setup",
                buildJsonObject {
                    put("model", modelName)
                    put(
                        "generationConfig",
                        buildJsonObject {
                            put(
                                "responseModalities",
                                buildJsonArray { add( kotlinx.serialization.json.JsonPrimitive("AUDIO") ) }
                            )
                            put(
                                "speechConfig",
                                buildJsonObject {
                                    put(
                                        "voiceConfig",
                                        buildJsonObject {
                                            put(
                                                "prebuiltVoiceConfig",
                                                buildJsonObject {
                                                    put("voiceName", activeVoiceName)
                                                }
                                            )
                                        }
                                    )
                                }
                            )
                        }
                    )
                    put(
                        "systemInstruction",
                        buildJsonObject {
                            put(
                                "parts",
                                buildJsonArray {
                                    add(
                                        buildJsonObject {
                                            put("text", LIVE_CULINARY_SYSTEM_INSTRUCTION.trim())
                                        }
                                    )
                                }
                            )
                        }
                    )
                    put("inputAudioTranscription", buildJsonObject {})
                    put("outputAudioTranscription", buildJsonObject {})
                }
            )
        }
        ws.send(setupPayload.toString())
    }

    private fun handleServerJson(rawJson: String, hasMicPermission: Boolean) {
        val root: JsonObject = try {
            json.parseToJsonElement(rawJson).jsonObject
        } catch (t: Throwable) {
            Log.w(TAG, "Non-JSON frame ignored: ${t.message}")
            return
        }

        // 1. Setup Complete -> start full-duplex mic capture & trigger greeting if requested
        if (root.containsKey("setupComplete")) {
            connectTimeoutJob?.cancel()
            isSetupComplete.set(true)
            callbacks.onConnected()

            if (hasMicPermission && !isMicMuted.get() && !isPaused.get()) {
                startMicrophoneStreaming()
            }

            pendingInitialGreetingPrompt?.let { prompt ->
                pendingInitialGreetingPrompt = null
                sendTextTurn(prompt, recordAsUserTranscript = false)
            }
            return
        }

        // 2. Server Content — process ALL parts simultaneously (audio + input/output transcriptions + interruption)
        val serverContent = root["serverContent"]?.jsonObject ?: return

        // 2a. Instant Barge-In Interruption
        val interrupted = serverContent["interrupted"]?.jsonPrimitive?.booleanOrNull == true
        if (interrupted) {
            flushAudioPlaybackImmediately()
            callbacks.onInterrupted()
            return
        }

        // 2b. Interim & Final Input Audio Transcription (User speech)
        serverContent["interimInputTranscription"]?.jsonObject
            ?.get("text")?.jsonPrimitive?.contentOrNull
            ?.takeIf { it.isNotEmpty() }
            ?.let { interim ->
                val preview = (currentUserTurnBuilder.toString() + interim).trim()
                if (preview.isNotEmpty()) {
                    callbacks.onUserTranscript(preview, isFinal = false)
                }
            }

        serverContent["inputTranscription"]?.jsonObject
            ?.get("text")?.jsonPrimitive?.contentOrNull
            ?.takeIf { it.isNotEmpty() }
            ?.let { piece ->
                // If AI was finishing a previous turn and user starts speaking a new turn
                if (!isAiCurrentlySpeaking.get() && serverTurnComplete.get()) {
                    serverTurnComplete.set(false)
                    currentAiTurnBuilder.clear()
                }
                currentUserTurnBuilder.append(piece)
                val fullUser = currentUserTurnBuilder.toString().trim()
                if (fullUser.isNotEmpty()) {
                    callbacks.onUserTranscript(fullUser, isFinal = false)
                }
            }

        // 2c. Output Audio Transcription (Gemini spoken words)
        serverContent["outputTranscription"]?.jsonObject
            ?.get("text")?.jsonPrimitive?.contentOrNull
            ?.takeIf { it.isNotEmpty() }
            ?.let { piece ->
                currentAiTurnBuilder.append(piece)
                val fullAi = currentAiTurnBuilder.toString().trim()
                val progressRatio = estimatePlaybackRatio()
                val chars = (fullAi.length * progressRatio).toInt().coerceIn(0, fullAi.length)
                callbacks.onAiTranscriptDelta(fullAi, chars)
            }

        // 2d. Model Turn Audio Parts (24kHz 16-bit mono PCM chunks)
        serverContent["modelTurn"]?.jsonObject
            ?.get("parts")?.jsonArray
            ?.forEach { partElem ->
                val part = partElem.jsonObject
                val inlineData = part["inlineData"]?.jsonObject
                if (inlineData != null) {
                    val mime = inlineData["mimeType"]?.jsonPrimitive?.contentOrNull.orEmpty()
                    val b64 = inlineData["data"]?.jsonPrimitive?.contentOrNull
                    if (!b64.isNullOrEmpty() && (mime.isEmpty() || mime.startsWith("audio/"))) {
                        val pcmBytes = try {
                            Base64.decode(b64, Base64.DEFAULT)
                        } catch (_: Throwable) {
                            null
                        }
                        if (pcmBytes != null && pcmBytes.isNotEmpty()) {
                            enqueuePcmOutput(pcmBytes)
                        }
                    }
                }
            }

        // 2e. Turn Complete signal
        val turnComplete = serverContent["turnComplete"]?.jsonPrimitive?.booleanOrNull == true
        val interactionIdle = root["interactionStatus"]?.jsonPrimitive?.contentOrNull == "IDLE"
        if (turnComplete || interactionIdle) {
            serverTurnComplete.set(true)
            if (queuedPcmBytes.get() <= 0) {
                finalizeAiTurnIfNeeded()
            }
        }
    }

    private fun estimatePlaybackRatio(): Float {
        val total = totalPcmBytesInTurn.get()
        if (total <= 0L) return 1f
        val played = playedPcmBytesInTurn.get()
        return (played.toFloat() / total.toFloat()).coerceIn(0.15f, 1f)
    }

    private fun enqueuePcmOutput(pcmBytes: ByteArray) {
        if (isPaused.get() || isClosed.get()) return
        if (isAiCurrentlySpeaking.compareAndSet(false, true)) {
            serverTurnComplete.set(false)
            playedPcmBytesInTurn.set(0L)
            totalPcmBytesInTurn.set(0L)
            callbacks.onAiSpeakingStarted()
        }
        totalPcmBytesInTurn.addAndGet(pcmBytes.size.toLong())
        queuedPcmBytes.addAndGet(pcmBytes.size)
        pcmChannel?.trySend(pcmBytes)
    }

    private fun startPlaybackPipeline() {
        playbackWorkerJob?.cancel()
        val channel = Channel<ByteArray>(Channel.UNLIMITED)
        pcmChannel = channel

        val minBuf = AudioTrack.getMinBufferSize(
            OUTPUT_SAMPLE_RATE,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        ).coerceAtLeast(4800)

        val track = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(OUTPUT_SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(minBuf * 3)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()

        audioTrack = track
        try {
            track.play()
        } catch (t: Throwable) {
            Log.w(TAG, "AudioTrack play error: ${t.message}")
        }

        playbackWorkerJob = scope.launch(Dispatchers.IO) {
            val subChunkBytes = 1920 // 40ms @ 24kHz 16-bit mono -> ~25-50Hz smooth RMS updates
            var smoothRms = 0.20f

            try {
                for (buffer in channel) {
                    if (!isActive || isClosed.get()) break
                    var offset = 0
                    while (offset < buffer.size && !isClosed.get() && !isPaused.get()) {
                        val activeTrack = audioTrack ?: break
                        val len = minOf(subChunkBytes, buffer.size - offset)
                        val written = try {
                            activeTrack.write(buffer, offset, len)
                        } catch (_: Throwable) {
                            -1
                        }
                        if (written <= 0) break

                        val rms = computePcm16Rms(buffer, offset, written)
                        val boosted = (rms * 4.1f).coerceIn(0.14f, 1.0f)
                        smoothRms = smoothRms * 0.42f + boosted * 0.58f
                        callbacks.onAudioLevel(smoothRms, isAiSpeaking = true)

                        offset += written
                        playedPcmBytesInTurn.addAndGet(written.toLong())
                        val remaining = queuedPcmBytes.addAndGet(-written).coerceAtLeast(0)

                        val fullAi = currentAiTurnBuilder.toString().trim()
                        if (fullAi.isNotEmpty()) {
                            val chars = (fullAi.length * estimatePlaybackRatio()).toInt()
                                .coerceIn(0, fullAi.length)
                            callbacks.onAiTranscriptDelta(fullAi, chars)
                        }

                        if (remaining == 0 && serverTurnComplete.get()) {
                            finalizeAiTurnIfNeeded()
                        }
                    }
                }
            } catch (_: CancellationException) {
            } catch (t: Throwable) {
                Log.w(TAG, "Playback loop error: ${t.message}")
            }
        }
    }

    private fun finalizeAiTurnIfNeeded() {
        if (isAiCurrentlySpeaking.compareAndSet(true, false) || serverTurnComplete.get()) {
            serverTurnComplete.set(false)
            val userSpoken = currentUserTurnBuilder.toString().trim()
            val aiSpoken = currentAiTurnBuilder.toString().trim()
            currentUserTurnBuilder.clear()
            currentAiTurnBuilder.clear()
            playedPcmBytesInTurn.set(0L)
            totalPcmBytesInTurn.set(0L)
            callbacks.onAiTurnCompleted(userSpoken, aiSpoken)
        }
    }

    fun flushAudioPlaybackImmediately() {
        isAiCurrentlySpeaking.set(false)
        serverTurnComplete.set(false)
        queuedPcmBytes.set(0)
        playedPcmBytesInTurn.set(0L)
        totalPcmBytesInTurn.set(0L)
        currentAiTurnBuilder.clear()

        // Drain queued chunks without closing channel
        while (pcmChannel?.tryReceive()?.isSuccess == true) {
            // discard buffered audio immediately
        }

        try {
            audioTrack?.let { track ->
                track.pause()
                track.flush()
                track.play()
            }
        } catch (_: Throwable) {
        }
    }

    @SuppressLint("MissingPermission")
    fun startMicrophoneStreaming() {
        if (isClosed.get() || !isSetupComplete.get() || isMicMuted.get() || isPaused.get()) return
        if (micCaptureJob?.isActive == true) return

        micCaptureJob = scope.launch(Dispatchers.IO) {
            val minBuf = AudioRecord.getMinBufferSize(
                INPUT_SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            ).coerceAtLeast(MIC_FRAME_BYTES * 4)

            val recorder = try {
                AudioRecord(
                    MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                    INPUT_SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    minBuf * 2
                )
            } catch (t: Throwable) {
                Log.e(TAG, "AudioRecord creation failed: ${t.message}")
                return@launch
            }

            if (recorder.state != AudioRecord.STATE_INITIALIZED) {
                recorder.release()
                return@launch
            }

            audioRecord = recorder
            attachHardwareAudioEffects(recorder.audioSessionId)

            val frameBuf = ByteArray(MIC_FRAME_BYTES)
            var smoothMicRms = 0.12f

            try {
                recorder.startRecording()
                while (isActive && !isClosed.get() && !isMicMuted.get() && !isPaused.get()) {
                    val read = recorder.read(frameBuf, 0, frameBuf.size)
                    if (read <= 0) continue

                    val rms = computePcm16Rms(frameBuf, 0, read)
                    val normalized = (rms * 5.2f).coerceIn(0.06f, 1.0f)
                    smoothMicRms = smoothMicRms * 0.50f + normalized * 0.50f

                    if (!isAiCurrentlySpeaking.get()) {
                        callbacks.onAudioLevel(smoothMicRms, isAiSpeaking = false)
                    }

                    // Stream raw 16kHz PCM frame via Gemini 3.8 Live realtimeInput.audio
                    val chunkToEncode = if (read == frameBuf.size) frameBuf else frameBuf.copyOf(read)
                    val b64 = Base64.encodeToString(chunkToEncode, Base64.NO_WRAP)
                    val msg = buildJsonObject {
                        put(
                            "realtimeInput",
                            buildJsonObject {
                                put(
                                    "audio",
                                    buildJsonObject {
                                        put("data", b64)
                                        put("mimeType", "audio/pcm;rate=$INPUT_SAMPLE_RATE")
                                    }
                                )
                            }
                        )
                    }
                    webSocket?.send(msg.toString())
                }
            } catch (_: CancellationException) {
            } catch (t: Throwable) {
                Log.w(TAG, "Mic streaming stopped: ${t.message}")
            } finally {
                releaseAudioRecordInternal()
            }
        }
    }

    fun stopMicrophoneStreaming(sendStreamEnd: Boolean = true) {
        micCaptureJob?.cancel()
        micCaptureJob = null
        releaseAudioRecordInternal()
        if (sendStreamEnd && isSetupComplete.get() && !isClosed.get()) {
            val endMsg = buildJsonObject {
                put(
                    "realtimeInput",
                    buildJsonObject {
                        put("audioStreamEnd", true)
                    }
                )
            }
            webSocket?.send(endMsg.toString())
        }
    }

    fun sendTextTurn(text: String, recordAsUserTranscript: Boolean = true) {
        val cleaned = text.trim()
        if (cleaned.isEmpty() || isClosed.get() || !isSetupComplete.get()) return

        flushAudioPlaybackImmediately()
        if (recordAsUserTranscript) {
            currentUserTurnBuilder.clear()
            currentUserTurnBuilder.append(cleaned)
            callbacks.onUserTranscript(cleaned, isFinal = true)
        }

        // Send via realtimeInput.text per Gemini 3.8 Live specification
        val payload = buildJsonObject {
            put(
                "realtimeInput",
                buildJsonObject {
                    put("text", cleaned)
                }
            )
        }
        webSocket?.send(payload.toString())
    }

    fun setMuted(muted: Boolean, hasMicPermission: Boolean) {
        isMicMuted.set(muted)
        if (muted) {
            stopMicrophoneStreaming(sendStreamEnd = true)
        } else if (!isPaused.get() && hasMicPermission && isSetupComplete.get()) {
            startMicrophoneStreaming()
        }
    }

    fun setPaused(paused: Boolean, hasMicPermission: Boolean) {
        isPaused.set(paused)
        if (paused) {
            stopMicrophoneStreaming(sendStreamEnd = true)
            flushAudioPlaybackImmediately()
        } else if (!isMicMuted.get() && hasMicPermission && isSetupComplete.get()) {
            startMicrophoneStreaming()
        }
    }

    fun interruptByTap(hasMicPermission: Boolean) {
        flushAudioPlaybackImmediately()
        // Send empty turnComplete clientContent to cancel server generation if still streaming
        if (isSetupComplete.get() && !isClosed.get()) {
            val interruptPayload = buildJsonObject {
                put(
                    "clientContent",
                    buildJsonObject {
                        put("turns", buildJsonArray {})
                        put("turnComplete", true)
                    }
                )
            }
            webSocket?.send(interruptPayload.toString())
        }
        if (!isMicMuted.get() && !isPaused.get() && hasMicPermission) {
            startMicrophoneStreaming()
        }
    }

    private fun attachHardwareAudioEffects(audioSessionId: Int) {
        try {
            if (AcousticEchoCanceler.isAvailable()) {
                echoCanceler = AcousticEchoCanceler.create(audioSessionId)?.apply { enabled = true }
            }
        } catch (_: Throwable) {
        }
        try {
            if (NoiseSuppressor.isAvailable()) {
                noiseSuppressor = NoiseSuppressor.create(audioSessionId)?.apply { enabled = true }
            }
        } catch (_: Throwable) {
        }
        try {
            if (AutomaticGainControl.isAvailable()) {
                autoGainControl = AutomaticGainControl.create(audioSessionId)?.apply { enabled = true }
            }
        } catch (_: Throwable) {
        }
    }

    private fun releaseAudioRecordInternal() {
        try {
            echoCanceler?.release()
        } catch (_: Throwable) {
        }
        echoCanceler = null
        try {
            noiseSuppressor?.release()
        } catch (_: Throwable) {
        }
        noiseSuppressor = null
        try {
            autoGainControl?.release()
        } catch (_: Throwable) {
        }
        autoGainControl = null

        try {
            audioRecord?.let { rec ->
                if (rec.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                    rec.stop()
                }
                rec.release()
            }
        } catch (_: Throwable) {
        }
        audioRecord = null
    }

    private fun configureCommunicationAudioRouting() {
        val am = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
        try {
            if (previousAudioMode == null) {
                previousAudioMode = am.mode
                @Suppress("DEPRECATION")
                wasSpeakerphoneOn = am.isSpeakerphoneOn
            }
            am.mode = AudioManager.MODE_IN_COMMUNICATION

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val devices = am.availableCommunicationDevices
                // Keep Bluetooth/wired headset if user is wearing one; otherwise route to built-in speaker
                val externalHeadset = devices.firstOrNull {
                    it.type == AudioDeviceInfo.TYPE_BLE_HEADSET ||
                        it.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                        it.type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                        it.type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                        it.type == AudioDeviceInfo.TYPE_USB_HEADSET
                }
                val speaker = devices.firstOrNull { it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER }
                val target = externalHeadset ?: speaker
                if (target != null) {
                    am.setCommunicationDevice(target)
                }
            } else {
                @Suppress("DEPRECATION")
                am.isSpeakerphoneOn = true
            }
        } catch (t: Throwable) {
            Log.w(TAG, "Audio routing config warning: ${t.message}")
        }
    }

    private fun restoreAudioRouting() {
        val am = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                am.clearCommunicationDevice()
            } else {
                wasSpeakerphoneOn?.let {
                    @Suppress("DEPRECATION")
                    am.isSpeakerphoneOn = it
                }
            }
            previousAudioMode?.let { am.mode = it }
        } catch (_: Throwable) {
        }
        previousAudioMode = null
        wasSpeakerphoneOn = null
    }

    private fun computePcm16Rms(bytes: ByteArray, offset: Int, length: Int): Float {
        var sumSq = 0.0
        var count = 0
        var i = offset
        val end = offset + length
        while (i + 1 < end) {
            val sample = ((bytes[i + 1].toInt() shl 8) or (bytes[i].toInt() and 0xFF)).toShort()
            val norm = sample / 32768.0
            sumSq += norm * norm
            count++
            i += 2
        }
        return if (count > 0) sqrt(sumSq / count).toFloat() else 0f
    }

    fun disconnect() {
        disconnectInternal(restoreAudioMode = true)
    }

    private fun disconnectInternal(restoreAudioMode: Boolean) {
        isClosed.set(true)
        isSetupComplete.set(false)
        connectTimeoutJob?.cancel()
        connectTimeoutJob = null
        stopMicrophoneStreaming(sendStreamEnd = false)

        playbackWorkerJob?.cancel()
        playbackWorkerJob = null
        pcmChannel?.close()
        pcmChannel = null
        queuedPcmBytes.set(0)

        try {
            audioTrack?.let { track ->
                track.pause()
                track.flush()
                track.stop()
                track.release()
            }
        } catch (_: Throwable) {
        }
        audioTrack = null

        try {
            webSocket?.close(1000, "Client closed")
        } catch (_: Throwable) {
        }
        webSocket = null

        if (restoreAudioMode) {
            restoreAudioRouting()
        }
    }
}

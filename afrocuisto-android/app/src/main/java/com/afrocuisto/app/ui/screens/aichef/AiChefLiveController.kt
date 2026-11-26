package com.afrocuisto.app.ui.screens.aichef

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.NoiseSuppressor
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.core.content.ContextCompat
import com.afrocuisto.app.data.model.AiChefRecipeResult
import com.afrocuisto.app.data.network.NetworkMonitor
import com.afrocuisto.app.data.repository.AiChefRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.sqrt

enum class GeminiLiveState {
    CONNECTING,
    LISTENING,
    THINKING,
    SPEAKING,
    PAUSED
}

data class GeminiLiveUiState(
    val state: GeminiLiveState = GeminiLiveState.CONNECTING,
    val isMuted: Boolean = false,
    val isPaused: Boolean = false,
    val showCaptions: Boolean = true,
    val showQuickPrompts: Boolean = false,
    val showVoiceSheet: Boolean = false,
    val hasMicPermission: Boolean = false,
    val speechAvailable: Boolean = true,
    val isRealtimeWebSocketConnected: Boolean = false,
    val selectedVoice: GeminiLiveVoiceProfile = GeminiVoiceCatalog.voices.first(),
    val voiceBadge: ActiveVoiceEngineBadge = ActiveVoiceEngineBadge.GOOGLE_NEURAL_NET,
    val hasGeminiApiKey: Boolean = false,
    val userTranscript: String = "",
    val aiResponseText: String = "",
    val aiSpokenCharIndex: Int = 0,
    val activeRecipe: AiChefRecipeResult? = null,
    val audioLevel: Float = 0.12f,
    val elapsedSeconds: Int = 0,
    val statusHint: String = "Connexion..."
)

/**
 * Full-Duplex Real-Time Gemini Live Session Controller matching Android 17 Gemini Live:
 *
 * 1. Primary Mode (`GeminiLiveWebSocketClient` -> `models/gemini-3.8-live`):
 *    - True full-duplex bidirectional WebSocket audio streaming (16kHz PCM mic -> 24kHz PCM speaker).
 *    - Hardware DSP `AcousticEchoCanceler` + server VAD for instant hands-free voice barge-in (<15ms).
 *    - Real-time input & output streaming transcriptions synced into chat history.
 *
 * 2. Seamless Zero-Difference Fallback Mode (when offline or without API key):
 *    - Prefers Android 13+/17 On-Device Tensor SpeechRecognizer (`createOnDeviceSpeechRecognizer`)
 *      when available on Pixel devices to eliminate system start/stop beeps and network lag,
 *      automatically falling back to standard `SpeechRecognizer` if on-device French pack isn't ready.
 *    - Runs a hardware-AEC acoustic voice-onset monitor while the AI speaks so the user can still
 *      interrupt hands-free simply by speaking at any moment, identical to native Gemini Live!
 */
class AiChefLiveController(
    private val context: Context,
    private val repository: AiChefRepository,
    private val scope: CoroutineScope,
    private var persona: String = "Chef Afro"
) {
    companion object {
        private const val TAG = "AiChefLiveCtrl"
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val voicePrefs = GeminiVoicePreferences(context.applicationContext)

    private val _uiState = MutableStateFlow(
        GeminiLiveUiState(
            hasMicPermission = checkMicPermission(),
            speechAvailable = SpeechRecognizer.isRecognitionAvailable(context)
        )
    )
    val uiState: StateFlow<GeminiLiveUiState> = _uiState.asStateFlow()

    private val voiceEngine = GeminiVoiceEngine(
        context = context.applicationContext,
        scope = scope,
        onEngineBadgeChanged = { badge ->
            if (!isReleased && !_uiState.value.isRealtimeWebSocketConnected) {
                _uiState.update { it.copy(voiceBadge = badge) }
            }
        }
    )

    private val liveWsClient = GeminiLiveWebSocketClient(
        context = context.applicationContext,
        scope = scope,
        callbacks = object : GeminiLiveWebSocketClient.Callbacks {
            override fun onConnected() {
                if (isReleased) return
                isUsingWebSocket = true
                _uiState.update {
                    it.copy(
                        isRealtimeWebSocketConnected = true,
                        voiceBadge = ActiveVoiceEngineBadge.GEMINI_3_8_CLOUD,
                        state = GeminiLiveState.LISTENING,
                        statusHint = "À l'écoute"
                    )
                }
            }

            override fun onUserTranscript(text: String, isFinal: Boolean) {
                if (isReleased) return
                _uiState.update {
                    it.copy(
                        state = if (isFinal) GeminiLiveState.THINKING else GeminiLiveState.LISTENING,
                        userTranscript = text,
                        statusHint = if (isFinal) "Réflexion..." else "À l'écoute"
                    )
                }
            }

            override fun onAiSpeakingStarted() {
                if (isReleased) return
                _uiState.update {
                    it.copy(
                        state = GeminiLiveState.SPEAKING,
                        aiSpokenCharIndex = 0,
                        statusHint = "Parlez à tout moment pour interrompre"
                    )
                }
            }

            override fun onAiTranscriptDelta(accumulatedText: String, spokenCharsEstimate: Int) {
                if (isReleased) return
                _uiState.update {
                    it.copy(
                        state = GeminiLiveState.SPEAKING,
                        aiResponseText = accumulatedText,
                        aiSpokenCharIndex = spokenCharsEstimate
                    )
                }
            }

            override fun onAiTurnCompleted(userText: String, aiText: String) {
                if (isReleased) return
                val matchedRecipe = if (userText.isNotBlank() || aiText.isNotBlank()) {
                    repository.recordLiveTurn(userText, aiText)
                } else {
                    null
                }
                _uiState.update {
                    it.copy(
                        state = if (it.isPaused) GeminiLiveState.PAUSED else GeminiLiveState.LISTENING,
                        aiSpokenCharIndex = it.aiResponseText.length,
                        activeRecipe = matchedRecipe ?: it.activeRecipe,
                        audioLevel = 0.10f,
                        statusHint = when {
                            it.isPaused -> "En attente"
                            it.isMuted -> "Micro coupé"
                            else -> "À l'écoute"
                        }
                    )
                }
            }

            override fun onInterrupted() {
                if (isReleased) return
                _uiState.update {
                    it.copy(
                        state = GeminiLiveState.LISTENING,
                        audioLevel = 0.18f,
                        statusHint = "À l'écoute"
                    )
                }
            }

            override fun onAudioLevel(rmsLevel: Float, isAiSpeaking: Boolean) {
                if (isReleased) return
                _uiState.update { current ->
                    if (current.isPaused) return@update current
                    current.copy(audioLevel = rmsLevel)
                }
            }

            override fun onConnectionFailed(reason: String) {
                if (isReleased) return
                Log.w(TAG, "Gemini 3.8 Live WebSocket unavailable ($reason), engaging seamless local full-duplex Live")
                val wasConnecting = _uiState.value.state == GeminiLiveState.CONNECTING
                isUsingWebSocket = false
                _uiState.update {
                    it.copy(isRealtimeWebSocketConnected = false)
                }
                if (wasConnecting) {
                    beginFallbackLiveGreeting()
                } else if (!_uiState.value.isPaused && !_uiState.value.isMuted) {
                    transitionToFallbackListening()
                }
            }
        }
    )

    private var isUsingWebSocket = false
    private var currentApiKey: String = ""
    private var speechRecognizer: SpeechRecognizer? = null
    private var usingOnDeviceRecognizer = false
    private var isListeningActive = false
    private var isReleased = false

    private var timerJob: Job? = null
    private var listeningRestartJob: Job? = null
    private var responseJob: Job? = null
    private var acousticBargeInJob: Job? = null

    init {
        observeVoicePreferences()
        startSessionTimer()
    }

    private fun observeVoicePreferences() {
        scope.launch {
            voicePrefs.selectedVoiceId.collect { voiceId ->
                if (isReleased) return@collect
                val profile = GeminiVoiceCatalog.byId(voiceId)
                voiceEngine.selectVoiceProfile(profile)
                _uiState.update { it.copy(selectedVoice = profile) }
            }
        }
        scope.launch {
            voicePrefs.effectiveApiKey.collect { key ->
                if (isReleased) return@collect
                currentApiKey = key.trim()
                voiceEngine.updateApiKey(currentApiKey)
                _uiState.update { it.copy(hasGeminiApiKey = currentApiKey.isNotEmpty()) }
            }
        }
    }

    private fun checkMicPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun updatePersona(newPersona: String) {
        persona = newPersona
    }

    fun onPermissionResult(granted: Boolean) {
        if (isReleased) return
        _uiState.update { it.copy(hasMicPermission = granted) }
        if (isUsingWebSocket) {
            if (granted && !_uiState.value.isMuted && !_uiState.value.isPaused) {
                liveWsClient.startMicrophoneStreaming()
            }
            return
        }
        val current = _uiState.value
        if (current.state == GeminiLiveState.CONNECTING) {
            beginFallbackLiveGreeting()
        } else if (granted && !current.isMuted && !current.isPaused && current.state == GeminiLiveState.LISTENING) {
            startFallbackListeningInternal()
        }
    }

    fun startSession() {
        if (isReleased) return
        val hasPerm = checkMicPermission()
        _uiState.update {
            it.copy(
                hasMicPermission = hasPerm,
                speechAvailable = SpeechRecognizer.isRecognitionAvailable(context),
                state = GeminiLiveState.CONNECTING,
                statusHint = "Connexion à Gemini Live..."
            )
        }

        scope.launch {
            val resolvedKey = voicePrefs.effectiveApiKey.first().trim()
            val resolvedVoiceId = voicePrefs.selectedVoiceId.first()
            val profile = GeminiVoiceCatalog.byId(resolvedVoiceId)
            currentApiKey = resolvedKey
            voiceEngine.selectVoiceProfile(profile)
            voiceEngine.updateApiKey(resolvedKey)

            _uiState.update {
                it.copy(
                    selectedVoice = profile,
                    hasGeminiApiKey = resolvedKey.isNotEmpty()
                )
            }

            if (isReleased) return@launch

            if (resolvedKey.isNotEmpty() && NetworkMonitor.isOnline.value) {
                liveWsClient.connect(
                    apiKey = resolvedKey,
                    voiceProfile = profile,
                    hasMicPermission = checkMicPermission()
                )
            } else {
                delay(220L)
                if (!isReleased && _uiState.value.state == GeminiLiveState.CONNECTING) {
                    beginFallbackLiveGreeting()
                }
            }
        }
    }

    private fun beginFallbackLiveGreeting() {
        val greeting = repository.liveGreeting(persona)
        speakFallbackResponse(greeting, recipe = null)
    }

    private fun startSessionTimer() {
        timerJob?.cancel()
        timerJob = scope.launch {
            while (isActive && !isReleased) {
                delay(1000L)
                if (!_uiState.value.isPaused && _uiState.value.state != GeminiLiveState.CONNECTING) {
                    _uiState.update { it.copy(elapsedSeconds = it.elapsedSeconds + 1) }
                }
            }
        }
    }

    /**
     * Hardware-AEC acoustic voice onset detector during fallback TTS playback:
     * Lets the user interrupt Chef Afro hands-free simply by speaking aloud,
     * with zero button tap required — matching native Android 17 Gemini Live!
     */
    @SuppressLint("MissingPermission")
    private fun startAcousticBargeInMonitor() {
        acousticBargeInJob?.cancel()
        val snap = _uiState.value
        if (!snap.hasMicPermission || snap.isMuted || snap.isPaused || snap.showVoiceSheet) return

        acousticBargeInJob = scope.launch(Dispatchers.IO) {
            // Brief settle delay so TTS startup transient doesn't false-trigger
            delay(380L)
            if (!isActive || isReleased || _uiState.value.state != GeminiLiveState.SPEAKING) return@launch

            val sampleRate = 16000
            val frameBytes = 1280 // 40ms
            val minBuf = AudioRecord.getMinBufferSize(
                sampleRate,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            ).coerceAtLeast(frameBytes * 3)

            var recorder: AudioRecord? = null
            var aec: AcousticEchoCanceler? = null
            var ns: NoiseSuppressor? = null

            try {
                // Require hardware AEC to avoid speaker self-interruption when user isn't on headphones
                if (!AcousticEchoCanceler.isAvailable()) return@launch

                recorder = AudioRecord(
                    MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                    sampleRate,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    minBuf * 2
                )
                if (recorder.state != AudioRecord.STATE_INITIALIZED) {
                    recorder.release()
                    return@launch
                }

                aec = AcousticEchoCanceler.create(recorder.audioSessionId)?.apply { enabled = true }
                if (aec == null) {
                    recorder.release()
                    return@launch
                }
                if (NoiseSuppressor.isAvailable()) {
                    ns = NoiseSuppressor.create(recorder.audioSessionId)?.apply { enabled = true }
                }

                val buf = ByteArray(frameBytes)
                var consecutiveVoiceFrames = 0
                recorder.startRecording()

                while (isActive && !isReleased && _uiState.value.state == GeminiLiveState.SPEAKING) {
                    val read = recorder.read(buf, 0, buf.size)
                    if (read <= 0) continue

                    var sumSq = 0.0
                    var samples = 0
                    var i = 0
                    while (i + 1 < read) {
                        val s = ((buf[i + 1].toInt() shl 8) or (buf[i].toInt() and 0xFF)).toShort()
                        val n = s / 32768.0
                        sumSq += n * n
                        samples++
                        i += 2
                    }
                    val rms = if (samples > 0) sqrt(sumSq / samples).toFloat() else 0f

                    // Sustained near-field human speech energy above AEC residual floor
                    if (rms > 0.085f) {
                        consecutiveVoiceFrames++
                        if (consecutiveVoiceFrames >= 4) { // ~160ms of clear user voice
                            Log.d(TAG, "Hands-free voice barge-in detected (rms=$rms)!")
                            mainHandler.post {
                                if (!isReleased && _uiState.value.state == GeminiLiveState.SPEAKING) {
                                    interruptAndListen()
                                }
                            }
                            break
                        }
                    } else {
                        consecutiveVoiceFrames = (consecutiveVoiceFrames - 1).coerceAtLeast(0)
                    }
                }
            } catch (_: CancellationException) {
            } catch (t: Throwable) {
                Log.w(TAG, "Acoustic barge-in monitor stopped: ${t.message}")
            } finally {
                try { aec?.release() } catch (_: Throwable) {}
                try { ns?.release() } catch (_: Throwable) {}
                try {
                    recorder?.let {
                        if (it.recordingState == AudioRecord.RECORDSTATE_RECORDING) it.stop()
                        it.release()
                    }
                } catch (_: Throwable) {}
            }
        }
    }

    private fun stopAcousticBargeInMonitor() {
        acousticBargeInJob?.cancel()
        acousticBargeInJob = null
    }

    private fun speakFallbackResponse(text: String, recipe: AiChefRecipeResult?) {
        if (isReleased) return
        stopFallbackListeningInternal()
        listeningRestartJob?.cancel()

        val activeProfile = _uiState.value.selectedVoice
        _uiState.update {
            it.copy(
                state = GeminiLiveState.SPEAKING,
                isPaused = false,
                aiResponseText = text,
                aiSpokenCharIndex = 0,
                activeRecipe = recipe ?: it.activeRecipe,
                statusHint = "Parlez ou touchez pour interrompre"
            )
        }

        voiceEngine.speak(
            rawText = text,
            profile = activeProfile,
            onCharProgress = { charIdx ->
                if (!isReleased && _uiState.value.state == GeminiLiveState.SPEAKING) {
                    _uiState.update { it.copy(aiSpokenCharIndex = charIdx) }
                }
            },
            onAmplitude = { amp ->
                if (!isReleased && _uiState.value.state == GeminiLiveState.SPEAKING) {
                    _uiState.update { it.copy(audioLevel = amp) }
                }
            },
            onFinished = {
                stopAcousticBargeInMonitor()
                onFallbackSpeakingFinished()
            }
        )

        startAcousticBargeInMonitor()
    }

    private fun onFallbackSpeakingFinished() {
        val snapshot = _uiState.value
        if (isReleased || snapshot.isPaused || isUsingWebSocket) return

        _uiState.update {
            it.copy(
                aiSpokenCharIndex = it.aiResponseText.length,
                audioLevel = 0.12f
            )
        }

        if (snapshot.showVoiceSheet) {
            _uiState.update {
                it.copy(
                    state = GeminiLiveState.LISTENING,
                    statusHint = "Fermez le panneau pour continuer"
                )
            }
            return
        }

        if (!snapshot.isMuted && snapshot.hasMicPermission && snapshot.speechAvailable) {
            transitionToFallbackListening()
        } else {
            _uiState.update {
                it.copy(
                    state = GeminiLiveState.LISTENING,
                    audioLevel = 0.10f,
                    statusHint = when {
                        it.isMuted -> "Micro coupé"
                        !it.hasMicPermission -> "Autorisez le micro pour parler"
                        else -> "À l'écoute"
                    }
                )
            }
        }
    }

    fun openVoiceSheet() {
        if (isReleased) return
        if (isUsingWebSocket) {
            liveWsClient.stopMicrophoneStreaming(sendStreamEnd = true)
        } else {
            stopAcousticBargeInMonitor()
            stopFallbackListeningInternal()
        }
        _uiState.update { it.copy(showVoiceSheet = true) }
    }

    fun dismissVoiceSheet() {
        if (isReleased) return
        _uiState.update { it.copy(showVoiceSheet = false) }
        val snap = _uiState.value
        if (snap.isPaused || snap.isMuted || !snap.hasMicPermission) return

        if (isUsingWebSocket) {
            liveWsClient.startMicrophoneStreaming()
        } else if (snap.state == GeminiLiveState.LISTENING) {
            transitionToFallbackListening()
        }
    }

    fun selectAndPreviewVoice(profile: GeminiLiveVoiceProfile) {
        if (isReleased) return
        scope.launch {
            voicePrefs.setSelectedVoice(profile.id)
        }
        voiceEngine.selectVoiceProfile(profile)
        _uiState.update { it.copy(selectedVoice = profile) }

        if (currentApiKey.isNotEmpty() && isUsingWebSocket) {
            // Reconnect Gemini 3.8 Live session with the newly chosen native voice
            liveWsClient.connect(
                apiKey = currentApiKey,
                voiceProfile = profile,
                hasMicPermission = checkMicPermission(),
                initialGreetingPrompt = "Présente-toi brièvement en français avec la voix ${profile.displayName} en une phrase chaleureuse de Chef Afro."
            )
            return
        }

        val sample = when (profile.id) {
            "ursa" -> "Bonjour ! Je suis Ursa. Parle-moi de ce que tu as dans ton frigo et on cuisine ensemble."
            "dipper" -> "Salut ! Moi c'est Dipper. Dis-moi quels ingrédients tu as sous la main, on va se régaler !"
            "lyra" -> "Bonjour ! Je suis Lyra. Quelle recette africaine veux-tu explorer ensemble aujourd'hui ?"
            "pegasus" -> "Bonjour, je suis Pegasus. Prenons le temps de préparer un plat authentique et parfumé."
            "orbit" -> "Bonjour ! Je suis Orbit. Je te guide étape par étape pour réussir ton plat du premier coup."
            else -> "Salut ! C'est Vega. Allumons les fourneaux, dis-moi ce qui te ferait plaisir ce soir !"
        }
        speakFallbackResponse(sample, recipe = null)
    }

    fun saveGeminiApiKey(rawKey: String) {
        if (isReleased) return
        val trimmed = rawKey.trim()
        currentApiKey = trimmed
        scope.launch {
            voicePrefs.setCustomApiKey(trimmed)
        }
        voiceEngine.updateApiKey(trimmed)
        _uiState.update { it.copy(hasGeminiApiKey = trimmed.isNotEmpty()) }

        if (trimmed.isNotEmpty()) {
            stopAcousticBargeInMonitor()
            stopFallbackListeningInternal()
            voiceEngine.stop()
            liveWsClient.connect(
                apiKey = trimmed,
                voiceProfile = _uiState.value.selectedVoice,
                hasMicPermission = checkMicPermission()
            )
        }
    }

    fun interruptAndListen() {
        if (isReleased) return
        val current = _uiState.value
        if (current.isPaused) {
            _uiState.update { it.copy(isPaused = false) }
        }
        if (current.isMuted) {
            _uiState.update { it.copy(isMuted = false) }
        }

        if (isUsingWebSocket) {
            liveWsClient.setPaused(false, checkMicPermission())
            liveWsClient.setMuted(false, checkMicPermission())
            liveWsClient.interruptByTap(checkMicPermission())
            _uiState.update {
                it.copy(
                    state = GeminiLiveState.LISTENING,
                    audioLevel = 0.16f,
                    statusHint = "À l'écoute"
                )
            }
            return
        }

        stopAcousticBargeInMonitor()
        responseJob?.cancel()
        voiceEngine.stop()
        transitionToFallbackListening()
    }

    private fun transitionToFallbackListening() {
        if (isReleased || isUsingWebSocket) return
        val current = _uiState.value
        if (!current.hasMicPermission || !current.speechAvailable) {
            _uiState.update {
                it.copy(
                    state = GeminiLiveState.LISTENING,
                    isPaused = false,
                    audioLevel = 0.12f,
                    statusHint = if (!current.hasMicPermission) {
                        "Autorisez le micro pour parler"
                    } else {
                        "Choisissez une suggestion vocale"
                    }
                )
            }
            return
        }

        _uiState.update {
            it.copy(
                state = GeminiLiveState.LISTENING,
                isPaused = false,
                userTranscript = "",
                audioLevel = 0.14f,
                statusHint = "À l'écoute"
            )
        }
        startFallbackListeningInternal()
    }

    private fun startFallbackListeningInternal() {
        if (isReleased || isUsingWebSocket) return
        stopAcousticBargeInMonitor()

        mainHandler.post {
            if (isReleased || isUsingWebSocket) return@post
            try {
                if (speechRecognizer == null) {
                    val canUseOnDevice = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                        SpeechRecognizer.isOnDeviceRecognitionAvailable(context.applicationContext)
                    usingOnDeviceRecognizer = canUseOnDevice
                    speechRecognizer = if (canUseOnDevice) {
                        SpeechRecognizer.createOnDeviceSpeechRecognizer(context.applicationContext)
                    } else {
                        SpeechRecognizer.createSpeechRecognizer(context.applicationContext)
                    }.apply {
                        setRecognitionListener(createRecognitionListener())
                    }
                }
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "fr-FR")
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "fr-FR")
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2200L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1500L)
                }
                isListeningActive = true
                speechRecognizer?.startListening(intent)
            } catch (_: Throwable) {
                isListeningActive = false
                _uiState.update {
                    it.copy(
                        speechAvailable = false,
                        statusHint = "Utilisez une suggestion ci-dessous"
                    )
                }
            }
        }
    }

    private fun stopFallbackListeningInternal() {
        isListeningActive = false
        listeningRestartJob?.cancel()
        mainHandler.post {
            try {
                speechRecognizer?.cancel()
            } catch (_: Throwable) {
            }
        }
    }

    private fun switchToNetworkSpeechRecognizerAndRetry() {
        usingOnDeviceRecognizer = false
        mainHandler.post {
            try {
                speechRecognizer?.destroy()
            } catch (_: Throwable) {
            }
            speechRecognizer = try {
                SpeechRecognizer.createSpeechRecognizer(context.applicationContext).apply {
                    setRecognitionListener(createRecognitionListener())
                }
            } catch (_: Throwable) {
                null
            }
            scheduleFallbackListeningRestart(220L)
        }
    }

    private fun createRecognitionListener() = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {
            if (isReleased || isUsingWebSocket) return
            _uiState.update { it.copy(statusHint = "À l'écoute") }
        }

        override fun onBeginningOfSpeech() {
            if (isReleased || isUsingWebSocket) return
            _uiState.update { it.copy(statusHint = "À l'écoute") }
        }

        override fun onRmsChanged(rmsdB: Float) {
            if (isReleased || isUsingWebSocket || _uiState.value.state != GeminiLiveState.LISTENING) return
            val normalized = ((rmsdB + 2.0f) / 11.2f).coerceIn(0.06f, 1.0f)
            _uiState.update { current ->
                val smoothed = current.audioLevel * 0.50f + normalized * 0.50f
                current.copy(audioLevel = smoothed)
            }
        }

        override fun onBufferReceived(buffer: ByteArray?) = Unit

        override fun onEndOfSpeech() {
            isListeningActive = false
        }

        override fun onError(error: Int) {
            isListeningActive = false
            if (isReleased || isUsingWebSocket) return
            val snapshot = _uiState.value
            if (snapshot.state != GeminiLiveState.LISTENING || snapshot.isPaused || snapshot.isMuted || snapshot.showVoiceSheet) {
                return
            }

            // If on-device recognizer lacks French offline language pack (ERROR_LANGUAGE_NOT_SUPPORTED = 12 / ERROR_LANGUAGE_UNAVAILABLE = 13), seamlessly switch to Google network recognizer
            if (usingOnDeviceRecognizer && (error == 12 || error == 13 || error == SpeechRecognizer.ERROR_SERVER)) {
                switchToNetworkSpeechRecognizerAndRetry()
                return
            }

            when (error) {
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> {
                    _uiState.update {
                        it.copy(
                            hasMicPermission = false,
                            audioLevel = 0.10f,
                            statusHint = "Autorisez le micro pour parler"
                        )
                    }
                }
                SpeechRecognizer.ERROR_NO_MATCH,
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT,
                SpeechRecognizer.ERROR_CLIENT,
                SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> {
                    _uiState.update { it.copy(audioLevel = 0.12f, statusHint = "À l'écoute") }
                    scheduleFallbackListeningRestart(if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY) 520L else 280L)
                }
                else -> {
                    scheduleFallbackListeningRestart(850L)
                }
            }
        }

        override fun onResults(results: Bundle?) {
            isListeningActive = false
            if (isReleased || isUsingWebSocket) return
            val spoken = results
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                ?.firstOrNull()
                ?.trim()

            if (!spoken.isNullOrEmpty()) {
                handleFallbackSpokenQuery(spoken)
            } else {
                scheduleFallbackListeningRestart(260L)
            }
        }

        override fun onPartialResults(partialResults: Bundle?) {
            if (isReleased || isUsingWebSocket) return
            val partial = partialResults
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                ?.firstOrNull()
                ?.trim()
            if (!partial.isNullOrEmpty()) {
                _uiState.update { it.copy(userTranscript = partial) }
            }
        }

        override fun onEvent(eventType: Int, params: Bundle?) = Unit
    }

    private fun scheduleFallbackListeningRestart(delayMs: Long) {
        listeningRestartJob?.cancel()
        listeningRestartJob = scope.launch {
            delay(delayMs)
            val snap = _uiState.value
            if (!isReleased &&
                !isUsingWebSocket &&
                snap.state == GeminiLiveState.LISTENING &&
                !snap.isPaused &&
                !snap.isMuted &&
                !snap.showVoiceSheet &&
                snap.hasMicPermission
            ) {
                startFallbackListeningInternal()
            }
        }
    }

    fun submitVoicePrompt(prompt: String) {
        val cleaned = prompt.trim()
        if (cleaned.isEmpty() || isReleased) return

        _uiState.update { it.copy(showQuickPrompts = false) }

        if (isUsingWebSocket) {
            liveWsClient.sendTextTurn(cleaned, recordAsUserTranscript = true)
            return
        }

        stopAcousticBargeInMonitor()
        stopFallbackListeningInternal()
        voiceEngine.stop()
        handleFallbackSpokenQuery(cleaned)
    }

    private fun handleFallbackSpokenQuery(spokenText: String) {
        responseJob?.cancel()
        _uiState.update {
            it.copy(
                state = GeminiLiveState.THINKING,
                isPaused = false,
                showQuickPrompts = false,
                userTranscript = spokenText,
                audioLevel = 0.58f,
                statusHint = "Réflexion..."
            )
        }

        responseJob = scope.launch {
            val reply = repository.sendLiveMessage(
                userText = spokenText,
                persona = persona,
                apiKey = currentApiKey
            )
            if (isReleased) return@launch
            speakFallbackResponse(
                text = reply.text.orEmpty(),
                recipe = reply.recipe
            )
        }
    }

    fun toggleMute() {
        if (isReleased) return
        val nextMuted = !_uiState.value.isMuted
        _uiState.update { it.copy(isMuted = nextMuted) }

        if (isUsingWebSocket) {
            liveWsClient.setMuted(nextMuted, checkMicPermission())
            if (_uiState.value.state == GeminiLiveState.LISTENING) {
                _uiState.update {
                    it.copy(
                        audioLevel = if (nextMuted) 0.05f else 0.14f,
                        statusHint = if (nextMuted) "Micro coupé" else "À l'écoute"
                    )
                }
            }
            return
        }

        if (nextMuted) {
            stopAcousticBargeInMonitor()
            stopFallbackListeningInternal()
            if (_uiState.value.state == GeminiLiveState.LISTENING) {
                _uiState.update {
                    it.copy(
                        audioLevel = 0.05f,
                        statusHint = "Micro coupé"
                    )
                }
            }
        } else {
            if (_uiState.value.isPaused) {
                _uiState.update { it.copy(isPaused = false) }
            }
            if (_uiState.value.state == GeminiLiveState.LISTENING || _uiState.value.state == GeminiLiveState.PAUSED) {
                transitionToFallbackListening()
            } else if (_uiState.value.state == GeminiLiveState.SPEAKING) {
                startAcousticBargeInMonitor()
            }
        }
    }

    fun togglePause() {
        if (isReleased) return
        val nextPaused = !_uiState.value.isPaused

        if (isUsingWebSocket) {
            liveWsClient.setPaused(nextPaused, checkMicPermission())
            _uiState.update {
                it.copy(
                    isPaused = nextPaused,
                    state = if (nextPaused) GeminiLiveState.PAUSED else GeminiLiveState.LISTENING,
                    audioLevel = if (nextPaused) 0.04f else 0.14f,
                    statusHint = if (nextPaused) "En attente" else if (it.isMuted) "Micro coupé" else "À l'écoute"
                )
            }
            return
        }

        if (nextPaused) {
            stopAcousticBargeInMonitor()
            stopFallbackListeningInternal()
            responseJob?.cancel()
            voiceEngine.stop()
            _uiState.update {
                it.copy(
                    isPaused = true,
                    state = GeminiLiveState.PAUSED,
                    audioLevel = 0.04f,
                    statusHint = "En attente"
                )
            }
        } else {
            _uiState.update { it.copy(isPaused = false) }
            transitionToFallbackListening()
        }
    }

    fun toggleCaptions() {
        _uiState.update { it.copy(showCaptions = !it.showCaptions) }
    }

    fun toggleQuickPrompts() {
        _uiState.update { it.copy(showQuickPrompts = !it.showQuickPrompts) }
    }

    fun release() {
        if (isReleased) return
        isReleased = true
        timerJob?.cancel()
        listeningRestartJob?.cancel()
        responseJob?.cancel()
        stopAcousticBargeInMonitor()
        liveWsClient.disconnect()
        voiceEngine.release()
        mainHandler.post {
            try {
                speechRecognizer?.cancel()
                speechRecognizer?.destroy()
            } catch (_: Throwable) {
            }
            speechRecognizer = null
        }
    }
}

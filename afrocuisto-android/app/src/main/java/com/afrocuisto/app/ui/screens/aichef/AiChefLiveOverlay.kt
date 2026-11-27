package com.afrocuisto.app.ui.screens.aichef

import android.Manifest
import android.app.Activity
import android.graphics.Paint
import android.graphics.RuntimeShader
import android.os.Build
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresApi
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.DisableSelection
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.ClosedCaption
import androidx.compose.material.icons.rounded.ClosedCaptionOff
import androidx.compose.material.icons.rounded.GraphicEq
import androidx.compose.material.icons.rounded.Key
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.MicOff
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.RecordVoiceOver
import androidx.compose.material.icons.rounded.RestaurantMenu
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import com.afrocuisto.app.data.model.AiChefRecipeResult
import com.afrocuisto.app.data.repository.AiChefRepository
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AfroOrange
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.sin

private val LIVE_VOICE_SUGGESTIONS = listOf(
    "J'ai du poulet, des tomates et des oignons",
    "Comment réussir un Poulet Yassa ?",
    "Une recette rapide en 15 minutes",
    "Gombo frais et poisson fumé",
    "Une boisson bissap bien fraîche"
)

private val GeminiLiveObsidianBg = Color(0xFF0A0B0F)
private val GeminiSurfacePill = Color(0xFF23252B)
private val GeminiRedEndLive = Color(0xFFDC362E)
private val GeminiBluePrimary = Color(0xFF4285F4)
private val GeminiSkyCyan = Color(0xFF7CC4FA)

/**
 * 1:1 Android 17 Google Gemini Live Volumetric Horizon Cloud AGSL Shader (API 33+):
 * - Deep OLED obsidian canvas (#0A0B0F)
 * - Multi-harmonic luminous cloud waves rising organically from the bottom horizon:
 *   - Listening: Crisp Google Blue & Sapphire undulating horizon reactive to 16kHz mic formants
 *   - Thinking: Iridescent Violet-Cyan-Blue swirling aurora sweeps
 *   - Speaking: Full-bodied Azure, Sky-Cyan & Ice-White billowing vocal cloud synchronized at 120fps
 *     to real 24kHz PCM voice output amplitude
 *   - Paused/Muted: Calm low-tide ambient glow
 */
private const val GEMINI_LIVE_ANDROID17_AGSL = """
uniform float2 iResolution;
uniform float iTime;
uniform float iAudio;
uniform float iEnergy;
uniform float iSpeaking;
uniform float iThinking;

half4 main(float2 fragCoord) {
    float2 res = max(iResolution, float2(1.0));
    float2 uv = fragCoord / res;

    // 1. Deep Android 17 Gemini Live Obsidian Canvas
    float3 baseBg = float3(0.039, 0.043, 0.059);
    float3 col = baseBg;

    float t = iTime * (0.82 + 0.62 * iEnergy + 0.52 * iAudio);
    float x = uv.x;
    float y = uv.y;

    // Official Google Gemini Live Android 17 Color Harmonics
    float3 royalCobalt = float3(0.08, 0.23, 0.74);
    float3 googleBlue  = float3(0.25, 0.52, 0.98);
    float3 skyCyan     = float3(0.44, 0.80, 1.00);
    float3 irisViolet  = float3(0.50, 0.40, 0.98);
    float3 iceWhite    = float3(0.88, 0.96, 1.00);

    float bellX = (x - 0.5) * 1.38;
    float centerBell = exp(-(bellX * bellX));
    float vocalLift = (0.045 + 0.165 * iAudio + 0.055 * iSpeaking) * iEnergy;

    // 2. Volumetric Atmospheric Horizon Mist
    float mistTop = 0.48 - vocalLift * 1.05;
    float mistY = smoothstep(mistTop, 1.0, y);
    float mistUndulation = 0.86 + 0.14 * sin(x * 4.2 + t * 0.85) * cos(x * 2.7 - t * 0.6);
    float3 mistHue = mix(royalCobalt, irisViolet, 0.30 * iThinking + 0.16 * sin(x * 3.14159 - t * 0.75));
    col += mistHue * mistY * mistY * (0.36 + 0.38 * iAudio) * iEnergy * mistUndulation;

    // 3. Deep Billowing Cloud Layer 1
    float c1Curve = 0.825 - vocalLift * (0.88 + 0.46 * centerBell)
        + 0.028 * sin(x * 4.8 + t * 1.18) * (0.52 + 0.82 * iAudio)
        + 0.016 * cos(x * 8.6 - t * 1.62) * (0.45 + 0.72 * iAudio);
    float c1Body = smoothstep(c1Curve - 0.15, c1Curve + 0.12, y);
    float c1Crest = exp(-abs(y - c1Curve) * (15.0 - 4.2 * iAudio));
    col += googleBlue * c1Body * (0.40 + 0.34 * iAudio) * iEnergy;
    col += mix(googleBlue, skyCyan, 0.48) * c1Crest * (0.30 + 0.40 * iAudio) * iEnergy;

    // 4. Mid Vocal Formant Wave Layer 2
    float c2Curve = 0.880 - vocalLift * (0.64 + 0.52 * centerBell)
        + 0.023 * sin(x * 6.5 - t * 1.72 + 1.1) * (0.50 + 0.90 * iAudio)
        + 0.014 * sin(x * 12.0 + t * 2.25) * (0.42 + 0.85 * iAudio);
    float c2Body = smoothstep(c2Curve - 0.10, c2Curve + 0.09, y);
    float c2Crest = exp(-abs(y - c2Curve) * (21.0 - 5.2 * iAudio));
    float3 c2Hue = mix(googleBlue, skyCyan, 0.40 + 0.38 * iSpeaking + 0.22 * centerBell);
    col += c2Hue * c2Body * (0.44 + 0.40 * iAudio) * iEnergy;
    col += mix(skyCyan, iceWhite, 0.38) * c2Crest * (0.32 + 0.48 * iAudio) * iEnergy;

    // 5. Incandescent Horizon Floor Layer 3
    float c3Curve = 0.940 - vocalLift * (0.35 + 0.38 * centerBell)
        + 0.014 * cos(x * 8.2 + t * 2.05) * (0.50 + 0.82 * iAudio);
    float c3Body = smoothstep(c3Curve - 0.065, 1.0, y);
    float3 c3Hue = mix(skyCyan, iceWhite, 0.38 + 0.38 * iAudio * centerBell);
    col += c3Hue * c3Body * (0.48 + 0.46 * iAudio) * iEnergy;

    // 6. Dual Orbital Thinking Shimmer Sweeps
    if (iThinking > 0.01) {
        float s1 = 0.5 + 0.36 * sin(iTime * 2.6);
        float s2 = 0.5 - 0.32 * cos(iTime * 2.1);
        float d1 = (x - s1) * 3.9;
        float d2 = (x - s2) * 4.4;
        float sweep = (exp(-(d1 * d1)) + 0.7 * exp(-(d2 * d2))) * smoothstep(0.74, 1.0, y);
        col += mix(irisViolet, iceWhite, 0.58) * sweep * iThinking * 0.58;
    }

    // 7. Soft Luminous Dock Reflection Pool
    float floorPool = smoothstep(0.91, 1.0, y) * (0.55 + 0.45 * centerBell);
    col += mix(googleBlue, iceWhite, 0.52) * floorPool * (0.30 + 0.36 * iAudio) * iEnergy;

    // Smooth highlight compression preserving rich chromatic saturation
    col = col / (float3(1.0) + max(col - float3(0.46), float3(0.0)) * 0.46);
    col = clamp(col, float3(0.0), float3(1.0));

    return half4(half3(col), 1.0);
}
"""

@Composable
fun AiChefLiveOverlay(
    repository: AiChefRepository,
    onNavigateToRecipeDetail: (String) -> Unit,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val view = LocalView.current
    val afroHaptics = rememberAfroHaptics()
    val scope = rememberCoroutineScope()

    val controller = remember(repository) {
        AiChefLiveController(
            context = context,
            repository = repository,
            scope = scope
        )
    }

    val uiState by controller.uiState.collectAsState()

    val micPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        controller.onPermissionResult(granted)
    }

    BackHandler(onBack = onClose)

    // Ensure crisp light icons on Android 17 status & gesture navigation bars while Live is active
    DisposableEffect(view) {
        val window = (view.context as? Activity)?.window
        val insetsController = window?.let { WindowCompat.getInsetsController(it, view) }
        val prevLightStatus = insetsController?.isAppearanceLightStatusBars
        val prevLightNav = insetsController?.isAppearanceLightNavigationBars
        insetsController?.isAppearanceLightStatusBars = false
        insetsController?.isAppearanceLightNavigationBars = false

        onDispose {
            controller.release()
            if (prevLightStatus != null) {
                insetsController.isAppearanceLightStatusBars = prevLightStatus
            }
            if (prevLightNav != null) {
                insetsController.isAppearanceLightNavigationBars = prevLightNav
            }
        }
    }

    LaunchedEffect(Unit) {
        controller.startSession()
        if (!uiState.hasMicPermission) {
            micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    // Continuous 120 FPS frame clock for silky liquid horizon physics
    var elapsedClock by remember { mutableFloatStateOf(0f) }
    LaunchedEffect(Unit) {
        val startNanos = withFrameNanos { it }
        while (true) {
            withFrameNanos { now ->
                elapsedClock = (now - startNanos) / 1_000_000_000f
            }
        }
    }

    val smoothAudio by animateFloatAsState(
        targetValue = when (uiState.state) {
            GeminiLiveState.PAUSED -> 0.03f
            GeminiLiveState.CONNECTING -> 0.26f
            GeminiLiveState.THINKING -> 0.46f
            GeminiLiveState.LISTENING -> if (uiState.isMuted) 0.04f else uiState.audioLevel
            GeminiLiveState.SPEAKING -> uiState.audioLevel
        },
        animationSpec = spring(dampingRatio = 0.74f, stiffness = Spring.StiffnessMedium),
        label = "geminiLiveSmoothAudio"
    )

    val smoothEnergy by animateFloatAsState(
        targetValue = when (uiState.state) {
            GeminiLiveState.PAUSED -> 0.20f
            GeminiLiveState.CONNECTING -> 0.74f
            GeminiLiveState.LISTENING -> if (uiState.isMuted) 0.30f else 0.94f
            GeminiLiveState.THINKING -> 1.02f
            GeminiLiveState.SPEAKING -> 1.10f
        },
        animationSpec = tween(durationMillis = 480, easing = FastOutSlowInEasing),
        label = "geminiLiveEnergy"
    )

    val smoothSpeaking by animateFloatAsState(
        targetValue = if (uiState.state == GeminiLiveState.SPEAKING) 1f else 0f,
        animationSpec = tween(durationMillis = 420, easing = FastOutSlowInEasing),
        label = "geminiLiveSpeakingMix"
    )

    val smoothThinking by animateFloatAsState(
        targetValue = if (uiState.state == GeminiLiveState.THINKING || uiState.state == GeminiLiveState.CONNECTING) 1f else 0f,
        animationSpec = tween(durationMillis = 380, easing = FastOutSlowInEasing),
        label = "geminiLiveThinkingMix"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(GeminiLiveObsidianBg)
    ) {
        // 1. 120 FPS Android 17 Google Gemini Live Volumetric Horizon Wave
        GoogleGeminiLiveWaveBackdrop(
            timeSeconds = elapsedClock,
            audioLevel = smoothAudio,
            energy = smoothEnergy,
            speakingMix = smoothSpeaking,
            thinkingMix = smoothThinking,
            modifier = Modifier.fillMaxSize()
        )

        // 2. Clean Android 17 Gemini Live Foreground Layout
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Pure Android 17 Gemini Live Top Bar (Non-selectable "Live" mark + CC)
            GoogleGeminiLiveTopBar(
                timeSeconds = elapsedClock,
                isActive = !uiState.isPaused,
                elapsedSeconds = uiState.elapsedSeconds,
                showCaptions = uiState.showCaptions,
                onToggleCaptions = {
                    afroHaptics.selectionTick()
                    controller.toggleCaptions()
                },
                modifier = Modifier.padding(top = 12.dp)
            )

            // Open Full-Screen Conversational Space (speak anytime OR tap anywhere to interrupt)
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {
                        when (uiState.state) {
                            GeminiLiveState.SPEAKING,
                            GeminiLiveState.PAUSED -> {
                                afroHaptics.heavyAction()
                                controller.interruptAndListen()
                            }
                            GeminiLiveState.LISTENING -> {
                                afroHaptics.selectionTick()
                                if (!uiState.hasMicPermission) {
                                    micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                } else if (uiState.isMuted) {
                                    controller.toggleMute()
                                } else {
                                    controller.toggleQuickPrompts()
                                }
                            }
                            else -> Unit
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                DisableSelection {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        if (uiState.showCaptions) {
                            GoogleGeminiLiveCaptions(
                                state = uiState.state,
                                isMuted = uiState.isMuted,
                                userTranscript = uiState.userTranscript,
                                aiResponseText = uiState.aiResponseText,
                                aiSpokenCharIndex = uiState.aiSpokenCharIndex,
                                statusHint = uiState.statusHint
                            )
                        } else {
                            GoogleGeminiMinimalStatus(
                                state = uiState.state,
                                isMuted = uiState.isMuted,
                                statusHint = uiState.statusHint
                            )
                        }
                    }
                }
            }

            // Floating Material 3 Dark Recipe Card whenever a matching dish is discussed
            AnimatedVisibility(
                visible = uiState.activeRecipe != null,
                enter = slideInVertically(
                    initialOffsetY = { it / 2 },
                    animationSpec = spring(dampingRatio = 0.82f, stiffness = Spring.StiffnessMediumLow)
                ) + fadeIn(tween(240)),
                exit = slideOutVertically { it / 2 } + fadeOut(tween(180))
            ) {
                uiState.activeRecipe?.let { recipe ->
                    GeminiLiveRecipeCard(
                        recipe = recipe,
                        onClick = {
                            afroHaptics.cardPress()
                            onClose()
                            onNavigateToRecipeDetail(recipe.id)
                        },
                        modifier = Modifier.padding(bottom = 14.dp)
                    )
                }
            }

            // Optional Quick Voice Ideas Row
            val showSuggestionRow = uiState.showQuickPrompts ||
                (!uiState.hasMicPermission && uiState.state == GeminiLiveState.LISTENING) ||
                (!uiState.speechAvailable && !uiState.isRealtimeWebSocketConnected)

            AnimatedVisibility(
                visible = showSuggestionRow,
                enter = fadeIn(tween(200)) + slideInVertically { it / 3 },
                exit = fadeOut(tween(160)) + slideOutVertically { it / 3 }
            ) {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(horizontal = 2.dp),
                    flingBehavior = rememberSmoothFlingBehavior(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    items(LIVE_VOICE_SUGGESTIONS) { prompt ->
                        Surface(
                            shape = RoundedCornerShape(22.dp),
                            color = Color(0xFF1C1F27).copy(alpha = 0.90f),
                            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
                            modifier = Modifier
                                .afroSpringClickable(
                                    pressedScale = 0.94f,
                                    haptic = AfroHapticKind.SELECTION
                                ) { controller.submitVoicePrompt(prompt) }
                        ) {
                            Text(
                                text = prompt,
                                color = Color(0xFFE8EAED),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp)
                            )
                        }
                    }
                }
            }

            // Compact 5-bar Gemini Live vocal equalizer sitting directly above the Android 17 dock
            GeminiLiveCompactWaveIndicator(
                timeSeconds = elapsedClock,
                audioLevel = smoothAudio,
                state = uiState.state,
                isMuted = uiState.isMuted,
                modifier = Modifier.padding(bottom = 20.dp)
            )

            // Authentic Android 17 Google Gemini Live Pill Control Bar
            GoogleGeminiLiveBottomDock(
                isMuted = uiState.isMuted,
                isPaused = uiState.isPaused,
                showQuickPrompts = uiState.showQuickPrompts,
                hasMicPermission = uiState.hasMicPermission,
                onTogglePrompts = {
                    afroHaptics.selectionTick()
                    controller.toggleQuickPrompts()
                },
                onTogglePause = {
                    afroHaptics.toggleSwitch(!uiState.isPaused)
                    controller.togglePause()
                },
                onToggleMic = {
                    if (!uiState.hasMicPermission) {
                        afroHaptics.selectionTick()
                        micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    } else if (uiState.state == GeminiLiveState.SPEAKING) {
                        afroHaptics.heavyAction()
                        controller.interruptAndListen()
                    } else {
                        afroHaptics.toggleSwitch(uiState.isMuted)
                        controller.toggleMute()
                    }
                },
                onEndCall = {
                    afroHaptics.heavyAction()
                    onClose()
                },
                modifier = Modifier.padding(bottom = 20.dp)
            )
        }
    }
}

@Composable
private fun GoogleGeminiLiveWaveBackdrop(
    timeSeconds: Float,
    audioLevel: Float,
    energy: Float,
    speakingMix: Float,
    thinkingMix: Float,
    modifier: Modifier = Modifier
) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        GeminiLiveAgslWaveCanvas(
            timeSeconds = timeSeconds,
            audioLevel = audioLevel,
            energy = energy,
            speakingMix = speakingMix,
            thinkingMix = thinkingMix,
            modifier = modifier
        )
    } else {
        GeminiLiveFallbackWaveCanvas(
            timeSeconds = timeSeconds,
            audioLevel = audioLevel,
            energy = energy,
            modifier = modifier
        )
    }
}

@RequiresApi(Build.VERSION_CODES.TIRAMISU)
@Composable
private fun GeminiLiveAgslWaveCanvas(
    timeSeconds: Float,
    audioLevel: Float,
    energy: Float,
    speakingMix: Float,
    thinkingMix: Float,
    modifier: Modifier = Modifier
) {
    val shader = remember {
        try {
            RuntimeShader(GEMINI_LIVE_ANDROID17_AGSL)
        } catch (e: Throwable) {
            android.util.Log.e("AiChefLive", "AGSL compile error", e)
            null
        }
    }
    val paint = remember { Paint(Paint.ANTI_ALIAS_FLAG) }

    if (shader == null) {
        GeminiLiveFallbackWaveCanvas(
            timeSeconds = timeSeconds,
            audioLevel = audioLevel,
            energy = energy,
            modifier = modifier
        )
        return
    }

    Canvas(modifier = modifier) {
        shader.setFloatUniform("iResolution", size.width, size.height)
        shader.setFloatUniform("iTime", timeSeconds)
        shader.setFloatUniform("iAudio", audioLevel)
        shader.setFloatUniform("iEnergy", energy)
        shader.setFloatUniform("iSpeaking", speakingMix)
        shader.setFloatUniform("iThinking", thinkingMix)
        paint.shader = shader
        drawIntoCanvas { canvas ->
            canvas.nativeCanvas.drawRect(0f, 0f, size.width, size.height, paint)
        }
    }
}

@Composable
private fun GeminiLiveFallbackWaveCanvas(
    timeSeconds: Float,
    audioLevel: Float,
    energy: Float,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val t = timeSeconds * (1.1f + 0.5f * audioLevel)
        val lift = (0.04f + 0.14f * audioLevel) * energy

        drawRect(color = GeminiLiveObsidianBg)

        drawRect(
            brush = Brush.verticalGradient(
                colorStops = arrayOf(
                    0.0f to Color.Transparent,
                    (0.56f - lift).coerceIn(0.32f, 0.78f) to Color.Transparent,
                    0.82f to Color(0xFF1A73E8).copy(alpha = (0.34f * energy).coerceIn(0f, 0.55f)),
                    0.94f to GeminiBluePrimary.copy(alpha = (0.58f * energy).coerceIn(0f, 0.75f)),
                    1.0f to GeminiSkyCyan.copy(alpha = (0.72f * energy).coerceIn(0f, 0.88f))
                )
            )
        )

        val waveSpecs = listOf(
            Triple(0.84f - lift * 0.9f, Color(0xFF2563EB).copy(alpha = 0.45f * energy), 1.0f),
            Triple(0.90f - lift * 0.55f, GeminiSkyCyan.copy(alpha = 0.55f * energy), -1.45f)
        )

        waveSpecs.forEach { (baseYFrac, color, speedDir) ->
            val path = Path()
            val steps = 36
            val baseY = h * baseYFrac
            path.moveTo(0f, h)
            for (i in 0..steps) {
                val frac = i.toFloat() / steps
                val x = frac * w
                val bell = sin(frac * PI.toFloat())
                val dy = h * (0.028f * (0.5f + audioLevel) * bell * sin(frac * 6.283f + t * speedDir))
                path.lineTo(x, baseY + dy)
            }
            path.lineTo(w, h)
            path.close()
            drawPath(
                path = path,
                brush = Brush.verticalGradient(
                    colors = listOf(color, Color(0xFFC7E6FF).copy(alpha = (0.42f * energy).coerceIn(0f, 0.65f))),
                    startY = baseY - h * 0.05f,
                    endY = h
                ),
                blendMode = BlendMode.Screen
            )
        }
    }
}

/**
 * Pure Android 17 Google Gemini Live Top Bar:
 * Left: Animated Gemini Live brand mark + Non-selectable "Live" title + live timer pill
 * Right: Voice selector pill + Captions (CC) toggle
 */
@Composable
private fun GoogleGeminiLiveTopBar(
    timeSeconds: Float,
    isActive: Boolean,
    elapsedSeconds: Int,
    showCaptions: Boolean,
    onToggleCaptions: () -> Unit,
    modifier: Modifier = Modifier
) {
    val mins = elapsedSeconds / 60
    val secs = elapsedSeconds % 60
    val formattedTimer = remember(mins, secs) {
        String.format(java.util.Locale.US, "%02d:%02d", mins, secs)
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        DisableSelection {
            Row(verticalAlignment = Alignment.CenterVertically) {
                GeminiLiveBrandMark(
                    timeSeconds = timeSeconds,
                    animated = isActive,
                    tint = Color(0xFFE8EAED),
                    modifier = Modifier.size(23.dp)
                )
                Spacer(modifier = Modifier.width(9.dp))
                Text(
                    text = "Live",
                    color = Color(0xFFE8EAED),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = (-0.2).sp
                )
                if (elapsedSeconds > 0) {
                    Spacer(modifier = Modifier.width(10.dp))
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = Color.White.copy(alpha = 0.07f)
                    ) {
                        Text(
                            text = formattedTimer,
                            color = Color(0xFF9AA0A6),
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(if (showCaptions) Color.White.copy(alpha = 0.13f) else Color.Transparent)
                    .afroSpringClickable(
                        pressedScale = 0.88f,
                        haptic = AfroHapticKind.NONE,
                        onClick = onToggleCaptions
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (showCaptions) Icons.Rounded.ClosedCaption else Icons.Rounded.ClosedCaptionOff,
                    contentDescription = "Sous-titres en direct",
                    tint = if (showCaptions) Color(0xFFE8EAED) else Color(0xFF9AA0A6),
                    modifier = Modifier.size(22.dp)
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GeminiLiveVoicePickerSheet(
    selectedVoice: GeminiLiveVoiceProfile,
    voiceBadge: ActiveVoiceEngineBadge,
    isRealtimeConnected: Boolean,
    hasApiKey: Boolean,
    onSelectVoice: (GeminiLiveVoiceProfile) -> Unit,
    onSaveApiKey: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var showApiKeyField by remember { mutableStateOf(false) }
    var apiKeyDraft by remember { mutableStateOf("") }

    val badgeLabel = when {
        isRealtimeConnected -> "Gemini 3.8 Live Temps Réel"
        voiceBadge == ActiveVoiceEngineBadge.GEMINI_3_8_CLOUD -> "Gemini 3.8 Studio HD"
        voiceBadge == ActiveVoiceEngineBadge.GOOGLE_NEURAL_NET -> "Google Neural HD"
        else -> "Google Neural"
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Color(0xFF15171D),
        contentColor = Color(0xFFE8EAED),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp)
                .padding(bottom = 24.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(end = 10.dp)
                ) {
                    Text(
                        text = "Voix Gemini Live",
                        color = Color(0xFFF1F3F4),
                        fontSize = 19.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Touchez une voix pour basculer instantanément",
                        color = Color(0xFF9AA0A6),
                        fontSize = 12.5.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Surface(
                    shape = RoundedCornerShape(50),
                    color = GeminiBluePrimary.copy(alpha = 0.18f),
                    border = BorderStroke(1.dp, GeminiSkyCyan.copy(alpha = 0.35f))
                ) {
                    Text(
                        text = badgeLabel,
                        color = GeminiSkyCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        softWrap = false,
                        modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            val rows = remember { GeminiVoiceCatalog.voices.chunked(2) }
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                rows.forEach { pair ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        pair.forEach { voice ->
                            val isSelected = voice.id == selectedVoice.id
                            val accent = Color(voice.accentColorHex)
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .afroSpringClickable(
                                        pressedScale = 0.95f,
                                        haptic = AfroHapticKind.NONE
                                    ) { onSelectVoice(voice) },
                                shape = RoundedCornerShape(22.dp),
                                color = if (isSelected) accent.copy(alpha = 0.16f) else Color(0xFF21242D),
                                border = BorderStroke(
                                    width = if (isSelected) 1.4.dp else 1.dp,
                                    color = if (isSelected) accent else Color.White.copy(alpha = 0.08f)
                                )
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 14.dp, vertical = 13.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .clip(CircleShape)
                                            .background(accent.copy(alpha = 0.22f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = if (isSelected) Icons.Rounded.GraphicEq else Icons.Rounded.RecordVoiceOver,
                                            contentDescription = null,
                                            tint = accent,
                                            modifier = Modifier.size(17.dp)
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(10.dp))

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = voice.displayName,
                                            color = Color(0xFFF1F3F4),
                                            fontSize = 14.5.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            maxLines = 1
                                        )
                                        Text(
                                            text = voice.tagline,
                                            color = Color(0xFF9AA0A6),
                                            fontSize = 11.5.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }

                                    if (isSelected) {
                                        Icon(
                                            imageVector = Icons.Rounded.Check,
                                            contentDescription = "Sélectionnée",
                                            tint = accent,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color(0xFF21242D),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showApiKeyField = !showApiKeyField },
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Rounded.Key,
                                contentDescription = null,
                                tint = GeminiSkyCyan,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = if (isRealtimeConnected) {
                                        "WebSocket gemini-3.8-live actif"
                                    } else if (hasApiKey) {
                                        "Clé Gemini configurée"
                                    } else {
                                        "Configurer une clé Gemini Live"
                                    },
                                    color = Color(0xFFE8EAED),
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = if (isRealtimeConnected) {
                                        "Audio bidirectionnel temps réel connecté"
                                    } else {
                                        "Optionnel : clé Google AI Studio pour gemini-3.8-live"
                                    },
                                    color = Color(0xFF9AA0A6),
                                    fontSize = 11.5.sp
                                )
                            }
                        }
                        Icon(
                            imageVector = Icons.Rounded.ChevronRight,
                            contentDescription = null,
                            tint = Color(0xFF9AA0A6),
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    AnimatedVisibility(visible = showApiKeyField) {
                        Column(modifier = Modifier.padding(top = 12.dp)) {
                            OutlinedTextField(
                                value = apiKeyDraft,
                                onValueChange = { apiKeyDraft = it },
                                singleLine = true,
                                placeholder = {
                                    Text(
                                        text = "Collez votre clé AIza...",
                                        color = Color(0xFF7D8590),
                                        fontSize = 13.sp
                                    )
                                },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White,
                                    focusedBorderColor = GeminiSkyCyan,
                                    unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                                    cursorColor = GeminiSkyCyan
                                ),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(50),
                                    color = GeminiBluePrimary,
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(50))
                                        .clickable {
                                            onSaveApiKey(apiKeyDraft)
                                            showApiKeyField = false
                                        }
                                ) {
                                    Text(
                                        text = "Connecter en direct",
                                        color = Color.White,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun GeminiLiveBrandMark(
    timeSeconds: Float,
    animated: Boolean,
    tint: Color,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val barW = w * 0.13f
        val cr = CornerRadius(barW * 0.5f, barW * 0.5f)

        val anim1 = if (animated) 0.04f * sin(timeSeconds * 3.1f) else 0f
        val anim2 = if (animated) 0.06f * sin(timeSeconds * 3.8f + 1.0f) else 0f
        val anim3 = if (animated) 0.05f * sin(timeSeconds * 3.4f + 2.0f) else 0f

        drawRoundRect(
            color = tint,
            topLeft = Offset(w * 0.08f, h * (0.42f - anim1 * 0.5f)),
            size = Size(barW, h * (0.34f + anim1)),
            cornerRadius = cr
        )
        drawRoundRect(
            color = tint,
            topLeft = Offset(w * 0.31f, h * (0.24f - anim2 * 0.5f)),
            size = Size(barW, h * (0.62f + anim2)),
            cornerRadius = cr
        )
        drawRoundRect(
            color = tint,
            topLeft = Offset(w * 0.54f, h * (0.44f - anim3 * 0.5f)),
            size = Size(barW, h * (0.38f + anim3)),
            cornerRadius = cr
        )

        val sx = w * 0.79f
        val sy = h * 0.25f
        val outer = w * 0.19f
        val inner = outer * 0.24f
        val starPath = Path().apply {
            moveTo(sx, sy - outer)
            quadraticTo(sx + inner, sy - inner, sx + outer, sy)
            quadraticTo(sx + inner, sy + inner, sx, sy + outer)
            quadraticTo(sx - inner, sy + inner, sx - outer, sy)
            quadraticTo(sx - inner, sy - inner, sx, sy - outer)
            close()
        }
        drawPath(path = starPath, color = tint)
    }
}

@Composable
private fun GoogleGeminiLiveCaptions(
    state: GeminiLiveState,
    isMuted: Boolean,
    userTranscript: String,
    aiResponseText: String,
    aiSpokenCharIndex: Int,
    statusHint: String
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        when (state) {
            GeminiLiveState.SPEAKING -> {
                if (aiResponseText.isNotBlank()) {
                    val splitAt = aiSpokenCharIndex.coerceIn(0, aiResponseText.length)
                    val annotated = buildAnnotatedString {
                        withStyle(SpanStyle(color = Color(0xFFF8FAFC), fontWeight = FontWeight.Normal)) {
                            append(aiResponseText.substring(0, splitAt))
                        }
                        if (splitAt < aiResponseText.length) {
                            withStyle(SpanStyle(color = Color(0xFF94A3B8).copy(alpha = 0.56f), fontWeight = FontWeight.Normal)) {
                                append(aiResponseText.substring(splitAt))
                            }
                        }
                    }
                    Text(
                        text = annotated,
                        fontSize = 23.sp,
                        lineHeight = 32.sp,
                        textAlign = TextAlign.Center,
                        maxLines = 5,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            GeminiLiveState.THINKING -> {
                if (userTranscript.isNotBlank()) {
                    Text(
                        text = userTranscript,
                        color = Color(0xFFF1F5F9),
                        fontSize = 23.sp,
                        lineHeight = 31.sp,
                        fontWeight = FontWeight.Normal,
                        textAlign = TextAlign.Center,
                        maxLines = 4,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            GeminiLiveState.LISTENING -> {
                val primaryText = when {
                    userTranscript.isNotBlank() -> userTranscript
                    isMuted -> "Micro coupé"
                    else -> "Je vous écoute..."
                }
                Text(
                    text = primaryText,
                    color = if (userTranscript.isNotBlank()) Color(0xFFF8FAFC) else Color(0xFFCBD5E1).copy(alpha = 0.85f),
                    fontSize = if (userTranscript.isNotBlank()) 24.sp else 21.sp,
                    lineHeight = 32.sp,
                    fontWeight = FontWeight.Normal,
                    textAlign = TextAlign.Center,
                    maxLines = 4,
                    overflow = TextOverflow.Ellipsis
                )
            }
            GeminiLiveState.PAUSED -> {
                Text(
                    text = "En attente",
                    color = Color(0xFFE8EAED),
                    fontSize = 23.sp,
                    fontWeight = FontWeight.Normal,
                    textAlign = TextAlign.Center
                )
            }
            GeminiLiveState.CONNECTING -> {
                Text(
                    text = "Connexion...",
                    color = Color(0xFFCBD5E1),
                    fontSize = 21.sp,
                    fontWeight = FontWeight.Normal,
                    textAlign = TextAlign.Center
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        AnimatedContent(
            targetState = statusHint,
            transitionSpec = { fadeIn(tween(220)) togetherWith fadeOut(tween(180)) },
            label = "geminiLiveHint"
        ) { hint ->
            Text(
                text = hint,
                color = Color(0xFF9AA0A6),
                fontSize = 13.sp,
                fontWeight = FontWeight.Normal,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun GoogleGeminiMinimalStatus(
    state: GeminiLiveState,
    isMuted: Boolean,
    statusHint: String
) {
    val headline = when {
        state == GeminiLiveState.PAUSED -> "En attente"
        state == GeminiLiveState.CONNECTING -> "Connexion..."
        state == GeminiLiveState.THINKING -> "Réflexion..."
        state == GeminiLiveState.SPEAKING -> "En direct"
        isMuted -> "Micro coupé"
        else -> "À l'écoute"
    }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = headline,
            color = Color(0xFFE8EAED),
            fontSize = 22.sp,
            fontWeight = FontWeight.Normal,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = statusHint,
            color = Color(0xFF9AA0A6),
            fontSize = 13.sp,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun GeminiLiveCompactWaveIndicator(
    timeSeconds: Float,
    audioLevel: Float,
    state: GeminiLiveState,
    isMuted: Boolean,
    modifier: Modifier = Modifier
) {
    val active = state != GeminiLiveState.PAUSED && !(state == GeminiLiveState.LISTENING && isMuted)
    Canvas(
        modifier = modifier
            .width(58.dp)
            .height(26.dp)
    ) {
        val barCount = 5
        val spacing = size.width / (barCount + 1)
        val cy = size.height * 0.5f
        val weights = floatArrayOf(0.45f, 0.82f, 1.0f, 0.82f, 0.45f)

        for (i in 0 until barCount) {
            val x = spacing * (i + 1)
            val osc = 0.5f + 0.5f * sin(timeSeconds * (5.4f + i * 0.90f) + i * 1.1f)
            val energy = if (!active) {
                0.13f
            } else if (state == GeminiLiveState.THINKING || state == GeminiLiveState.CONNECTING) {
                0.26f + 0.64f * abs(sin(timeSeconds * 4.6f - i * 0.55f))
            } else {
                0.18f + 0.82f * audioLevel * (0.45f + 0.55f * osc)
            }
            val halfH = (size.height * 0.45f * weights[i] * energy).coerceAtLeast(2.2.dp.toPx())
            val color = if (active) {
                Color(0xFFD2E3FC).copy(alpha = 0.92f)
            } else {
                Color(0xFF9AA0A6).copy(alpha = 0.42f)
            }
            drawLine(
                color = color,
                start = Offset(x, cy - halfH),
                end = Offset(x, cy + halfH),
                strokeWidth = 3.2.dp.toPx(),
                cap = StrokeCap.Round
            )
        }
    }
}

@Composable
private fun GeminiLiveRecipeCard(
    recipe: AiChefRecipeResult,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .afroSpringClickable(
                pressedScale = 0.96f,
                haptic = AfroHapticKind.NONE,
                onClick = onClick
            ),
        shape = RoundedCornerShape(28.dp),
        color = Color(0xFF1A1D24).copy(alpha = 0.92f),
        border = BorderStroke(1.dp, Color(0xFF8AB4F8).copy(alpha = 0.24f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(AfroOrange.copy(alpha = 0.18f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Rounded.RestaurantMenu,
                    contentDescription = null,
                    tint = AfroOrange,
                    modifier = Modifier.size(21.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${recipe.region.uppercase()} • ${recipe.totalTime}",
                    color = Color(0xFF8AB4F8),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.6.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = recipe.dishName,
                    color = Color(0xFFF1F3F4),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            Surface(
                shape = RoundedCornerShape(50),
                color = Color(0xFF8AB4F8).copy(alpha = 0.16f)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 11.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Voir",
                        color = Color(0xFFD2E3FC),
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Icon(
                        imageVector = Icons.Rounded.ChevronRight,
                        contentDescription = null,
                        tint = Color(0xFFD2E3FC),
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

/**
 * Android 17 Google Gemini Live Pill/Circle Control Dock:
 * Active toggles morph smoothly in width & corner radius (Material 3 Expressive Android 17 style).
 */
@Composable
private fun GoogleGeminiLiveBottomDock(
    isMuted: Boolean,
    isPaused: Boolean,
    showQuickPrompts: Boolean,
    hasMicPermission: Boolean,
    onTogglePrompts: () -> Unit,
    onTogglePause: () -> Unit,
    onToggleMic: () -> Unit,
    onEndCall: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(14.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 1. Culinary Ideas Toggle
        GeminiExpressiveDockButton(
            icon = Icons.Rounded.AutoAwesome,
            contentDescription = "Suggestions vocales",
            isActive = showQuickPrompts,
            containerColor = if (showQuickPrompts) Color(0xFFE8EAED) else GeminiSurfacePill.copy(alpha = 0.90f),
            contentColor = if (showQuickPrompts) Color(0xFF131314) else Color(0xFFE8EAED),
            onClick = onTogglePrompts
        )

        // 2. Hold / Pause Session
        GeminiExpressiveDockButton(
            icon = if (isPaused) Icons.Rounded.PlayArrow else Icons.Rounded.Pause,
            contentDescription = if (isPaused) "Reprendre" else "Mettre en attente",
            isActive = isPaused,
            containerColor = if (isPaused) Color(0xFFE8EAED) else GeminiSurfacePill.copy(alpha = 0.90f),
            contentColor = if (isPaused) Color(0xFF131314) else Color(0xFFE8EAED),
            onClick = onTogglePause
        )

        // 3. Microphone Mute / Unmute
        val micOff = isMuted || !hasMicPermission
        GeminiExpressiveDockButton(
            icon = if (micOff) Icons.Rounded.MicOff else Icons.Rounded.Mic,
            contentDescription = if (micOff) "Activer le micro" else "Couper le micro",
            isActive = micOff,
            containerColor = if (micOff) Color(0xFFE8EAED) else GeminiSurfacePill.copy(alpha = 0.90f),
            contentColor = if (micOff) Color(0xFF131314) else Color(0xFFE8EAED),
            onClick = onToggleMic
        )

        // 4. Android 17 Gemini Live Red End Pill
        GeminiExpressiveDockButton(
            icon = Icons.Rounded.Close,
            contentDescription = "Quitter Live",
            isActive = true,
            baseWidth = 72.dp,
            activeWidth = 72.dp,
            height = 60.dp,
            containerColor = GeminiRedEndLive,
            contentColor = Color.White,
            onClick = onEndCall
        )
    }
}

@Composable
private fun GeminiExpressiveDockButton(
    icon: ImageVector,
    contentDescription: String,
    isActive: Boolean,
    containerColor: Color,
    contentColor: Color,
    onClick: () -> Unit,
    baseWidth: Dp = 64.dp,
    activeWidth: Dp = 72.dp,
    height: Dp = 60.dp
) {
    val animatedWidth by animateDpAsState(
        targetValue = if (isActive) activeWidth else baseWidth,
        animationSpec = spring(dampingRatio = 0.75f, stiffness = Spring.StiffnessMedium),
        label = "dockBtnWidth"
    )
    val animatedCorner by animateDpAsState(
        targetValue = if (isActive) 22.dp else 30.dp,
        animationSpec = spring(dampingRatio = 0.75f, stiffness = Spring.StiffnessMedium),
        label = "dockBtnCorner"
    )
    val animatedBg by animateColorAsState(
        targetValue = containerColor,
        animationSpec = tween(200),
        label = "dockBtnBg"
    )
    val animatedTint by animateColorAsState(
        targetValue = contentColor,
        animationSpec = tween(200),
        label = "dockBtnTint"
    )

    val shape = RoundedCornerShape(animatedCorner)
    Surface(
        modifier = Modifier
            .width(animatedWidth)
            .height(height)
            .afroSpringClickable(
                pressedScale = 0.90f,
                haptic = AfroHapticKind.NONE,
                onClick = onClick
            ),
        shape = shape,
        color = animatedBg,
        border = BorderStroke(
            0.8.dp,
            if (isActive) Color.Transparent else Color.White.copy(alpha = 0.08f)
        )
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = icon,
                contentDescription = contentDescription,
                tint = animatedTint,
                modifier = Modifier.size(25.dp)
            )
        }
    }
}

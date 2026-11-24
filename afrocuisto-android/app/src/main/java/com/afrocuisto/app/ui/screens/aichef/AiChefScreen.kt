package com.afrocuisto.app.ui.screens.aichef

import android.app.Activity
import android.content.Intent
import android.graphics.Paint
import android.graphics.RuntimeShader
import android.os.Build
import android.speech.RecognizerIntent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresApi
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.selection.DisableSelection
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.Kitchen
import androidx.compose.material.icons.rounded.LocalFireDepartment
import androidx.compose.material.icons.rounded.RestaurantMenu
import androidx.compose.material.icons.rounded.Stop
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.afrocuisto.app.data.model.AiChefMessage
import com.afrocuisto.app.data.model.AiChefRecipeResult
import com.afrocuisto.app.data.repository.AiChefRepository
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.afroStaggeredEntrance
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.NexaFontFamily
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import com.afrocuisto.app.ui.theme.nexaTitleEmphasis
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

private enum class GeminiGlowActivity {
    IDLE,
    TYPING,
    THINKING,
    CHATTING
}

private data class WelcomePromptChip(
    val label: String,
    val prompt: String,
    val icon: ImageVector,
    val accent: Color
)

private val CURATED_WELCOME_PROMPTS = listOf(
    WelcomePromptChip(
        label = "Poulet, tomates & oignons",
        prompt = "J'ai du poulet, des tomates et des oignons dans mon frigo, que préparer ?",
        icon = Icons.Rounded.Kitchen,
        accent = AfroOrange
    ),
    WelcomePromptChip(
        label = "Dîner express 15 min",
        prompt = "Propose-moi un repas africain complet et rapide prêt en 15 minutes.",
        icon = Icons.Rounded.Bolt,
        accent = Color(0xFF4285F4)
    ),
    WelcomePromptChip(
        label = "Amiwô sans grumeaux",
        prompt = "Comment réussir l'Amiwô parfaitement lisse et sans grumeaux ?",
        icon = Icons.Rounded.AutoAwesome,
        accent = Color(0xFF8B5CF6)
    ),
    WelcomePromptChip(
        label = "Gombo & poisson fumé",
        prompt = "J'ai du gombo frais et du poisson fumé, quelle sauce traditionnelle préparer ?",
        icon = Icons.Rounded.LocalFireDepartment,
        accent = Color(0xFF0EA5E9)
    )
)

/**
 * 120 FPS GPU AGSL Volumetric AI Aurora & Plasma Backdrop Shader (API 33+):
 * Renders multi-harmonic silk ribbons rising behind the composer & welcome stage,
 * reacting instantaneously to keystroke impulses, AI thinking, and token streaming.
 */
private const val FRIGO_MAGIQUE_AI_AURORA_AGSL = """
uniform float2 iResolution;
uniform float iTime;
uniform float iActivity;
uniform float iImpulse;
uniform float iReach;
uniform float iDark;

half4 main(float2 fragCoord) {
    float2 res = max(iResolution, float2(1.0));
    float2 uv = fragCoord / res;

    float3 lightBase = float3(1.0, 1.0, 1.0);
    float3 darkBase  = float3(0.055, 0.067, 0.094);
    float3 baseBg    = mix(lightBase, darkBase, iDark);

    float speed = 0.72 + 1.15 * iActivity + 0.85 * iImpulse;
    float t = iTime * speed;

    // Signature AI Palette: Google Blue, Sky Cyan, Electric Violet & AfroCuisto Coral-Orange
    float3 googleBlue = float3(0.259, 0.522, 0.957);
    float3 skyCyan    = float3(0.420, 0.780, 0.990);
    float3 irisViolet = float3(0.580, 0.380, 0.960);
    float3 afroCoral  = float3(0.984, 0.337, 0.027);

    float yStart = 1.0 - iReach - 0.09 * iImpulse;
    float horizonMask = smoothstep(yStart, 1.0, uv.y);

    // Flowing organic silk ribbon 1 (Sapphire -> Sky Cyan)
    float wave1 = sin(uv.x * 4.4 + t * 0.95) * 0.045 + cos(uv.x * 7.8 - t * 1.30) * 0.022;
    float ribbon1 = exp(-abs(uv.y - (0.87 - 0.11 * iActivity + wave1)) * (11.0 - 3.5 * iActivity));

    // Flowing organic silk ribbon 2 (Violet -> AfroCuisto Coral)
    float wave2 = cos(uv.x * 5.2 - t * 1.15 + 1.4) * 0.048 + sin(uv.x * 9.2 + t * 1.65) * 0.020;
    float ribbon2 = exp(-abs(uv.y - (0.91 - 0.09 * iActivity + wave2)) * (13.0 - 4.0 * iImpulse));

    // Keystroke / Thinking radial energy ripple from bottom center
    float2 origin = float2(0.5 + 0.16 * sin(t * 0.8), 0.96);
    float dist = length((uv - origin) * float2(1.0, 1.35));
    float pulseRing = exp(-abs(dist - (0.18 + 0.24 * fract(iTime * 0.42))) * 14.0) * (iActivity * 0.55 + iImpulse * 0.95);
    float coreGlow = exp(-dist * 3.1) * (0.35 + 0.45 * iActivity + 0.45 * iImpulse);

    float3 aurora = float3(0.0);
    aurora += mix(googleBlue, skyCyan, 0.5 + 0.5 * sin(uv.x * 3.1 + t)) * ribbon1 * 0.58;
    aurora += mix(irisViolet, afroCoral, 0.42 + 0.45 * iActivity) * ribbon2 * (0.42 + 0.38 * iActivity);
    aurora += mix(skyCyan, afroCoral, 0.35 + 0.35 * sin(t * 1.3)) * (coreGlow * 0.52 + pulseRing * 0.40);

    float strength = mix(0.28, 0.44, iDark) * (0.68 + 0.52 * iActivity + 0.45 * iImpulse);
    float3 col = mix(baseBg, mix(baseBg, aurora + baseBg * 0.35, 0.85), clamp(horizonMask * strength * 1.75, 0.0, 0.82));

    // Subtle top ambient corner halo during active AI reasoning
    if (iActivity > 0.65) {
        float topDist = length((uv - float2(0.5 + 0.22 * cos(t * 0.7), 0.04)) * float2(1.0, 2.4));
        float topCrown = exp(-topDist * 4.2) * (iActivity - 0.65) * 0.55;
        col = mix(col, mix(googleBlue, afroCoral, 0.5 + 0.5 * sin(t)), topCrown * mix(0.22, 0.38, iDark));
    }

    col = clamp(col, float3(0.0), float3(1.0));
    return half4(half3(col), 1.0);
}
"""

@Composable
fun AiChefScreen(
    onBack: () -> Unit,
    onNavigateToRecipeDetail: (String) -> Unit,
    repository: AiChefRepository = remember { AiChefRepository() }
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val afroHaptics = rememberAfroHaptics()
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    val voicePrefs = remember(context) { GeminiVoicePreferences(context.applicationContext) }
    val configuredApiKey by voicePrefs.effectiveApiKey.collectAsState(initial = "")

    val messages by repository.messages.collectAsState(initial = emptyList())
    val conversationHistory by repository.conversationHistory.collectAsState()
    val isThinking by repository.isThinking.collectAsState(initial = false)
    val isStreaming by repository.isStreaming.collectAsState(initial = false)
    val isGenerating = isThinking || isStreaming

    var inputText by remember { mutableStateOf("") }
    var isInputFocused by remember { mutableStateOf(false) }
    var isLiveMode by remember { mutableStateOf(false) }
    var showConversationHistory by remember { mutableStateOf(false) }

    // Kinetic impulse triggered on keystrokes, prompt taps, and message sends for shader ripples
    val kineticImpulse = remember { Animatable(0f) }
    fun triggerAiImpulse(peak: Float = 0.85f) {
        scope.launch {
            kineticImpulse.snapTo(peak.coerceIn(0f, 1f))
            kineticImpulse.animateTo(
                targetValue = 0f,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioNoBouncy,
                    stiffness = Spring.StiffnessLow
                )
            )
        }
    }

    // Continuous 120 FPS frame clock driving AGSL shaders & neural emblem orbits
    var elapsedClock by remember { mutableFloatStateOf(0f) }
    LaunchedEffect(Unit) {
        val startNanos = withFrameNanos { it }
        while (true) {
            withFrameNanos { now ->
                elapsedClock = (now - startNanos) / 1_000_000_000f
            }
        }
    }

    val voiceDictationLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val spoken = result.data
                ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                ?.firstOrNull()
                ?.trim()
            if (!spoken.isNullOrEmpty()) {
                triggerAiImpulse(0.95f)
                inputText = if (inputText.isBlank()) spoken else "$inputText $spoken"
            }
        }
    }

    val glowActivity = when {
        isThinking || isStreaming -> GeminiGlowActivity.THINKING
        isInputFocused || inputText.isNotBlank() -> GeminiGlowActivity.TYPING
        messages.isNotEmpty() -> GeminiGlowActivity.CHATTING
        else -> GeminiGlowActivity.IDLE
    }

    val lastMsgSignature = messages.lastOrNull()?.let {
        "${it.id}:${it.text?.length ?: 0}:${it.thoughtSummary?.length ?: 0}:${it.recipe != null}"
    }
    LaunchedEffect(messages.size, lastMsgSignature) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem((messages.size - 1).coerceAtLeast(0))
        }
    }

    val canvasTopBg = if (isDark) colorScheme.background else Color(0xFFFFFFFF)
    val titleColor = if (isDark) colorScheme.onBackground else Color(0xFF1F242D)
    val mutedColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF6B7280)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(canvasTopBg)
    ) {
        // 1. 120 FPS AGSL Volumetric AI Aurora Backdrop reactive to typing, thinking & streaming
        GeminiActivityGlowBackdrop(
            timeSeconds = elapsedClock,
            activity = glowActivity,
            typingStrength = (inputText.length / 36f).coerceIn(0f, 1f),
            impulse = kineticImpulse.value,
            isDark = isDark,
            modifier = Modifier.fillMaxSize()
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
        ) {
            // 2. Clean Static Header: Back + Non-Selectable "Frigo Magique" Title (Zero SELECT dropdown)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = {
                            afroHaptics.navigationTap()
                            onBack()
                        }
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Retour",
                            tint = titleColor
                        )
                    }

                    Spacer(modifier = Modifier.width(4.dp))

                    // Strictly static, non-clickable, non-selectable title
                    DisableSelection {
                        Text(
                            text = "Frigo Magique",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = (-0.25).sp,
                            color = titleColor,
                            modifier = Modifier.nexaTitleEmphasis()
                        )
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.padding(end = 6.dp)
                ) {
                    // New Conversation button with tactile spring feedback
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .afroSpringClickable(
                                pressedScale = 0.86f,
                                haptic = AfroHapticKind.SELECTION
                            ) {
                                triggerAiImpulse(0.75f)
                                focusManager.clearFocus()
                                inputText = ""
                                repository.resetConversation()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            drawCircle(
                                color = mutedColor.copy(alpha = 0.65f),
                                radius = size.minDimension * 0.42f,
                                style = Stroke(
                                    width = 1.35.dp.toPx(),
                                    pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(
                                        floatArrayOf(5f, 5f),
                                        0f
                                    )
                                )
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Nouvelle discussion",
                            tint = titleColor,
                            modifier = Modifier.size(15.dp)
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(if (isDark) Color.White.copy(alpha = 0.10f) else Color(0xFFF2F3F7))
                            .afroSpringClickable(pressedScale = 0.88f, haptic = AfroHapticKind.SELECTION) {
                                showConversationHistory = true
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.History,
                            contentDescription = "Historique des conversations",
                            tint = AfroOrange,
                            modifier = Modifier.size(21.dp)
                        )
                        if (conversationHistory.isNotEmpty()) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .size(8.dp)
                                    .background(AfroOrange, CircleShape)
                            )
                        }
                    }
                }
            }

            // 3. Center Stage: Interactive AI Neural Welcome Stage OR Conversational Stream
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                AnimatedContent(
                    targetState = messages.isEmpty() && !isThinking,
                    transitionSpec = {
                        (fadeIn(tween(300)) + scaleIn(initialScale = 0.96f, animationSpec = tween(300))) togetherWith
                            (fadeOut(tween(200)) + scaleOut(targetScale = 0.98f, animationSpec = tween(200)))
                    },
                    label = "geminiStageTransition"
                ) { showWelcome ->
                    if (showWelcome) {
                        GeminiWelcomeStage(
                            prompts = CURATED_WELCOME_PROMPTS,
                            titleColor = titleColor,
                            mutedColor = mutedColor,
                            isDark = isDark,
                            onPromptClick = { chip ->
                                afroHaptics.actionSuccess()
                                triggerAiImpulse(1f)
                                focusManager.clearFocus()
                                scope.launch {
                                    repository.sendMessage(
                                        userText = chip.prompt,
                                        apiKey = configuredApiKey
                                    )
                                }
                            }
                        )
                    } else {
                        LazyColumn(
                            state = listState,
                            flingBehavior = rememberSmoothFlingBehavior(),
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(
                                start = 18.dp,
                                end = 18.dp,
                                top = 12.dp,
                                bottom = 24.dp
                            ),
                            verticalArrangement = Arrangement.spacedBy(20.dp)
                        ) {
                            items(messages, key = { it.id }) { msg ->
                                GeminiMessageItem(
                                    message = msg,
                                    timeSeconds = elapsedClock,
                                    titleColor = titleColor,
                                    mutedColor = mutedColor,
                                    isDark = isDark,
                                    onRecipeClick = { recipeId ->
                                        afroHaptics.cardPress()
                                        onNavigateToRecipeDetail(recipeId.ifBlank { "P02" })
                                    },
                                    onSuggestionClick = { suggestion ->
                                        if (!isGenerating) {
                                            afroHaptics.selectionTick()
                                            triggerAiImpulse(0.9f)
                                            focusManager.clearFocus()
                                            scope.launch {
                                                repository.sendMessage(
                                                    userText = suggestion,
                                                    apiKey = configuredApiKey
                                                )
                                            }
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
            }

            // 4. Unified Floating AI Composer Dock (Chat & Frigo pills removed per specification)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .imePadding()
                    .navigationBarsPadding()
                    .padding(top = 4.dp, bottom = 14.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                GeminiComposerPill(
                    value = inputText,
                    onValueChange = { next ->
                        if (next.length != inputText.length) {
                            triggerAiImpulse(0.42f)
                        }
                        inputText = next
                    },
                    onFocusChanged = { focused ->
                        isInputFocused = focused
                        if (focused) triggerAiImpulse(0.55f)
                    },
                    timeSeconds = elapsedClock,
                    isFocused = isInputFocused,
                    isGenerating = isGenerating,
                    isDark = isDark,
                    titleColor = titleColor,
                    mutedColor = mutedColor,
                    onQuickIngredientClick = {
                        afroHaptics.selectionTick()
                        triggerAiImpulse(0.65f)
                        val sample = if (inputText.isBlank()) {
                            "Poulet, tomates et oignons"
                        } else {
                            "$inputText, gingembre frais"
                        }
                        inputText = sample
                    },
                    onVoiceDictationClick = {
                        afroHaptics.selectionTick()
                        try {
                            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                                putExtra(
                                    RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
                                )
                                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "fr-FR")
                                putExtra(
                                    RecognizerIntent.EXTRA_PROMPT,
                                    "Dictez vos ingrédients ou votre question..."
                                )
                            }
                            voiceDictationLauncher.launch(intent)
                        } catch (_: Throwable) {
                            focusManager.clearFocus()
                            isLiveMode = true
                        }
                    },
                    onSendMessage = {
                        val payload = inputText.trim()
                        if (payload.isNotEmpty() && !isGenerating) {
                            afroHaptics.actionSuccess()
                            triggerAiImpulse(1.0f)
                            inputText = ""
                            focusManager.clearFocus()
                            scope.launch {
                                repository.sendMessage(
                                    userText = payload,
                                    apiKey = configuredApiKey
                                )
                            }
                        }
                    },
                    onStopGeneration = {
                        afroHaptics.heavyAction()
                        repository.cancelGeneration()
                    },
                    onLaunchLive = {
                        afroHaptics.heavyAction()
                        focusManager.clearFocus()
                        isLiveMode = true
                    },
                    modifier = Modifier.padding(horizontal = 18.dp)
                )
            }
        }

        // 5. Full-Bleed Android 17 Google Gemini Live Spatial Morph Overlay
        AnimatedVisibility(
            visible = isLiveMode,
            enter = fadeIn(tween(280)) + scaleIn(
                initialScale = 0.88f,
                transformOrigin = TransformOrigin(0.88f, 0.94f),
                animationSpec = spring(
                    dampingRatio = 0.82f,
                    stiffness = Spring.StiffnessMediumLow
                )
            ),
            exit = fadeOut(tween(220)) + scaleOut(
                targetScale = 0.91f,
                transformOrigin = TransformOrigin(0.88f, 0.94f),
                animationSpec = tween(220)
            ),
            modifier = Modifier.fillMaxSize()
        ) {
            AiChefLiveOverlay(
                repository = repository,
                onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                onClose = {
                    afroHaptics.navigationTap()
                    isLiveMode = false
                }
            )
        }

        if (showConversationHistory) {
            AlertDialog(
                onDismissRequest = { showConversationHistory = false },
                title = { Text("Historique des conversations", fontWeight = FontWeight.Bold) },
                text = {
                    if (conversationHistory.isEmpty()) {
                        Text("Vos conversations terminées apparaîtront ici. Lancez une nouvelle discussion pour archiver celle-ci.")
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 420.dp)
                                .verticalScroll(rememberScrollState()),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            conversationHistory.forEach { conversation ->
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            repository.restoreConversation(conversation)
                                            showConversationHistory = false
                                            scope.launch { listState.scrollToItem(0) }
                                        },
                                    shape = RoundedCornerShape(14.dp),
                                    color = if (isDark) Color.White.copy(alpha = 0.08f) else Color(0xFFF3F4F7)
                                ) {
                                    Column(Modifier.padding(12.dp)) {
                                        Text(
                                            conversation.title,
                                            fontWeight = FontWeight.Bold,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Spacer(Modifier.height(3.dp))
                                        Text(
                                            "${conversation.messages.count { it.sender == "user" }} échanges · Ouvrir",
                                            color = mutedColor,
                                            fontSize = 12.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showConversationHistory = false }) {
                        Text("Fermer", color = AfroOrange)
                    }
                }
            )
        }
    }
}

@Composable
private fun GeminiActivityGlowBackdrop(
    timeSeconds: Float,
    activity: GeminiGlowActivity,
    typingStrength: Float,
    impulse: Float,
    isDark: Boolean,
    modifier: Modifier = Modifier
) {
    val targetActivity by animateFloatAsState(
        targetValue = when (activity) {
            GeminiGlowActivity.IDLE -> 0.22f
            GeminiGlowActivity.CHATTING -> 0.35f
            GeminiGlowActivity.TYPING -> 0.62f + 0.22f * typingStrength
            GeminiGlowActivity.THINKING -> 1.0f
        },
        animationSpec = spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessLow),
        label = "aiAuroraActivity"
    )

    val targetReach by animateFloatAsState(
        targetValue = when (activity) {
            GeminiGlowActivity.IDLE -> 0.42f
            GeminiGlowActivity.CHATTING -> 0.30f
            GeminiGlowActivity.TYPING -> 0.52f
            GeminiGlowActivity.THINKING -> 0.66f
        },
        animationSpec = spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessLow),
        label = "aiAuroraReach"
    )

    val darkMix by animateFloatAsState(
        targetValue = if (isDark) 1f else 0f,
        animationSpec = tween(350),
        label = "aiAuroraDark"
    )

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        GeminiActivityAgslCanvas(
            timeSeconds = timeSeconds,
            activityMix = targetActivity,
            impulse = impulse,
            reach = targetReach,
            darkMix = darkMix,
            isDark = isDark,
            modifier = modifier
        )
    } else {
        GeminiActivityFallbackCanvas(
            timeSeconds = timeSeconds,
            activityMix = targetActivity,
            impulse = impulse,
            reach = targetReach,
            isDark = isDark,
            modifier = modifier
        )
    }
}

@RequiresApi(Build.VERSION_CODES.TIRAMISU)
@Composable
private fun GeminiActivityAgslCanvas(
    timeSeconds: Float,
    activityMix: Float,
    impulse: Float,
    reach: Float,
    darkMix: Float,
    isDark: Boolean,
    modifier: Modifier = Modifier
) {
    val shader = remember {
        try {
            RuntimeShader(FRIGO_MAGIQUE_AI_AURORA_AGSL)
        } catch (_: Throwable) {
            null
        }
    }
    val paint = remember { Paint(Paint.ANTI_ALIAS_FLAG) }

    if (shader == null) {
        GeminiActivityFallbackCanvas(
            timeSeconds = timeSeconds,
            activityMix = activityMix,
            impulse = impulse,
            reach = reach,
            isDark = isDark,
            modifier = modifier
        )
        return
    }

    Canvas(modifier = modifier) {
        shader.setFloatUniform("iResolution", size.width, size.height)
        shader.setFloatUniform("iTime", timeSeconds)
        shader.setFloatUniform("iActivity", activityMix)
        shader.setFloatUniform("iImpulse", impulse)
        shader.setFloatUniform("iReach", reach)
        shader.setFloatUniform("iDark", darkMix)
        paint.shader = shader
        drawIntoCanvas { canvas ->
            canvas.nativeCanvas.drawRect(0f, 0f, size.width, size.height, paint)
        }
    }
}

@Composable
private fun GeminiActivityFallbackCanvas(
    timeSeconds: Float,
    activityMix: Float,
    impulse: Float,
    reach: Float,
    isDark: Boolean,
    modifier: Modifier = Modifier
) {
    val skyBlue = Color(0xFF7CC4FA)
    val geminiBlue = Color(0xFF4285F4)
    val violet = Color(0xFF8B5CF6)
    val alphaMul = (0.45f + 0.45f * activityMix + 0.25f * impulse) * if (isDark) 0.55f else 0.85f

    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val drift = sin(timeSeconds * 1.2f) * 0.12f

        drawRect(
            brush = Brush.verticalGradient(
                colorStops = arrayOf(
                    0.0f to Color.Transparent,
                    (1f - reach).coerceIn(0.2f, 0.85f) to Color.Transparent,
                    0.82f to skyBlue.copy(alpha = (0.18f * alphaMul).coerceIn(0f, 0.36f)),
                    1.0f to geminiBlue.copy(alpha = (0.28f * alphaMul).coerceIn(0f, 0.46f))
                )
            )
        )

        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    AfroOrange.copy(alpha = (0.20f * alphaMul).coerceIn(0f, 0.38f)),
                    violet.copy(alpha = (0.12f * alphaMul).coerceIn(0f, 0.25f)),
                    Color.Transparent
                ),
                center = Offset(w * (0.76f - drift), h * 0.90f),
                radius = w * 0.65f
            ),
            radius = w * 0.65f,
            center = Offset(w * (0.76f - drift), h * 0.90f)
        )
    }
}

/**
 * Interactive AI Neural Constellation Welcome Stage with orbital 4-point Gemini emblem
 * and staggered spring suggestion chips.
 */
@Composable
private fun GeminiWelcomeStage(
    prompts: List<WelcomePromptChip>,
    titleColor: Color,
    mutedColor: Color,
    isDark: Boolean,
    onPromptClick: (WelcomePromptChip) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 22.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        DisableSelection {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Que cuisinons-nous\naujourd'hui ?",
                    fontSize = 28.sp,
                    lineHeight = 35.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = (-0.5).sp,
                    color = titleColor,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Listez les ingrédients de votre frigo ou lancez une conversation vocale en direct.",
                    fontSize = 13.5.sp,
                    lineHeight = 19.sp,
                    color = mutedColor,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(horizontal = 4.dp),
            flingBehavior = rememberSmoothFlingBehavior()
        ) {
            itemsIndexed(prompts) { index, chip ->
                Surface(
                    shape = RoundedCornerShape(22.dp),
                    color = if (isDark) Color(0xFF1A1F2B).copy(alpha = 0.88f) else Color.White.copy(alpha = 0.88f),
                    border = BorderStroke(
                        1.dp,
                        if (isDark) Color.White.copy(alpha = 0.12f) else Color(0xFFE2E8F0)
                    ),
                    shadowElevation = 0.dp,
                    modifier = Modifier
                        .afroStaggeredEntrance(index = index)
                        .afroSpringClickable(
                            pressedScale = 0.94f,
                            haptic = AfroHapticKind.SELECTION
                        ) { onPromptClick(chip) }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(26.dp)
                                .clip(CircleShape)
                                .background(chip.accent.copy(alpha = if (isDark) 0.22f else 0.12f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = chip.icon,
                                contentDescription = null,
                                tint = chip.accent,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(9.dp))
                        Text(
                            text = chip.label,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = titleColor.copy(alpha = 0.92f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun GeminiFourPointSpark(
    size: Dp,
    timeSeconds: Float,
    animated: Boolean,
    modifier: Modifier = Modifier
) {
    val rot = if (animated) 8f * sin(timeSeconds * 1.8f) else 0f
    val pulse = if (animated) 0.95f + 0.08f * sin(timeSeconds * 3.1f) else 1f
    val sweepAngle = if (animated) timeSeconds * 1.4f else 0f

    Canvas(
        modifier = modifier
            .size(size)
            .graphicsLayer {
                rotationZ = rot
                scaleX = pulse
                scaleY = pulse
            }
    ) {
        val w = this.size.width
        val h = this.size.height
        val cx = w * 0.5f
        val cy = h * 0.5f
        val outer = this.size.minDimension * 0.48f
        val inner = outer * 0.23f

        val path = Path().apply {
            moveTo(cx, cy - outer)
            quadraticTo(cx + inner * 0.36f, cy - inner * 0.36f, cx + outer, cy)
            quadraticTo(cx + inner * 0.36f, cy + inner * 0.36f, cx, cy + outer)
            quadraticTo(cx - inner * 0.36f, cy + inner * 0.36f, cx - outer, cy)
            quadraticTo(cx - inner * 0.36f, cy - inner * 0.36f, cx, cy - outer)
            close()
        }

        val startOffset = Offset(
            x = cx + outer * cos(sweepAngle),
            y = cy + outer * sin(sweepAngle)
        )
        val endOffset = Offset(
            x = cx - outer * cos(sweepAngle),
            y = cy - outer * sin(sweepAngle)
        )

        drawPath(
            path = path,
            brush = Brush.linearGradient(
                colors = listOf(
                    Color(0xFF4285F4),
                    Color(0xFF38BDF8),
                    Color(0xFF8B5CF6),
                    AfroOrange
                ),
                start = startOffset,
                end = endOffset
            )
        )
    }
}

@Composable
private fun GeminiMessageItem(
    message: AiChefMessage,
    timeSeconds: Float,
    titleColor: Color,
    mutedColor: Color,
    isDark: Boolean,
    onRecipeClick: (String) -> Unit,
    onSuggestionClick: (String) -> Unit
) {
    val isUser = message.sender == "user"

    if (isUser) {
        var entered by remember(message.id) { mutableStateOf(false) }
        LaunchedEffect(message.id) { entered = true }
        val bubbleScale by animateFloatAsState(
            targetValue = if (entered) 1f else 0.92f,
            animationSpec = spring(dampingRatio = 0.78f, stiffness = Spring.StiffnessMedium),
            label = "userMsgPop"
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .graphicsLayer {
                    scaleX = bubbleScale
                    scaleY = bubbleScale
                    transformOrigin = TransformOrigin(1f, 1f)
                },
            horizontalArrangement = Arrangement.End
        ) {
            Surface(
                shape = RoundedCornerShape(
                    topStart = 22.dp,
                    topEnd = 22.dp,
                    bottomStart = 22.dp,
                    bottomEnd = 6.dp
                ),
                color = if (isDark) Color(0xFF252B39) else Color(0xFFF0F4F9),
                border = BorderStroke(
                    0.8.dp,
                    if (isDark) Color.White.copy(alpha = 0.08f) else Color(0xFFE2E8F0)
                ),
                modifier = Modifier.padding(start = 48.dp)
            ) {
                Text(
                    text = message.text.orEmpty(),
                    fontSize = 14.5.sp,
                    lineHeight = 20.5.sp,
                    color = titleColor,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 11.dp)
                )
            }
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .animateContentSize(
                    animationSpec = spring(
                        dampingRatio = 0.86f,
                        stiffness = Spring.StiffnessMediumLow
                    )
                )
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top
            ) {
                GeminiFourPointSpark(
                    size = 22.dp,
                    timeSeconds = timeSeconds,
                    animated = message.isThinkingActive || message.isStreaming,
                    modifier = Modifier.padding(top = 3.dp)
                )

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    // 1. Animated Neural Reasoning Accordion
                    if (message.isThinkingActive || !message.thoughtSummary.isNullOrBlank()) {
                        GeminiThinkingAccordion(
                            messageId = message.id,
                            timeSeconds = timeSeconds,
                            thoughtSummary = message.thoughtSummary.orEmpty(),
                            thinkingDurationMs = message.thinkingDurationMs,
                            isThinkingActive = message.isThinkingActive,
                            mutedColor = mutedColor,
                            isDark = isDark
                        )
                        if (!message.text.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(10.dp))
                        }
                    }

                    // 2. Strict Culinary Scope Badge if Guardrail triggered
                    if (message.isGuardrail) {
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = AfroOrange.copy(alpha = 0.12f),
                            border = BorderStroke(0.8.dp, AfroOrange.copy(alpha = 0.35f)),
                            modifier = Modifier.padding(bottom = 8.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.RestaurantMenu,
                                    contentDescription = null,
                                    tint = AfroOrange,
                                    modifier = Modifier.size(13.dp)
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = "Assistant 100 % Cuisine",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = AfroOrange
                                )
                            }
                        }
                    }

                    // 3. Well-Ordered Progressive Culinary Response Body
                    if (!message.text.isNullOrBlank()) {
                        GeminiOrderedCulinaryContent(
                            markdown = message.text,
                            isStreaming = message.isStreaming,
                            titleColor = titleColor,
                            mutedColor = mutedColor,
                            isDark = isDark
                        )
                    }

                    // 4. Quick Culinary Redirection Suggestions
                    AnimatedVisibility(
                        visible = message.quickSuggestions.isNotEmpty() && !message.isStreaming && !message.isThinkingActive,
                        enter = fadeIn(tween(260)) + expandVertically()
                    ) {
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            flingBehavior = rememberSmoothFlingBehavior(),
                            modifier = Modifier.padding(top = 12.dp)
                        ) {
                            items(message.quickSuggestions) { prompt ->
                                Surface(
                                    shape = RoundedCornerShape(18.dp),
                                    color = if (isDark) Color(0xFF1F2430) else Color(0xFFF3F6FB),
                                    border = BorderStroke(
                                        1.dp,
                                        if (isDark) Color.White.copy(alpha = 0.12f) else Color(0xFFDDE5F0)
                                    ),
                                    modifier = Modifier
                                        .afroSpringClickable(
                                            pressedScale = 0.94f,
                                            haptic = AfroHapticKind.SELECTION
                                        ) { onSuggestionClick(prompt) }
                                ) {
                                    Text(
                                        text = prompt,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = titleColor,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 5. Smoothly Animated Recipe Card once streaming finishes
            AnimatedVisibility(
                visible = message.recipe != null && !message.isThinkingActive && !message.isStreaming,
                enter = slideInVertically(
                    initialOffsetY = { it / 3 },
                    animationSpec = spring(dampingRatio = 0.82f, stiffness = Spring.StiffnessMediumLow)
                ) + fadeIn(tween(280))
            ) {
                message.recipe?.let { recipe ->
                    Column {
                        Spacer(modifier = Modifier.height(14.dp))
                        GeminiSuggestedRecipeCard(
                            recipe = recipe,
                            titleColor = titleColor,
                            mutedColor = mutedColor,
                            isDark = isDark,
                            onClick = { onRecipeClick(recipe.id) },
                            modifier = Modifier.padding(start = 34.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun GeminiThinkingAccordion(
    messageId: String,
    timeSeconds: Float,
    thoughtSummary: String,
    thinkingDurationMs: Long,
    isThinkingActive: Boolean,
    mutedColor: Color,
    isDark: Boolean
) {
    var expanded by remember(messageId) { mutableStateOf(isThinkingActive) }
    LaunchedEffect(isThinkingActive) {
        expanded = isThinkingActive
    }

    val chevronRotation by animateFloatAsState(
        targetValue = if (expanded) 180f else 0f,
        animationSpec = tween(220),
        label = "thinkingChevronRot"
    )

    val durationLabel = if (thinkingDurationMs > 0L) {
        val secs = thinkingDurationMs / 1000.0
        " • " + String.format(java.util.Locale.FRANCE, "%.1f s", secs)
    } else {
        ""
    }

    val pillBg = if (isDark) {
        Color(0xFF1D2330).copy(alpha = 0.88f)
    } else {
        Color(0xFFF3F7FD)
    }
    val pulseAlpha = 0.35f + 0.40f * (0.5f + 0.5f * sin(timeSeconds * 4.2f))
    val pillBorder = if (isThinkingActive) {
        Color(0xFF4285F4).copy(alpha = pulseAlpha)
    } else if (isDark) {
        Color.White.copy(alpha = 0.10f)
    } else {
        Color(0xFFE0E8F5)
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = pillBg,
            border = BorderStroke(1.dp, pillBorder),
            modifier = Modifier
                .clip(RoundedCornerShape(14.dp))
                .clickable(enabled = thoughtSummary.isNotBlank()) {
                    expanded = !expanded
                }
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (isThinkingActive) {
                    // Animated 4-bar neural reasoning wave
                    Canvas(modifier = Modifier.size(width = 16.dp, height = 13.dp)) {
                        val barCount = 4
                        val step = size.width / (barCount + 1)
                        val cy = size.height * 0.5f
                        for (i in 0 until barCount) {
                            val amp = 0.32f + 0.68f * abs(sin(timeSeconds * 5.4f - i * 0.65f))
                            val halfH = size.height * 0.44f * amp
                            val x = step * (i + 1)
                            drawLine(
                                color = if (i % 2 == 0) Color(0xFF4285F4) else AfroOrange,
                                start = Offset(x, cy - halfH),
                                end = Offset(x, cy + halfH),
                                strokeWidth = 2.dp.toPx(),
                                cap = StrokeCap.Round
                            )
                        }
                    }
                } else {
                    Icon(
                        imageVector = Icons.Rounded.AutoAwesome,
                        contentDescription = null,
                        tint = mutedColor,
                        modifier = Modifier.size(14.dp)
                    )
                }

                Spacer(modifier = Modifier.width(7.dp))
                Text(
                    text = if (isThinkingActive) {
                        "Réflexion culinaire..."
                    } else {
                        "Réflexion terminée$durationLabel"
                    },
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isThinkingActive) {
                        if (isDark) Color(0xFF93C5FD) else Color(0xFF1A73E8)
                    } else {
                        mutedColor
                    }
                )
                if (thoughtSummary.isNotBlank()) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowDown,
                        contentDescription = if (expanded) "Masquer la réflexion" else "Afficher la réflexion",
                        tint = mutedColor,
                        modifier = Modifier
                            .size(16.dp)
                            .graphicsLayer { rotationZ = chevronRotation }
                    )
                }
            }
        }

        AnimatedVisibility(
            visible = expanded && thoughtSummary.isNotBlank(),
            enter = expandVertically(tween(240)) + fadeIn(tween(220)),
            exit = shrinkVertically(tween(200)) + fadeOut(tween(160))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp, start = 4.dp, end = 4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(54.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            Brush.verticalGradient(
                                listOf(
                                    Color(0xFF4285F4).copy(alpha = 0.72f),
                                    AfroOrange.copy(alpha = 0.55f),
                                    Color.Transparent
                                )
                            )
                        )
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = thoughtSummary,
                    fontSize = 12.5.sp,
                    lineHeight = 18.sp,
                    color = mutedColor.copy(alpha = if (isThinkingActive) 0.95f else 0.82f),
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

private sealed interface CulinaryBlock {
    data class OpeningTitle(val title: String) : CulinaryBlock
    data class SectionHeader(val title: String) : CulinaryBlock
    data class NumberedStep(val number: String, val content: String) : CulinaryBlock
    data class BulletItem(val content: String) : CulinaryBlock
    data class Callout(val content: String, val isPairing: Boolean) : CulinaryBlock
    data class Paragraph(val content: String) : CulinaryBlock
}

private fun parseCulinaryBlocks(markdown: String): List<CulinaryBlock> {
    val blocks = mutableListOf<CulinaryBlock>()
    val numberedRegex = Regex("^(\\d+)\\.\\s+(.*)$")

    markdown.lines().forEach { rawLine ->
        val line = rawLine.trim()
        if (line.isEmpty()) return@forEach

        when {
            line.startsWith("### ") -> {
                blocks += CulinaryBlock.OpeningTitle(line.removePrefix("### ").trim())
            }
            line.startsWith("#### ") -> {
                blocks += CulinaryBlock.SectionHeader(line.removePrefix("#### ").trim())
            }
            line.startsWith("> ") -> {
                val body = line.removePrefix("> ").trim()
                val isPairing = body.contains("Accord", ignoreCase = true)
                blocks += CulinaryBlock.Callout(body, isPairing = isPairing)
            }
            line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ") -> {
                blocks += CulinaryBlock.BulletItem(line.substring(2).trim())
            }
            numberedRegex.matches(line) -> {
                val match = numberedRegex.find(line)!!
                blocks += CulinaryBlock.NumberedStep(
                    number = match.groupValues[1],
                    content = match.groupValues[2].trim()
                )
            }
            else -> {
                blocks += CulinaryBlock.Paragraph(line)
            }
        }
    }
    return blocks
}

private fun parseInlineBold(
    text: String,
    baseColor: Color,
    boldColor: Color
): AnnotatedString = buildAnnotatedString {
    var cursor = 0
    val regex = Regex("\\*\\*(.+?)\\*\\*")
    for (match in regex.findAll(text)) {
        if (match.range.first > cursor) {
            withStyle(SpanStyle(color = baseColor)) {
                append(text.substring(cursor, match.range.first))
            }
        }
        withStyle(SpanStyle(color = boldColor, fontWeight = FontWeight.SemiBold)) {
            append(match.groupValues[1])
        }
        cursor = match.range.last + 1
    }
    if (cursor < text.length) {
        withStyle(SpanStyle(color = baseColor)) {
            append(text.substring(cursor))
        }
    }
}

@Composable
private fun GeminiOrderedCulinaryContent(
    markdown: String,
    isStreaming: Boolean,
    titleColor: Color,
    mutedColor: Color,
    isDark: Boolean
) {
    val blocks = remember(markdown) { parseCulinaryBlocks(markdown) }
    val pulseTransition = rememberInfiniteTransition(label = "streamCaret")
    val caretAlpha by pulseTransition.animateFloat(
        initialValue = 0.25f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(520, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "streamCaretAlpha"
    )

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        blocks.forEachIndexed { index, block ->
            when (block) {
                is CulinaryBlock.OpeningTitle -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 2.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .width(3.5.dp)
                                .height(20.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(
                                    Brush.verticalGradient(
                                        listOf(AfroOrange, Color(0xFFFF8F3F))
                                    )
                                )
                        )
                        Spacer(modifier = Modifier.width(9.dp))
                        Text(
                            text = block.title,
                            fontSize = 17.5.sp,
                            lineHeight = 23.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = (-0.25).sp,
                            color = titleColor
                        )
                    }
                }
                is CulinaryBlock.SectionHeader -> {
                    Column(modifier = Modifier.padding(top = 6.dp)) {
                        if (index > 0) {
                            HorizontalDivider(
                                thickness = 0.6.dp,
                                color = if (isDark) Color.White.copy(alpha = 0.08f) else Color(0xFFE7ECF3),
                                modifier = Modifier.padding(bottom = 8.dp)
                            )
                        }
                        Text(
                            text = block.title.uppercase(),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 0.75.sp,
                            color = AfroOrange
                        )
                    }
                }
                is CulinaryBlock.BulletItem -> {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 2.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Box(
                            modifier = Modifier
                                .padding(top = 8.dp)
                                .size(5.dp)
                                .clip(CircleShape)
                                .background(AfroOrange)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = parseInlineBold(block.content, titleColor.copy(alpha = 0.90f), titleColor),
                            fontSize = 14.sp,
                            lineHeight = 20.5.sp,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                is CulinaryBlock.NumberedStep -> {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 1.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Box(
                            modifier = Modifier
                                .padding(top = 1.dp)
                                .size(22.dp)
                                .clip(CircleShape)
                                .background(AfroOrange.copy(alpha = if (isDark) 0.22f else 0.13f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = block.number,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = AfroOrange
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = parseInlineBold(block.content, titleColor.copy(alpha = 0.92f), titleColor),
                            fontSize = 14.sp,
                            lineHeight = 20.5.sp,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                is CulinaryBlock.Callout -> {
                    val accent = if (block.isPairing) Color(0xFF4285F4) else AfroOrange
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = accent.copy(alpha = if (isDark) 0.13f else 0.08f),
                        border = BorderStroke(0.8.dp, accent.copy(alpha = 0.22f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Box(
                                modifier = Modifier
                                    .padding(top = 3.dp)
                                    .width(3.dp)
                                    .height(16.dp)
                                    .clip(RoundedCornerShape(3.dp))
                                    .background(accent)
                            )
                            Spacer(modifier = Modifier.width(9.dp))
                            Text(
                                text = parseInlineBold(block.content, titleColor.copy(alpha = 0.92f), titleColor),
                                fontSize = 13.5.sp,
                                lineHeight = 19.5.sp,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
                is CulinaryBlock.Paragraph -> {
                    Text(
                        text = parseInlineBold(block.content, titleColor.copy(alpha = 0.92f), titleColor),
                        fontSize = 14.5.sp,
                        lineHeight = 21.5.sp,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        if (isStreaming) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 2.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .graphicsLayer { alpha = caretAlpha }
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFF4285F4), AfroOrange)
                            )
                        )
                )
                Spacer(modifier = Modifier.width(7.dp))
                Text(
                    text = "Rédaction culinaire en direct...",
                    fontSize = 11.5.sp,
                    color = mutedColor.copy(alpha = 0.78f)
                )
            }
        }
    }
}

@Composable
private fun GeminiSuggestedRecipeCard(
    recipe: AiChefRecipeResult,
    titleColor: Color,
    mutedColor: Color,
    isDark: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val cardBg = if (isDark) Color(0xFF1A1E26) else Color.White
    val borderColor = if (isDark) Color.White.copy(alpha = 0.12f) else Color(0xFFE2E8F0)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .afroSpringClickable(
                pressedScale = 0.97f,
                haptic = AfroHapticKind.CARD_PRESS,
                onClick = onClick
            ),
        shape = RoundedCornerShape(28.dp),
        color = cardBg,
        border = BorderStroke(1.dp, borderColor),
        shadowElevation = 0.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = recipe.region.uppercase(),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 0.9.sp,
                    color = AfroOrange
                )
                Text(
                    text = "${recipe.totalTime} • ${recipe.difficulty}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = mutedColor
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = recipe.dishName,
                fontSize = 16.sp,
                fontWeight = FontWeight.ExtraBold,
                color = titleColor
            )

            if (recipe.usedIngredients.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    flingBehavior = rememberSmoothFlingBehavior()
                ) {
                    items(recipe.usedIngredients) { ing ->
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = AfroOrange.copy(alpha = 0.12f)
                        ) {
                            Text(
                                text = ing.name,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = AfroOrange,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }

            if (!recipe.chefTip.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = recipe.chefTip,
                    fontSize = 12.sp,
                    lineHeight = 16.sp,
                    color = mutedColor
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Surface(
                shape = RoundedCornerShape(50),
                color = AfroOrange,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 10.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Voir la recette complète",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

/**
 * Unified AI Composer Pill with rotating iridescent AI halo border and spring-morphing
 * Live / Send / Stop action pill.
 */
@Composable
private fun GeminiComposerPill(
    value: String,
    onValueChange: (String) -> Unit,
    onFocusChanged: (Boolean) -> Unit,
    timeSeconds: Float,
    isFocused: Boolean,
    isGenerating: Boolean,
    isDark: Boolean,
    titleColor: Color,
    mutedColor: Color,
    onQuickIngredientClick: () -> Unit,
    onVoiceDictationClick: () -> Unit,
    onSendMessage: () -> Unit,
    onStopGeneration: () -> Unit,
    onLaunchLive: () -> Unit,
    modifier: Modifier = Modifier
) {
    val hasText = value.isNotBlank()
    val pillBg = if (isDark) Color(0xFF1C2029) else Color.White

    val haloStrength by animateFloatAsState(
        targetValue = when {
            isGenerating -> 0.95f
            isFocused || hasText -> 0.72f
            else -> 0.34f
        },
        animationSpec = tween(280),
        label = "composerHaloStrength"
    )

    val actionBg by animateColorAsState(
        targetValue = when {
            isGenerating -> if (isDark) Color(0xFF2B3242) else Color(0xFF1F242D)
            hasText -> AfroOrange
            isDark -> Color(0xFF253047)
            else -> Color(0xFFE1EEFF)
        },
        animationSpec = tween(220),
        label = "composerActionBg"
    )
    val actionTint = when {
        isGenerating -> Color.White
        hasText -> Color.White
        isDark -> Color(0xFF93C5FD)
        else -> Color(0xFF0B3D91)
    }

    val sweepAngle = (timeSeconds * (if (isGenerating) 140f else 55f)) % 360f
    val rad = (sweepAngle * PI / 180.0).toFloat()
    val gradStart = Offset(500f + 500f * cos(rad), 50f + 50f * sin(rad))
    val gradEnd = Offset(500f - 500f * cos(rad), 50f - 50f * sin(rad))

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .height(60.dp),
        shape = RoundedCornerShape(32.dp),
        color = pillBg,
        border = BorderStroke(
            width = if (isFocused || isGenerating) 1.4.dp else 1.dp,
            brush = Brush.linearGradient(
                colors = listOf(
                    Color(0xFF4285F4).copy(alpha = haloStrength),
                    Color(0xFF38BDF8).copy(alpha = haloStrength * 0.85f),
                    AfroOrange.copy(alpha = haloStrength * 0.90f),
                    Color(0xFF8B5CF6).copy(alpha = haloStrength * 0.80f)
                ),
                start = gradStart,
                end = gradEnd
            )
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(start = 10.dp, end = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onQuickIngredientClick,
                modifier = Modifier.size(38.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Ajouter des ingrédients",
                    tint = titleColor,
                    modifier = Modifier.size(22.dp)
                )
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 4.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                if (value.isEmpty()) {
                    DisableSelection {
                        Text(
                            text = "Ingrédients du frigo ou question cuisine...",
                            fontSize = 15.sp,
                            color = mutedColor,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    singleLine = true,
                    textStyle = TextStyle(
                        fontFamily = NexaFontFamily,
                        color = titleColor,
                        fontSize = 15.5.sp,
                        fontWeight = FontWeight.Normal
                    ),
                    cursorBrush = SolidColor(AfroOrange),
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { onFocusChanged(it.isFocused) }
                )
            }

            IconButton(
                onClick = onVoiceDictationClick,
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Mic,
                    contentDescription = "Dictée vocale",
                    tint = titleColor.copy(alpha = 0.85f),
                    modifier = Modifier.size(21.dp)
                )
            }

            Spacer(modifier = Modifier.width(6.dp))

            // Morphing Action Control: Animated Gemini Live Wave <-> Send <-> Stop
            val actionMode = when {
                isGenerating -> "STOP"
                hasText -> "SEND"
                else -> "LIVE"
            }

            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(actionBg)
                    .afroSpringClickable(
                        pressedScale = 0.88f,
                        haptic = AfroHapticKind.NONE
                    ) {
                        when (actionMode) {
                            "STOP" -> onStopGeneration()
                            "SEND" -> onSendMessage()
                            else -> onLaunchLive()
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                if (actionMode == "STOP") {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        rotate(degrees = (timeSeconds * 180f) % 360f) {
                            drawArc(
                                brush = Brush.sweepGradient(
                                    listOf(Color.Transparent, Color(0xFF7CC4FA), AfroOrange)
                                ),
                                startAngle = 0f,
                                sweepAngle = 250f,
                                useCenter = false,
                                style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round)
                            )
                        }
                    }
                }

                AnimatedContent(
                    targetState = actionMode,
                    transitionSpec = {
                        (scaleIn(initialScale = 0.65f, animationSpec = spring(dampingRatio = 0.72f)) + fadeIn(tween(150))) togetherWith
                            (scaleOut(targetScale = 0.65f, animationSpec = tween(120)) + fadeOut(tween(120)))
                    },
                    label = "composerActionMorph"
                ) { mode ->
                    when (mode) {
                        "STOP" -> Icon(
                            imageVector = Icons.Rounded.Stop,
                            contentDescription = "Arrêter la réponse",
                            tint = actionTint,
                            modifier = Modifier.size(19.dp)
                        )
                        "SEND" -> Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Envoyer",
                            tint = actionTint,
                            modifier = Modifier.size(19.dp)
                        )
                        else -> AnimatedLiveButtonGlyph(
                            timeSeconds = timeSeconds,
                            tint = actionTint,
                            modifier = Modifier.size(21.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Animated miniature Gemini Live icon (3 breathing vertical sound bars + 4-point star)
 * inside the composer's Live launch button.
 */
@Composable
private fun AnimatedLiveButtonGlyph(
    timeSeconds: Float,
    tint: Color,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val barW = w * 0.135f
        val cr = CornerRadius(barW * 0.5f, barW * 0.5f)

        val h1 = h * (0.28f + 0.12f * (0.5f + 0.5f * sin(timeSeconds * 3.6f)))
        val h2 = h * (0.48f + 0.18f * (0.5f + 0.5f * sin(timeSeconds * 4.4f + 1.1f)))
        val h3 = h * (0.30f + 0.14f * (0.5f + 0.5f * sin(timeSeconds * 3.9f + 2.2f)))

        drawRoundRect(
            color = tint,
            topLeft = Offset(w * 0.08f, (h - h1) * 0.54f),
            size = Size(barW, h1),
            cornerRadius = cr
        )
        drawRoundRect(
            color = tint,
            topLeft = Offset(w * 0.31f, (h - h2) * 0.52f),
            size = Size(barW, h2),
            cornerRadius = cr
        )
        drawRoundRect(
            color = tint,
            topLeft = Offset(w * 0.54f, (h - h3) * 0.56f),
            size = Size(barW, h3),
            cornerRadius = cr
        )

        val sx = w * 0.80f
        val sy = h * 0.24f
        val outer = w * 0.18f
        val inner = outer * 0.25f
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

package com.afrocuisto.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.afrocuisto.app.R
import com.afrocuisto.app.service.CookingTimerService
import com.afrocuisto.app.service.TimerState
import com.afrocuisto.app.ui.theme.AccentEmerald
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.ExpressivePillShape
import com.afrocuisto.app.ui.theme.NexaFontFamily
import com.afrocuisto.app.ui.theme.isAfroDarkTheme

/**
 * Floating Timer Dock Overlay displayed across main screens when a cooking timer is active.
 */
@Composable
fun InteractiveTimerPill(
    modifier: Modifier = Modifier,
    onOpenRecipe: (String) -> Unit = {}
) {
    val timerState by CookingTimerService.timerState.collectAsState()

    AnimatedVisibility(
        visible = timerState.isActive,
        enter = slideInVertically(
            initialOffsetY = { it },
            animationSpec = spring(dampingRatio = 0.82f, stiffness = Spring.StiffnessMediumLow)
        ) + fadeIn(tween(200)),
        exit = slideOutVertically(
            targetOffsetY = { it },
            animationSpec = tween(200)
        ) + fadeOut(tween(160)),
        modifier = modifier
    ) {
        CookingTimerDockCard(
            timerState = timerState,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            onCardClick = {
                if (timerState.recipeId.isNotBlank()) {
                    onOpenRecipe(timerState.recipeId)
                }
            }
        )
    }
}

/**
 * Clean, high-contrast Android 17 Clock-style Cooking Timer Card used both in RecipeDetailScreen
 * and in the global floating timer overlay.
 */
@Composable
fun CookingTimerDockCard(
    timerState: TimerState,
    modifier: Modifier = Modifier,
    onCardClick: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current
    val isDark = isAfroDarkTheme()

    val surfaceColor = if (isDark) Color(0xFF1E1C1A) else Color(0xFFFFFFFF)
    val borderColor = when {
        timerState.isCompleted -> AccentEmerald.copy(alpha = 0.55f)
        timerState.isRunning -> AfroOrange.copy(alpha = if (isDark) 0.45f else 0.30f)
        else -> if (isDark) Color(0xFF322E2A) else Color(0xFFE6E1D8)
    }
    val inkColor = if (isDark) Color(0xFFF7F5F0) else Color(0xFF19221D)
    val mutedColor = if (isDark) Color(0xFF9E9890) else Color(0xFF6E7771)
    val neutralBtnBg = if (isDark) Color(0xFF2B2824) else Color(0xFFF4F1EA)

    val animatedProgress by animateFloatAsState(
        targetValue = if (timerState.isCompleted) 1f else timerState.progressFraction,
        animationSpec = tween(durationMillis = 350, easing = FastOutSlowInEasing),
        label = "timerRingProgress"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "timerLiveDot")
    val liveDotAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(850, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "liveDotAlpha"
    )

    val accentColor = if (timerState.isCompleted) AccentEmerald else AfroOrange

    val subtitleText = buildString {
        val cleanRecipe = timerState.recipeName.trim()
        val cleanStep = timerState.stepTitle.trim()
        if (cleanStep.isNotBlank() && !cleanStep.equals(cleanRecipe, ignoreCase = true)) {
            append(cleanStep)
            if (cleanRecipe.isNotBlank() && !cleanStep.contains(cleanRecipe, ignoreCase = true)) {
                append(" · ")
                append(cleanRecipe)
            }
        } else {
            append(cleanRecipe.ifBlank { "Minuteur de cuisson" })
        }
    }

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(22.dp),
        color = surfaceColor,
        border = BorderStroke(1.dp, borderColor),
        shadowElevation = 10.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .then(
                    if (onCardClick != null) {
                        Modifier.clickable(onClick = onCardClick)
                    } else {
                        Modifier
                    }
                )
                .padding(horizontal = 14.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 1. Circular Countdown Ring + Monochrome Stopwatch Icon
            Box(
                modifier = Modifier.size(42.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    progress = { animatedProgress },
                    modifier = Modifier.size(42.dp),
                    color = accentColor,
                    trackColor = accentColor.copy(alpha = 0.14f),
                    strokeWidth = 3.2.dp,
                    strokeCap = StrokeCap.Round
                )

                if (timerState.isCompleted) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Terminé",
                        tint = AccentEmerald,
                        modifier = Modifier.size(18.dp)
                    )
                } else {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_stopwatch_linear),
                        contentDescription = "Minuteur",
                        tint = if (timerState.isRunning) AfroOrange else mutedColor,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // 2. Tabular Countdown Time + Status Chip + Dish Subtitle
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = if (timerState.isCompleted) "00:00" else timerState.formattedTime,
                        style = TextStyle(
                            fontFamily = NexaFontFamily,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 19.sp,
                            letterSpacing = (-0.3).sp,
                            fontFeatureSettings = "tnum"
                        ),
                        color = inkColor,
                        maxLines = 1
                    )

                    Surface(
                        shape = ExpressivePillShape,
                        color = when {
                            timerState.isCompleted -> AccentEmerald.copy(alpha = 0.14f)
                            timerState.isRunning -> AfroOrange.copy(alpha = 0.12f)
                            else -> neutralBtnBg
                        }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.5.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            if (timerState.isRunning) {
                                Box(
                                    modifier = Modifier
                                        .size(5.5.dp)
                                        .alpha(liveDotAlpha)
                                        .clip(CircleShape)
                                        .background(AfroOrange)
                                )
                            }
                            Text(
                                text = when {
                                    timerState.isCompleted -> "Prêt"
                                    timerState.isRunning -> "Actif"
                                    else -> "Pause"
                                },
                                color = when {
                                    timerState.isCompleted -> AccentEmerald
                                    timerState.isRunning -> AfroOrange
                                    else -> mutedColor
                                },
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = subtitleText,
                    color = mutedColor,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // 3. Tactile Controls: +1m, Pause/Resume, Stop
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // +1 min button
                Surface(
                    shape = RoundedCornerShape(11.dp),
                    color = neutralBtnBg,
                    modifier = Modifier
                        .height(36.dp)
                        .clip(RoundedCornerShape(11.dp))
                        .clickable {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            CookingTimerService.addSeconds(context, 60)
                        }
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.padding(horizontal = 9.dp)
                    ) {
                        Text(
                            text = "+1m",
                            color = inkColor,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }

                // Pause / Play button
                if (!timerState.isCompleted) {
                    Surface(
                        shape = CircleShape,
                        color = AfroOrange,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .clickable {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                if (timerState.isRunning) {
                                    CookingTimerService.pause(context)
                                } else {
                                    CookingTimerService.resume(context)
                                }
                            }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = if (timerState.isRunning) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = if (timerState.isRunning) "Mettre en pause" else "Reprendre",
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                // Stop / Dismiss button
                Surface(
                    shape = CircleShape,
                    color = neutralBtnBg,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .clickable {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            CookingTimerService.stop(context)
                        }
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Arrêter le minuteur",
                            tint = inkColor,
                            modifier = Modifier.size(17.dp)
                        )
                    }
                }
            }
        }
    }
}

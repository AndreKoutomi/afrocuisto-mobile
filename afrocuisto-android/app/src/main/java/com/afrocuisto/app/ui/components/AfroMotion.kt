package com.afrocuisto.app.ui.components

import android.os.Build
import android.view.HapticFeedbackConstants
import android.view.View
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class AfroHapticKind {
    NAVIGATION,
    SELECTION,
    CARD_PRESS,
    SUCCESS,
    TOGGLE_ON,
    TOGGLE_OFF,
    DESTRUCTIVE,
    NONE
}

/**
 * Precision Android Linear-Actuator Haptic Controller leveraging Android 14–17 waveforms
 * with graceful fallbacks down to API 26.
 */
@Stable
class AfroHapticsController(private val view: View) {

    fun perform(kind: AfroHapticKind) {
        when (kind) {
            AfroHapticKind.NAVIGATION -> navigationTap()
            AfroHapticKind.SELECTION -> selectionTick()
            AfroHapticKind.CARD_PRESS -> cardPress()
            AfroHapticKind.SUCCESS -> actionSuccess()
            AfroHapticKind.TOGGLE_ON -> toggleSwitch(true)
            AfroHapticKind.TOGGLE_OFF -> toggleSwitch(false)
            AfroHapticKind.DESTRUCTIVE -> destructiveTick()
            AfroHapticKind.NONE -> Unit
        }
    }

    fun cardPress() {
        val constant = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            HapticFeedbackConstants.CONTEXT_CLICK
        } else {
            HapticFeedbackConstants.KEYBOARD_TAP
        }
        view.performHapticFeedback(constant)
    }

    fun heavyAction() {
        val constant = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            HapticFeedbackConstants.GESTURE_START
        } else {
            HapticFeedbackConstants.LONG_PRESS
        }
        view.performHapticFeedback(constant)
    }

    fun navigationTap() {
        val constant = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            HapticFeedbackConstants.CONTEXT_CLICK
        } else {
            HapticFeedbackConstants.CLOCK_TICK
        }
        view.performHapticFeedback(constant)
    }

    fun selectionTick() {
        val constant = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            HapticFeedbackConstants.SEGMENT_FREQUENT_TICK
        } else {
            HapticFeedbackConstants.CLOCK_TICK
        }
        view.performHapticFeedback(constant)
    }

    fun toggleSwitch(checked: Boolean) {
        val constant = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            if (checked) HapticFeedbackConstants.TOGGLE_ON else HapticFeedbackConstants.TOGGLE_OFF
        } else {
            HapticFeedbackConstants.CLOCK_TICK
        }
        view.performHapticFeedback(constant)
    }

    fun favoriteBurst(isNowLiked: Boolean) {
        val constant = if (isNowLiked) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                HapticFeedbackConstants.CONFIRM
            } else {
                HapticFeedbackConstants.LONG_PRESS
            }
        } else {
            HapticFeedbackConstants.CLOCK_TICK
        }
        view.performHapticFeedback(constant)
    }

    fun actionSuccess() {
        val constant = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            HapticFeedbackConstants.CONFIRM
        } else {
            HapticFeedbackConstants.LONG_PRESS
        }
        view.performHapticFeedback(constant)
    }

    fun destructiveTick() {
        val constant = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            HapticFeedbackConstants.REJECT
        } else {
            HapticFeedbackConstants.KEYBOARD_TAP
        }
        view.performHapticFeedback(constant)
    }
}

@Composable
fun rememberAfroHaptics(): AfroHapticsController {
    val view = LocalView.current
    return remember(view) { AfroHapticsController(view) }
}

val AfroSpatialEasing = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)

/**
 * Interactive tactile modifier combining GPU spring compression, micro-rebound on release,
 * subtle vertical press travel, and native linear-actuator haptic feedback.
 */
fun Modifier.afroSpringClickable(
    enabled: Boolean = true,
    pressedScale: Float = 0.93f,
    pressSink: Dp = 1.dp,
    haptic: AfroHapticKind = AfroHapticKind.SELECTION,
    onClick: () -> Unit
): Modifier = composed {
    val haptics = rememberAfroHaptics()
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed && enabled) pressedScale else 1f,
        animationSpec = spring(
            dampingRatio = if (isPressed) Spring.DampingRatioNoBouncy else 0.56f,
            stiffness = if (isPressed) Spring.StiffnessHigh else Spring.StiffnessMedium
        ),
        label = "afroSpringScale"
    )
    val sinkProgress by animateFloatAsState(
        targetValue = if (isPressed && enabled) 1f else 0f,
        animationSpec = tween(durationMillis = if (isPressed) 90 else 180),
        label = "afroSpringSink"
    )

    this
        .graphicsLayer {
            scaleX = scale
            scaleY = scale
            translationY = sinkProgress * pressSink.toPx()
        }
        .clickable(
            enabled = enabled,
            interactionSource = interactionSource,
            indication = null
        ) {
            haptics.perform(haptic)
            onClick()
        }
}

/**
 * GPU-only elastic cushion press effect for Material3 Cards that manage their own `onClick`.
 */
fun Modifier.afroCardPressMotion(
    interactionSource: InteractionSource,
    pressedScale: Float = 0.965f
): Modifier = composed {
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) pressedScale else 1f,
        animationSpec = spring(
            dampingRatio = if (isPressed) Spring.DampingRatioNoBouncy else 0.60f,
            stiffness = if (isPressed) Spring.StiffnessMedium else Spring.StiffnessMediumLow
        ),
        label = "afroCardScale"
    )
    val liftY by animateFloatAsState(
        targetValue = if (isPressed) 1.5f else 0f,
        animationSpec = tween(120),
        label = "afroCardLift"
    )

    this.graphicsLayer {
        scaleX = scale
        scaleY = scale
        translationY = liftY.dp.toPx()
    }
}

/**
 * Choreographed staggered entrance animation for cards and sections.
 */
fun Modifier.afroStaggeredEntrance(
    index: Int,
    triggerKey: Any? = Unit
): Modifier = composed {
    val alphaAnim = remember(triggerKey) { Animatable(0f) }
    val offsetAnim = remember(triggerKey) { Animatable(1f) }
    val scaleAnim = remember(triggerKey) { Animatable(0.95f) }

    LaunchedEffect(triggerKey) {
        val staggerDelay = (index.coerceIn(0, 7)) * 28L
        if (staggerDelay > 0L) delay(staggerDelay)
        launch {
            alphaAnim.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 280, easing = AfroSpatialEasing)
            )
        }
        launch {
            offsetAnim.animateTo(
                targetValue = 0f,
                animationSpec = tween(durationMillis = 340, easing = AfroSpatialEasing)
            )
        }
        launch {
            scaleAnim.animateTo(
                targetValue = 1f,
                animationSpec = spring(
                    dampingRatio = 0.78f,
                    stiffness = Spring.StiffnessMediumLow
                )
            )
        }
    }

    this.graphicsLayer {
        alpha = alphaAnim.value
        translationY = offsetAnim.value * 16.dp.toPx()
        scaleX = scaleAnim.value
        scaleY = scaleAnim.value
    }
}

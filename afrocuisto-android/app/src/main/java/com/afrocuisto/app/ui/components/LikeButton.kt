package com.afrocuisto.app.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.afrocuisto.app.R
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.LikeRed
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * Unified Like / Favorite button shared across all cards and screens:
 * - Multi-stage elastic spring pop + joyful micro-tilt when liked
 * - Radial shockwave ring + 6-spark particle burst on false -> true transition
 * - Native Android CONFIRM / CLOCK_TICK haptic feedback built in
 */
@Composable
fun ProductLikeButton(
    isLiked: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    buttonSize: Dp = 28.dp,
    iconSize: Dp = 16.dp
) {
    val haptics = rememberAfroHaptics()
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val pressScale by animateFloatAsState(
        targetValue = if (isPressed) 0.84f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioNoBouncy,
            stiffness = Spring.StiffnessHigh
        ),
        label = "likePressScale"
    )

    val popScale = remember { Animatable(1f) }
    val tiltDeg = remember { Animatable(0f) }
    val burstProgress = remember { Animatable(1f) }
    var previousLiked by remember { mutableStateOf(isLiked) }

    LaunchedEffect(isLiked) {
        if (isLiked != previousLiked) {
            val likedNow = isLiked
            previousLiked = isLiked
            if (likedNow) {
                launch {
                    burstProgress.snapTo(0f)
                    burstProgress.animateTo(
                        targetValue = 1f,
                        animationSpec = tween(durationMillis = 480, easing = FastOutSlowInEasing)
                    )
                }
                launch {
                    tiltDeg.snapTo(-14f)
                    tiltDeg.animateTo(
                        targetValue = 0f,
                        animationSpec = spring(
                            dampingRatio = 0.45f,
                            stiffness = Spring.StiffnessMedium
                        )
                    )
                }
                popScale.snapTo(0.72f)
                popScale.animateTo(
                    targetValue = 1f,
                    animationSpec = spring(
                        dampingRatio = 0.42f,
                        stiffness = Spring.StiffnessMedium
                    )
                )
            } else {
                popScale.snapTo(0.86f)
                popScale.animateTo(
                    targetValue = 1f,
                    animationSpec = spring(
                        dampingRatio = 0.68f,
                        stiffness = Spring.StiffnessMedium
                    )
                )
            }
        }
    }

    Box(
        modifier = modifier.size(buttonSize),
        contentAlignment = Alignment.Center
    ) {
        // Radial shockwave + 6-spark celebration burst (not clipped by circle)
        if (burstProgress.value < 0.99f) {
            Canvas(modifier = Modifier.size(buttonSize * 1.65f)) {
                val p = burstProgress.value
                val center = Offset(size.width * 0.5f, size.height * 0.5f)
                val maxR = size.minDimension * 0.48f

                // Expanding shockwave ring
                val ringAlpha = (1f - p).coerceIn(0f, 1f) * 0.75f
                drawCircle(
                    color = LikeRed.copy(alpha = ringAlpha),
                    radius = maxR * (0.45f + 0.55f * p),
                    center = center,
                    style = Stroke(width = 1.6.dp.toPx() * (1f - p * 0.6f))
                )

                // 6 radiating sparks alternating Coral Red & AfroOrange
                val sparkCount = 6
                for (i in 0 until sparkCount) {
                    val angle = (i * (2.0 * PI / sparkCount)) - PI / 2.0
                    val dist = maxR * (0.42f + 0.62f * p)
                    val sx = center.x + (cos(angle) * dist).toFloat()
                    val sy = center.y + (sin(angle) * dist).toFloat()
                    val sparkRadius = (2.2.dp.toPx() * (1f - p * 0.85f)).coerceAtLeast(0.4f)
                    val sparkColor = if (i % 2 == 0) LikeRed else AfroOrange
                    drawCircle(
                        color = sparkColor.copy(alpha = (1f - p).coerceIn(0f, 1f)),
                        radius = sparkRadius,
                        center = Offset(sx, sy)
                    )
                }
            }
        }

        Box(
            modifier = Modifier
                .size(buttonSize)
                .graphicsLayer {
                    scaleX = pressScale * popScale.value
                    scaleY = pressScale * popScale.value
                }
                .clip(CircleShape)
                .background(Color.Black.copy(alpha = 0.50f))
                .clickable(
                    interactionSource = interactionSource,
                    indication = null
                ) {
                    haptics.favoriteBurst(!isLiked)
                    onClick()
                },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                painter = painterResource(
                    id = if (isLiked) R.drawable.ic_solar_heart_liked else R.drawable.ic_solar_heart_linear
                ),
                contentDescription = "Favori",
                tint = Color.Unspecified,
                modifier = Modifier
                    .size(iconSize)
                    .graphicsLayer {
                        rotationZ = tiltDeg.value
                    }
            )
        }
    }
}

package com.afrocuisto.app.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.afrocuisto.app.ui.theme.AccentGold
import com.afrocuisto.app.ui.theme.PrimaryOrange
import com.afrocuisto.app.ui.theme.PrimaryOrangeLight

/**
 * Material 3 Expressive Glowing Border & Ambient Light Effect.
 * Creates an expressive pulsing warm glow around cards or hero containers.
 */
@Composable
fun GlowEffect(
    modifier: Modifier = Modifier,
    blurRadius: Dp = 18.dp,
    borderRadius: Dp = 28.dp,
    glowColors: List<Color> = listOf(
        PrimaryOrange,
        AccentGold,
        PrimaryOrangeLight
    ),
    content: @Composable () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "glowTransition")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(
            animation = tween(1600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowAlpha"
    )

    Box(modifier = modifier) {
        // Glowing background blurred box
        Box(
            modifier = Modifier
                .matchParentSize()
                .padding(3.dp)
                .blur(blurRadius)
                .background(
                    brush = Brush.horizontalGradient(
                        colors = glowColors.map { it.copy(alpha = alpha) }
                    ),
                    shape = RoundedCornerShape(borderRadius)
                )
        )

        // Foreground content
        content()
    }
}

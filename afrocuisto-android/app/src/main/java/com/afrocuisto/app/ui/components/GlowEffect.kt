package com.afrocuisto.app.ui.components

import android.graphics.BlurMaskFilter
import android.graphics.Matrix
import android.graphics.SweepGradient
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.afrocuisto.app.ui.theme.AccentGold
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.PrimaryOrange
import com.afrocuisto.app.ui.theme.PrimaryOrangeLight
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

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

private data class AuroraPlumeSpec(
    val color: Color,
    val baseX: Float,
    val baseY: Float,
    val ampX: Float,
    val ampY: Float,
    val freqX: Float,
    val freqY: Float,
    val phaseOffset: Float,
    val radiusFactor: Float,
    val alphaMultiplier: Float
)

private val AppleAiRingColors = intArrayOf(
    Color(0xFF4F46E5).toArgb(), // Electric Indigo
    Color(0xFFA855F7).toArgb(), // Vivid Purple
    Color(0xFFFF2E93).toArgb(), // Apple AI Magenta
    Color(0xFFFB5607).toArgb(), // AfroCuisto Coral Orange
    Color(0xFFFF9F0A).toArgb(), // Warm Amber
    Color(0xFF38BDF8).toArgb(), // Luminous Cyan
    Color(0xFF4F46E5).toArgb()  // Loop closure
)

private val AppleAiPlumes = listOf(
    AuroraPlumeSpec(
        color = Color(0xFF4F46E5),
        baseX = 0.16f,
        baseY = 0.96f,
        ampX = 0.10f,
        ampY = 0.08f,
        freqX = 1f,
        freqY = 2f,
        phaseOffset = 0.0f,
        radiusFactor = 0.56f,
        alphaMultiplier = 1.0f
    ),
    AuroraPlumeSpec(
        color = Color(0xFFFF2E93),
        baseX = 0.48f,
        baseY = 0.98f,
        ampX = 0.15f,
        ampY = 0.07f,
        freqX = 1f,
        freqY = 1f,
        phaseOffset = 1.1f,
        radiusFactor = 0.60f,
        alphaMultiplier = 1.05f
    ),
    AuroraPlumeSpec(
        color = Color(0xFFFB5607),
        baseX = 0.84f,
        baseY = 0.92f,
        ampX = 0.11f,
        ampY = 0.10f,
        freqX = 1f,
        freqY = 2f,
        phaseOffset = 2.4f,
        radiusFactor = 0.54f,
        alphaMultiplier = 0.95f
    ),
    AuroraPlumeSpec(
        color = Color(0xFF38BDF8),
        baseX = 0.34f,
        baseY = 1.02f,
        ampX = 0.16f,
        ampY = 0.06f,
        freqX = 2f,
        freqY = 1f,
        phaseOffset = 3.7f,
        radiusFactor = 0.48f,
        alphaMultiplier = 0.85f
    ),
    AuroraPlumeSpec(
        color = Color(0xFFA855F7),
        baseX = 0.94f,
        baseY = 0.34f,
        ampX = 0.05f,
        ampY = 0.16f,
        freqX = 1f,
        freqY = 1f,
        phaseOffset = 4.6f,
        radiusFactor = 0.44f,
        alphaMultiplier = 0.65f
    )
)

/**
 * Apple Intelligence-inspired dynamic animated AI Glow card container:
 * - Seamless rotating multi-spectrum outer ambient halo (no clip clipping)
 * - Undulating internal mesh-like aurora waves concentrated smoothly along the bottom edge
 * - Crisp rotating iridescent rim border + subtle specular glass highlight
 */
@Composable
fun AppleAiGlowCard(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 22.dp,
    containerColor: Color = Color.White,
    isDark: Boolean = false,
    showInternalAurora: Boolean = true,
    content: @Composable BoxScope.() -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "appleAiGlow")
    val phase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2.0 * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 7200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "appleAiPhase"
    )

    val rotationDeg = (phase / (2f * PI.toFloat())) * 360f
    val pulse = 0.5f + 0.5f * sin(phase * 2f)
    val basePlumeAlpha = if (isDark) 0.28f else 0.10f
    val haloAlpha = if (isDark) (0.50f + 0.18f * pulse) else (0.38f + 0.16f * pulse)

    val shape = RoundedCornerShape(cornerRadius)
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val pressScale by animateFloatAsState(
        targetValue = if (isPressed) 0.97f else 1f,
        animationSpec = spring(
            dampingRatio = if (isPressed) Spring.DampingRatioNoBouncy else 0.58f,
            stiffness = Spring.StiffnessMedium
        ),
        label = "aiGlowCardPressScale"
    )
    val shaderMatrix = remember { Matrix() }
    val haloPaint = remember {
        android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
            style = android.graphics.Paint.Style.STROKE
        }
    }
    val rimPaint = remember {
        android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
            style = android.graphics.Paint.Style.STROKE
        }
    }

    Box(
        modifier = modifier
            .graphicsLayer {
                scaleX = pressScale
                scaleY = pressScale
            }
            .drawBehind {
                val radiusPx = cornerRadius.toPx()
                val cx = size.width * 0.5f
                val cy = size.height * 0.5f

                shaderMatrix.reset()
                shaderMatrix.setRotate(rotationDeg, cx, cy)
                val sweepShader = SweepGradient(cx, cy, AppleAiRingColors, null).apply {
                    setLocalMatrix(shaderMatrix)
                }

                // Soft outer ambient Apple Intelligence aura radiating around the card
                drawIntoCanvas { canvas ->
                    haloPaint.strokeWidth = 10.dp.toPx()
                    haloPaint.shader = sweepShader
                    haloPaint.alpha = (haloAlpha * 255).toInt().coerceIn(0, 255)
                    haloPaint.maskFilter = BlurMaskFilter(14.dp.toPx(), BlurMaskFilter.Blur.NORMAL)
                    canvas.nativeCanvas.drawRoundRect(
                        0f,
                        1.5.dp.toPx(),
                        size.width,
                        size.height + 1.5.dp.toPx(),
                        radiusPx,
                        radiusPx,
                        haloPaint
                    )
                }

                // Subtle bottom ambient bloom mirroring the card's bottom aurora wave
                val bottomBloomOffset = 0.08f * sin(phase)
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            Color(0xFFFF2E93).copy(alpha = 0.18f + 0.06f * pulse),
                            AfroOrange.copy(alpha = 0.09f),
                            Color.Transparent
                        ),
                        center = Offset(size.width * (0.5f + bottomBloomOffset), size.height * 0.92f),
                        radius = size.width * 0.45f
                    ),
                    radius = size.width * 0.45f,
                    center = Offset(size.width * (0.5f + bottomBloomOffset), size.height * 0.92f)
                )
            }
            .clip(shape)
            .background(containerColor)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
    ) {
        // Internal undulating Apple AI aurora mesh layer + glowing iridescent edge border
        Canvas(modifier = Modifier.matchParentSize()) {
            val w = size.width
            val h = size.height
            val radiusPx = cornerRadius.toPx()

            if (showInternalAurora) {
                // Animated flowing aurora light plumes along bottom & edge
                AppleAiPlumes.forEach { plume ->
                    val cx = w * (plume.baseX + plume.ampX * cos(phase * plume.freqX + plume.phaseOffset))
                    val cy = h * (plume.baseY + plume.ampY * sin(phase * plume.freqY + plume.phaseOffset))
                    val r = w * plume.radiusFactor * (0.94f + 0.08f * sin(phase + plume.phaseOffset))
                    val peakAlpha = (basePlumeAlpha * plume.alphaMultiplier * (0.86f + 0.14f * pulse))
                        .coerceIn(0f, 0.55f)

                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                plume.color.copy(alpha = peakAlpha),
                                plume.color.copy(alpha = peakAlpha * 0.42f),
                                Color.Transparent
                            ),
                            center = Offset(cx, cy),
                            radius = r
                        ),
                        radius = r,
                        center = Offset(cx, cy)
                    )
                }

                // Soft luminous bottom-edge sheen matching the glowing base in Apple AI cards
                drawRect(
                    brush = Brush.verticalGradient(
                        colorStops = arrayOf(
                            0.0f to Color.Transparent,
                            0.68f to Color.Transparent,
                            0.90f to Color(0xFFFF2E93).copy(alpha = if (isDark) 0.14f else 0.07f),
                            1.0f to Color(0xFF6366F1).copy(alpha = if (isDark) 0.22f else 0.11f)
                        )
                    )
                )
            }

            // Crisp animated rotating Apple AI gradient rim border
            shaderMatrix.reset()
            shaderMatrix.setRotate(rotationDeg, w * 0.5f, h * 0.5f)
            val borderShader = SweepGradient(w * 0.5f, h * 0.5f, AppleAiRingColors, null).apply {
                setLocalMatrix(shaderMatrix)
            }

            drawIntoCanvas { canvas ->
                val strokePx = 0.75.dp.toPx()
                val halfStroke = strokePx * 0.5f
                rimPaint.strokeWidth = strokePx
                rimPaint.shader = borderShader
                rimPaint.alpha = (165 + 45 * pulse).toInt().coerceIn(0, 255)
                canvas.nativeCanvas.drawRoundRect(
                    halfStroke,
                    halfStroke,
                    w - halfStroke,
                    h - halfStroke,
                    radiusPx - halfStroke,
                    radiusPx - halfStroke,
                    rimPaint
                )
            }

            // Subtle hairline inner glass highlight
            drawRoundRect(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color.White.copy(alpha = if (isDark) 0.14f else 0.55f),
                        Color.Transparent
                    )
                ),
                cornerRadius = CornerRadius(radiusPx, radiusPx),
                style = Stroke(width = 0.5.dp.toPx())
            )
        }

        content()
    }
}

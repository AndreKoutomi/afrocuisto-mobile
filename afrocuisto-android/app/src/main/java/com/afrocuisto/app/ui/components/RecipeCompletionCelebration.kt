package com.afrocuisto.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.unit.dp
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin

// Exact pixel-sampled palette from Congratulations.gif
private val ConfettiCoral = Color(0xFFEC6175)
private val ConfettiRose = Color(0xFFE85D70)
private val ConfettiOrange = Color(0xFFF77E00)
private val ConfettiAmber = Color(0xFFF17900)
private val ConfettiChampagne = Color(0xFFF1D0BB)
private val ConfettiCream = Color(0xFFEECEB9)
private val ConfettiGold = Color(0xFFFFC412)

private val CelebrationPalette = listOf(
    ConfettiCoral,
    ConfettiOrange,
    ConfettiChampagne,
    ConfettiGold,
    ConfettiRose,
    ConfettiAmber,
    ConfettiCream
)

private enum class ConfettiShapeKind {
    STAR_5,
    SPARKLE_4,
    CHIP_RECT,
    DOT
}

private data class VectorBurstParticle(
    val originXFrac: Float,
    val originYFrac: Float,
    val angleDeg: Float,
    val reachFrac: Float,
    val gravityFrac: Float,
    val swayAmpDp: Float,
    val swayFreq: Float,
    val sizeDp: Float,
    val color: Color,
    val shape: ConfettiShapeKind,
    val startNorm: Float,
    val endNorm: Float,
    val spinDeg: Float,
    val flipSpeed: Float
)

private data class VectorRibbonStreamer(
    val originXFrac: Float,
    val originYFrac: Float,
    val angleDeg: Float,
    val lengthFrac: Float,
    val isLooped: Boolean,
    val loopsOrWaves: Float,
    val amplitudeFrac: Float,
    val curveSagFrac: Float,
    val chirality: Float,
    val phaseRad: Float,
    val driftXFrac: Float,
    val driftYFrac: Float,
    val strokeDp: Float,
    val color: Color,
    val startNorm: Float,
    val unfurlEndNorm: Float,
    val retractStartNorm: Float,
    val finishNorm: Float
)

/**
 * High-density, brisk 120 FPS pure vector recreation of Congratulations.gif lasting 5s.
 * Renders rich multi-wave bursts of curly looped ribbons, wavy serpentine streamers,
 * crisp 5-point stars, 4-point sparkles, and 3D-tumbling confetti chips as a full-screen
 * backgroundless overlay.
 */
@Composable
fun HighResCongratulationsOverlay(
    visible: Boolean,
    durationMillis: Int = 5000,
    modifier: Modifier = Modifier
) {
    var progress by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(visible, durationMillis) {
        if (!visible) {
            progress = 0f
            return@LaunchedEffect
        }
        progress = 0f
        val durationNs = durationMillis.toLong() * 1_000_000L
        val startNs = withFrameNanos { it }
        while (progress < 1f) {
            val nowNs = withFrameNanos { it }
            val elapsed = (nowNs - startNs).coerceAtLeast(0L)
            progress = (elapsed.toFloat() / durationNs.toFloat()).coerceIn(0f, 1f)
        }
    }

    val ribbons = remember { buildDenseSignatureRibbons() }
    val particles = remember { buildDenseSignatureParticles() }
    val reusablePath = remember { Path() }
    val reusableSegment = remember { Path() }
    val reusableMeasure = remember { PathMeasure() }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(70)),
        exit = fadeOut(tween(240)),
        modifier = modifier.fillMaxSize()
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val scaleRef = min(w, h)
            val t = progress

            // 1. Dense Unfurling Curly Loops & Wavy Serpentine Streamers (36 ribbons across 3 brisk waves)
            ribbons.forEach { r ->
                if (t <= r.startNorm || t >= r.finishNorm) return@forEach

                val headT = ((t - r.startNorm) / (r.unfurlEndNorm - r.startNorm)).coerceIn(0f, 1f)
                // Snappier unfurl curve for livelier motion
                val endTrim = 1f - (1f - headT).pow(3.6f)

                val tailT = if (t <= r.retractStartNorm) {
                    0f
                } else {
                    ((t - r.retractStartNorm) / (r.finishNorm - r.retractStartNorm)).coerceIn(0f, 1f)
                }
                val startTrim = easeInOutCubic(tailT)
                if (endTrim - startTrim <= 0.008f) return@forEach

                val lifeT = ((t - r.startNorm) / (r.finishNorm - r.startNorm)).coerceIn(0f, 1f)
                val fadeAlpha = when {
                    lifeT < 0.05f -> lifeT / 0.05f
                    lifeT > 0.85f -> ((1f - lifeT) / 0.15f).coerceIn(0f, 1f)
                    else -> 1f
                }

                val ox = w * r.originXFrac + w * r.driftXFrac * easeOutQuad(lifeT)
                val oy = h * r.originYFrac + scaleRef * r.driftYFrac * lifeT.pow(1.35f)
                val lenPx = scaleRef * r.lengthFrac
                val ampPx = scaleRef * r.amplitudeFrac
                val sagPx = scaleRef * r.curveSagFrac
                val rad = r.angleDeg * (PI.toFloat() / 180f)
                val cosA = cos(rad)
                val sinA = sin(rad)

                buildSmoothRibbonPath(
                    outPath = reusablePath,
                    ox = ox,
                    oy = oy,
                    cosA = cosA,
                    sinA = sinA,
                    lenPx = lenPx,
                    ampPx = ampPx,
                    sagPx = sagPx,
                    isLooped = r.isLooped,
                    loopsOrWaves = r.loopsOrWaves,
                    chirality = r.chirality,
                    phaseRad = r.phaseRad + lifeT * 0.95f
                )

                reusableSegment.reset()
                reusableMeasure.setPath(reusablePath, false)
                val totalLen = reusableMeasure.length
                if (totalLen > 1f) {
                    reusableMeasure.getSegment(
                        startDistance = totalLen * startTrim,
                        stopDistance = totalLen * endTrim,
                        destination = reusableSegment,
                        startWithMoveTo = true
                    )
                    drawPath(
                        path = reusableSegment,
                        color = r.color.copy(alpha = fadeAlpha),
                        style = Stroke(
                            width = r.strokeDp.dp.toPx(),
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round
                        )
                    )
                }
            }

            // 2. Dense Stars, Sparkles & 3D-Flipping Confetti Chips (~144 particles across 3 brisk waves)
            particles.forEach { p ->
                if (t < p.startNorm || t >= p.endNorm) return@forEach
                val localT = ((t - p.startNorm) / (p.endNorm - p.startNorm)).coerceIn(0f, 1f)

                // Brisker explosive pop + livelier downward drift & flutter
                val burstEase = 1f - (1f - localT).pow(5.2f)
                val rad = p.angleDeg * (PI.toFloat() / 180f)
                val dist = scaleRef * p.reachFrac * burstEase
                val gravityY = scaleRef * p.gravityFrac * localT.pow(1.50f)
                val swayX = p.swayAmpDp.dp.toPx() * sin(localT * p.swayFreq * 2f * PI.toFloat()) * localT

                val px = w * p.originXFrac + cos(rad) * dist + swayX
                val py = h * p.originYFrac + sin(rad) * dist + gravityY

                val popScale = when {
                    localT < 0.08f -> easeOutBack(localT / 0.08f)
                    localT > 0.74f -> ((1f - localT) / 0.26f).coerceIn(0f, 1f)
                    else -> 1f
                }
                val alpha = if (localT > 0.78f) ((1f - localT) / 0.22f).coerceIn(0f, 1f) else 1f
                if (popScale <= 0.02f || alpha <= 0.01f) return@forEach

                val baseRadius = (p.sizeDp.dp.toPx() * 0.5f) * popScale
                val rot = p.spinDeg * easeOutQuad(localT)
                val flipScaleX = abs(cos(localT * p.flipSpeed * PI.toFloat())).coerceAtLeast(0.22f)

                withTransform({
                    translate(left = px, top = py)
                    rotate(degrees = rot, pivot = Offset.Zero)
                    if (p.shape == ConfettiShapeKind.CHIP_RECT) {
                        scale(scaleX = flipScaleX, scaleY = 1f, pivot = Offset.Zero)
                    }
                }) {
                    val drawColor = p.color.copy(alpha = alpha)
                    when (p.shape) {
                        ConfettiShapeKind.STAR_5 -> drawFivePointStar(reusablePath, baseRadius, drawColor)
                        ConfettiShapeKind.SPARKLE_4 -> drawFourPointSparkle(reusablePath, baseRadius, drawColor)
                        ConfettiShapeKind.CHIP_RECT -> {
                            val rw = baseRadius * 1.65f
                            val rh = baseRadius * 1.05f
                            drawRoundRect(
                                color = drawColor,
                                topLeft = Offset(-rw, -rh),
                                size = Size(rw * 2f, rh * 2f),
                                cornerRadius = CornerRadius(baseRadius * 0.35f)
                            )
                        }
                        ConfettiShapeKind.DOT -> {
                            drawCircle(
                                color = drawColor,
                                radius = baseRadius * 0.74f,
                                center = Offset.Zero
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun buildSmoothRibbonPath(
    outPath: Path,
    ox: Float,
    oy: Float,
    cosA: Float,
    sinA: Float,
    lenPx: Float,
    ampPx: Float,
    sagPx: Float,
    isLooped: Boolean,
    loopsOrWaves: Float,
    chirality: Float,
    phaseRad: Float
) {
    outPath.reset()
    val steps = 64
    var prevX = 0f
    var prevY = 0f

    for (i in 0..steps) {
        val u = i.toFloat() / steps.toFloat()
        val lx: Float
        val ly: Float
        if (isLooped) {
            val theta = u * 2f * PI.toFloat() * loopsOrWaves + phaseRad
            val env = sin(u * PI.toFloat()).pow(0.45f)
            lx = lenPx * u - ampPx * env * sin(theta)
            ly = sagPx * sin(u * PI.toFloat()) + ampPx * env * (1f - cos(theta)) * chirality
        } else {
            val theta = u * 2f * PI.toFloat() * loopsOrWaves + phaseRad
            val env = sin(u * PI.toFloat()).pow(0.35f)
            lx = lenPx * u
            ly = sagPx * u * u + ampPx * env * sin(theta) * chirality
        }

        val wx = ox + lx * cosA - ly * sinA
        val wy = oy + lx * sinA + ly * cosA

        if (i == 0) {
            outPath.moveTo(wx, wy)
        } else {
            val midX = (prevX + wx) * 0.5f
            val midY = (prevY + wy) * 0.5f
            outPath.quadraticTo(prevX, prevY, midX, midY)
        }
        prevX = wx
        prevY = wy
    }
    outPath.lineTo(prevX, prevY)
}

private fun DrawScope.drawFivePointStar(path: Path, outerRadius: Float, color: Color) {
    path.reset()
    val innerRadius = outerRadius * 0.48f
    for (i in 0 until 10) {
        val r = if (i % 2 == 0) outerRadius else innerRadius
        val angle = -PI.toFloat() / 2f + i * (PI.toFloat() / 5f)
        val x = cos(angle) * r
        val y = sin(angle) * r
        if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
    }
    path.close()
    drawPath(path = path, color = color)
    drawPath(
        path = path,
        color = color,
        style = Stroke(width = outerRadius * 0.22f, join = StrokeJoin.Round, cap = StrokeCap.Round)
    )
}

private fun DrawScope.drawFourPointSparkle(path: Path, outerRadius: Float, color: Color) {
    path.reset()
    val inner = outerRadius * 0.30f
    for (i in 0 until 8) {
        val r = if (i % 2 == 0) outerRadius else inner
        val angle = i * (PI.toFloat() / 4f)
        val x = cos(angle) * r
        val y = sin(angle) * r
        if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
    }
    path.close()
    drawPath(path = path, color = color)
}

private fun easeOutQuad(x: Float): Float = 1f - (1f - x) * (1f - x)

private fun easeInOutCubic(x: Float): Float =
    if (x < 0.5f) 4f * x * x * x else 1f - (-2f * x + 2f).pow(3f) / 2f

private fun easeOutBack(x: Float): Float {
    val c1 = 1.70158f
    val c3 = c1 + 1f
    return 1f + c3 * (x - 1f).pow(3f) + c1 * (x - 1f).pow(2f)
}

private data class RibbonHub(
    val ox: Float,
    val oy: Float,
    val waveStart: Float,
    val waveDuration: Float
)

private fun buildDenseSignatureRibbons(): List<VectorRibbonStreamer> {
    // 3 brisk overlapping celebratory waves spanning the full 5.0s duration (0.00 -> 1.00)
    val hubs = listOf(
        // Wave 1 (0.00s -> 2.55s): Central & flanking pop
        RibbonHub(0.50f, 0.46f, 0.01f, 0.48f),
        RibbonHub(0.28f, 0.44f, 0.04f, 0.48f),
        RibbonHub(0.72f, 0.44f, 0.05f, 0.48f),
        // Wave 2 (0.85s -> 3.80s): Upper-wide festive burst
        RibbonHub(0.38f, 0.36f, 0.17f, 0.50f),
        RibbonHub(0.62f, 0.36f, 0.19f, 0.50f),
        RibbonHub(0.18f, 0.50f, 0.22f, 0.50f),
        RibbonHub(0.82f, 0.50f, 0.23f, 0.50f),
        // Wave 3 (1.75s -> 5.00s): Grand finale canopy
        RibbonHub(0.50f, 0.32f, 0.35f, 0.56f),
        RibbonHub(0.26f, 0.38f, 0.38f, 0.56f),
        RibbonHub(0.74f, 0.38f, 0.40f, 0.56f)
    )

    // 4 ribbons per hub = 40 crisp looped & serpentine streamers!
    val localAngles = listOf(-142f, -104f, -52f, 22f)
    val list = ArrayList<VectorRibbonStreamer>(hubs.size * localAngles.size)

    hubs.forEachIndexed { hIdx, hub ->
        localAngles.forEachIndexed { aIdx, baseAngle ->
            val idx = hIdx * localAngles.size + aIdx
            val isLooped = idx % 2 == 0
            val angleJitter = ((idx * 13) % 18) - 9f
            val angle = baseAngle + angleJitter + (if (aIdx == 3 && idx % 3 == 0) 128f else 0f)
            val start = (hub.waveStart + aIdx * 0.016f).coerceAtMost(0.62f)
            val finish = (start + hub.waveDuration).coerceAtMost(0.995f)
            val span = finish - start
            val dirSign = if (cos(angle * (PI.toFloat() / 180f)) >= 0f) 1f else -1f

            list += VectorRibbonStreamer(
                originXFrac = (hub.ox + ((aIdx - 1.5f) * 0.025f)).coerceIn(0.10f, 0.90f),
                originYFrac = (hub.oy + ((aIdx % 2) * 0.025f)).coerceIn(0.22f, 0.65f),
                angleDeg = angle,
                lengthFrac = if (isLooped) 0.24f + (idx % 3) * 0.032f else 0.21f + (idx % 3) * 0.028f,
                isLooped = isLooped,
                loopsOrWaves = if (isLooped) 1.30f + (idx % 3) * 0.45f else 2.6f + (idx % 3) * 0.45f,
                amplitudeFrac = if (isLooped) 0.048f + (idx % 3) * 0.010f else 0.021f + (idx % 3) * 0.004f,
                curveSagFrac = 0.022f + (idx % 2) * 0.014f,
                chirality = if (idx % 2 == 0) 1f else -1f,
                phaseRad = (idx * 0.47f) % (2f * PI.toFloat()),
                driftXFrac = dirSign * (0.035f + (idx % 3) * 0.012f),
                driftYFrac = 0.17f + (idx % 3) * 0.03f,
                strokeDp = 3.8f + (idx % 3) * 0.45f,
                color = CelebrationPalette[idx % CelebrationPalette.size],
                startNorm = start,
                unfurlEndNorm = start + span * 0.36f,
                retractStartNorm = start + span * 0.26f,
                finishNorm = finish
            )
        }
    }

    return list
}

private fun buildDenseSignatureParticles(): List<VectorBurstParticle> {
    // Rich mix weighted heavily toward crisp small 5-point stars, 4-point sparkles & 3D chips
    val shapes = listOf(
        ConfettiShapeKind.STAR_5,
        ConfettiShapeKind.STAR_5,
        ConfettiShapeKind.SPARKLE_4,
        ConfettiShapeKind.CHIP_RECT,
        ConfettiShapeKind.STAR_5,
        ConfettiShapeKind.SPARKLE_4,
        ConfettiShapeKind.CHIP_RECT,
        ConfettiShapeKind.DOT
    )

    val emitters = listOf(
        // Wave 1 (fast initial burst)
        Triple(0.50f, 0.46f, 0.00f to 0.50f),
        Triple(0.28f, 0.44f, 0.03f to 0.52f),
        Triple(0.72f, 0.44f, 0.04f to 0.53f),
        // Wave 2 (mid celebration)
        Triple(0.38f, 0.36f, 0.16f to 0.68f),
        Triple(0.62f, 0.36f, 0.18f to 0.70f),
        Triple(0.20f, 0.48f, 0.21f to 0.74f),
        Triple(0.80f, 0.48f, 0.22f to 0.75f),
        // Wave 3 (finale)
        Triple(0.50f, 0.33f, 0.34f to 0.96f),
        Triple(0.26f, 0.38f, 0.37f to 0.98f),
        Triple(0.74f, 0.38f, 0.39f to 1.00f)
    )

    // 15 particles per emitter = 150 stars, sparkles & tumbling confetti chips!
    val baseAngles = listOf(
        -170f, -152f, -135f, -118f, -101f, -85f, -68f, -51f, -34f, -17f,
        155f, 138f, 42f, 22f, -92f
    )

    val list = ArrayList<VectorBurstParticle>(emitters.size * baseAngles.size)

    emitters.forEachIndexed { eIdx, (ox, oy, window) ->
        val (wStart, wEnd) = window
        baseAngles.forEachIndexed { aIdx, baseAngle ->
            val idx = eIdx * baseAngles.size + aIdx
            val shape = shapes[idx % shapes.size]
            val isPetite = idx % 3 != 0
            val sizeDp = when (shape) {
                ConfettiShapeKind.STAR_5 -> if (isPetite) 11.5f + (idx % 3) * 2.2f else 17.5f + (idx % 2) * 3f
                ConfettiShapeKind.SPARKLE_4 -> if (isPetite) 9.5f + (idx % 3) * 2f else 14.5f + (idx % 2) * 2.5f
                ConfettiShapeKind.CHIP_RECT -> 9.5f + (idx % 3) * 2.0f
                ConfettiShapeKind.DOT -> 6.5f + (idx % 3) * 1.8f
            }
            val start = (wStart + (aIdx % 4) * 0.012f).coerceAtMost(0.68f)
            val end = (wEnd - ((idx % 3) * 0.02f)).coerceIn(start + 0.30f, 1.0f)

            list += VectorBurstParticle(
                originXFrac = (ox + ((aIdx % 5) - 2) * 0.011f).coerceIn(0.08f, 0.92f),
                originYFrac = (oy + ((aIdx % 3) - 1) * 0.010f).coerceIn(0.18f, 0.72f),
                angleDeg = baseAngle + (((idx * 17) % 12) - 6f),
                reachFrac = 0.22f + ((idx * 23) % 11) * 0.024f,
                gravityFrac = 0.21f + (idx % 4) * 0.038f,
                swayAmpDp = 10f + (idx % 4) * 3.8f,
                swayFreq = 1.6f + (idx % 3) * 0.55f,
                sizeDp = sizeDp,
                color = CelebrationPalette[idx % CelebrationPalette.size],
                shape = shape,
                startNorm = start,
                endNorm = end,
                spinDeg = if (idx % 2 == 0) 360f + (idx % 5) * 45f else -340f - (idx % 5) * 40f,
                flipSpeed = 3.6f + (idx % 4) * 0.95f
            )
        }
    }

    return list
}

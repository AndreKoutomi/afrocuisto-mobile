package com.afrocuisto.app.ui.screens.splash

import android.app.Activity
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.core.view.WindowCompat
import com.afrocuisto.app.R
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val MontserratBlack = FontFamily(
    Font(R.font.montserrat_black, FontWeight.Black)
)

/**
 * Exact FigCraft Splash Screen implementation (`figcraft://node/17179869294` on 1210x2588):
 * - Full-bleed culinary photography (`img_splash_bg`)
 * - Vertical gradient scrim fading seamlessly into pure `#000000` at 76.44% height
 * - Rounded `ic_afrocuisto_logo` (255/1210 width, 72.15/255 corner radius)
 * - "Afrocuisto" wordmark in Montserrat Black `#FFFFFF`
 * - Smoothly spinning 270° rounded-cap white circular loader anchored cleanly above bottom edge
 */
@Composable
fun SplashScreen(
    onFinished: () -> Unit
) {
    val view = LocalView.current

    // Light system bar icons over the dark top photography & pure black bottom
    SideEffect {
        val window = (view.context as? Activity)?.window
        val insetsController = window?.let { WindowCompat.getInsetsController(it, view) }
        insetsController?.isAppearanceLightStatusBars = false
        insetsController?.isAppearanceLightNavigationBars = false
    }

    val contentAlpha = remember { Animatable(1f) }
    val logoScale = remember { Animatable(0.96f) }

    LaunchedEffect(Unit) {
        launch {
            logoScale.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 380, easing = FastOutSlowInEasing)
            )
        }
        delay(7000L)
        onFinished()
    }

    val infiniteTransition = rememberInfiniteTransition(label = "splashSpinnerTransition")
    val spinnerAngle = infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 920, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "splashSpinnerAngle"
    )

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        val effectiveWidth = if (maxWidth >= 600.dp) 440.dp else maxWidth
        val widthUnit = effectiveWidth / 1210f
        val logoSize = widthUnit * 255f
        val logoCorner = logoSize * (72.14677f / 255f)
        val gapLogoToWordmark = widthUnit * 43f
        val gapWordmarkToSpinner = widthUnit * 65f
        val spinnerSize = widthUnit * 66.84f
        val spinnerStroke = widthUnit * 11.6667f
        val bottomMargin = if (maxWidth >= 600.dp) {
            (maxHeight * 0.10f).coerceIn(52.dp, 110.dp)
        } else {
            maxHeight * (299.16f / 2588f)
        }
        val wordmarkFontSize = with(LocalDensity.current) { (widthUnit * 72f).toSp() }

        // 1. Full-bleed Culinary Photography
        Image(
            painter = painterResource(id = R.drawable.bg_auth_splash),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )

        // 2. Exact FigCraft Linear Gradient Overlay (Transparent 0% -> #000000 at 76.44% -> #000000 100%)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0.0f to Color.Transparent,
                        0.7644f to Color.Black,
                        1.0f to Color.Black
                    )
                )
        )

        // 3. Bottom-Anchored Centered Brand Identity Stack (Logo + Montserrat Black Wordmark + 270° Spinner)
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = bottomMargin)
                .graphicsLayer {
                    alpha = contentAlpha.value
                },
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Image(
                painter = painterResource(id = R.drawable.ic_afrocuisto_logo),
                contentDescription = "Afrocuisto",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(logoSize)
                    .graphicsLayer {
                        scaleX = logoScale.value
                        scaleY = logoScale.value
                    }
                    .clip(RoundedCornerShape(logoCorner))
            )

            Spacer(modifier = Modifier.height(gapLogoToWordmark))

            Text(
                text = "Afrocuisto",
                style = TextStyle(
                    fontFamily = MontserratBlack,
                    fontWeight = FontWeight.Black,
                    fontSize = wordmarkFontSize,
                    color = Color.White,
                    textAlign = TextAlign.Center
                ),
                maxLines = 1,
                softWrap = false
            )

            Spacer(modifier = Modifier.height(gapWordmarkToSpinner))

            val density = LocalDensity.current
            val spinnerStrokePx = remember(spinnerStroke, density) {
                with(density) { spinnerStroke.toPx() }
            }
            val spinnerStyle = remember(spinnerStrokePx) {
                Stroke(width = spinnerStrokePx, cap = StrokeCap.Round)
            }

            Canvas(
                modifier = Modifier
                    .size(spinnerSize)
                    .graphicsLayer {
                        rotationZ = spinnerAngle.value
                    }
            ) {
                drawArc(
                    color = Color.White,
                    startAngle = -90f,
                    sweepAngle = 270f,
                    useCenter = false,
                    style = spinnerStyle
                )
            }
        }
    }
}

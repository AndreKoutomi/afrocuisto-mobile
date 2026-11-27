package com.afrocuisto.app.ui.screens.auth

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.view.WindowManager
import androidx.annotation.DrawableRes
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import com.afrocuisto.app.R
import com.afrocuisto.app.data.repository.PasswordCriteria
import com.afrocuisto.app.data.repository.PasswordStrength
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.theme.AccentEmerald
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.AfroOrangeLight
import com.afrocuisto.app.ui.theme.ExpressivePillShape
import com.afrocuisto.app.ui.theme.LikeRed
import com.afrocuisto.app.ui.theme.NexaFontFamily
import com.afrocuisto.app.ui.theme.StarGold
import com.afrocuisto.app.ui.theme.isAfroDarkTheme

private val AuthMontserratBlack = FontFamily(
    Font(R.font.montserrat_black, FontWeight.Black)
)

private tailrec fun Context.findAuthActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findAuthActivity()
    else -> null
}

/**
 * Protects credential screens with `FLAG_SECURE` to block screenshots, screen recording,
 * and Recents app-switcher snapshots while passwords are being entered.
 */
@Composable
fun AuthScreenSecurityEffect() {
    val view = LocalView.current
    DisposableEffect(view) {
        val window = view.context.findAuthActivity()?.window
        val hadSecureFlag = window != null &&
            (window.attributes.flags and WindowManager.LayoutParams.FLAG_SECURE) != 0
        window?.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        onDispose {
            if (!hadSecureFlag) {
                window?.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
            }
        }
    }
}

data class AuthPalette(
    val canvas: Color,
    val card: Color,
    val inputSurface: Color,
    val subtleSurface: Color,
    val border: Color,
    val title: Color,
    val body: Color,
    val muted: Color,
    val placeholder: Color
)

@Composable
fun rememberAuthPalette(isDark: Boolean): AuthPalette {
    // Always honours the SplashScreen's pure #000000 black canvas & seamless obsidian surfaces
    return remember(isDark) {
        AuthPalette(
            canvas = Color.Black,
            card = Color(0xFF0E0E11),
            inputSurface = Color(0xFF17171C),
            subtleSurface = Color(0xFF1F1F26),
            border = Color(0xFF2B2B34),
            title = Color.White,
            body = Color(0xFFD4D4D8),
            muted = Color(0xFF9CA3AF),
            placeholder = Color(0xFF6B7280)
        )
    }
}

@Composable
fun AuthTopControlsBar(
    canNavigateBack: Boolean,
    onBack: () -> Unit,
    stepBadge: String? = null,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .padding(horizontal = 18.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (canNavigateBack) {
            Surface(
                shape = CircleShape,
                color = Color.Black.copy(alpha = 0.68f),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.24f)),
                modifier = Modifier
                    .size(40.dp)
                    .afroSpringClickable(
                        pressedScale = 0.88f,
                        haptic = AfroHapticKind.NAVIGATION,
                        onClick = onBack
                    )
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_arrow_left_linear),
                        contentDescription = "Retour",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        } else {
            Spacer(modifier = Modifier.width(40.dp))
        }

        if (stepBadge != null) {
            Surface(
                shape = ExpressivePillShape,
                color = Color.Black.copy(alpha = 0.68f),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.24f))
            ) {
                Text(
                    text = stepBadge,
                    color = Color.White,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }
        }
    }
}

@Composable
fun AuthFixedBackground(
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(276.dp)
        ) {
            Image(
                painter = painterResource(id = R.drawable.bg_auth_splash),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            0.0f to Color.Black.copy(alpha = 0.42f),
                            0.42f to Color.Black.copy(alpha = 0.50f),
                            0.82f to Color.Black.copy(alpha = 0.96f),
                            1.0f to Color.Black
                        )
                    )
            )
        }
    }
}

@Composable
fun AuthHeroHeader(
    palette: AuthPalette,
    canNavigateBack: Boolean,
    onBack: () -> Unit,
    stepBadge: String? = null,
    showTopControls: Boolean = true,
    showBackground: Boolean = true
) {
    val view = LocalView.current
    SideEffect {
        val window = view.context.findAuthActivity()?.window
        val controller = window?.let { WindowCompat.getInsetsController(it, view) }
        controller?.isAppearanceLightStatusBars = false
        controller?.isAppearanceLightNavigationBars = false
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(228.dp)
            .background(if (showBackground) Color.Black else Color.Transparent)
    ) {
        if (showBackground) {
            Image(
                painter = painterResource(id = R.drawable.bg_auth_splash),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            0.0f to Color.Black.copy(alpha = 0.42f),
                            0.42f to Color.Black.copy(alpha = 0.45f),
                            0.80f to Color.Black.copy(alpha = 0.94f),
                            1.0f to Color.Black
                        )
                    )
            )
        }

        if (showTopControls) {
            AuthTopControlsBar(
                canNavigateBack = canNavigateBack,
                onBack = onBack,
                stepBadge = stepBadge
            )
        }

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 22.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color.Black,
                border = BorderStroke(1.5.dp, Color.White.copy(alpha = 0.24f)),
                shadowElevation = 8.dp,
                modifier = Modifier.size(54.dp)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.ic_afrocuisto_logo),
                    contentDescription = "AfroCuisto",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Afrocuisto",
                    style = TextStyle(
                        fontFamily = AuthMontserratBlack,
                        fontWeight = FontWeight.Black,
                        fontSize = 22.sp,
                        color = Color.White,
                        letterSpacing = (-0.3).sp
                    )
                )
                Text(
                    text = "Saveurs d'Afrique & Chef IA",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = palette.muted
                )
            }
        }
    }
}

@Composable
fun AfroAuthTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    palette: AuthPalette,
    modifier: Modifier = Modifier,
    @DrawableRes leadingIconRes: Int? = null,
    isPassword: Boolean = false,
    isValid: Boolean = false,
    errorText: String? = null,
    onFocusLost: (() -> Unit)? = null,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    trailingContent: (@Composable () -> Unit)? = null
) {
    var isFocused by remember { mutableStateOf(false) }
    var hadFocus by remember { mutableStateOf(false) }
    var passwordVisible by remember { mutableStateOf(false) }

    val hasError = !errorText.isNullOrBlank()
    val borderColor by animateColorAsState(
        targetValue = when {
            hasError -> LikeRed
            isFocused -> AfroOrange
            isValid -> AccentEmerald.copy(alpha = 0.72f)
            else -> palette.border
        },
        animationSpec = tween(180),
        label = "authFieldBorder"
    )
    val iconTint by animateColorAsState(
        targetValue = when {
            hasError -> LikeRed
            isFocused -> AfroOrange
            isValid -> AccentEmerald
            else -> palette.muted
        },
        animationSpec = tween(180),
        label = "authFieldIconTint"
    )

    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label,
            fontSize = 12.5.sp,
            fontWeight = FontWeight.Bold,
            color = palette.title,
            modifier = Modifier.padding(start = 4.dp, bottom = 6.dp)
        )

        Surface(
            shape = RoundedCornerShape(28.dp),
            color = palette.inputSurface,
            border = BorderStroke(if (isFocused || hasError) 1.4.dp else 1.dp, borderColor),
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (leadingIconRes != null) {
                    Icon(
                        painter = painterResource(id = leadingIconRes),
                        contentDescription = null,
                        tint = iconTint,
                        modifier = Modifier.size(19.dp)
                    )
                    Spacer(modifier = Modifier.width(11.dp))
                }

                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.CenterStart
                ) {
                    if (value.isEmpty()) {
                        Text(
                            text = placeholder,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = palette.placeholder,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    BasicTextField(
                        value = value,
                        onValueChange = onValueChange,
                        singleLine = true,
                        textStyle = TextStyle(
                            fontFamily = NexaFontFamily,
                            fontSize = 14.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = palette.title
                        ),
                        cursorBrush = SolidColor(AfroOrange),
                        visualTransformation = if (isPassword && !passwordVisible) {
                            PasswordVisualTransformation()
                        } else {
                            VisualTransformation.None
                        },
                        keyboardOptions = keyboardOptions,
                        keyboardActions = keyboardActions,
                        modifier = Modifier
                            .fillMaxWidth()
                            .onFocusChanged { focusState ->
                                if (focusState.isFocused) {
                                    hadFocus = true
                                } else if (hadFocus && isFocused) {
                                    onFocusLost?.invoke()
                                }
                                isFocused = focusState.isFocused
                            }
                    )
                }

                if (isValid && !hasError) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_check_circle_linear),
                        contentDescription = "Format valide",
                        tint = AccentEmerald,
                        modifier = Modifier
                            .padding(end = if (isPassword) 4.dp else 0.dp)
                            .size(18.dp)
                    )
                }

                if (isPassword) {
                    IconButton(
                        onClick = { passwordVisible = !passwordVisible },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            painter = painterResource(
                                id = if (passwordVisible) {
                                    R.drawable.ic_solar_eye_closed_linear
                                } else {
                                    R.drawable.ic_solar_eye_linear
                                }
                            ),
                            contentDescription = if (passwordVisible) {
                                "Masquer le mot de passe"
                            } else {
                                "Afficher le mot de passe"
                            },
                            tint = palette.muted,
                            modifier = Modifier.size(19.dp)
                        )
                    }
                } else if (trailingContent != null) {
                    trailingContent()
                }
            }
        }

        AnimatedVisibility(
            visible = hasError,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            Row(
                modifier = Modifier.padding(start = 6.dp, top = 5.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_solar_danger_circle_linear),
                    contentDescription = null,
                    tint = LikeRed,
                    modifier = Modifier.size(14.dp)
                )
                Text(
                    text = errorText.orEmpty(),
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = LikeRed
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun PasswordStrengthIndicator(
    strength: PasswordStrength,
    criteria: PasswordCriteria,
    palette: AuthPalette
) {
    AnimatedVisibility(
        visible = strength != PasswordStrength.EMPTY,
        enter = expandVertically() + fadeIn(),
        exit = shrinkVertically() + fadeOut()
    ) {
        val activeColor by animateColorAsState(
            targetValue = when (strength) {
                PasswordStrength.WEAK -> LikeRed
                PasswordStrength.MEDIUM -> StarGold
                PasswordStrength.STRONG -> AccentEmerald
                PasswordStrength.EMPTY -> palette.border
            },
            animationSpec = tween(220),
            label = "passwordStrengthColor"
        )

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp, start = 4.dp, end = 4.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                repeat(3) { index ->
                    val filled = index < strength.level
                    val barColor by animateColorAsState(
                        targetValue = if (filled) activeColor else palette.subtleSurface,
                        animationSpec = tween(220),
                        label = "strengthBar$index"
                    )
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(4.dp)
                            .clip(CircleShape)
                            .background(barColor)
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Protection : ${strength.label}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = activeColor
                )
                if (!criteria.isNotCommon) {
                    Text(
                        text = "Évitez nom / mot courant",
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = LikeRed
                    )
                }
            }

            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                SecurityCriterionPill("8+ car.", criteria.hasMinLength, palette)
                SecurityCriterionPill("Maj. & min.", criteria.hasUpperAndLower, palette)
                SecurityCriterionPill("1 chiffre", criteria.hasDigit, palette)
                SecurityCriterionPill("1 symbole", criteria.hasSpecialChar, palette)
            }
        }
    }
}

@Composable
private fun SecurityCriterionPill(
    label: String,
    met: Boolean,
    palette: AuthPalette
) {
    Surface(
        shape = RoundedCornerShape(28.dp),
        color = if (met) AccentEmerald.copy(alpha = 0.14f) else palette.subtleSurface,
        border = BorderStroke(1.dp, if (met) AccentEmerald.copy(alpha = 0.45f) else palette.border)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                painter = painterResource(id = R.drawable.ic_solar_check_linear),
                contentDescription = null,
                tint = if (met) AccentEmerald else palette.muted,
                modifier = Modifier.size(11.dp)
            )
            Text(
                text = label,
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Bold,
                color = if (met) AccentEmerald else palette.muted
            )
        }
    }
}

@Composable
fun AuthFeedbackBanner(
    message: String?,
    isError: Boolean,
    palette: AuthPalette
) {
    AnimatedVisibility(
        visible = !message.isNullOrBlank(),
        enter = expandVertically() + fadeIn(),
        exit = shrinkVertically() + fadeOut()
    ) {
        val accent = if (isError) LikeRed else AccentEmerald
        Surface(
            shape = RoundedCornerShape(28.dp),
            color = accent.copy(alpha = 0.11f),
            border = BorderStroke(1.dp, accent.copy(alpha = 0.38f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    painter = painterResource(
                        id = if (isError) {
                            R.drawable.ic_solar_danger_circle_linear
                        } else {
                            R.drawable.ic_solar_check_circle_linear
                        }
                    ),
                    contentDescription = null,
                    tint = accent,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = message.orEmpty(),
                    fontSize = 12.5.sp,
                    lineHeight = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = palette.title
                )
            }
        }
    }
}

@Composable
fun AfroAuthPrimaryButton(
    text: String,
    isLoading: Boolean,
    enabled: Boolean = true,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val haptics = rememberAfroHaptics()
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed && enabled && !isLoading) 0.97f else 1f,
        animationSpec = spring(
            dampingRatio = if (isPressed) Spring.DampingRatioNoBouncy else 0.6f,
            stiffness = Spring.StiffnessMedium
        ),
        label = "authPrimaryBtnScale"
    )

    Surface(
        shape = RoundedCornerShape(28.dp),
        color = if (enabled) AfroOrange else AfroOrange.copy(alpha = 0.45f),
        shadowElevation = 0.dp,
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .clip(RoundedCornerShape(28.dp))
            .clickable(
                enabled = enabled && !isLoading,
                interactionSource = interactionSource,
                indication = null
            ) {
                haptics.actionSuccess()
                onClick()
            }
    ) {
        Box(contentAlignment = Alignment.Center) {
            AnimatedContent(
                targetState = isLoading,
                transitionSpec = { fadeIn(tween(160)) togetherWith fadeOut(tween(160)) },
                label = "authBtnLoading"
            ) { loading ->
                if (loading) {
                    CircularProgressIndicator(
                        color = Color.White,
                        strokeWidth = 2.5.dp,
                        modifier = Modifier.size(22.dp)
                    )
                } else {
                    Text(
                        text = text,
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.1.sp
                    )
                }
            }
        }
    }
}

@Composable
fun AfroGoogleAuthButton(
    text: String = "Continuer avec Google",
    isLoading: Boolean,
    enabled: Boolean = true,
    palette: AuthPalette,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val haptics = rememberAfroHaptics()
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed && enabled && !isLoading) 0.97f else 1f,
        animationSpec = spring(
            dampingRatio = if (isPressed) Spring.DampingRatioNoBouncy else 0.6f,
            stiffness = Spring.StiffnessMedium
        ),
        label = "googleBtnScale"
    )

    Surface(
        shape = RoundedCornerShape(28.dp),
        color = Color.White,
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.16f)),
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .clip(RoundedCornerShape(28.dp))
            .clickable(
                enabled = enabled && !isLoading,
                interactionSource = interactionSource,
                indication = null
            ) {
                haptics.selectionTick()
                onClick()
            }
    ) {
        Box(contentAlignment = Alignment.Center) {
            AnimatedContent(
                targetState = isLoading,
                transitionSpec = { fadeIn(tween(150)) togetherWith fadeOut(tween(150)) },
                label = "googleBtnLoading"
            ) { loading ->
                if (loading) {
                    CircularProgressIndicator(
                        color = Color(0xFF111111),
                        strokeWidth = 2.3.dp,
                        modifier = Modifier.size(21.dp)
                    )
                } else {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(11.dp)
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_google_logo),
                            contentDescription = "Google",
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            text = text,
                            color = Color(0xFF111111),
                            fontSize = 14.5.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AuthOrDivider(
    palette: AuthPalette,
    label: String = "ou avec e-mail"
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = palette.border
        )
        Text(
            text = label,
            fontSize = 11.5.sp,
            fontWeight = FontWeight.SemiBold,
            color = palette.muted
        )
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = palette.border
        )
    }
}

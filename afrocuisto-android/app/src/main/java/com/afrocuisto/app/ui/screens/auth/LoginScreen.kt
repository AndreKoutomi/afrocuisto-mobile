package com.afrocuisto.app.ui.screens.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.afrocuisto.app.R
import com.afrocuisto.app.data.repository.AuthRepository
import com.afrocuisto.app.data.repository.AuthResult
import com.afrocuisto.app.data.repository.AuthValidation
import com.afrocuisto.app.data.security.GoogleAuthLauncher
import com.afrocuisto.app.data.security.GoogleSignInOutcome
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.afroStaggeredEntrance
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.ExpressivePillShape
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import com.afrocuisto.app.ui.theme.nexaTitleEmphasis
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    authRepository: AuthRepository,
    canNavigateBack: Boolean,
    onBack: () -> Unit,
    onNavigateToRegister: () -> Unit,
    onAuthSuccess: () -> Unit
) {
    // Block screenshots, screen recording & Recents snapshots while entering credentials
    AuthScreenSecurityEffect()

    val isDark = isAfroDarkTheme()
    val palette = rememberAuthPalette(isDark)
    val haptics = rememberAfroHaptics()
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val coroutineScope = rememberCoroutineScope()

    var email by rememberSaveable { mutableStateOf("") }
    // Security: NEVER persist password in SavedStateRegistry / IPC Bundle
    var password by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var bannerMessage by remember { mutableStateOf<String?>(null) }
    var bannerIsError by remember { mutableStateOf(true) }
    var isLoading by remember { mutableStateOf(false) }
    var isGoogleLoading by remember { mutableStateOf(false) }
    var lockoutSeconds by remember { mutableIntStateOf(0) }
    var showForgotPasswordSheet by remember { mutableStateOf(false) }

    fun submitGoogleSignIn() {
        if (isLoading || isGoogleLoading) return
        focusManager.clearFocus()
        bannerMessage = null
        isGoogleLoading = true
        coroutineScope.launch {
            val outcome = GoogleAuthLauncher.signIn(context, authRepository)
            isGoogleLoading = false
            when (outcome) {
                is GoogleSignInOutcome.Authenticated -> {
                    password = ""
                    haptics.actionSuccess()
                    onAuthSuccess()
                }
                GoogleSignInOutcome.RedirectedToBrowser -> {
                    password = ""
                }
                GoogleSignInOutcome.Cancelled -> Unit
                is GoogleSignInOutcome.Failed -> {
                    haptics.destructiveTick()
                    bannerIsError = true
                    bannerMessage = outcome.message
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        lockoutSeconds = authRepository.getRemainingLockoutSeconds()
    }

    LaunchedEffect(lockoutSeconds) {
        if (lockoutSeconds > 0) {
            delay(1000L)
            lockoutSeconds = authRepository.getRemainingLockoutSeconds()
        }
    }

    fun submitLogin() {
        if (lockoutSeconds > 0 || isLoading) return
        focusManager.clearFocus()
        bannerMessage = null
        val cleanEmail = AuthValidation.normalizeEmail(email)
        emailError = if (!AuthValidation.isValidEmail(cleanEmail)) {
            "Adresse e-mail invalide"
        } else {
            null
        }
        passwordError = if (password.isBlank()) {
            "Saisissez votre mot de passe"
        } else {
            null
        }
        if (emailError != null || passwordError != null) {
            haptics.destructiveTick()
            return
        }

        isLoading = true
        coroutineScope.launch {
            val submittedPassword = password
            when (val result = authRepository.signIn(cleanEmail, submittedPassword)) {
                is AuthResult.Success -> {
                    password = ""
                    isLoading = false
                    haptics.actionSuccess()
                    onAuthSuccess()
                }
                is AuthResult.EmailConfirmationRequired -> {
                    password = ""
                    isLoading = false
                    bannerIsError = false
                    bannerMessage = result.message
                }
                is AuthResult.Error -> {
                    isLoading = false
                    lockoutSeconds = authRepository.getRemainingLockoutSeconds()
                    haptics.destructiveTick()
                    bannerIsError = true
                    bannerMessage = result.message
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(palette.canvas)
    ) {
        // Fixed background that never scrolls with the page content
        AuthFixedBackground()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(
                    state = rememberScrollState(),
                    flingBehavior = rememberSmoothFlingBehavior()
                )
                .imePadding()
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            AuthHeroHeader(
                palette = palette,
                canNavigateBack = canNavigateBack,
                onBack = onBack,
                showTopControls = false,
                showBackground = false
            )

            Column(
                modifier = Modifier
                    .widthIn(max = 480.dp)
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp)
                        .afroStaggeredEntrance(index = 0),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Bon retour en cuisine",
                        fontSize = 25.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = (-0.5).sp,
                        textAlign = TextAlign.Center,
                        color = palette.title,
                        modifier = Modifier.nexaTitleEmphasis()
                    )
                }

                Card(
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = palette.card),
                    border = BorderStroke(1.dp, palette.border),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .afroStaggeredEntrance(index = 1)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        val effectiveBanner = if (lockoutSeconds > 0) {
                            "Protection anti-intrusion active. Réessayez dans ${lockoutSeconds}s."
                        } else {
                            bannerMessage
                        }
                        AuthFeedbackBanner(
                            message = effectiveBanner,
                            isError = lockoutSeconds > 0 || bannerIsError,
                            palette = palette
                        )

                        AfroAuthTextField(
                            value = email,
                            onValueChange = {
                                email = it
                                if (emailError != null) emailError = null
                                if (bannerMessage != null) bannerMessage = null
                            },
                            label = "Adresse e-mail",
                            placeholder = "amina@afrocuisto.com",
                            palette = palette,
                            leadingIconRes = R.drawable.ic_solar_letter_linear,
                            errorText = emailError,
                            keyboardOptions = KeyboardOptions(
                                autoCorrectEnabled = false,
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            )
                        )

                        AfroAuthTextField(
                            value = password,
                            onValueChange = {
                                password = it
                                if (passwordError != null) passwordError = null
                                if (bannerMessage != null) bannerMessage = null
                            },
                            label = "Mot de passe",
                            placeholder = "Votre mot de passe",
                            palette = palette,
                            leadingIconRes = R.drawable.ic_solar_lock_password_linear,
                            isPassword = true,
                            errorText = passwordError,
                            keyboardOptions = KeyboardOptions(
                                autoCorrectEnabled = false,
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = { submitLogin() }
                            )
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            Text(
                                text = "Mot de passe oublié ?",
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = AfroOrange,
                                modifier = Modifier
                                    .clip(ExpressivePillShape)
                                    .afroSpringClickable(
                                        pressedScale = 0.94f,
                                        haptic = AfroHapticKind.SELECTION
                                    ) {
                                        showForgotPasswordSheet = true
                                    }
                                    .padding(horizontal = 6.dp, vertical = 4.dp)
                            )
                        }

                        AfroAuthPrimaryButton(
                            text = if (lockoutSeconds > 0) "Verrouillé (${lockoutSeconds}s)" else "Se connecter",
                            isLoading = isLoading,
                            enabled = lockoutSeconds == 0,
                            onClick = ::submitLogin
                        )
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 26.dp)
                        .afroStaggeredEntrance(index = 2),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    AuthOrDivider(palette = palette, label = "ou continuer avec")

                    AfroGoogleAuthButton(
                        text = "Continuer avec Google",
                        isLoading = isGoogleLoading,
                        enabled = !isLoading,
                        palette = palette,
                        onClick = ::submitGoogleSignIn
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        HorizontalDivider(
                            modifier = Modifier.weight(1f),
                            color = palette.border
                        )
                        Text(
                            text = "Nouveau sur AfroCuisto ?",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = palette.muted
                        )
                        HorizontalDivider(
                            modifier = Modifier.weight(1f),
                            color = palette.border
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(28.dp),
                        color = palette.card,
                        border = BorderStroke(1.dp, palette.border),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                            .afroSpringClickable(
                                pressedScale = 0.97f,
                                haptic = AfroHapticKind.NAVIGATION,
                                onClick = onNavigateToRegister
                            )
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = "Créer un compte",
                                fontSize = 14.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = palette.title
                            )
                        }
                    }
                }
            }
        }

        AuthTopControlsBar(
            canNavigateBack = canNavigateBack,
            onBack = onBack,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }

    if (showForgotPasswordSheet) {
        ForgotPasswordBottomSheet(
            initialEmail = email,
            palette = palette,
            authRepository = authRepository,
            onDismiss = { showForgotPasswordSheet = false }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ForgotPasswordBottomSheet(
    initialEmail: String,
    palette: AuthPalette,
    authRepository: AuthRepository,
    onDismiss: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val haptics = rememberAfroHaptics()
    var resetEmail by rememberSaveable { mutableStateOf(initialEmail) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var feedbackMessage by remember { mutableStateOf<String?>(null) }
    var feedbackIsError by remember { mutableStateOf(false) }
    var isSending by remember { mutableStateOf(false) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        containerColor = palette.card,
        scrimColor = Color.Black.copy(alpha = 0.72f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .imePadding()
                .padding(horizontal = 22.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                text = "Réinitialiser le mot de passe",
                fontSize = 19.sp,
                fontWeight = FontWeight.ExtraBold,
                color = palette.title,
                modifier = Modifier.nexaTitleEmphasis()
            )
            Text(
                text = "Saisissez l'adresse e-mail associée à votre compte AfroCuisto pour recevoir un lien sécurisé de réinitialisation.",
                fontSize = 13.sp,
                lineHeight = 18.sp,
                color = palette.muted
            )

            AuthFeedbackBanner(
                message = feedbackMessage,
                isError = feedbackIsError,
                palette = palette
            )

            AfroAuthTextField(
                value = resetEmail,
                onValueChange = {
                    resetEmail = it
                    if (emailError != null) emailError = null
                },
                label = "Adresse e-mail",
                placeholder = "amina@afrocuisto.com",
                palette = palette,
                leadingIconRes = R.drawable.ic_solar_letter_linear,
                errorText = emailError,
                keyboardOptions = KeyboardOptions(
                    autoCorrectEnabled = false,
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Done
                )
            )

            AfroAuthPrimaryButton(
                text = "Envoyer le lien sécurisé",
                isLoading = isSending,
                onClick = {
                    val clean = AuthValidation.normalizeEmail(resetEmail)
                    if (!AuthValidation.isValidEmail(clean)) {
                        emailError = "Adresse e-mail invalide"
                        haptics.destructiveTick()
                        return@AfroAuthPrimaryButton
                    }
                    isSending = true
                    feedbackMessage = null
                    coroutineScope.launch {
                        when (val res = authRepository.sendPasswordReset(clean)) {
                            is AuthResult.Success -> {
                                isSending = false
                                feedbackIsError = false
                                feedbackMessage = res.message
                                haptics.actionSuccess()
                            }
                            is AuthResult.Error -> {
                                isSending = false
                                feedbackIsError = true
                                feedbackMessage = res.message
                                haptics.destructiveTick()
                            }
                            is AuthResult.EmailConfirmationRequired -> {
                                isSending = false
                                feedbackIsError = false
                                feedbackMessage = res.message
                            }
                        }
                    }
                }
            )

            Spacer(modifier = Modifier.height(10.dp))
        }
    }
}

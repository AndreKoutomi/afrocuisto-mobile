package com.afrocuisto.app.ui.screens.auth

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
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
import com.afrocuisto.app.data.repository.OtpVerifyResult
import com.afrocuisto.app.data.repository.PasswordResetRequestResult
import com.afrocuisto.app.data.security.GoogleAuthLauncher
import com.afrocuisto.app.data.security.GoogleSignInOutcome
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.afroStaggeredEntrance
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberIsTablet
import com.afrocuisto.app.ui.components.rememberKeyboardDismisser
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
    val dismissKeyboard = rememberKeyboardDismisser()
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

    fun validateEmailField(): Boolean {
        val clean = AuthValidation.normalizeEmail(email)
        emailError = when {
            clean.isEmpty() -> "Saisissez votre adresse e-mail"
            !AuthValidation.isValidEmail(clean) -> "Format attendu : nom@domaine.com"
            else -> null
        }
        return emailError == null
    }

    fun validatePasswordField(): Boolean {
        passwordError = AuthValidation.validateLoginPassword(password)
        return passwordError == null
    }

    val isEmailValid = remember(email) {
        AuthValidation.isValidEmail(AuthValidation.normalizeEmail(email))
    }
    val isPasswordFormatValid = remember(password) {
        AuthValidation.validateLoginPassword(password) == null
    }

    fun submitLogin() {
        if (lockoutSeconds > 0 || isLoading) return
        dismissKeyboard()
        bannerMessage = null
        val cleanEmail = AuthValidation.normalizeEmail(email)
        val emailOk = validateEmailField()
        val passwordOk = validatePasswordField()
        if (!emailOk || !passwordOk) {
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

        val isTablet = rememberIsTablet()
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(
                    state = rememberScrollState(),
                    flingBehavior = rememberSmoothFlingBehavior()
                )
                .imePadding()
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = if (isTablet) Arrangement.Center else Arrangement.Top
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
                            onValueChange = { raw ->
                                email = AuthValidation.sanitizeEmailInput(raw)
                                if (emailError != null) emailError = null
                                if (bannerMessage != null) bannerMessage = null
                            },
                            label = "Adresse e-mail",
                            placeholder = "amina@afrocuisto.com",
                            palette = palette,
                            leadingIconRes = R.drawable.ic_solar_letter_linear,
                            isValid = isEmailValid,
                            errorText = emailError,
                            onFocusLost = {
                                if (email.isNotEmpty()) validateEmailField()
                            },
                            keyboardOptions = KeyboardOptions(
                                autoCorrectEnabled = false,
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = {
                                    validateEmailField()
                                    focusManager.moveFocus(FocusDirection.Down)
                                }
                            )
                        )

                        AfroAuthTextField(
                            value = password,
                            onValueChange = { raw ->
                                password = AuthValidation.sanitizePasswordInput(raw)
                                if (passwordError != null) passwordError = null
                                if (bannerMessage != null) bannerMessage = null
                            },
                            label = "Mot de passe",
                            placeholder = "6 caractères min. sans espace",
                            palette = palette,
                            leadingIconRes = R.drawable.ic_solar_lock_password_linear,
                            isPassword = true,
                            isValid = isPasswordFormatValid,
                            errorText = passwordError,
                            onFocusLost = {
                                if (password.isNotEmpty()) validatePasswordField()
                            },
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
                            enabled = lockoutSeconds == 0 && isEmailValid && isPasswordFormatValid,
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
            onPasswordResetSuccess = { updatedEmail, successMessage ->
                email = updatedEmail
                emailError = null
                password = ""
                passwordError = null
                bannerIsError = false
                bannerMessage = successMessage
                showForgotPasswordSheet = false
            },
            onNavigateToRegister = {
                showForgotPasswordSheet = false
                onNavigateToRegister()
            },
            onContinueWithGoogle = {
                showForgotPasswordSheet = false
                submitGoogleSignIn()
            },
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
    onPasswordResetSuccess: (email: String, message: String) -> Unit,
    onNavigateToRegister: () -> Unit,
    onContinueWithGoogle: () -> Unit,
    onDismiss: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val dismissKeyboard = rememberKeyboardDismisser()
    val focusManager = LocalFocusManager.current
    val haptics = rememberAfroHaptics()

    // Step 1: Email -> Step 2: 6-digit OTP -> Step 3: New Password
    var step by rememberSaveable { mutableIntStateOf(1) }
    var resetEmail by rememberSaveable { mutableStateOf(AuthValidation.sanitizeEmailInput(initialEmail)) }
    var otpCode by remember { mutableStateOf("") }
    var recoveryAccessToken by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmNewPassword by remember { mutableStateOf("") }

    var emailError by remember { mutableStateOf<String?>(null) }
    var otpError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var confirmError by remember { mutableStateOf<String?>(null) }
    var feedbackMessage by remember { mutableStateOf<String?>(null) }
    var feedbackIsError by remember { mutableStateOf(false) }
    var accountNotFound by remember { mutableStateOf(false) }
    var isWorking by remember { mutableStateOf(false) }
    var resendCooldownSec by remember { mutableIntStateOf(0) }

    LaunchedEffect(resendCooldownSec) {
        if (resendCooldownSec > 0) {
            delay(1000L)
            resendCooldownSec -= 1
        }
    }

    val resetEmailValid = remember(resetEmail) {
        AuthValidation.isValidEmail(AuthValidation.normalizeEmail(resetEmail))
    }
    val newPasswordCriteria = remember(newPassword, resetEmail) {
        AuthValidation.inspectPasswordCriteria(newPassword, resetEmail, "")
    }
    val newPasswordStrength = remember(newPassword, resetEmail) {
        AuthValidation.evaluatePasswordStrength(newPassword, resetEmail, "")
    }
    val newPasswordValid = remember(newPassword, resetEmail) {
        AuthValidation.validateRegistrationPassword(
            password = newPassword,
            email = AuthValidation.normalizeEmail(resetEmail),
            displayName = ""
        ) == null
    }
    val confirmNewPasswordValid = remember(confirmNewPassword, newPassword) {
        confirmNewPassword.isNotEmpty() && confirmNewPassword == newPassword
    }

    fun sendOtp(moveToStepTwo: Boolean) {
        val clean = AuthValidation.normalizeEmail(resetEmail)
        if (!AuthValidation.isValidEmail(clean)) {
            emailError = "Format attendu : nom@domaine.com"
            haptics.destructiveTick()
            return
        }
        isWorking = true
        feedbackMessage = null
        accountNotFound = false
        coroutineScope.launch {
            when (val res = authRepository.sendPasswordReset(clean)) {
                is PasswordResetRequestResult.OtpSent -> {
                    isWorking = false
                    feedbackIsError = false
                    feedbackMessage = res.message
                    resendCooldownSec = 60
                    haptics.actionSuccess()
                    if (moveToStepTwo) {
                        otpCode = ""
                        otpError = null
                        step = 2
                    }
                }
                PasswordResetRequestResult.AccountNotFound -> {
                    isWorking = false
                    accountNotFound = true
                    feedbackIsError = true
                    feedbackMessage = "Aucun compte AfroCuisto n'existe pour $clean."
                    haptics.destructiveTick()
                }
                is PasswordResetRequestResult.Error -> {
                    isWorking = false
                    feedbackIsError = true
                    feedbackMessage = res.message
                    haptics.destructiveTick()
                }
            }
        }
    }

    fun verifyOtp() {
        val cleanOtp = otpCode.filter { it.isDigit() }
        if (cleanOtp.length < 6) {
            otpError = "Saisissez les 6 chiffres du code OTP"
            haptics.destructiveTick()
            return
        }
        dismissKeyboard()
        isWorking = true
        otpError = null
        feedbackMessage = null
        coroutineScope.launch {
            when (val res = authRepository.verifyPasswordResetOtp(resetEmail, cleanOtp)) {
                is OtpVerifyResult.Verified -> {
                    isWorking = false
                    recoveryAccessToken = res.accessToken
                    feedbackIsError = false
                    feedbackMessage = "Code vérifié ! Définissez votre nouveau mot de passe."
                    haptics.actionSuccess()
                    step = 3
                }
                is OtpVerifyResult.Error -> {
                    isWorking = false
                    otpError = res.message
                    haptics.destructiveTick()
                }
            }
        }
    }

    fun submitNewPassword() {
        val cleanEmail = AuthValidation.normalizeEmail(resetEmail)
        passwordError = AuthValidation.validateRegistrationPassword(newPassword, cleanEmail, "")
        confirmError = if (confirmNewPassword != newPassword) {
            "Les mots de passe ne correspondent pas"
        } else {
            null
        }
        if (passwordError != null || confirmError != null) {
            haptics.destructiveTick()
            return
        }
        dismissKeyboard()
        isWorking = true
        feedbackMessage = null
        coroutineScope.launch {
            when (val res = authRepository.completePasswordResetWithToken(
                accessToken = recoveryAccessToken,
                newPassword = newPassword,
                email = cleanEmail
            )) {
                is AuthResult.Success -> {
                    isWorking = false
                    haptics.actionSuccess()
                    onPasswordResetSuccess(
                        cleanEmail,
                        res.message ?: "Mot de passe réinitialisé avec succès ! Connectez-vous."
                    )
                }
                is AuthResult.Error -> {
                    isWorking = false
                    feedbackIsError = true
                    feedbackMessage = res.message
                    haptics.destructiveTick()
                }
                is AuthResult.EmailConfirmationRequired -> {
                    isWorking = false
                    feedbackIsError = false
                    feedbackMessage = res.message
                }
            }
        }
    }

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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Mot de passe oublié",
                    fontSize = 19.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = palette.title,
                    modifier = Modifier.nexaTitleEmphasis()
                )
                Surface(
                    shape = ExpressivePillShape,
                    color = AfroOrange.copy(alpha = 0.14f)
                ) {
                    Text(
                        text = "Étape $step / 3",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = AfroOrange,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            // 3-step progress bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                repeat(3) { idx ->
                    val active = idx < step
                    val barColor by animateColorAsState(
                        targetValue = if (active) AfroOrange else palette.subtleSurface,
                        animationSpec = tween(220),
                        label = "otpStepBar$idx"
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

            AuthFeedbackBanner(
                message = feedbackMessage,
                isError = feedbackIsError,
                palette = palette
            )

            AnimatedContent(
                targetState = step,
                transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(150)) },
                label = "forgotPasswordOtpStep"
            ) { currentStep ->
                when (currentStep) {
                    1 -> {
                        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                            Text(
                                text = "Saisissez l'adresse e-mail de votre compte pour recevoir un code de vérification OTP à 6 chiffres.",
                                fontSize = 13.sp,
                                lineHeight = 18.sp,
                                color = palette.muted
                            )

                            AfroAuthTextField(
                                value = resetEmail,
                                onValueChange = { raw ->
                                    resetEmail = AuthValidation.sanitizeEmailInput(raw)
                                    if (emailError != null) emailError = null
                                    if (accountNotFound) {
                                        accountNotFound = false
                                        feedbackMessage = null
                                    }
                                },
                                label = "Adresse e-mail",
                                placeholder = "amina@afrocuisto.com",
                                palette = palette,
                                leadingIconRes = R.drawable.ic_solar_letter_linear,
                                isValid = resetEmailValid && !accountNotFound,
                                errorText = emailError,
                                onFocusLost = {
                                    val clean = AuthValidation.normalizeEmail(resetEmail)
                                    if (clean.isNotEmpty() && !AuthValidation.isValidEmail(clean)) {
                                        emailError = "Format attendu : nom@domaine.com"
                                    }
                                },
                                keyboardOptions = KeyboardOptions(
                                    autoCorrectEnabled = false,
                                    keyboardType = KeyboardType.Email,
                                    imeAction = ImeAction.Done
                                ),
                                keyboardActions = KeyboardActions(
                                    onDone = { if (resetEmailValid && !accountNotFound && !isWorking) sendOtp(moveToStepTwo = true) }
                                )
                            )

                            if (accountNotFound) {
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    AfroAuthPrimaryButton(
                                        text = "Créer un compte",
                                        isLoading = false,
                                        onClick = onNavigateToRegister
                                    )

                                    AfroGoogleAuthButton(
                                        text = "Continuer avec Google",
                                        isLoading = false,
                                        palette = palette,
                                        onClick = onContinueWithGoogle
                                    )
                                }
                            } else {
                                AfroAuthPrimaryButton(
                                    text = "Envoyer le code OTP",
                                    isLoading = isWorking,
                                    enabled = resetEmailValid,
                                    onClick = { sendOtp(moveToStepTwo = true) }
                                )
                            }
                        }
                    }

                    2 -> {
                        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                            Text(
                                text = "Entrez le code à 6 chiffres envoyé à ${AuthValidation.normalizeEmail(resetEmail)}.",
                                fontSize = 13.sp,
                                lineHeight = 18.sp,
                                color = palette.muted
                            )

                            OtpDigitBoxesField(
                                code = otpCode,
                                hasError = !otpError.isNullOrBlank(),
                                palette = palette,
                                onCodeChange = { raw ->
                                    val digits = raw.filter { it.isDigit() }.take(6)
                                    otpCode = digits
                                    if (otpError != null) otpError = null
                                    if (digits.length == 6 && !isWorking) {
                                        verifyOtp()
                                    }
                                },
                                onDone = { if (otpCode.length == 6 && !isWorking) verifyOtp() }
                            )

                            if (!otpError.isNullOrBlank()) {
                                Text(
                                    text = otpError.orEmpty(),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFFEF4444)
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Modifier l'e-mail",
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = palette.muted,
                                    modifier = Modifier
                                        .clip(ExpressivePillShape)
                                        .clickable(enabled = !isWorking) {
                                            feedbackMessage = null
                                            otpError = null
                                            step = 1
                                        }
                                        .padding(horizontal = 6.dp, vertical = 4.dp)
                                )

                                Text(
                                    text = if (resendCooldownSec > 0) {
                                        "Renvoyer (${resendCooldownSec}s)"
                                    } else {
                                        "Renvoyer le code"
                                    },
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (resendCooldownSec > 0) palette.muted else AfroOrange,
                                    modifier = Modifier
                                        .clip(ExpressivePillShape)
                                        .clickable(enabled = resendCooldownSec == 0 && !isWorking) {
                                            sendOtp(moveToStepTwo = false)
                                        }
                                        .padding(horizontal = 6.dp, vertical = 4.dp)
                                )
                            }

                            AfroAuthPrimaryButton(
                                text = "Vérifier le code OTP",
                                isLoading = isWorking,
                                enabled = otpCode.length == 6,
                                onClick = ::verifyOtp
                            )
                        }
                    }

                    else -> {
                        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                            Text(
                                text = "Choisissez un nouveau mot de passe robuste pour votre compte.",
                                fontSize = 13.sp,
                                lineHeight = 18.sp,
                                color = palette.muted
                            )

                            Column {
                                AfroAuthTextField(
                                    value = newPassword,
                                    onValueChange = { raw ->
                                        newPassword = AuthValidation.sanitizePasswordInput(raw)
                                        if (passwordError != null) passwordError = null
                                    },
                                    label = "Nouveau mot de passe",
                                    placeholder = "8+ caractères, maj., chiffre, symbole",
                                    palette = palette,
                                    leadingIconRes = R.drawable.ic_solar_lock_password_linear,
                                    isPassword = true,
                                    isValid = newPasswordValid,
                                    errorText = passwordError,
                                    onFocusLost = {
                                        if (newPassword.isNotEmpty()) {
                                            passwordError = AuthValidation.validateRegistrationPassword(
                                                password = newPassword,
                                                email = AuthValidation.normalizeEmail(resetEmail),
                                                displayName = ""
                                            )
                                        }
                                    },
                                    keyboardOptions = KeyboardOptions(
                                        autoCorrectEnabled = false,
                                        keyboardType = KeyboardType.Password,
                                        imeAction = ImeAction.Next
                                    ),
                                    keyboardActions = KeyboardActions(
                                        onNext = { focusManager.moveFocus(FocusDirection.Down) }
                                    )
                                )
                                PasswordStrengthIndicator(
                                    strength = newPasswordStrength,
                                    criteria = newPasswordCriteria,
                                    palette = palette
                                )
                            }

                            AfroAuthTextField(
                                value = confirmNewPassword,
                                onValueChange = { raw ->
                                    confirmNewPassword = AuthValidation.sanitizePasswordInput(raw)
                                    if (confirmError != null) confirmError = null
                                },
                                label = "Confirmer le nouveau mot de passe",
                                placeholder = "Répétez votre mot de passe",
                                palette = palette,
                                leadingIconRes = R.drawable.ic_solar_shield_check_linear,
                                isPassword = true,
                                isValid = confirmNewPasswordValid,
                                errorText = confirmError,
                                onFocusLost = {
                                    if (confirmNewPassword.isNotEmpty() && confirmNewPassword != newPassword) {
                                        confirmError = "Les mots de passe ne correspondent pas"
                                    }
                                },
                                keyboardOptions = KeyboardOptions(
                                    autoCorrectEnabled = false,
                                    keyboardType = KeyboardType.Password,
                                    imeAction = ImeAction.Done
                                ),
                                keyboardActions = KeyboardActions(
                                    onDone = { if (newPasswordValid && confirmNewPasswordValid && !isWorking) submitNewPassword() }
                                )
                            )

                            AfroAuthPrimaryButton(
                                text = "Enregistrer le mot de passe",
                                isLoading = isWorking,
                                enabled = newPasswordValid && confirmNewPasswordValid,
                                onClick = ::submitNewPassword
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
        }
    }
}

@Composable
private fun OtpDigitBoxesField(
    code: String,
    hasError: Boolean,
    palette: AuthPalette,
    onCodeChange: (String) -> Unit,
    onDone: () -> Unit
) {
    BasicTextField(
        value = code,
        onValueChange = onCodeChange,
        singleLine = true,
        keyboardOptions = KeyboardOptions(
            autoCorrectEnabled = false,
            keyboardType = KeyboardType.NumberPassword,
            imeAction = ImeAction.Done
        ),
        keyboardActions = KeyboardActions(onDone = { onDone() }),
        decorationBox = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                repeat(6) { index ->
                    val char = code.getOrNull(index)?.toString().orEmpty()
                    val isCurrent = index == code.length.coerceAtMost(5) && code.length < 6
                    val boxBorder = when {
                        hasError -> Color(0xFFEF4444)
                        isCurrent || char.isNotEmpty() -> AfroOrange
                        else -> palette.border
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(54.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(palette.inputSurface)
                            .border(
                                width = if (isCurrent || hasError) 1.5.dp else 1.dp,
                                color = boxBorder,
                                shape = RoundedCornerShape(16.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = char.ifEmpty { "•" },
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (char.isNotEmpty()) palette.title else palette.placeholder
                        )
                    }
                }
            }
        },
        modifier = Modifier.fillMaxWidth()
    )
}

package com.afrocuisto.app.ui.screens.auth

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.afrocuisto.app.R
import com.afrocuisto.app.data.repository.AuthRepository
import com.afrocuisto.app.data.repository.AuthResult
import com.afrocuisto.app.data.repository.AuthValidation
import com.afrocuisto.app.data.repository.UserPreferencesRepository
import com.afrocuisto.app.data.security.GoogleAuthLauncher
import com.afrocuisto.app.data.security.GoogleSignInOutcome
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AccentEmerald
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.ExpressivePillShape
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import com.afrocuisto.app.ui.theme.nexaTitleEmphasis
import kotlinx.coroutines.launch

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RegisterScreen(
    authRepository: AuthRepository,
    canNavigateBack: Boolean,
    onBack: () -> Unit,
    onNavigateToLogin: () -> Unit,
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

    // Step 1: Credentials (passwords kept strictly in RAM via remember, never SavedState Bundle)
    var currentStep by rememberSaveable { mutableIntStateOf(1) }
    var fullName by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }

    // Step 2: Culinary Identity (100% aligned with active app & Supabase schema)
    var selectedRole by rememberSaveable { mutableStateOf(UserPreferencesRepository.ROLE_OPTIONS.first()) }
    var selectedTerroir by rememberSaveable { mutableStateOf("Bénin") }
    var diasporaMode by rememberSaveable { mutableStateOf(false) }

    // Validation & Submission State
    var nameError by remember { mutableStateOf<String?>(null) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var confirmError by remember { mutableStateOf<String?>(null) }
    var bannerMessage by remember { mutableStateOf<String?>(null) }
    var bannerIsError by remember { mutableStateOf(true) }
    var isLoading by remember { mutableStateOf(false) }
    var isGoogleLoading by remember { mutableStateOf(false) }
    var pendingConfirmationEmail by rememberSaveable { mutableStateOf<String?>(null) }

    fun submitGoogleSignUp() {
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
                    confirmPassword = ""
                    haptics.actionSuccess()
                    onAuthSuccess()
                }
                GoogleSignInOutcome.RedirectedToBrowser -> {
                    password = ""
                    confirmPassword = ""
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

    val passwordCriteria = remember(password, email, fullName) {
        AuthValidation.inspectPasswordCriteria(password, email, fullName)
    }
    val passwordStrength = remember(password, email, fullName) {
        AuthValidation.evaluatePasswordStrength(password, email, fullName)
    }

    BackHandler(enabled = currentStep == 2 && pendingConfirmationEmail == null) {
        haptics.navigationTap()
        currentStep = 1
    }

    fun validateStepOne(): Boolean {
        focusManager.clearFocus()
        bannerMessage = null
        val cleanName = AuthValidation.sanitizeDisplayName(fullName)
        val cleanEmail = AuthValidation.normalizeEmail(email)

        nameError = if (cleanName.length < 2) {
            "Saisissez votre nom ou pseudo (2 caractères min.)"
        } else {
            null
        }
        emailError = if (!AuthValidation.isValidEmail(cleanEmail)) {
            "Adresse e-mail invalide"
        } else {
            null
        }
        passwordError = AuthValidation.validateRegistrationPassword(
            password = password,
            email = cleanEmail,
            displayName = cleanName
        )
        confirmError = if (confirmPassword != password) {
            "Les mots de passe ne correspondent pas"
        } else {
            null
        }

        val valid = nameError == null && emailError == null && passwordError == null && confirmError == null
        if (!valid) haptics.destructiveTick()
        return valid
    }

    fun submitRegistration() {
        if (isLoading) return
        if (!validateStepOne()) {
            currentStep = 1
            return
        }
        isLoading = true
        bannerMessage = null
        val submittedPassword = password
        coroutineScope.launch {
            val result = authRepository.signUp(
                name = fullName,
                email = email,
                password = submittedPassword,
                roleTitle = selectedRole,
                favoriteTerroir = selectedTerroir,
                diasporaSubstitutesFirst = diasporaMode
            )
            isLoading = false
            when (result) {
                is AuthResult.Success -> {
                    password = ""
                    confirmPassword = ""
                    haptics.actionSuccess()
                    onAuthSuccess()
                }
                is AuthResult.EmailConfirmationRequired -> {
                    password = ""
                    confirmPassword = ""
                    haptics.actionSuccess()
                    pendingConfirmationEmail = result.email
                }
                is AuthResult.Error -> {
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
                canNavigateBack = canNavigateBack || currentStep == 2,
                onBack = {
                    if (currentStep == 2 && pendingConfirmationEmail == null) {
                        currentStep = 1
                    } else {
                        onBack()
                    }
                },
                stepBadge = if (pendingConfirmationEmail == null) "Étape $currentStep / 2" else null,
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
                if (pendingConfirmationEmail != null) {
                    EmailConfirmationCard(
                        email = pendingConfirmationEmail.orEmpty(),
                        palette = palette,
                        onGoToLogin = onNavigateToLogin
                    )
                } else {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        repeat(2) { idx ->
                            val active = idx < currentStep
                            val barColor by animateColorAsState(
                                targetValue = if (active) AfroOrange else palette.subtleSurface,
                                animationSpec = tween(240),
                                label = "registerStepBar$idx"
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

                    AnimatedContent(
                        targetState = currentStep,
                        transitionSpec = {
                            if (targetState > initialState) {
                                (slideInHorizontally(initialOffsetX = { (it * 0.25f).toInt() }, animationSpec = tween(260)) + fadeIn(tween(200))) togetherWith
                                    (slideOutHorizontally(targetOffsetX = { -(it * 0.15f).toInt() }, animationSpec = tween(220)) + fadeOut(tween(160)))
                            } else {
                                (slideInHorizontally(initialOffsetX = { -(it * 0.25f).toInt() }, animationSpec = tween(260)) + fadeIn(tween(200))) togetherWith
                                    (slideOutHorizontally(targetOffsetX = { (it * 0.15f).toInt() }, animationSpec = tween(220)) + fadeOut(tween(160)))
                            }
                        },
                        label = "registerStepTransition"
                    ) { step ->
                        if (step == 1) {
                            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                Column {
                                    Text(
                                        text = "Créez votre compte",
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        letterSpacing = (-0.5).sp,
                                        color = palette.title,
                                        modifier = Modifier.nexaTitleEmphasis()
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Synchronisez vos favoris, vos listes de marché et vos discussions culinaires sur tous vos appareils.",
                                        fontSize = 13.5.sp,
                                        lineHeight = 19.sp,
                                        color = palette.muted
                                    )
                                }

                                Card(
                                    shape = RoundedCornerShape(28.dp),
                                    colors = CardDefaults.cardColors(containerColor = palette.card),
                                    border = BorderStroke(1.dp, palette.border),
                                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(20.dp),
                                        verticalArrangement = Arrangement.spacedBy(14.dp)
                                    ) {
                                        AuthFeedbackBanner(
                                            message = bannerMessage,
                                            isError = bannerIsError,
                                            palette = palette
                                        )

                                        AfroAuthTextField(
                                            value = fullName,
                                            onValueChange = {
                                                fullName = it
                                                if (nameError != null) nameError = null
                                            },
                                            label = "Nom ou pseudo",
                                            placeholder = "Ex : Amina Diallo",
                                            palette = palette,
                                            leadingIconRes = R.drawable.ic_solar_user_circle_linear,
                                            errorText = nameError,
                                            keyboardOptions = KeyboardOptions(
                                                capitalization = KeyboardCapitalization.Words,
                                                autoCorrectEnabled = false,
                                                imeAction = ImeAction.Next
                                            ),
                                            keyboardActions = KeyboardActions(
                                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                                            )
                                        )

                                        AfroAuthTextField(
                                            value = email,
                                            onValueChange = {
                                                email = it
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
                                                imeAction = ImeAction.Next
                                            ),
                                            keyboardActions = KeyboardActions(
                                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                                            )
                                        )

                                        Column {
                                            AfroAuthTextField(
                                                value = password,
                                                onValueChange = {
                                                    password = it
                                                    if (passwordError != null) passwordError = null
                                                },
                                                label = "Mot de passe robuste",
                                                placeholder = "8+ caractères, maj., chiffre, symbole",
                                                palette = palette,
                                                leadingIconRes = R.drawable.ic_solar_lock_password_linear,
                                                isPassword = true,
                                                errorText = passwordError,
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
                                                strength = passwordStrength,
                                                criteria = passwordCriteria,
                                                palette = palette
                                            )
                                        }

                                        AfroAuthTextField(
                                            value = confirmPassword,
                                            onValueChange = {
                                                confirmPassword = it
                                                if (confirmError != null) confirmError = null
                                            },
                                            label = "Confirmer le mot de passe",
                                            placeholder = "Répétez votre mot de passe",
                                            palette = palette,
                                            leadingIconRes = R.drawable.ic_solar_shield_check_linear,
                                            isPassword = true,
                                            errorText = confirmError,
                                            keyboardOptions = KeyboardOptions(
                                                autoCorrectEnabled = false,
                                                keyboardType = KeyboardType.Password,
                                                imeAction = ImeAction.Done
                                            ),
                                            keyboardActions = KeyboardActions(
                                                onDone = {
                                                    if (validateStepOne()) {
                                                        haptics.navigationTap()
                                                        currentStep = 2
                                                    }
                                                }
                                            )
                                        )

                                        Spacer(modifier = Modifier.height(2.dp))

                                        AfroAuthPrimaryButton(
                                            text = "Continuer · Mon identité culinaire",
                                            isLoading = false,
                                            onClick = {
                                                if (validateStepOne()) {
                                                    haptics.navigationTap()
                                                    currentStep = 2
                                                }
                                            }
                                        )
                                    }
                                }

                                AuthOrDivider(palette = palette, label = "ou s'inscrire avec")

                                AfroGoogleAuthButton(
                                    text = "S'inscrire avec Google",
                                    isLoading = isGoogleLoading,
                                    enabled = !isLoading,
                                    palette = palette,
                                    onClick = ::submitGoogleSignUp
                                )

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 22.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Déjà inscrit ? ",
                                        fontSize = 13.sp,
                                        color = palette.muted
                                    )
                                    Text(
                                        text = "Se connecter",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = AfroOrange,
                                        modifier = Modifier
                                            .clip(ExpressivePillShape)
                                            .afroSpringClickable(
                                                pressedScale = 0.94f,
                                                haptic = AfroHapticKind.NAVIGATION,
                                                onClick = onNavigateToLogin
                                            )
                                            .padding(horizontal = 6.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        } else {
                            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                Column {
                                    Text(
                                        text = "Votre identité culinaire",
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        letterSpacing = (-0.5).sp,
                                        color = palette.title,
                                        modifier = Modifier.nexaTitleEmphasis()
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Choisissez votre signature et votre terroir de cœur pour personnaliser votre espace.",
                                        fontSize = 13.5.sp,
                                        lineHeight = 19.sp,
                                        color = palette.muted
                                    )
                                }

                                Card(
                                    shape = RoundedCornerShape(28.dp),
                                    colors = CardDefaults.cardColors(containerColor = palette.card),
                                    border = BorderStroke(1.dp, palette.border),
                                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(20.dp),
                                        verticalArrangement = Arrangement.spacedBy(18.dp)
                                    ) {
                                        AuthFeedbackBanner(
                                            message = bannerMessage,
                                            isError = bannerIsError,
                                            palette = palette
                                        )

                                        // 1. Signature culinaire
                                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(7.dp)
                                            ) {
                                                Icon(
                                                    painter = painterResource(id = R.drawable.ic_solar_star_linear),
                                                    contentDescription = null,
                                                    tint = palette.title,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                                Text(
                                                    text = "Signature culinaire",
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    color = palette.title
                                                )
                                            }
                                            FlowRow(
                                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                verticalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                UserPreferencesRepository.ROLE_OPTIONS.forEach { role ->
                                                    AuthSelectableChip(
                                                        label = role,
                                                        selected = selectedRole == role,
                                                        palette = palette,
                                                        onClick = {
                                                            haptics.selectionTick()
                                                            selectedRole = role
                                                        }
                                                    )
                                                }
                                            }
                                        }

                                        // 2. Terroir favori
                                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(7.dp)
                                            ) {
                                                Icon(
                                                    painter = painterResource(id = R.drawable.ic_solar_globe_linear),
                                                    contentDescription = null,
                                                    tint = palette.title,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                                Text(
                                                    text = "Terroir favori",
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    color = palette.title
                                                )
                                            }
                                            FlowRow(
                                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                verticalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                UserPreferencesRepository.TERROIR_OPTIONS.forEach { terroir ->
                                                    AuthSelectableChip(
                                                        label = terroir,
                                                        selected = selectedTerroir == terroir,
                                                        palette = palette,
                                                        onClick = {
                                                            haptics.selectionTick()
                                                            selectedTerroir = terroir
                                                        }
                                                    )
                                                }
                                            }
                                        }

                                        // 3. Mode Cuisine Diaspora
                                        Surface(
                                            shape = RoundedCornerShape(28.dp),
                                            color = palette.inputSurface,
                                            border = BorderStroke(1.dp, palette.border),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clip(RoundedCornerShape(28.dp))
                                                .clickable {
                                                    haptics.selectionTick()
                                                    diasporaMode = !diasporaMode
                                                }
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(
                                                        text = "Mode Cuisine Diaspora",
                                                        fontSize = 13.5.sp,
                                                        fontWeight = FontWeight.ExtraBold,
                                                        color = palette.title
                                                    )
                                                    Text(
                                                        text = "Affiche les ingrédients de substitution hors d'Afrique",
                                                        fontSize = 11.5.sp,
                                                        color = palette.muted
                                                    )
                                                }
                                                Switch(
                                                    checked = diasporaMode,
                                                    onCheckedChange = {
                                                        haptics.selectionTick()
                                                        diasporaMode = it
                                                    },
                                                    colors = SwitchDefaults.colors(
                                                        checkedThumbColor = Color.White,
                                                        checkedTrackColor = AfroOrange,
                                                        uncheckedThumbColor = palette.muted,
                                                        uncheckedTrackColor = palette.subtleSurface,
                                                        uncheckedBorderColor = palette.border
                                                    )
                                                )
                                            }
                                        }

                                        AfroAuthPrimaryButton(
                                            text = "Créer mon compte",
                                            isLoading = isLoading,
                                            onClick = ::submitRegistration
                                        )
                                    }
                                }

                                Text(
                                    text = "Modifier mes identifiants (étape 1)",
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = palette.muted,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier
                                        .align(Alignment.CenterHorizontally)
                                        .clip(ExpressivePillShape)
                                        .clickable(enabled = !isLoading) {
                                            haptics.navigationTap()
                                            currentStep = 1
                                        }
                                        .padding(horizontal = 14.dp, vertical = 8.dp)
                                )

                                Spacer(modifier = Modifier.height(12.dp))
                            }
                        }
                    }
                }
            }
        }

        // Fixed top navigation & step indicator (never scrolls with page content)
        AuthTopControlsBar(
            canNavigateBack = canNavigateBack || currentStep == 2,
            onBack = {
                if (currentStep == 2 && pendingConfirmationEmail == null) {
                    currentStep = 1
                } else {
                    onBack()
                }
            },
            stepBadge = if (pendingConfirmationEmail == null) "Étape $currentStep / 2" else null,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }
}

@Composable
private fun AuthSelectableChip(
    label: String,
    selected: Boolean,
    palette: AuthPalette,
    onClick: () -> Unit
) {
    Surface(
        shape = ExpressivePillShape,
        color = if (selected) AfroOrange else palette.inputSurface,
        border = BorderStroke(1.dp, if (selected) AfroOrange else palette.border),
        modifier = Modifier
            .clip(ExpressivePillShape)
            .clickable(onClick = onClick)
    ) {
        Text(
            text = label,
            color = Color.White,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 13.dp, vertical = 7.dp)
        )
    }
}

@Composable
private fun EmailConfirmationCard(
    email: String,
    palette: AuthPalette,
    onGoToLogin: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = palette.card),
        border = BorderStroke(1.dp, palette.border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp, bottom = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(AccentEmerald.copy(alpha = 0.14f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_solar_check_circle_linear),
                    contentDescription = null,
                    tint = AccentEmerald,
                    modifier = Modifier.size(32.dp)
                )
            }

            Text(
                text = "Vérifiez votre boîte mail",
                fontSize = 21.sp,
                fontWeight = FontWeight.ExtraBold,
                color = palette.title,
                textAlign = TextAlign.Center,
                modifier = Modifier.nexaTitleEmphasis()
            )

            Text(
                text = "Votre compte sécurisé est prêt ! Nous avons envoyé un lien de confirmation à $email. Validez-le puis connectez-vous.",
                fontSize = 13.5.sp,
                lineHeight = 20.sp,
                color = palette.muted,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(4.dp))

            AfroAuthPrimaryButton(
                text = "Aller à la connexion",
                isLoading = false,
                onClick = onGoToLogin
            )
        }
    }
}

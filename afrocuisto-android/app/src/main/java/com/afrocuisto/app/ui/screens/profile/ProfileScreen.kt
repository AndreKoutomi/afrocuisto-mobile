package com.afrocuisto.app.ui.screens.profile

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import coil.annotation.ExperimentalCoilApi
import coil.compose.AsyncImage
import coil.imageLoader
import com.afrocuisto.app.BuildConfig
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.Recipe
import com.afrocuisto.app.data.ota.OtaStatus
import com.afrocuisto.app.data.ota.OtaUiState
import com.afrocuisto.app.data.ota.OtaUpdateManager
import com.afrocuisto.app.data.repository.AppLanguage
import com.afrocuisto.app.data.repository.AppThemeMode
import com.afrocuisto.app.data.repository.AuthRepository
import com.afrocuisto.app.data.repository.AuthSessionState
import com.afrocuisto.app.data.repository.BugReportRepository
import com.afrocuisto.app.data.repository.CulinaryLevel
import com.afrocuisto.app.data.repository.MeasurementMode
import com.afrocuisto.app.data.repository.RecipeRepository
import com.afrocuisto.app.data.repository.ShoppingRepository
import com.afrocuisto.app.data.repository.SpiceTolerance
import com.afrocuisto.app.data.repository.UserPreferencesRepository
import com.afrocuisto.app.data.repository.UserPreferencesState
import com.afrocuisto.app.service.CookingTimerService
import com.afrocuisto.app.ui.components.RecipeImageOrSkeleton
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberKeyboardDismisser
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.i18n.LocalAppLanguage
import com.afrocuisto.app.ui.i18n.tr
import com.afrocuisto.app.ui.i18n.translateThemeLabel
import com.afrocuisto.app.ui.screens.aichef.GeminiVoiceCatalog
import com.afrocuisto.app.ui.screens.aichef.GeminiVoicePreferences
import com.afrocuisto.app.ui.theme.AccentEmerald
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.ExpressivePillShape
import com.afrocuisto.app.ui.theme.NexaFontFamily
import com.afrocuisto.app.ui.theme.StarGold
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import com.afrocuisto.app.ui.theme.nexaTitleEmphasis
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.util.Locale

private data class ProfilePalette(
    val canvas: Color,
    val card: Color,
    val subtleSurface: Color,
    val segmentedTrack: Color,
    val segmentedActivePill: Color,
    val border: Color,
    val title: Color,
    val body: Color,
    val muted: Color
)

@Composable
private fun rememberProfilePalette(isDark: Boolean): ProfilePalette {
    return remember(isDark) {
        if (isDark) {
            ProfilePalette(
                canvas = Color(0xFF121110),
                card = Color(0xFF1A1816),
                subtleSurface = Color(0xFF24211E),
                segmentedTrack = Color(0xFF24221F),
                segmentedActivePill = Color(0xFF33302C),
                border = Color(0xFF2E2C29),
                title = Color(0xFFF7F5F0),
                body = Color(0xFFC8C2BA),
                muted = Color(0xFF8E8880)
            )
        } else {
            ProfilePalette(
                canvas = Color(0xFFF8F9FA),
                card = Color(0xFFFFFFFF),
                subtleSurface = Color(0xFFF8FAFC),
                segmentedTrack = Color(0xFFF1F2F6),
                segmentedActivePill = Color(0xFFFFFFFF),
                border = Color(0xFFE2E8F0),
                title = Color(0xFF1E1E2D),
                body = Color(0xFF475569),
                muted = Color(0xFF64748B)
            )
        }
    }
}

private fun computeDirectoryBytes(dir: File): Long {
    if (!dir.exists()) return 0L
    if (dir.isFile) return dir.length()
    return dir.walkTopDown().filter { it.isFile }.sumOf { it.length() }
}

private fun formatStorageSize(bytes: Long): String {
    if (bytes <= 0L) return "0 Ko"
    val kb = bytes / 1024.0
    if (kb < 1024.0) return String.format(Locale.FRENCH, "%.0f Ko", kb)
    val mb = kb / 1024.0
    return String.format(Locale.FRENCH, "%.1f Mo", mb)
}

private data class CulinaryMasteryRank(
    val title: String,
    val nextTitle: String,
    val progress: Float,
    val points: Int
)

private fun computeMasteryRank(
    favoritesCount: Int,
    cookedCount: Int,
    marketItemsCount: Int
): CulinaryMasteryRank {
    val points = favoritesCount * 25 + cookedCount * 60 + marketItemsCount * 10
    return when {
        points < 120 -> CulinaryMasteryRank(
            title = "Initié des Épices",
            nextTitle = "Cuisinier du Terroir",
            progress = (points / 120f).coerceIn(0.08f, 1f),
            points = points
        )
        points < 260 -> CulinaryMasteryRank(
            title = "Cuisinier du Terroir",
            nextTitle = "Maître Marmite",
            progress = ((points - 120) / 140f).coerceIn(0.05f, 1f),
            points = points
        )
        points < 450 -> CulinaryMasteryRank(
            title = "Maître Marmite",
            nextTitle = "Grand Chef AfroCuisto",
            progress = ((points - 260) / 190f).coerceIn(0.05f, 1f),
            points = points
        )
        else -> CulinaryMasteryRank(
            title = "Grand Chef AfroCuisto",
            nextTitle = "Rang Suprême atteint",
            progress = 1f,
            points = points
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class, ExperimentalCoilApi::class)
@Composable
fun ProfileScreen(
    onBack: () -> Unit,
    onNavigateToRecipeDetail: (String) -> Unit = {},
    onNavigateToFavorites: () -> Unit = {},
    onNavigateToMarket: () -> Unit = {},
    onNavigateToAiChef: () -> Unit = {},
    onNavigateToLogin: () -> Unit = {},
    onNavigateToRegister: () -> Unit = {},
    recipeRepository: RecipeRepository = remember { RecipeRepository() },
    shoppingRepository: ShoppingRepository = remember { ShoppingRepository() },
    userPreferencesRepository: UserPreferencesRepository? = null,
    authRepository: AuthRepository? = null
) {
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current
    val afroHaptics = rememberAfroHaptics()
    val coroutineScope = rememberCoroutineScope()
    val lifecycleOwner = LocalLifecycleOwner.current
    val isDark = isAfroDarkTheme()
    val palette = rememberProfilePalette(isDark)

    val prefsRepo = userPreferencesRepository ?: remember { UserPreferencesRepository(context.applicationContext) }
    val authRepo = authRepository ?: remember { AuthRepository(context.applicationContext, prefsRepo) }
    val authSession by authRepo.sessionFlow.collectAsState(initial = AuthSessionState())
    val voicePrefs = remember { GeminiVoicePreferences(context.applicationContext) }
    val bugReportRepo = remember { BugReportRepository(context.applicationContext) }
    val otaManager = remember { OtaUpdateManager(context.applicationContext) }
    val otaState by otaManager.state.collectAsState()
    var showOtaUpdateSheet by remember { mutableStateOf(false) }
    var showPrivacySheet by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        if (otaState.status == OtaStatus.IDLE) {
            otaManager.checkForUpdates(coroutineScope)
        }
    }

    val userPrefs by prefsRepo.preferencesFlow.collectAsState(initial = UserPreferencesState())
    val selectedVoiceId by voicePrefs.selectedVoiceId.collectAsState(initial = GeminiVoiceCatalog.voices.first().id)

    val recipes by recipeRepository.recipes.collectAsState(initial = emptyList())
    val favoriteIds by recipeRepository.favoriteIds.collectAsState(initial = emptySet())
    val shoppingItems by shoppingRepository.items.collectAsState()
    val timerState by CookingTimerService.timerState.collectAsState()

    val cookedRecipes = remember(recipes, userPrefs.cookedRecipeIds) {
        recipes.filter { it.id in userPrefs.cookedRecipeIds }
    }
    val pendingMarketCount = remember(shoppingItems) { shoppingItems.count { !it.isChecked } }
    val checkedMarketCount = remember(shoppingItems) { shoppingItems.count { it.isChecked } }

    val masteryRank = remember(favoriteIds.size, userPrefs.cookedRecipeIds.size, shoppingItems.size) {
        computeMasteryRank(
            favoritesCount = favoriteIds.size,
            cookedCount = userPrefs.cookedRecipeIds.size,
            marketItemsCount = shoppingItems.size
        )
    }

    // Live OS Notification & Promoted Live Update permission status
    var notificationsEnabled by remember { mutableStateOf(true) }
    var promotedLiveUpdatesEnabled by remember { mutableStateOf(true) }

    fun refreshSystemNotificationFlags() {
        notificationsEnabled = NotificationManagerCompat.from(context).areNotificationsEnabled()
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        promotedLiveUpdatesEnabled = if (Build.VERSION.SDK_INT >= 36) {
            runCatching {
                nm.javaClass.getMethod("canPostPromotedNotifications").invoke(nm) as? Boolean ?: true
            }.getOrDefault(notificationsEnabled)
        } else {
            notificationsEnabled
        }
    }

    DisposableEffect(lifecycleOwner) {
        refreshSystemNotificationFlags()
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                refreshSystemNotificationFlags()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // Live Coil Image Cache disk size
    var imageCacheBytes by remember { mutableLongStateOf(0L) }
    var statusBannerMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        imageCacheBytes = withContext(Dispatchers.IO) {
            computeDirectoryBytes(context.cacheDir.resolve("coil_image_cache"))
        }
    }

    LaunchedEffect(statusBannerMessage) {
        if (statusBannerMessage != null) {
            delay(3200L)
            statusBannerMessage = null
        }
    }

    var showEditIdentitySheet by remember { mutableStateOf(false) }
    var showAccountInfoSheet by remember { mutableStateOf(false) }
    var showCookedHistorySheet by remember { mutableStateOf(false) }
    var showResetConfirmDialog by remember { mutableStateOf(false) }
    var showSignOutConfirmDialog by remember { mutableStateOf(false) }
    var selectedSettingsGroup by remember { mutableStateOf<String?>(null) }
    val dismissKeyboard = rememberKeyboardDismisser()

    LaunchedEffect(selectedSettingsGroup) {
        dismissKeyboard()
    }

    LaunchedEffect(Unit) {
        if (otaState.status == OtaStatus.IDLE) {
            otaManager.checkForUpdates(coroutineScope)
        }
    }

    LaunchedEffect(showOtaUpdateSheet) {
        if (showOtaUpdateSheet && (otaState.status == OtaStatus.IDLE || otaState.status == OtaStatus.ERROR)) {
            otaManager.checkForUpdates(coroutineScope)
        }
    }

    BackHandler(enabled = selectedSettingsGroup != null) {
        afroHaptics.navigationTap()
        selectedSettingsGroup = null
    }

    val scrollState = rememberScrollState()
    val showTopDivider by remember { derivedStateOf { scrollState.value > 6 } }

    AnimatedContent(
        targetState = selectedSettingsGroup,
        transitionSpec = {
            if (targetState != null) {
                (slideInHorizontally(initialOffsetX = { (it * 0.24f).toInt() }, animationSpec = tween(280)) + fadeIn(tween(220))) togetherWith
                    (slideOutHorizontally(targetOffsetX = { -(it * 0.10f).toInt() }, animationSpec = tween(240)) + fadeOut(tween(180)))
            } else {
                (slideInHorizontally(initialOffsetX = { -(it * 0.14f).toInt() }, animationSpec = tween(260)) + fadeIn(tween(200))) togetherWith
                    (slideOutHorizontally(targetOffsetX = { (it * 0.24f).toInt() }, animationSpec = tween(240)) + fadeOut(tween(180)))
            }
        },
        label = "profileSubPageNav"
    ) { activeGroup ->
        if (activeGroup == null) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(palette.canvas)
    ) {
        // 1. STICKY HEADER
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(palette.canvas)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = {
                        afroHaptics.navigationTap()
                        onBack()
                    }) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_arrow_left_linear),
                            contentDescription = "Retour",
                            tint = palette.title,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Text(
                        text = tr("Mon espace", "My Space", "Mi espacio"),
                        fontSize = 19.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = palette.title,
                        modifier = Modifier.nexaTitleEmphasis()
                    )
                }
            }

            if (showTopDivider) {
                HorizontalDivider(thickness = 1.dp, color = palette.border)
            }
        }

        // 2. SCROLLABLE CONTENT
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(
                    state = scrollState,
                    flingBehavior = rememberSmoothFlingBehavior()
                )
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            Spacer(modifier = Modifier.height(2.dp))

            // Transient Feedback Toast Banner
            AnimatedVisibility(
                visible = statusBannerMessage != null,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(28.dp),
                    color = AccentEmerald.copy(alpha = if (isDark) 0.18f else 0.12f),
                    border = BorderStroke(1.dp, AccentEmerald.copy(alpha = 0.45f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_check_linear),
                            contentDescription = null,
                            tint = AccentEmerald,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = statusBannerMessage.orEmpty(),
                            color = palette.title,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // A. COMPACT USER PROFILE CARD (Click to view full account info)
            val animatedMastery by animateFloatAsState(
                targetValue = masteryRank.progress,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioNoBouncy,
                    stiffness = Spring.StiffnessLow
                ),
                label = "masteryProgress"
            )

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .clickable {
                        afroHaptics.navigationTap()
                        showAccountInfoSheet = true
                    },
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = AfroOrange),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.22f)),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(58.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.18f), CircleShape)
                            .border(1.5.dp, Color.White.copy(alpha = 0.55f), CircleShape)
                            .padding(3.dp)
                    ) {
                        AsyncImage(
                            model = userPrefs.avatarUrl,
                            contentDescription = userPrefs.displayName,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                        )
                    }

                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = userPrefs.displayName,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )

                        Text(
                            text = if (authSession.isAuthenticated && authSession.email.isNotBlank()) {
                                "${authSession.email} · ${userPrefs.favoriteTerroir}"
                            } else {
                                "${userPrefs.roleTitle} · ${userPrefs.favoriteTerroir}"
                            },
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color.White.copy(alpha = 0.88f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(4.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.26f))
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth(animatedMastery)
                                        .fillMaxHeight()
                                        .clip(CircleShape)
                                        .background(Color.White)
                                )
                            }
                            Text(
                                text = "${masteryRank.title} · ${masteryRank.points} pts",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White.copy(alpha = 0.92f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_alt_arrow_right_linear),
                        contentDescription = tr("Voir les informations du compte", "View account information", "Ver información de la cuenta"),
                        tint = Color.White.copy(alpha = 0.9f),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            if (selectedSettingsGroup == null) {
                ProfileSectionCard(
                    title = tr("Paramètres", "Settings", "Ajustes"),
                    subtitle = tr("Vos réglages regroupés par thème", "Your settings grouped by topic", "Tus ajustes agrupados por tema"),
                    palette = palette
                ) {
                    ProfileSettingsGroupRow(
                        tr("Personnalisation", "Personalization", "Personalización"),
                        tr("Thème, langue et carrousel d'accueil", "Theme, language and home carousel", "Tema, idioma y carrusel de inicio"),
                        R.drawable.ic_solar_moon_linear,
                        palette
                    ) {
                        afroHaptics.navigationTap()
                        selectedSettingsGroup = "appearance"
                    }
                    SectionDivider(palette)
                    ProfileSettingsGroupRow(
                        tr("Préférences culinaires", "Culinary preferences", "Preferencias culinarias"),
                        tr("Portions, mode diaspora et écran actif", "Servings, diaspora mode and keep screen on", "Porciones, modo diáspora y pantalla activa"),
                        R.drawable.ic_solar_cat_fork_knife_outline,
                        palette
                    ) {
                        afroHaptics.navigationTap()
                        selectedSettingsGroup = "culinary"
                    }
                    SectionDivider(palette)
                    ProfileSettingsGroupRow(
                        tr("Chef IA & Frigo Magique", "AI Chef & Magic Fridge", "Chef IA y Nevera Mágica"),
                        tr("Voix de l'assistant culinaire", "Culinary assistant voice", "Voz del asistente culinario"),
                        R.drawable.ic_solar_microphone_linear,
                        palette
                    ) {
                        afroHaptics.navigationTap()
                        selectedSettingsGroup = "assistant"
                    }
                    SectionDivider(palette)
                    ProfileSettingsGroupRow(
                        tr("Minuteur & notifications", "Timer & notifications", "Temporizador y notificaciones"),
                        tr("Alertes, vibration et barre de statut", "Alerts, vibration and status bar", "Alertas, vibración y barra de estado"),
                        R.drawable.ic_solar_stopwatch_linear,
                        palette
                    ) {
                        afroHaptics.navigationTap()
                        selectedSettingsGroup = "timer"
                    }
                    SectionDivider(palette)
                    ProfileSettingsGroupRow(
                        tr("Données & stockage", "Data & storage", "Datos y almacenamiento"),
                        tr("Panier, photos et entretien local", "Cart, photos and local maintenance", "Carrito, fotos y mantenimiento local"),
                        R.drawable.ic_solar_broom_linear,
                        palette
                    ) {
                        afroHaptics.navigationTap()
                        selectedSettingsGroup = "storage"
                    }
                    SectionDivider(palette)
                    ProfileSettingsGroupRow(
                        title = tr("Confidentialité & à propos", "Privacy & about", "Privacidad y acerca de"),
                        subtitle = tr("Données locales, permissions, mentions & version", "Local data, permissions, notices & version", "Datos locales, permisos, avisos y versión"),
                        iconRes = R.drawable.ic_solar_shield_check_linear,
                        palette = palette
                    ) {
                        afroHaptics.navigationTap()
                        selectedSettingsGroup = "privacy"
                    }
                    SectionDivider(palette)
                    ProfileSettingsGroupRow(
                        title = tr("Signaler un bug", "Report a bug", "Reportar un error"),
                        subtitle = tr("Envoyer un rapport détaillé à l'équipe AfroCuisto", "Send a detailed report to the AfroCuisto team", "Enviar un informe detallado al equipo AfroCuisto"),
                        iconRes = R.drawable.ic_solar_danger_circle_linear,
                        palette = palette
                    ) {
                        afroHaptics.navigationTap()
                        selectedSettingsGroup = "bug_report"
                    }
                    SectionDivider(palette)
                    val hasOtaUpdate = otaState.status == OtaStatus.UPDATE_AVAILABLE ||
                        otaState.status == OtaStatus.READY_TO_INSTALL
                    val otaRowSubtitle = when (otaState.status) {
                        OtaStatus.UPDATE_AVAILABLE -> tr(
                            "Version ${otaState.availableRelease?.versionName ?: ""} prête à installer",
                            "Version ${otaState.availableRelease?.versionName ?: ""} ready to install",
                            "Versión ${otaState.availableRelease?.versionName ?: ""} lista para instalar"
                        )
                        OtaStatus.DOWNLOADING -> tr(
                            "Téléchargement ${(otaState.progress * 100).toInt()}% • ${OtaUpdateManager.formatSpeed(otaState.speedBytesPerSec)}",
                            "Downloading ${(otaState.progress * 100).toInt()}% • ${OtaUpdateManager.formatSpeed(otaState.speedBytesPerSec)}",
                            "Descargando ${(otaState.progress * 100).toInt()}% • ${OtaUpdateManager.formatSpeed(otaState.speedBytesPerSec)}"
                        )
                        OtaStatus.READY_TO_INSTALL -> tr("Prête à être installée", "Ready to install", "Lista para instalar")
                        OtaStatus.UP_TO_DATE -> tr(
                            "AfroCuisto ${BuildConfig.VERSION_NAME} est à jour",
                            "AfroCuisto ${BuildConfig.VERSION_NAME} is up to date",
                            "AfroCuisto ${BuildConfig.VERSION_NAME} está al día"
                        )
                        else -> tr(
                            "Version ${BuildConfig.VERSION_NAME} • Rechercher des nouveautés",
                            "Version ${BuildConfig.VERSION_NAME} • Check for updates",
                            "Versión ${BuildConfig.VERSION_NAME} • Buscar novedades"
                        )
                    }
                    ProfileSettingsGroupRow(
                        title = tr("Mises à jour de l'application", "App updates", "Actualizaciones de la app"),
                        subtitle = otaRowSubtitle,
                        iconRes = R.drawable.ic_solar_cloud_download_linear,
                        palette = palette,
                        badge = if (hasOtaUpdate) {
                            {
                                Surface(
                                    shape = RoundedCornerShape(28.dp),
                                    color = AfroOrange.copy(alpha = 0.14f),
                                    border = BorderStroke(1.dp, AfroOrange.copy(alpha = 0.35f)),
                                    modifier = Modifier.padding(top = 6.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(6.dp)
                                                .clip(CircleShape)
                                                .background(AfroOrange)
                                        )
                                        Text(
                                            text = "Nouvelle mise à jour disponible",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = AfroOrange
                                        )
                                    }
                                }
                            }
                        } else {
                            null
                        }
                    ) {
                        afroHaptics.navigationTap()
                        showOtaUpdateSheet = true
                    }
                }

                Surface(
                    shape = RoundedCornerShape(28.dp),
                    color = Color(0xFFEF4444).copy(alpha = 0.08f),
                    border = BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.25f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .clip(RoundedCornerShape(28.dp))
                        .clickable {
                            afroHaptics.navigationTap()
                            showSignOutConfirmDialog = true
                        }
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = tr("Déconnexion", "Sign out", "Cerrar sesión"),
                            color = Color(0xFFEF4444),
                            fontSize = 14.5.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
        } else {
            val subPageTitle = when (activeGroup) {
                "appearance" -> tr("Personnalisation", "Personalization", "Personalización")
                "culinary" -> tr("Préférences culinaires", "Culinary preferences", "Preferencias culinarias")
                "assistant" -> tr("Chef IA & Frigo Magique", "AI Chef & Magic Fridge", "Chef IA y Nevera Mágica")
                "timer" -> tr("Minuteur & notifications", "Timer & notifications", "Temporizador y notificaciones")
                "storage" -> tr("Données & stockage", "Data & storage", "Datos y almacenamiento")
                "privacy" -> tr("Confidentialité & à propos", "Privacy & about", "Privacidad y acerca de")
                "bug_report" -> tr("Signaler un bug", "Report a bug", "Reportar un error")
                "updates" -> tr("Mises à jour de l'application", "App updates", "Actualizaciones de la app")
                else -> tr("Paramètres", "Settings", "Ajustes")
            }
            val subScrollState = rememberScrollState()
            val showSubDivider by remember { derivedStateOf { subScrollState.value > 6 } }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(palette.canvas)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(palette.canvas)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = {
                            afroHaptics.navigationTap()
                            selectedSettingsGroup = null
                        }) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_solar_arrow_left_linear),
                                contentDescription = "Retour aux paramètres",
                                tint = palette.title,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Text(
                            text = subPageTitle,
                            fontSize = 19.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = palette.title,
                            modifier = Modifier.nexaTitleEmphasis()
                        )
                    }
                    if (showSubDivider) {
                        HorizontalDivider(thickness = 1.dp, color = palette.border)
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(subScrollState)
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
            if (activeGroup == "appearance") {
            val currentLang = LocalAppLanguage.current
            // D. PERSONNALISATION (Live App Theme + Language + Carousel Auto-Scroll)
            ProfileSectionCard(
                title = tr("Personnalisation", "Personalization", "Personalización"),
                subtitle = tr("Apparence visuelle et langue de l'application", "Visual appearance and app language", "Apariencia visual e idioma de la aplicación"),
                palette = palette
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SettingLeadingIcon(R.drawable.ic_solar_moon_linear, palette)
                    Column {
                        Text(
                            text = tr("Thème de l'interface", "Interface theme", "Tema de la interfaz"),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = palette.title
                        )
                        Text(
                            text = tr("Basculer entre le mode clair, sombre ou système", "Switch between light, dark or system mode", "Cambiar entre modo claro, oscuro o sistema"),
                            fontSize = 11.5.sp,
                            color = palette.muted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Anti-Slop Clean Neutral Segmented Switcher
                CleanSegmentedSwitcher(
                    options = AppThemeMode.entries.map { translateThemeLabel(it.id, currentLang) },
                    selectedIndex = AppThemeMode.entries.indexOf(userPrefs.themeMode),
                    palette = palette,
                    onSelect = { idx ->
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        val mode = AppThemeMode.entries[idx]
                        coroutineScope.launch { prefsRepo.setThemeMode(mode) }
                    }
                )

                SectionDivider(palette)

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SettingLeadingIcon(R.drawable.ic_solar_globe_linear, palette)
                    Column {
                        Text(
                            text = tr("Langue de l'application", "App language", "Idioma de la aplicación"),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = palette.title
                        )
                        Text(
                            text = tr(
                                "Traduit l'interface tout en gardant les noms authentiques des plats",
                                "Translates the interface while keeping authentic dish names",
                                "Traduce la interfaz conservando los nombres auténticos de los platos"
                            ),
                            fontSize = 11.5.sp,
                            color = palette.muted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                CleanSegmentedSwitcher(
                    options = AppLanguage.entries.map { it.label },
                    selectedIndex = AppLanguage.entries.indexOf(userPrefs.language),
                    palette = palette,
                    onSelect = { idx ->
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        val lang = AppLanguage.entries[idx]
                        coroutineScope.launch { prefsRepo.setLanguage(lang) }
                    }
                )

                SectionDivider(palette)

                ProfileToggleRow(
                    iconRes = R.drawable.ic_solar_slider_vertical_linear,
                    title = tr("Rotation auto du carrousel d'accueil", "Auto-rotate home carousel", "Rotación automática del carrusel"),
                    subtitle = tr(
                        "Fait défiler doucement les plats vedettes au repos (le swipe infini reste actif)",
                        "Gently scrolls featured dishes when idle (infinite swipe remains active)",
                        "Desplaza suavemente los platos destacados en reposo (el deslizamiento sigue activo)"
                    ),
                    checked = userPrefs.carouselAutoScroll,
                    palette = palette,
                    onCheckedChange = { enabled ->
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        coroutineScope.launch { prefsRepo.setCarouselAutoScroll(enabled) }
                    }
                )
            }
            }

            if (activeGroup == "culinary") {
            // E. CALIBRATION CULINAIRE & RECETTES (Directly drives RecipeDetailScreen)
            ProfileSectionCard(
                title = "Préférences Culinaires",
                subtitle = "Ces réglages s'appliquent directement dans vos fiches recettes",
                palette = palette
            ) {
                // 1. Default Servings Stepper
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        SettingLeadingIcon(R.drawable.ic_solar_users_linear, palette)
                        Column {
                            Text(
                                text = "Portions par défaut",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = palette.title
                            )
                            Text(
                                text = "Recalcule automatiquement les ingrédients à l'ouverture d'un plat",
                                fontSize = 11.5.sp,
                                color = palette.muted
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        SmallCircleStepperButton(
                            iconRes = R.drawable.ic_solar_minus_linear,
                            enabled = userPrefs.defaultServings > 1,
                            palette = palette,
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                coroutineScope.launch {
                                    prefsRepo.setDefaultServings(userPrefs.defaultServings - 1)
                                }
                            }
                        )
                        Text(
                            text = "${userPrefs.defaultServings} pers.",
                            style = TextStyle(
                                fontFamily = NexaFontFamily,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 13.5.sp,
                                fontFeatureSettings = "tnum"
                            ),
                            color = palette.title
                        )
                        SmallCircleStepperButton(
                            iconRes = R.drawable.ic_solar_add_linear,
                            enabled = userPrefs.defaultServings < 20,
                            palette = palette,
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                coroutineScope.launch {
                                    prefsRepo.setDefaultServings(userPrefs.defaultServings + 1)
                                }
                            }
                        )
                    }
                }

                SectionDivider(palette)

                // 2. Diaspora Mode Toggle
                ProfileToggleRow(
                    iconRes = R.drawable.ic_solar_globe_linear,
                    title = "Mode Cuisine Diaspora",
                    subtitle = "Affiche en haut des ingrédients les alternatives accessibles hors d'Afrique",
                    checked = userPrefs.diasporaSubstitutesFirst,
                    palette = palette,
                    onCheckedChange = { enabled ->
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        coroutineScope.launch { prefsRepo.setDiasporaSubstitutesFirst(enabled) }
                    }
                )

                SectionDivider(palette)

                // 3. Keep Screen Awake in Recipes
                ProfileToggleRow(
                    iconRes = R.drawable.ic_solar_smartphone_linear,
                    title = "Écran toujours allumé en recette",
                    subtitle = "Évite que l'écran ne s'éteigne pendant que vous cuisinez les mains prises",
                    checked = userPrefs.keepScreenOnInRecipe,
                    palette = palette,
                    onCheckedChange = { enabled ->
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        coroutineScope.launch { prefsRepo.setKeepScreenOnInRecipe(enabled) }
                    }
                )
            }
            }

            if (activeGroup == "assistant") {
            // F. ASSISTANT VOCAL CHEF IA & FRIGO MAGIQUE (Connected to GeminiVoicePreferences)
            ProfileSectionCard(
                title = "Chef IA Vocal & Frigo Magique",
                subtitle = "Voix conversationnelle Gemini Live et configuration IA",
                trailingAction = {
                    Surface(
                        shape = ExpressivePillShape,
                        color = palette.subtleSurface,
                        border = BorderStroke(1.dp, palette.border),
                        modifier = Modifier
                            .clip(ExpressivePillShape)
                            .clickable {
                                afroHaptics.navigationTap()
                                onNavigateToAiChef()
                            }
                    ) {
                        Text(
                            text = "Ouvrir l'IA",
                            color = palette.title,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                },
                palette = palette
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SettingLeadingIcon(R.drawable.ic_solar_microphone_linear, palette)
                    Column {
                        Text(
                            text = "Voix du Chef IA (${GeminiVoiceCatalog.byId(selectedVoiceId).displayName})",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = palette.title
                        )
                        Text(
                            text = GeminiVoiceCatalog.byId(selectedVoiceId).tagline,
                            fontSize = 11.5.sp,
                            color = palette.muted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    flingBehavior = rememberSmoothFlingBehavior()
                ) {
                    items(GeminiVoiceCatalog.voices, key = { it.id }) { voice ->
                        val active = voice.id == selectedVoiceId
                        Surface(
                            shape = RoundedCornerShape(28.dp),
                            color = if (active) palette.title else palette.subtleSurface,
                            border = BorderStroke(
                                1.dp,
                                if (active) palette.title else palette.border
                            ),
                            modifier = Modifier
                                .width(134.dp)
                                .clip(RoundedCornerShape(28.dp))
                                .clickable {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    coroutineScope.launch { voicePrefs.setSelectedVoice(voice.id) }
                                }
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = voice.displayName,
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = if (active) palette.card else palette.title
                                    )
                                    if (active) {
                                        Icon(
                                            painter = painterResource(id = R.drawable.ic_solar_check_linear),
                                            contentDescription = null,
                                            tint = palette.card,
                                            modifier = Modifier.size(15.dp)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(3.dp))
                                Text(
                                    text = voice.tagline,
                                    fontSize = 11.sp,
                                    color = if (active) palette.card.copy(alpha = 0.78f) else palette.muted,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }
            }

            if (activeGroup == "timer") {
            // G. MINUTEUR & LIVE UPDATES ANDROID 17
            ProfileSectionCard(
                title = "Minuteur & Barre de Statut",
                subtitle = "Contrôle du chronomètre natif et des notifications promues",
                palette = palette
            ) {
                if (timerState.isActive) {
                    Surface(
                        shape = RoundedCornerShape(28.dp),
                        color = AfroOrange.copy(alpha = 0.10f),
                        border = BorderStroke(1.dp, AfroOrange.copy(alpha = 0.40f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (timerState.recipeId.isNotBlank()) {
                                    onNavigateToRecipeDetail(timerState.recipeId)
                                }
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_stopwatch_linear),
                                    contentDescription = null,
                                    tint = AfroOrange,
                                    modifier = Modifier.size(20.dp)
                                )
                                Column {
                                    Text(
                                        text = "${timerState.formattedTime} · ${timerState.recipeName}",
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = palette.title,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = if (timerState.isRunning) "Minuteur en cours · Voir le plat" else "Minuteur en pause",
                                        fontSize = 11.sp,
                                        color = AfroOrange,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }

                            Text(
                                text = "Arrêter",
                                color = AfroOrange,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier
                                    .clip(ExpressivePillShape)
                                    .clickable { CookingTimerService.stop(context) }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    SectionDivider(palette)
                }

                // System Notification & Live Update Permission Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val settingsIntent = if (notificationsEnabled && !promotedLiveUpdatesEnabled) {
                                CookingTimerService.buildPromotedNotificationSettingsIntent(context)
                            } else {
                                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                                    putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                                }
                            }
                            runCatching { context.startActivity(settingsIntent) }
                        },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        SettingLeadingIcon(R.drawable.ic_solar_bell_linear, palette)
                        Column {
                            Text(
                                text = "Notifications et chronomètre",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = palette.title
                            )
                            Text(
                                text = when {
                                    !notificationsEnabled -> "Désactivées · Appuyer pour autoriser"
                                    !promotedLiveUpdatesEnabled -> "Actives · Activer le chronomètre en direct"
                                    else -> "Chronomètre barre de statut & alertes actifs"
                                },
                                fontSize = 11.5.sp,
                                color = if (notificationsEnabled && promotedLiveUpdatesEnabled) AccentEmerald else AfroOrange,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    Surface(
                        shape = ExpressivePillShape,
                        color = if (notificationsEnabled) AccentEmerald.copy(alpha = 0.14f) else AfroOrange.copy(alpha = 0.14f)
                    ) {
                        Text(
                            text = if (notificationsEnabled) "Actif" else "Activer",
                            color = if (notificationsEnabled) AccentEmerald else AfroOrange,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                        )
                    }
                }

                SectionDivider(palette)

                ProfileToggleRow(
                    iconRes = R.drawable.ic_solar_stopwatch_linear,
                    title = "Vibration de fin de cuisson",
                    subtitle = "Émet une alerte vibrante dès que le minuteur atteint zéro",
                    checked = userPrefs.timerVibrationEnabled,
                    palette = palette,
                    onCheckedChange = { enabled ->
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        coroutineScope.launch { prefsRepo.setTimerVibrationEnabled(enabled) }
                    }
                )
            }
            }

            if (activeGroup == "storage") {
            // H. ENTRETIEN DU MARCHÉ & CACHE HORS-LIGNE (Real storage & cart maintenance)
            ProfileSectionCard(
                title = "Données & Stockage Local",
                subtitle = "Entretien réel de votre panier et du cache photos hors-ligne",
                palette = palette
            ) {
                // 1. Clear bought items from Market
                ActionMaintenanceRow(
                    iconRes = R.drawable.ic_solar_trash_linear,
                    title = "Nettoyer les articles cochés du marché",
                    subtitle = if (checkedMarketCount > 0) {
                        "$checkedMarketCount article(s) déjà acheté(s) prêt(s) à être retiré(s)"
                    } else {
                        "Aucun article coché en attente de suppression"
                    },
                    actionLabel = if (checkedMarketCount > 0) "Vider ($checkedMarketCount)" else "À jour",
                    actionEnabled = checkedMarketCount > 0,
                    palette = palette,
                    onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                        shoppingRepository.clearCheckedItems()
                        statusBannerMessage = "Articles cochés retirés de Mon marché"
                    }
                )

                SectionDivider(palette)

                // 2. Clear Coil Image Cache
                ActionMaintenanceRow(
                    iconRes = R.drawable.ic_solar_broom_linear,
                    title = "Cache photos des recettes",
                    subtitle = "Espace occupé : ${formatStorageSize(imageCacheBytes)}",
                    actionLabel = if (imageCacheBytes > 0L) "Libérer" else "Vide",
                    actionEnabled = imageCacheBytes > 0L,
                    palette = palette,
                    onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                        coroutineScope.launch {
                            withContext(Dispatchers.IO) {
                                runCatching { context.imageLoader.diskCache?.clear() }
                                runCatching { context.imageLoader.memoryCache?.clear() }
                                imageCacheBytes = computeDirectoryBytes(
                                    context.cacheDir.resolve("coil_image_cache")
                                )
                            }
                            statusBannerMessage = "Cache d'images vidé avec succès"
                        }
                    }
                )

                SectionDivider(palette)

                // 3. Reset Culinary Preferences
                ActionMaintenanceRow(
                    iconRes = R.drawable.ic_solar_restart_linear,
                    title = "Réinitialiser les réglages culinaires",
                    subtitle = "Restaure portions (4 pers.), thème système et options par défaut",
                    actionLabel = "Réinitialiser",
                    actionEnabled = true,
                    palette = palette,
                    onClick = { showResetConfirmDialog = true }
                )
            }
            }

            if (activeGroup == "privacy") {
                ProfileSectionCard(
                    title = "Protection de vos données",
                    subtitle = "Vos informations restent sous votre contrôle",
                    palette = palette
                ) {
                    Text(
                        text = "Vos recettes favorites, votre panier de marché, vos préférences culinaires et votre photo de profil sont enregistrés localement sur votre appareil. AfroCuisto ne revend aucune donnée personnelle et n'effectue aucun pistage publicitaire.",
                        fontSize = 13.sp,
                        lineHeight = 19.sp,
                        color = palette.body
                    )
                }

                ProfileSectionCard(
                    title = "Permissions utilisées",
                    subtitle = "Accès strictement liés aux fonctionnalités actives",
                    palette = palette
                ) {
                    Text(
                        text = "• Microphone : activé uniquement lors de la dictée vocale ou du mode vocal en direct.\n• Notifications : minuteur de cuisson et alertes en direct.\n• Galerie photo : import de votre photo de profil ou de vos plats.\n• Mises à jour : téléchargement et installation des nouveautés de l'application.",
                        fontSize = 12.5.sp,
                        lineHeight = 19.sp,
                        color = palette.body
                    )
                }

                ProfileSectionCard(
                    title = "Mentions & conditions",
                    subtitle = "AfroCuisto ${BuildConfig.VERSION_NAME}",
                    palette = palette
                ) {
                    Text(
                        text = "AfroCuisto — Compagnon culinaire dédié aux cuisines d'Afrique de l'Ouest et du monde. Les suggestions nutritionnelles et temps de cuisson sont fournis à titre indicatif.",
                        fontSize = 12.5.sp,
                        lineHeight = 18.sp,
                        color = palette.muted
                    )
                }
            }

            if (activeGroup == "bug_report") {
                BugReportSubPage(
                    bugReportRepository = bugReportRepo,
                    userPrefs = userPrefs,
                    authSession = authSession,
                    isDark = isDark,
                    canvasColor = palette.canvas,
                    cardColor = palette.card,
                    subtleSurfaceColor = palette.subtleSurface,
                    borderColor = palette.border,
                    titleColor = palette.title,
                    bodyColor = palette.body,
                    mutedColor = palette.muted,
                    onReportSubmitted = { msg ->
                        statusBannerMessage = msg
                    }
                )
            }

            if (activeGroup == "updates") {
                val animatedOtaProgress by animateFloatAsState(
                    targetValue = otaState.progress,
                    animationSpec = spring(dampingRatio = 0.85f, stiffness = Spring.StiffnessMediumLow),
                    label = "otaPageProgress"
                )
                ProfileSectionCard(
                    title = "Version installée : ${otaState.currentVersionName}",
                    subtitle = when (otaState.status) {
                        OtaStatus.IDLE -> "Prêt à vérifier"
                        OtaStatus.CHECKING -> "Recherche en cours..."
                        OtaStatus.UP_TO_DATE -> "Votre application est à jour"
                        OtaStatus.UPDATE_AVAILABLE -> "Nouvelle mise à jour disponible"
                        OtaStatus.DOWNLOADING -> "Téléchargement en cours"
                        OtaStatus.READY_TO_INSTALL -> "Prête à installer"
                        OtaStatus.ERROR -> "Connexion impossible"
                    },
                    palette = palette
                ) {
                    Text(
                        text = otaState.message,
                        fontSize = 13.sp,
                        lineHeight = 19.sp,
                        color = palette.body
                    )

                    otaState.availableRelease?.let { rel ->
                        if (rel.releaseNotes.isNotBlank()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = rel.releaseNotes,
                                fontSize = 12.5.sp,
                                lineHeight = 18.sp,
                                color = palette.muted
                            )
                        }
                    }

                    if (otaState.status == OtaStatus.DOWNLOADING) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(28.dp))
                                .background(palette.segmentedTrack)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(animatedOtaProgress)
                                    .fillMaxHeight()
                                    .clip(RoundedCornerShape(28.dp))
                                    .background(Brush.horizontalGradient(listOf(AfroOrange, AccentEmerald)))
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${OtaUpdateManager.formatBytes(otaState.downloadedBytes)} / ${OtaUpdateManager.formatBytes(otaState.totalBytes)}",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = palette.muted
                            )
                            Text(
                                text = "${(otaState.progress * 100).toInt()}% • ${OtaUpdateManager.formatSpeed(otaState.speedBytesPerSec)}",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = AfroOrange
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    when (otaState.status) {
                        OtaStatus.UPDATE_AVAILABLE -> {
                            Button(
                                onClick = {
                                    afroHaptics.actionSuccess()
                                    otaManager.startHighSpeedDownload(coroutineScope)
                                },
                                shape = RoundedCornerShape(28.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = AfroOrange, contentColor = Color.White),
                                modifier = Modifier.fillMaxWidth().height(48.dp)
                            ) {
                                Text("Télécharger la mise à jour", fontWeight = FontWeight.Bold)
                            }
                        }
                        OtaStatus.DOWNLOADING -> {
                            Button(
                                onClick = {
                                    afroHaptics.navigationTap()
                                    otaManager.cancelDownload()
                                },
                                shape = RoundedCornerShape(28.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = palette.subtleSurface, contentColor = palette.title),
                                modifier = Modifier.fillMaxWidth().height(48.dp)
                            ) {
                                Text("Annuler le téléchargement", fontWeight = FontWeight.Bold)
                            }
                        }
                        OtaStatus.READY_TO_INSTALL -> {
                            Button(
                                onClick = {
                                    afroHaptics.actionSuccess()
                                    val launched = otaManager.launchInstall(context)
                                    if (!launched) {
                                        statusBannerMessage = "Autorisez l'installation d'applications pour finaliser la mise à jour"
                                    }
                                },
                                shape = RoundedCornerShape(28.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = AccentEmerald, contentColor = Color.White),
                                modifier = Modifier.fillMaxWidth().height(48.dp)
                            ) {
                                Text("Installer maintenant", fontWeight = FontWeight.Bold)
                            }
                        }
                        else -> {
                            Button(
                                onClick = {
                                    afroHaptics.navigationTap()
                                    otaManager.checkForUpdates(coroutineScope)
                                },
                                enabled = otaState.status != OtaStatus.CHECKING,
                                shape = RoundedCornerShape(28.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = AfroOrange, contentColor = Color.White),
                                modifier = Modifier.fillMaxWidth().height(48.dp)
                            ) {
                                Text(
                                    text = if (otaState.status == OtaStatus.CHECKING) "Vérification en cours..." else "Vérifier les mises à jour",
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }

    // =========================================================================
    // MODALS & DIALOGS
    // =========================================================================

    if (showPrivacySheet) {
        PrivacyAndAboutBottomSheet(
            palette = palette,
            onDismiss = { showPrivacySheet = false }
        )
    }

    if (showOtaUpdateSheet) {
        OtaUpdateBottomSheet(
            otaState = otaState,
            palette = palette,
            onCheck = {
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                otaManager.checkForUpdates(coroutineScope)
            },
            onDownload = {
                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                otaManager.startHighSpeedDownload(coroutineScope)
            },
            onCancelDownload = {
                otaManager.cancelDownload()
            },
            onInstall = {
                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                val launched = otaManager.launchInstall(context)
                if (!launched) {
                    statusBannerMessage = "Autorisez l'installation d'applications pour finaliser la mise à jour"
                }
            },
            onDismiss = { showOtaUpdateSheet = false }
        )
    }

    if (showAccountInfoSheet) {
        AccountDetailsBottomSheet(
            userPrefs = userPrefs,
            authSession = authSession,
            masteryRank = masteryRank,
            palette = palette,
            onEditProfile = {
                showAccountInfoSheet = false
                showEditIdentitySheet = true
            },
            onConnectAccount = {
                showAccountInfoSheet = false
                onNavigateToLogin()
            },
            onDismiss = { showAccountInfoSheet = false }
        )
    }

    if (showEditIdentitySheet) {
        EditIdentityBottomSheet(
            initialPrefs = userPrefs,
            palette = palette,
            onDismiss = { showEditIdentitySheet = false },
            onImportAvatar = { uri -> prefsRepo.importAvatar(uri) },
            onSave = { name, role, bio, terroir, avatar ->
                coroutineScope.launch {
                    prefsRepo.updateIdentity(
                        displayName = name,
                        roleTitle = role,
                        bio = bio,
                        favoriteTerroir = terroir,
                        avatarUrl = avatar
                    )
                    authRepo.syncIdentityToRemote(
                        displayName = name,
                        favoriteTerroir = terroir,
                        bio = bio
                    )
                    showEditIdentitySheet = false
                    statusBannerMessage = "Profil culinaire enregistré"
                }
            }
        )
    }

    if (showCookedHistorySheet) {
        ModalBottomSheet(
            onDismissRequest = { showCookedHistorySheet = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = palette.card,
            scrimColor = Color(0xFF0F172A).copy(alpha = 0.45f)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 22.dp, vertical = 10.dp)
            ) {
                Text(
                    text = "Plats cuisinés (${cookedRecipes.size})",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = palette.title
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Terminez toutes les étapes d'une fiche recette pour l'ajouter automatiquement ici.",
                    fontSize = 12.5.sp,
                    color = palette.muted
                )
                Spacer(modifier = Modifier.height(16.dp))

                if (cookedRecipes.isEmpty()) {
                    Text(
                        text = "Aucun plat terminé pour le moment.",
                        color = palette.muted,
                        fontSize = 13.5.sp,
                        modifier = Modifier.padding(vertical = 20.dp)
                    )
                } else {
                    cookedRecipes.forEach { recipe ->
                        Surface(
                            shape = RoundedCornerShape(28.dp),
                            color = palette.subtleSurface,
                            border = BorderStroke(1.dp, palette.border),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 10.dp)
                                .clip(RoundedCornerShape(28.dp))
                                .clickable {
                                    showCookedHistorySheet = false
                                    onNavigateToRecipeDetail(recipe.id)
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AsyncImage(
                                    model = recipe.image,
                                    contentDescription = recipe.name,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(52.dp)
                                        .clip(RoundedCornerShape(28.dp))
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = recipe.name,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 14.sp,
                                        color = palette.title,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "${recipe.region} · ${recipe.cookTime}",
                                        fontSize = 12.sp,
                                        color = palette.muted
                                    )
                                }
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_alt_arrow_right_linear),
                                    contentDescription = null,
                                    tint = palette.muted,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))
            }
        }
    }

    if (showResetConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showResetConfirmDialog = false },
            shape = RoundedCornerShape(28.dp),
            containerColor = palette.card,
            title = {
                Text(
                    text = "Réinitialiser les réglages ?",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 17.sp,
                    color = palette.title
                )
            },
            text = {
                Text(
                    text = "Vos portions par défaut (4 pers.), thème, tolérance au piment et préférences de recette reviendront aux valeurs initiales. Vos favoris et votre panier sont conservés.",
                    fontSize = 13.sp,
                    lineHeight = 19.sp,
                    color = palette.muted
                )
            },
            dismissButton = {
                TextButton(onClick = { showResetConfirmDialog = false }) {
                    Text("Annuler", color = palette.muted, fontWeight = FontWeight.Bold)
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        coroutineScope.launch {
                            prefsRepo.resetCulinaryPreferences()
                            showResetConfirmDialog = false
                            statusBannerMessage = "Réglages culinaires réinitialisés"
                        }
                    }
                ) {
                    Text("Confirmer", color = AfroOrange, fontWeight = FontWeight.ExtraBold)
                }
            }
        )
    }

    if (showSignOutConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showSignOutConfirmDialog = false },
            shape = RoundedCornerShape(28.dp),
            containerColor = palette.card,
            title = {
                Text(
                    text = "Se déconnecter ?",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 17.sp,
                    color = palette.title
                )
            },
            text = {
                Text(
                    text = "Vous devrez vous reconnecter pour accéder à vos recettes, vos favoris et votre panier synchronisé.",
                    fontSize = 13.sp,
                    lineHeight = 19.sp,
                    color = palette.muted
                )
            },
            dismissButton = {
                TextButton(onClick = { showSignOutConfirmDialog = false }) {
                    Text("Annuler", color = palette.muted, fontWeight = FontWeight.Bold)
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        coroutineScope.launch {
                            authRepo.signOut()
                            showSignOutConfirmDialog = false
                            onNavigateToLogin()
                        }
                    }
                ) {
                    Text("Déconnexion", color = Color(0xFFEF4444), fontWeight = FontWeight.ExtraBold)
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AccountDetailsBottomSheet(
    userPrefs: UserPreferencesState,
    authSession: AuthSessionState,
    masteryRank: CulinaryMasteryRank,
    palette: ProfilePalette,
    onEditProfile: () -> Unit,
    onConnectAccount: () -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        containerColor = palette.card,
        scrimColor = Color(0xFF0F172A).copy(alpha = 0.45f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 22.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header with avatar & status
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(palette.subtleSurface, CircleShape)
                        .border(1.5.dp, palette.border, CircleShape)
                        .padding(3.dp)
                ) {
                    AsyncImage(
                        model = userPrefs.avatarUrl,
                        contentDescription = userPrefs.displayName,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                    )
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = userPrefs.displayName,
                        fontSize = 19.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = palette.title
                    )
                    Surface(
                        shape = ExpressivePillShape,
                        color = if (authSession.isAuthenticated) {
                            AccentEmerald.copy(alpha = 0.14f)
                        } else {
                            AfroOrange.copy(alpha = 0.14f)
                        }
                    ) {
                        Text(
                            text = when {
                                authSession.isAuthenticated && authSession.isEmailVerified -> "Compte vérifié"
                                authSession.isAuthenticated -> "Compte connecté"
                                else -> "Session invité"
                            },
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (authSession.isAuthenticated) AccentEmerald else AfroOrange,
                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
                        )
                    }
                }
            }

            // Account fields card
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = palette.subtleSurface,
                border = BorderStroke(1.dp, palette.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    AccountInfoDetailRow(
                        label = "Nom / Pseudo",
                        value = userPrefs.displayName,
                        palette = palette
                    )
                    HorizontalDivider(color = palette.border)
                    AccountInfoDetailRow(
                        label = "Adresse e-mail",
                        value = authSession.email.ifBlank { "Non renseignée (mode invité)" },
                        palette = palette
                    )
                    HorizontalDivider(color = palette.border)
                    AccountInfoDetailRow(
                        label = "Signature culinaire",
                        value = userPrefs.roleTitle,
                        palette = palette
                    )
                    HorizontalDivider(color = palette.border)
                    AccountInfoDetailRow(
                        label = "Terroir favori",
                        value = userPrefs.favoriteTerroir,
                        palette = palette
                    )
                    HorizontalDivider(color = palette.border)
                    AccountInfoDetailRow(
                        label = "Rang & maîtrise",
                        value = "${masteryRank.title} (${masteryRank.points} pts)",
                        palette = palette
                    )
                    if (userPrefs.bio.isNotBlank()) {
                        HorizontalDivider(color = palette.border)
                        AccountInfoDetailRow(
                            label = "Bio",
                            value = userPrefs.bio,
                            palette = palette
                        )
                    }
                    if (authSession.isAuthenticated && authSession.userId.isNotBlank()) {
                        HorizontalDivider(color = palette.border)
                        AccountInfoDetailRow(
                            label = "Identifiant compte",
                            value = "${authSession.userId.take(8)}…",
                            palette = palette
                        )
                    }
                }
            }

            // Action buttons
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = onEditProfile,
                    shape = RoundedCornerShape(28.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = AfroOrange,
                        contentColor = Color.White
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text(
                        text = "Modifier mon profil",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 14.sp
                    )
                }

                if (!authSession.isAuthenticated) {
                    Surface(
                        shape = RoundedCornerShape(28.dp),
                        color = palette.subtleSurface,
                        border = BorderStroke(1.dp, palette.border),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp)
                            .clip(RoundedCornerShape(28.dp))
                            .clickable(onClick = onConnectAccount)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = "Se connecter / Créer un compte",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.5.sp,
                                color = palette.title
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
        }
    }
}

@Composable
private fun AccountInfoDetailRow(
    label: String,
    value: String,
    palette: ProfilePalette
) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = palette.muted
        )
        Text(
            text = value,
            fontSize = 13.5.sp,
            fontWeight = FontWeight.SemiBold,
            color = palette.title,
            lineHeight = 19.sp
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun EditIdentityBottomSheet(
    initialPrefs: UserPreferencesState,
    palette: ProfilePalette,
    onDismiss: () -> Unit,
    onImportAvatar: suspend (Uri) -> String?,
    onSave: (String, String, String, String, String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var draftName by remember(initialPrefs) { mutableStateOf(initialPrefs.displayName) }
    var draftRole by remember(initialPrefs) { mutableStateOf(initialPrefs.roleTitle) }
    var draftBio by remember(initialPrefs) { mutableStateOf(initialPrefs.bio) }
    var draftTerroir by remember(initialPrefs) { mutableStateOf(initialPrefs.favoriteTerroir) }
    var draftAvatar by remember(initialPrefs) { mutableStateOf(initialPrefs.avatarUrl) }
    val avatarPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            coroutineScope.launch {
                onImportAvatar(uri)?.let { draftAvatar = it }
            }
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        containerColor = palette.card,
        scrimColor = Color(0xFF0F172A).copy(alpha = 0.45f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 22.dp, vertical = 8.dp)
        ) {
            Text(
                text = "Modifier mon identité culinaire",
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = palette.title
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Photo de profil",
                fontSize = 12.5.sp,
                fontWeight = FontWeight.Bold,
                color = palette.muted
            )
            Spacer(modifier = Modifier.height(10.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .clip(CircleShape)
                        .border(2.dp, AfroOrange, CircleShape)
                        .clickable { avatarPicker.launch("image/*") }
                        .padding(3.dp),
                    contentAlignment = Alignment.Center
                ) {
                    val hasUserPhoto = draftAvatar.isNotBlank() &&
                        draftAvatar !in UserPreferencesRepository.AVATAR_PRESETS
                    if (hasUserPhoto || draftAvatar.isNotBlank()) {
                        AsyncImage(
                            model = draftAvatar,
                            contentDescription = "Photo de profil de $draftName",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .background(AfroOrange.copy(alpha = 0.14f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = draftName.trim().take(1).uppercase().ifBlank { "A" },
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = AfroOrange
                            )
                        }
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    TextButton(
                        onClick = { avatarPicker.launch("image/*") },
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "Choisir une photo personnelle",
                            color = AfroOrange,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Text(
                        text = "Importée depuis votre galerie",
                        fontSize = 11.5.sp,
                        color = palette.muted,
                        modifier = Modifier.padding(start = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text("Nom ou pseudo", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = palette.muted)
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedTextField(
                value = draftName,
                onValueChange = { draftName = it },
                singleLine = true,
                shape = RoundedCornerShape(28.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AfroOrange,
                    unfocusedBorderColor = palette.border
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(14.dp))

            Text("Signature culinaire", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = palette.muted)
            Spacer(modifier = Modifier.height(8.dp))
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                UserPreferencesRepository.ROLE_OPTIONS.forEach { role ->
                    SelectableChipPill(
                        label = role,
                        selected = draftRole == role,
                        palette = palette,
                        onClick = { draftRole = role }
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text("Terroir favori", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = palette.muted)
            Spacer(modifier = Modifier.height(8.dp))
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                UserPreferencesRepository.TERROIR_OPTIONS.forEach { terroir ->
                    SelectableChipPill(
                        label = terroir,
                        selected = draftTerroir == terroir,
                        palette = palette,
                        onClick = { draftTerroir = terroir }
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text("Présentation", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = palette.muted)
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedTextField(
                value = draftBio,
                onValueChange = { draftBio = it },
                maxLines = 3,
                shape = RoundedCornerShape(28.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AfroOrange,
                    unfocusedBorderColor = palette.border
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = { onSave(draftName, draftRole, draftBio, draftTerroir, draftAvatar) },
                shape = RoundedCornerShape(28.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = AfroOrange,
                    contentColor = Color.White
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("Enregistrer mon profil", fontWeight = FontWeight.ExtraBold, fontSize = 14.5.sp)
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

// =============================================================================
// REUSABLE ATOMS & MOLECULES
// =============================================================================

@Composable
private fun ProfileSettingsGroupRow(
    title: String,
    subtitle: String,
    @DrawableRes iconRes: Int,
    palette: ProfilePalette,
    badge: (@Composable () -> Unit)? = null,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        SettingLeadingIcon(iconRes, palette)
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = palette.title, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(2.dp))
            Text(subtitle, color = palette.muted, fontSize = 11.5.sp)
            badge?.invoke()
        }
        Icon(
            painter = painterResource(id = R.drawable.ic_solar_alt_arrow_right_linear),
            contentDescription = null,
            tint = palette.muted,
            modifier = Modifier.size(18.dp)
        )
    }
}

@Composable
private fun ProfileSettingsGroupHeader(
    title: String,
    palette: ProfilePalette,
    onBack: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        IconButton(onClick = onBack, modifier = Modifier.size(40.dp)) {
            Icon(
                painter = painterResource(id = R.drawable.ic_solar_arrow_left_linear),
                contentDescription = "Retour aux paramètres",
                tint = palette.title,
                modifier = Modifier.size(22.dp)
            )
        }
        Text(title, color = palette.title, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
    }
}

@Composable
private fun ProfileSectionCard(
    title: String,
    subtitle: String,
    palette: ProfilePalette,
    trailingAction: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = palette.card),
        border = BorderStroke(1.dp, palette.border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = palette.title,
                        modifier = Modifier.nexaTitleEmphasis()
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = subtitle,
                        fontSize = 11.5.sp,
                        color = palette.muted
                    )
                }
                if (trailingAction != null) {
                    Spacer(modifier = Modifier.width(8.dp))
                    trailingAction()
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            content()
        }
    }
}

@Composable
private fun DashboardMetricCard(
    label: String,
    value: String,
    @DrawableRes iconRes: Int,
    palette: ProfilePalette,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = palette.card),
        border = BorderStroke(1.dp, palette.border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = modifier.height(104.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(palette.subtleSurface)
                    .border(1.dp, palette.border, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = iconRes),
                    contentDescription = null,
                    tint = palette.title,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                style = TextStyle(
                    fontFamily = NexaFontFamily,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    fontFeatureSettings = "tnum"
                ),
                color = palette.title
            )
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = palette.muted,
                maxLines = 1
            )
        }
    }
}

@Composable
private fun MiniRecipePreviewCard(
    recipe: Recipe,
    palette: ProfilePalette,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(28.dp),
        color = palette.subtleSurface,
        border = BorderStroke(1.dp, palette.border),
        modifier = Modifier
            .width(154.dp)
            .clip(RoundedCornerShape(28.dp))
            .clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(8.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(86.dp)
                    .clip(RoundedCornerShape(28.dp))
            ) {
                RecipeImageOrSkeleton(
                    model = recipe.image,
                    contentDescription = recipe.name,
                    contentScale = ContentScale.Crop,
                    iconSize = 24.dp,
                    modifier = Modifier.fillMaxSize()
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.Transparent, Color.Black.copy(alpha = 0.55f))
                            )
                        )
                )
                Row(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_star_linear),
                        contentDescription = null,
                        tint = StarGold,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = String.format(Locale.FRENCH, "%.1f", recipe.rating),
                        color = Color.White,
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }
            Spacer(modifier = Modifier.height(7.dp))
            Text(
                text = recipe.name,
                fontSize = 12.5.sp,
                fontWeight = FontWeight.ExtraBold,
                color = palette.title,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "${recipe.region.substringBefore(" &")} · ${recipe.prepTime}",
                fontSize = 10.5.sp,
                color = palette.muted,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun CleanSegmentedSwitcher(
    options: List<String>,
    selectedIndex: Int,
    palette: ProfilePalette,
    onSelect: (Int) -> Unit
) {
    val trackColor by animateColorAsState(
        targetValue = palette.segmentedTrack,
        animationSpec = tween(220),
        label = "segTrackBg"
    )
    val activePillColor by animateColorAsState(
        targetValue = palette.segmentedActivePill,
        animationSpec = tween(220),
        label = "segActivePillBg"
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(41.dp),
        shape = RoundedCornerShape(28.dp),
        color = trackColor
    ) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .padding(4.dp)
        ) {
            val count = options.size.coerceAtLeast(1)
            val safeIndex = selectedIndex.coerceIn(0, count - 1)
            val tabWidth = maxWidth / count
            val indicatorOffset by animateDpAsState(
                targetValue = tabWidth * safeIndex,
                animationSpec = spring(
                    dampingRatio = 0.86f,
                    stiffness = Spring.StiffnessMediumLow
                ),
                label = "segIndicatorOffset"
            )

            Surface(
                modifier = Modifier
                    .offset(x = indicatorOffset)
                    .width(tabWidth)
                    .fillMaxHeight(),
                shape = RoundedCornerShape(28.dp),
                color = activePillColor,
                shadowElevation = 1.dp
            ) {}

            Row(modifier = Modifier.fillMaxSize()) {
                options.forEachIndexed { index, label ->
                    val active = index == safeIndex
                    val textColor by animateColorAsState(
                        targetValue = if (active) palette.title else palette.muted,
                        animationSpec = tween(180),
                        label = "segTextColor"
                    )

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clip(RoundedCornerShape(28.dp))
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) { onSelect(index) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            color = textColor,
                            fontSize = 12.sp,
                            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileToggleRow(
    @DrawableRes iconRes: Int,
    title: String,
    subtitle: String,
    checked: Boolean,
    palette: ProfilePalette,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) { onCheckedChange(!checked) },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.weight(1f)
        ) {
            SettingLeadingIcon(iconRes, palette)
            Column {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = palette.title
                )
                Text(
                    text = subtitle,
                    fontSize = 11.5.sp,
                    lineHeight = 16.sp,
                    color = palette.muted
                )
            }
        }

        Spacer(modifier = Modifier.width(10.dp))

        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = AfroOrange,
                uncheckedThumbColor = palette.muted,
                uncheckedTrackColor = palette.segmentedTrack,
                uncheckedBorderColor = palette.border
            )
        )
    }
}

@Composable
private fun ActionMaintenanceRow(
    @DrawableRes iconRes: Int,
    title: String,
    subtitle: String,
    actionLabel: String,
    actionEnabled: Boolean,
    palette: ProfilePalette,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.weight(1f)
        ) {
            SettingLeadingIcon(iconRes, palette)
            Column {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = palette.title
                )
                Text(
                    text = subtitle,
                    fontSize = 11.5.sp,
                    color = palette.muted
                )
            }
        }

        Spacer(modifier = Modifier.width(8.dp))

        Surface(
            shape = RoundedCornerShape(28.dp),
            color = if (actionEnabled) palette.subtleSurface else palette.segmentedTrack,
            border = if (actionEnabled) BorderStroke(1.dp, palette.border) else null,
            modifier = Modifier
                .clip(RoundedCornerShape(28.dp))
                .clickable(enabled = actionEnabled, onClick = onClick)
        ) {
            Text(
                text = actionLabel,
                color = if (actionEnabled) palette.title else palette.muted,
                fontSize = 11.5.sp,
                fontWeight = FontWeight.ExtraBold,
                modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp)
            )
        }
    }
}

@Composable
private fun SelectableChipPill(
    label: String,
    selected: Boolean,
    palette: ProfilePalette,
    onClick: () -> Unit
) {
    Surface(
        shape = ExpressivePillShape,
        color = if (selected) palette.title else palette.subtleSurface,
        border = BorderStroke(1.dp, if (selected) palette.title else palette.border),
        modifier = Modifier
            .clip(ExpressivePillShape)
            .clickable(onClick = onClick)
    ) {
        Text(
            text = label,
            color = if (selected) palette.card else palette.title,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 13.dp, vertical = 7.dp)
        )
    }
}

@Composable
private fun SmallCircleStepperButton(
    @DrawableRes iconRes: Int,
    enabled: Boolean,
    palette: ProfilePalette,
    onClick: () -> Unit
) {
    Surface(
        shape = CircleShape,
        color = palette.subtleSurface,
        border = BorderStroke(1.dp, palette.border),
        modifier = Modifier
            .size(28.dp)
            .clip(CircleShape)
            .clickable(enabled = enabled, onClick = onClick)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                painter = painterResource(id = iconRes),
                contentDescription = null,
                tint = if (enabled) palette.title else palette.muted,
                modifier = Modifier.size(15.dp)
            )
        }
    }
}

@Composable
private fun SettingLeadingIcon(
    @DrawableRes iconRes: Int,
    palette: ProfilePalette
) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(RoundedCornerShape(28.dp))
            .background(palette.subtleSurface)
            .border(1.dp, palette.border, RoundedCornerShape(28.dp)),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            painter = painterResource(id = iconRes),
            contentDescription = null,
            tint = palette.title,
            modifier = Modifier.size(18.dp)
        )
    }
}

@Composable
private fun SectionDivider(palette: ProfilePalette) {
    HorizontalDivider(
        modifier = Modifier.padding(vertical = 14.dp),
        thickness = 1.dp,
        color = palette.border.copy(alpha = 0.75f)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun OtaUpdateBottomSheet(
    otaState: OtaUiState,
    palette: ProfilePalette,
    onCheck: () -> Unit,
    onDownload: () -> Unit,
    onCancelDownload: () -> Unit,
    onInstall: () -> Unit,
    onDismiss: () -> Unit
) {
    val animatedProgress by animateFloatAsState(
        targetValue = otaState.progress,
        animationSpec = spring(dampingRatio = 0.85f, stiffness = Spring.StiffnessMediumLow),
        label = "otaDownloadProgress"
    )

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        containerColor = palette.card,
        scrimColor = Color(0xFF0F172A).copy(alpha = 0.45f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 22.dp, vertical = 10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(RoundedCornerShape(28.dp))
                        .background(AfroOrange.copy(alpha = 0.14f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_cloud_download_linear),
                        contentDescription = null,
                        tint = AfroOrange,
                        modifier = Modifier.size(24.dp)
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Mise à jour de l'application",
                        fontSize = 19.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = palette.title
                    )
                    Text(
                        text = "Version installée : ${otaState.currentVersionName}",
                        fontSize = 12.sp,
                        color = palette.muted
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Live Status Card
            Surface(
                shape = RoundedCornerShape(28.dp),
                color = palette.subtleSurface,
                border = BorderStroke(1.dp, palette.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = when (otaState.status) {
                                OtaStatus.IDLE -> "Prêt à vérifier"
                                OtaStatus.CHECKING -> "Recherche en cours..."
                                OtaStatus.UP_TO_DATE -> "Votre application est à jour"
                                OtaStatus.UPDATE_AVAILABLE -> "Nouvelle mise à jour disponible"
                                OtaStatus.DOWNLOADING -> "Téléchargement en cours"
                                OtaStatus.READY_TO_INSTALL -> "Prête à installer"
                                OtaStatus.ERROR -> "Connexion impossible"
                            },
                            fontSize = 14.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = when (otaState.status) {
                                OtaStatus.UP_TO_DATE, OtaStatus.READY_TO_INSTALL -> AccentEmerald
                                OtaStatus.UPDATE_AVAILABLE, OtaStatus.DOWNLOADING -> AfroOrange
                                OtaStatus.ERROR -> Color(0xFFEF4444)
                                else -> palette.title
                            }
                        )

                        otaState.availableRelease?.let { rel ->
                            Surface(
                                shape = RoundedCornerShape(28.dp),
                                color = AfroOrange.copy(alpha = 0.14f)
                            ) {
                                Text(
                                    text = "v${rel.versionName}",
                                    color = AfroOrange,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = otaState.message,
                        fontSize = 12.5.sp,
                        color = palette.body
                    )

                    otaState.availableRelease?.let { rel ->
                        if (rel.releaseNotes.isNotBlank()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = rel.releaseNotes,
                                fontSize = 12.sp,
                                lineHeight = 17.sp,
                                color = palette.muted
                            )
                        }
                    }

                    if (otaState.status == OtaStatus.DOWNLOADING) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(28.dp))
                                .background(palette.segmentedTrack)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(animatedProgress)
                                    .fillMaxHeight()
                                    .clip(RoundedCornerShape(28.dp))
                                    .background(
                                        Brush.horizontalGradient(listOf(AfroOrange, AccentEmerald))
                                    )
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${OtaUpdateManager.formatBytes(otaState.downloadedBytes)} / ${OtaUpdateManager.formatBytes(otaState.totalBytes)}",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = palette.muted
                            )
                            Text(
                                text = "${(otaState.progress * 100).toInt()}% • ${OtaUpdateManager.formatSpeed(otaState.speedBytesPerSec)}",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = AfroOrange
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            when (otaState.status) {
                OtaStatus.UPDATE_AVAILABLE -> {
                    Button(
                        onClick = onDownload,
                        shape = RoundedCornerShape(28.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AfroOrange,
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        Text("Télécharger la mise à jour", fontWeight = FontWeight.Bold)
                    }
                }
                OtaStatus.DOWNLOADING -> {
                    Button(
                        onClick = onCancelDownload,
                        shape = RoundedCornerShape(28.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = palette.subtleSurface,
                            contentColor = palette.title
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        Text("Annuler le téléchargement", fontWeight = FontWeight.Bold)
                    }
                }
                OtaStatus.READY_TO_INSTALL -> {
                    Button(
                        onClick = onInstall,
                        shape = RoundedCornerShape(28.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AccentEmerald,
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        Text("Installer maintenant", fontWeight = FontWeight.Bold)
                    }
                }
                else -> {
                    Button(
                        onClick = onCheck,
                        enabled = otaState.status != OtaStatus.CHECKING,
                        shape = RoundedCornerShape(28.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AfroOrange,
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        Text(
                            text = if (otaState.status == OtaStatus.CHECKING) {
                                "Vérification en cours..."
                            } else {
                                "Vérifier les mises à jour"
                            },
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PrivacyAndAboutBottomSheet(
    palette: ProfilePalette,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        containerColor = palette.card,
        scrimColor = Color(0xFF0F172A).copy(alpha = 0.45f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 22.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(RoundedCornerShape(28.dp))
                        .background(palette.subtleSurface)
                        .border(1.dp, palette.border, RoundedCornerShape(28.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_shield_check_linear),
                        contentDescription = null,
                        tint = palette.title,
                        modifier = Modifier.size(24.dp)
                    )
                }
                Column {
                    Text(
                        text = "Confidentialité & à propos",
                        fontSize = 19.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = palette.title
                    )
                    Text(
                        text = "AfroCuisto ${BuildConfig.VERSION_NAME}",
                        fontSize = 12.sp,
                        color = palette.muted
                    )
                }
            }

            Surface(
                shape = RoundedCornerShape(28.dp),
                color = palette.subtleSurface,
                border = BorderStroke(1.dp, palette.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Protection de vos données",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = palette.title
                    )
                    Text(
                        text = "Vos recettes favorites, votre panier de marché, vos préférences culinaires et votre photo de profil sont enregistrés localement sur votre appareil. AfroCuisto ne revend aucune donnée personnelle et n'effectue aucun pistage publicitaire.",
                        fontSize = 12.5.sp,
                        lineHeight = 18.sp,
                        color = palette.body
                    )
                }
            }

            Surface(
                shape = RoundedCornerShape(28.dp),
                color = palette.subtleSurface,
                border = BorderStroke(1.dp, palette.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Permissions utilisées",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = palette.title
                    )
                    Text(
                        text = "• Microphone : activé uniquement lors de la dictée vocale ou du mode vocal en direct.\n• Notifications : minuteur de cuisson et alertes en direct.\n• Galerie photo : import de votre photo de profil ou de vos plats.\n• Mises à jour : téléchargement et installation des nouveautés de l'application.",
                        fontSize = 12.sp,
                        lineHeight = 18.sp,
                        color = palette.body
                    )
                }
            }

            Surface(
                shape = RoundedCornerShape(28.dp),
                color = palette.subtleSurface,
                border = BorderStroke(1.dp, palette.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "Mentions & conditions",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = palette.title
                    )
                    Text(
                        text = "AfroCuisto — Compagnon culinaire dédié aux cuisines d'Afrique de l'Ouest et du monde. Les suggestions nutritionnelles et temps de cuisson sont fournis à titre indicatif.",
                        fontSize = 12.sp,
                        lineHeight = 17.sp,
                        color = palette.muted
                    )
                }
            }

            Button(
                onClick = onDismiss,
                shape = RoundedCornerShape(28.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = AfroOrange,
                    contentColor = Color.White
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("Compris", fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

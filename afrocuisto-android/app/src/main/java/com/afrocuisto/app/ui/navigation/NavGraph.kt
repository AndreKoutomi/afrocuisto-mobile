package com.afrocuisto.app.ui.navigation

import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import coil.compose.AsyncImage
import com.afrocuisto.app.R
import com.afrocuisto.app.data.network.NetworkMonitor
import com.afrocuisto.app.data.repository.AiChefRepository
import com.afrocuisto.app.data.repository.AuthRepository
import com.afrocuisto.app.data.repository.AuthResult
import com.afrocuisto.app.data.repository.AuthSessionState
import com.afrocuisto.app.data.repository.CommunityRepository
import com.afrocuisto.app.data.repository.FavoriteAddedEvent
import com.afrocuisto.app.data.repository.RecipeRepository
import com.afrocuisto.app.data.repository.ShoppingRepository
import com.afrocuisto.app.data.repository.UserPreferencesRepository
import com.afrocuisto.app.data.repository.UserPreferencesState
import com.afrocuisto.app.service.CookingTimerService
import com.afrocuisto.app.ui.components.AdaptiveCenteredContainer
import com.afrocuisto.app.ui.components.ConnectivityBanner
import com.afrocuisto.app.ui.components.InteractiveTimerPill
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberIsTablet
import com.afrocuisto.app.ui.components.rememberKeyboardDismisser
import com.afrocuisto.app.ui.screens.aichef.AiChefScreen
import com.afrocuisto.app.ui.screens.aichef.GeminiVoiceCatalog
import com.afrocuisto.app.ui.screens.aichef.GeminiVoicePreferences
import com.afrocuisto.app.ui.screens.auth.LoginScreen
import com.afrocuisto.app.ui.screens.auth.RegisterScreen
import com.afrocuisto.app.ui.screens.community.CommunityScreen
import com.afrocuisto.app.ui.screens.favorites.FavoritesScreen
import com.afrocuisto.app.ui.screens.home.HomeScreen
import com.afrocuisto.app.ui.screens.market.MarketScreen
import com.afrocuisto.app.ui.screens.profile.ProfileScreen
import com.afrocuisto.app.ui.screens.recipe.CategoryRecipesScreen
import com.afrocuisto.app.ui.screens.recipe.RecipeDetailScreen
import com.afrocuisto.app.ui.screens.recipe.RecipeListScreen
import com.afrocuisto.app.ui.screens.splash.SplashScreen
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.ExpressivePillShape
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import com.afrocuisto.app.ui.i18n.tr
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first

@Composable
fun NavGraph(
    navController: NavHostController = rememberNavController(),
    recipeRepository: RecipeRepository = remember { RecipeRepository() },
    shoppingRepository: ShoppingRepository = remember { ShoppingRepository() },
    userPreferencesRepository: UserPreferencesRepository? = null,
    externalRecipeId: String? = null,
    onExternalRecipeConsumed: () -> Unit = {},
    externalOAuthUri: Uri? = null,
    onExternalOAuthConsumed: () -> Unit = {},
    onForceDarkSystemBarsChange: (Boolean) -> Unit = {},
    onReadyForPermissions: () -> Unit = {}
) {
    val context = LocalContext.current
    val haptics = rememberAfroHaptics()
    val prefsRepo = userPreferencesRepository
        ?: remember { UserPreferencesRepository(context.applicationContext) }
    val authRepository = remember { AuthRepository(context.applicationContext, prefsRepo) }
    val voicePrefs = remember { GeminiVoicePreferences(context.applicationContext) }
    val aiChefRepository = remember { AiChefRepository(context.applicationContext) }
    val communityRepository = remember { CommunityRepository(context.applicationContext) }
    val authSession by authRepository.sessionFlow.collectAsState(initial = AuthSessionState())
    val userPrefs by prefsRepo.preferencesFlow.collectAsState(initial = UserPreferencesState())
    val selectedVoiceId by voicePrefs.selectedVoiceId.collectAsState(initial = GeminiVoiceCatalog.voices.first().id)
    val favoriteIds by recipeRepository.favoriteIds.collectAsState(initial = emptySet())
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val dismissKeyboard = rememberKeyboardDismisser()
    val homeScrollState = rememberScrollState()
    val favoriteAddedEvent by recipeRepository.favoriteAddedEvents.collectAsState(initial = null)
    val shoppingItems by shoppingRepository.items.collectAsState()
    val archivedShoppingItems by shoppingRepository.archivedItems.collectAsState()
    val marketCurrency by shoppingRepository.currency.collectAsState()
    val timerState by CookingTimerService.timerState.collectAsState()
    val pendingMarketCount = remember(shoppingItems) { shoppingItems.count { !it.isChecked } }
    val isOnline by NetworkMonitor.isOnline.collectAsState()
    var wasOfflineForSync by remember { mutableStateOf(!isOnline) }

    var hydratedUserId by remember { mutableStateOf<String?>(null) }
    var lastSyncedFavorites by remember { mutableStateOf<Set<String>?>(null) }
    var lastSyncedCooked by remember { mutableStateOf<Set<String>?>(null) }
    var lastSyncedPrefsKey by remember { mutableStateOf<Pair<UserPreferencesState, String>?>(null) }
    var lastSyncedShoppingKey by remember { mutableStateOf<Triple<List<com.afrocuisto.app.data.model.ShoppingItem>, List<com.afrocuisto.app.data.model.ShoppingItem>, com.afrocuisto.app.data.model.MarketCurrency>?>(null) }

    LaunchedEffect(isOnline) {
        if (!isOnline) {
            wasOfflineForSync = true
        } else if (wasOfflineForSync) {
            wasOfflineForSync = false
            recipeRepository.refreshFromSupabaseAsync()
            if (authSession.isAuthenticated && authSession.userId.isNotBlank() && hydratedUserId == null) {
                val hydrated = authRepository.hydrateUserBundle(
                    recipeRepository = recipeRepository,
                    shoppingRepository = shoppingRepository,
                    voicePreferences = voicePrefs
                )
                if (hydrated) {
                    val latestPrefs = prefsRepo.preferencesFlow.first()
                    val latestVoice = voicePrefs.selectedVoiceId.first()
                    lastSyncedFavorites = recipeRepository.currentFavorites()
                    lastSyncedCooked = latestPrefs.cookedRecipeIds
                    lastSyncedPrefsKey = latestPrefs to latestVoice
                    lastSyncedShoppingKey = Triple(
                        shoppingRepository.items.value,
                        shoppingRepository.archivedItems.value,
                        shoppingRepository.currency.value
                    )
                    hydratedUserId = authSession.userId
                }
            }
        }
    }

    LaunchedEffect(authSession.isAuthenticated, authSession.userId) {
        if (authSession.isAuthenticated && authSession.userId.isNotBlank()) {
            if (hydratedUserId != authSession.userId) {
                val hydrated = authRepository.hydrateUserBundle(
                    recipeRepository = recipeRepository,
                    shoppingRepository = shoppingRepository,
                    voicePreferences = voicePrefs
                )
                if (hydrated) {
                    val latestPrefs = prefsRepo.preferencesFlow.first()
                    val latestVoice = voicePrefs.selectedVoiceId.first()
                    lastSyncedFavorites = recipeRepository.currentFavorites()
                    lastSyncedCooked = latestPrefs.cookedRecipeIds
                    lastSyncedPrefsKey = latestPrefs to latestVoice
                    lastSyncedShoppingKey = Triple(
                        shoppingRepository.items.value,
                        shoppingRepository.archivedItems.value,
                        shoppingRepository.currency.value
                    )
                    hydratedUserId = authSession.userId
                }
            }
        } else {
            hydratedUserId = null
            lastSyncedFavorites = null
            lastSyncedCooked = null
            lastSyncedPrefsKey = null
            lastSyncedShoppingKey = null
        }
    }

    LaunchedEffect(hydratedUserId, userPrefs, selectedVoiceId) {
        if (hydratedUserId != null && hydratedUserId == authSession.userId) {
            val currentKey = userPrefs to selectedVoiceId
            if (lastSyncedPrefsKey != currentKey) {
                delay(900L)
                authRepository.syncPreferencesToRemote(userPrefs, selectedVoiceId)
                lastSyncedPrefsKey = currentKey
            }
        }
    }

    LaunchedEffect(hydratedUserId, favoriteIds) {
        if (hydratedUserId != null && hydratedUserId == authSession.userId) {
            val prev = lastSyncedFavorites
            if (prev != null && prev != favoriteIds) {
                val changed = (prev - favoriteIds) + (favoriteIds - prev)
                changed.forEach { recipeId ->
                    authRepository.toggleFavoriteRemote(recipeId)
                }
            }
            lastSyncedFavorites = favoriteIds
        }
    }

    LaunchedEffect(hydratedUserId, userPrefs.cookedRecipeIds) {
        if (hydratedUserId != null && hydratedUserId == authSession.userId) {
            val prev = lastSyncedCooked
            if (prev != null) {
                val newlyCooked = userPrefs.cookedRecipeIds - prev
                newlyCooked.forEach { recipeId ->
                    authRepository.markRecipeCookedRemote(recipeId)
                }
            }
            lastSyncedCooked = userPrefs.cookedRecipeIds
        }
    }

    LaunchedEffect(hydratedUserId, shoppingItems, archivedShoppingItems, marketCurrency) {
        if (hydratedUserId != null && hydratedUserId == authSession.userId) {
            val currentKey = Triple(shoppingItems, archivedShoppingItems, marketCurrency)
            if (lastSyncedShoppingKey != currentKey) {
                delay(900L)
                authRepository.syncShoppingItemsRemote(
                    activeItems = shoppingItems,
                    archivedItems = archivedShoppingItems,
                    currency = marketCurrency
                )
                lastSyncedShoppingKey = currentKey
            }
        }
    }

    var activeRecipeId by rememberSaveable { mutableStateOf<String?>(null) }
    var displayedRecipeId by rememberSaveable { mutableStateOf<String?>(null) }
    if (activeRecipeId != null) {
        displayedRecipeId = activeRecipeId
    }

    fun closeRecipeDetail(withHaptic: Boolean = true) {
        dismissKeyboard()
        if (withHaptic) haptics.navigationTap()
        activeRecipeId = null
    }

    fun openRecipeDetail(recipeId: String, withHaptic: Boolean = true) {
        if (recipeId.isBlank()) return
        dismissKeyboard()
        if (withHaptic) haptics.navigationTap()
        activeRecipeId = recipeId
    }

    fun switchBottomTab(route: String) {
        dismissKeyboard()
        activeRecipeId = null
        navController.navigate(route) {
            popUpTo(Screen.Home.route) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    fun navigateToMarketTab() {
        dismissKeyboard()
        haptics.navigationTap()
        activeRecipeId = null
        switchBottomTab(Screen.Market.route)
    }

    fun popWithHaptic() {
        dismissKeyboard()
        haptics.navigationTap()
        navController.popBackStack()
    }

    LaunchedEffect(favoriteAddedEvent?.eventId) {
        if (favoriteAddedEvent != null) {
            delay(2800L)
            recipeRepository.consumeFavoriteAddedEvent()
        }
    }

    LaunchedEffect(currentRoute, activeRecipeId) {
        dismissKeyboard()
    }

    val skipInitialSplash = remember {
        !externalRecipeId.isNullOrBlank() ||
            externalOAuthUri != null ||
            CookingTimerService.timerState.value.isActive
    }
    val initialStartDestination = remember {
        if (!skipInitialSplash && !authRepository.hasCompletedAuthGateSync()) {
            Screen.Login.route
        } else {
            Screen.Home.route
        }
    }
    var showSplash by rememberSaveable { mutableStateOf(!skipInitialSplash) }
    var mountMainScaffold by rememberSaveable { mutableStateOf(skipInitialSplash) }

    LaunchedEffect(showSplash) {
        if (!showSplash) {
            onReadyForPermissions()
        }
    }

    LaunchedEffect(externalRecipeId) {
        if (!externalRecipeId.isNullOrBlank()) {
            showSplash = false
            mountMainScaffold = true
            openRecipeDetail(externalRecipeId, withHaptic = false)
            onExternalRecipeConsumed()
        }
    }

    LaunchedEffect(externalOAuthUri) {
        val uri = externalOAuthUri ?: return@LaunchedEffect
        onExternalOAuthConsumed()
        showSplash = false
        mountMainScaffold = true
        when (val result = authRepository.completeOAuthCallback(uri)) {
            is AuthResult.Success -> {
                haptics.actionSuccess()
                navController.navigate(Screen.Home.route) {
                    popUpTo(0) { inclusive = true }
                    launchSingleTop = true
                }
            }
            is AuthResult.Error -> {
                haptics.destructiveTick()
                android.widget.Toast.makeText(context, result.message, android.widget.Toast.LENGTH_LONG).show()
            }
            is AuthResult.EmailConfirmationRequired -> {
                haptics.actionSuccess()
            }
        }
    }

    LaunchedEffect(Unit) {
        if (!mountMainScaffold) {
            delay(180L)
            mountMainScaffold = true
        }
    }

    val bottomBarRoutes = remember {
        listOf(
            Screen.Home.route,
            Screen.Recipes.route,
            Screen.Favorites.route,
            Screen.Market.route,
            Screen.Community.route
        )
    }

    val showBottomBar = currentRoute in bottomBarRoutes
    val isRecipeDetailOpen = activeRecipeId != null

    val isDarkSystemBarRoute = showSplash ||
        currentRoute == Screen.Login.route ||
        currentRoute == Screen.Register.route
    LaunchedEffect(isDarkSystemBarRoute) {
        onForceDarkSystemBarsChange(isDarkSystemBarRoute)
    }

    // Automatic safety redirect: any authenticated session on Login/Register immediately enters Home
    LaunchedEffect(authSession.isAuthenticated, currentRoute) {
        if (authSession.isAuthenticated &&
            (currentRoute == Screen.Login.route || currentRoute == Screen.Register.route)
        ) {
            navController.navigate(Screen.Home.route) {
                popUpTo(0) { inclusive = true }
                launchSingleTop = true
            }
        }
    }

    val appleEaseOut = remember { CubicBezierEasing(0.22f, 1f, 0.36f, 1f) }
    val bottomBarHideProgress by animateFloatAsState(
        targetValue = if (showBottomBar) 0f else 1f,
        animationSpec = tween(durationMillis = 230, easing = appleEaseOut),
        label = "bottomBarHideProgress"
    )
    val recipeOverlayParallax by animateFloatAsState(
        targetValue = if (isRecipeDetailOpen) 1f else 0f,
        animationSpec = tween(
            durationMillis = if (isRecipeDetailOpen) 280 else 250,
            easing = appleEaseOut
        ),
        label = "recipeOverlayParallax"
    )
    val isTablet = rememberIsTablet()
    val tabScreenModifier = if (isTablet) {
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
    } else {
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(bottom = 63.dp)
    }
    val standardPushModifier = Modifier
        .fillMaxSize()
        .statusBarsPadding()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        if (mountMainScaffold) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        translationX = -recipeOverlayParallax * size.width * 0.22f
                    }
            ) {
                NavHost(
                    navController = navController,
                    startDestination = initialStartDestination,
                    modifier = Modifier.fillMaxSize(),
                    enterTransition = {
                        val fromIdx = bottomBarRoutes.indexOf(initialState.destination.route)
                        val toIdx = bottomBarRoutes.indexOf(targetState.destination.route)
                        if (fromIdx != -1 && toIdx != -1) {
                            val dir = if (toIdx >= fromIdx) 1 else -1
                            slideInHorizontally(
                                initialOffsetX = { fullWidth -> (fullWidth * 0.08f * dir).toInt() },
                                animationSpec = tween(260, easing = appleEaseOut)
                            ) + fadeIn(tween(200))
                        } else {
                            // Pure GPU RenderNode horizontal slide (100% opaque, zero alpha buffer jank)
                            slideInHorizontally(
                                initialOffsetX = { fullWidth -> fullWidth },
                                animationSpec = tween(300, easing = appleEaseOut)
                            )
                        }
                    },
                    exitTransition = {
                        val fromIdx = bottomBarRoutes.indexOf(initialState.destination.route)
                        val toIdx = bottomBarRoutes.indexOf(targetState.destination.route)
                        if (fromIdx != -1 && toIdx != -1) {
                            val dir = if (toIdx >= fromIdx) -1 else 1
                            slideOutHorizontally(
                                targetOffsetX = { fullWidth -> (fullWidth * 0.06f * dir).toInt() },
                                animationSpec = tween(230, easing = appleEaseOut)
                            ) + fadeOut(tween(180))
                        } else {
                            slideOutHorizontally(
                                targetOffsetX = { fullWidth -> -(fullWidth * 0.24f).toInt() },
                                animationSpec = tween(300, easing = appleEaseOut)
                            )
                        }
                    },
                    popEnterTransition = {
                        slideInHorizontally(
                            initialOffsetX = { fullWidth -> -(fullWidth * 0.24f).toInt() },
                            animationSpec = tween(280, easing = appleEaseOut)
                        )
                    },
                    popExitTransition = {
                        slideOutHorizontally(
                            targetOffsetX = { fullWidth -> fullWidth },
                            animationSpec = tween(270, easing = appleEaseOut)
                        )
                    }
                ) {
                    composable(Screen.Home.route) {
                        Box(tabScreenModifier) {
                            HomeScreen(
                                onNavigateToRecipeDetail = { recipeId ->
                                    openRecipeDetail(recipeId)
                                },
                                onNavigateToCategory = { categoryId ->
                                    haptics.navigationTap()
                                    navController.navigate(Screen.CategoryRecipes.createRoute(categoryId))
                                },
                                onNavigateToAiChef = {
                                    haptics.navigationTap()
                                    navController.navigate(Screen.AiChef.route)
                                },
                                onNavigateToProfile = {
                                    haptics.navigationTap()
                                    navController.navigate(Screen.Profile.route)
                                },
                                onNavigateToRecipes = {
                                    haptics.navigationTap()
                                    switchBottomTab(Screen.Recipes.route)
                                },
                                onNavigateToMarket = {
                                    navigateToMarketTab()
                                },
                                onNavigateToCommunity = {
                                    haptics.navigationTap()
                                    switchBottomTab(Screen.Community.route)
                                },
                                carouselAutoScroll = userPrefs.carouselAutoScroll && !isRecipeDetailOpen,
                                avatarUrl = userPrefs.avatarUrl,
                                repository = recipeRepository,
                                homeScrollState = homeScrollState
                            )
                        }
                    }

                    composable(Screen.Recipes.route) {
                        Box(tabScreenModifier) {
                            RecipeListScreen(
                                onNavigateToRecipeDetail = { recipeId ->
                                    openRecipeDetail(recipeId)
                                },
                                onNavigateToCategory = { categoryId ->
                                    dismissKeyboard()
                                    haptics.navigationTap()
                                    navController.navigate(Screen.CategoryRecipes.createRoute(categoryId))
                                },
                                repository = recipeRepository
                            )
                        }
                    }

                    composable(Screen.Favorites.route) {
                        Box(tabScreenModifier) {
                            FavoritesScreen(
                                onNavigateToRecipeDetail = { recipeId ->
                                    openRecipeDetail(recipeId)
                                },
                                repository = recipeRepository
                            )
                        }
                    }

                    composable(Screen.Market.route) {
                        AdaptiveCenteredContainer(modifier = tabScreenModifier, maxWidth = 960.dp) {
                            MarketScreen(repository = shoppingRepository)
                        }
                    }

                    composable(Screen.Community.route) {
                        AdaptiveCenteredContainer(modifier = tabScreenModifier, maxWidth = 820.dp) {
                            CommunityScreen(
                                onNavigateToRecipeDetail = { recipeId ->
                                    openRecipeDetail(recipeId)
                                },
                                repository = communityRepository,
                                recipeRepository = recipeRepository,
                                userPreferences = userPrefs
                            )
                        }
                    }

                    composable(
                        route = Screen.RecipeDetail.route,
                        arguments = listOf(navArgument("recipeId") { type = NavType.StringType })
                    ) { backStackEntry ->
                        val recipeId = backStackEntry.arguments?.getString("recipeId").orEmpty()
                        Box(Modifier.fillMaxSize()) {
                            RecipeDetailScreen(
                                recipeId = recipeId,
                                onBack = ::popWithHaptic,
                                onNavigateToMarket = ::navigateToMarketTab,
                                onNavigateToRecipeDetail = { nextId ->
                                    navController.navigate(Screen.RecipeDetail.createRoute(nextId))
                                },
                                repository = recipeRepository,
                                shoppingRepository = shoppingRepository,
                                userPreferencesRepository = prefsRepo,
                                initialUserPrefs = userPrefs
                            )
                        }
                    }

                    composable(Screen.AiChef.route) {
                        AdaptiveCenteredContainer(maxWidth = 860.dp) {
                            AiChefScreen(
                                onBack = ::popWithHaptic,
                                repository = aiChefRepository,
                                onNavigateToRecipeDetail = { recipeId ->
                                    openRecipeDetail(recipeId)
                                }
                            )
                        }
                    }

                    composable(
                        route = Screen.CategoryRecipes.route,
                        arguments = listOf(navArgument("category") { type = NavType.StringType })
                    ) { backStackEntry ->
                        val categoryId = backStackEntry.arguments?.getString("category") ?: "sauces"
                        Box(standardPushModifier) {
                            CategoryRecipesScreen(
                                categoryId = categoryId,
                                onBack = ::popWithHaptic,
                                onNavigateToRecipeDetail = { recipeId ->
                                    openRecipeDetail(recipeId)
                                },
                                repository = recipeRepository
                            )
                        }
                    }

                    composable(Screen.Login.route) {
                        val hasPrevious = navController.previousBackStackEntry != null
                        Box(Modifier.fillMaxSize()) {
                            LoginScreen(
                                authRepository = authRepository,
                                canNavigateBack = hasPrevious,
                                onBack = ::popWithHaptic,
                                onNavigateToRegister = {
                                    haptics.navigationTap()
                                    navController.navigate(Screen.Register.route) {
                                        launchSingleTop = true
                                    }
                                },
                                onAuthSuccess = {
                                    navController.navigate(Screen.Home.route) {
                                        popUpTo(0) { inclusive = true }
                                        launchSingleTop = true
                                    }
                                }
                            )
                        }
                    }

                    composable(Screen.Register.route) {
                        val hasPrevious = navController.previousBackStackEntry != null
                        Box(Modifier.fillMaxSize()) {
                            RegisterScreen(
                                authRepository = authRepository,
                                canNavigateBack = hasPrevious,
                                onBack = ::popWithHaptic,
                                onNavigateToLogin = {
                                    haptics.navigationTap()
                                    if (navController.previousBackStackEntry?.destination?.route == Screen.Login.route) {
                                        navController.popBackStack()
                                    } else {
                                        navController.navigate(Screen.Login.route) {
                                            launchSingleTop = true
                                        }
                                    }
                                },
                                onAuthSuccess = {
                                    navController.navigate(Screen.Home.route) {
                                        popUpTo(0) { inclusive = true }
                                        launchSingleTop = true
                                    }
                                }
                            )
                        }
                    }

                    composable(Screen.Profile.route) {
                        AdaptiveCenteredContainer(modifier = standardPushModifier, maxWidth = 860.dp) {
                            ProfileScreen(
                                onBack = ::popWithHaptic,
                                onNavigateToRecipeDetail = { recipeId ->
                                    openRecipeDetail(recipeId)
                                },
                                onNavigateToFavorites = {
                                    haptics.navigationTap()
                                    switchBottomTab(Screen.Favorites.route)
                                },
                                onNavigateToMarket = {
                                    navigateToMarketTab()
                                },
                                onNavigateToAiChef = {
                                    haptics.navigationTap()
                                    navController.navigate(Screen.AiChef.route)
                                },
                                onNavigateToLogin = {
                                    haptics.navigationTap()
                                    navController.navigate(Screen.Login.route) {
                                        popUpTo(0) { inclusive = true }
                                        launchSingleTop = true
                                    }
                                },
                                onNavigateToRegister = {
                                    haptics.navigationTap()
                                    navController.navigate(Screen.Register.route) {
                                        launchSingleTop = true
                                    }
                                },
                                recipeRepository = recipeRepository,
                                shoppingRepository = shoppingRepository,
                                userPreferencesRepository = prefsRepo,
                                authRepository = authRepository
                            )
                        }
                    }
                }

                if (!isRecipeDetailOpen && timerState.isActive) {
                    InteractiveTimerPill(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .navigationBarsPadding()
                            .padding(
                                bottom = when {
                                    showBottomBar && isTablet -> 88.dp
                                    showBottomBar -> 73.dp
                                    else -> 12.dp
                                }
                            ),
                        onOpenRecipe = { id ->
                            if (id.isNotBlank()) openRecipeDetail(id)
                        }
                    )
                }

                // Permanently composed navigation bar animated strictly on GPU (zero mount/unmount/reflow jank)
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .graphicsLayer {
                            translationY = bottomBarHideProgress * size.height
                            alpha = 1f - bottomBarHideProgress
                        }
                ) {
                    if (isTablet) {
                        TabletFloatingNavBar(
                            currentRoute = currentRoute,
                            onNavigate = { route -> if (showBottomBar && !isRecipeDetailOpen) switchBottomTab(route) },
                            onOpenAiChef = {
                                if (showBottomBar && !isRecipeDetailOpen) navController.navigate(Screen.AiChef.route)
                            },
                            marketBadgeCount = pendingMarketCount
                        )
                    } else {
                        CustomBottomNavBar(
                            currentRoute = currentRoute,
                            onNavigate = { route -> if (showBottomBar && !isRecipeDetailOpen) switchBottomTab(route) },
                            onOpenAiChef = {
                                if (showBottomBar && !isRecipeDetailOpen) navController.navigate(Screen.AiChef.route)
                            },
                            marketBadgeCount = pendingMarketCount
                        )
                    }
                }
            }

            // Dedicated 120 FPS hardware-accelerated RecipeDetail overlay:
            // Keeps HomeScreen & BottomNavBar mounted underneath (zero unmount on open, zero remount on close)
            AnimatedVisibility(
                visible = isRecipeDetailOpen,
                enter = slideInHorizontally(
                    initialOffsetX = { fullWidth -> fullWidth },
                    animationSpec = tween(durationMillis = 280, easing = appleEaseOut)
                ),
                exit = slideOutHorizontally(
                    targetOffsetX = { fullWidth -> fullWidth },
                    animationSpec = tween(durationMillis = 250, easing = appleEaseOut)
                ),
                modifier = Modifier.fillMaxSize()
            ) {
                val targetId = displayedRecipeId
                if (!targetId.isNullOrBlank()) {
                    // Registered AFTER NavHost so LIFO BackHandler intercepts back gestures before NavController
                    // on sub-tabs like Recipes and Favorites (where NavController's own callback is enabled).
                    BackHandler(enabled = isRecipeDetailOpen) {
                        closeRecipeDetail(withHaptic = true)
                    }
                    RecipeDetailScreen(
                        recipeId = targetId,
                        onBack = { closeRecipeDetail(withHaptic = true) },
                        onNavigateToMarket = ::navigateToMarketTab,
                        onNavigateToRecipeDetail = { nextId -> openRecipeDetail(nextId) },
                        repository = recipeRepository,
                        shoppingRepository = shoppingRepository,
                        userPreferencesRepository = prefsRepo,
                        initialUserPrefs = userPrefs
                    )
                }
            }

            ConnectivityBanner(
                isOnline = isOnline,
                modifier = Modifier.align(Alignment.TopCenter)
            )

            // Non-generic custom Favorite Toast above the bottom navbar (and above RecipeDetail when open)
            AnimatedVisibility(
                visible = favoriteAddedEvent != null,
                enter = slideInVertically(
                    initialOffsetY = { it / 2 },
                    animationSpec = tween(240, easing = appleEaseOut)
                ) + fadeIn(tween(200)) + scaleIn(initialScale = 0.94f),
                exit = slideOutVertically(
                    targetOffsetY = { it / 2 },
                    animationSpec = tween(200, easing = appleEaseOut)
                ) + fadeOut(tween(160)),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(
                        start = 18.dp,
                        end = 18.dp,
                        bottom = when {
                            isRecipeDetailOpen -> 18.dp
                            showBottomBar && isTablet -> 90.dp
                            showBottomBar -> 74.dp
                            else -> 16.dp
                        }
                    )
            ) {
                favoriteAddedEvent?.let { event ->
                    FavoriteAddedToast(
                        event = event,
                        onOpenFavorites = {
                            haptics.navigationTap()
                            recipeRepository.consumeFavoriteAddedEvent()
                            if (isRecipeDetailOpen) {
                                closeRecipeDetail(withHaptic = false)
                            }
                            switchBottomTab(Screen.Favorites.route)
                        }
                    )
                }
            }
        }

        AnimatedVisibility(
            visible = showSplash,
            exit = fadeOut(
                animationSpec = tween(durationMillis = 420, easing = FastOutSlowInEasing)
            ),
            modifier = Modifier.fillMaxSize()
        ) {
            SplashScreen(
                onFinished = { showSplash = false }
            )
        }
    }
}

@Composable
private fun FavoriteAddedToast(
    event: FavoriteAddedEvent,
    onOpenFavorites: () -> Unit
) {
    val isDark = isAfroDarkTheme()
    val containerColor = if (isDark) Color(0xFF282522).copy(alpha = 0.94f) else Color(0xFF1E2220).copy(alpha = 0.92f)
    val borderColor = Color.White.copy(alpha = 0.10f)

    Surface(
        shape = ExpressivePillShape,
        color = containerColor,
        border = BorderStroke(0.8.dp, borderColor),
        shadowElevation = 4.dp,
        modifier = Modifier
            .widthIn(max = 320.dp)
            .clip(ExpressivePillShape)
            .clickable(onClick = onOpenFavorites)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                painter = painterResource(id = R.drawable.ic_solar_heart_liked),
                contentDescription = null,
                tint = Color.Unspecified,
                modifier = Modifier.size(15.dp)
            )
            Text(
                text = if (event.recipeName.isNotBlank()) {
                    "${event.recipeName} · ${tr("Ajouté aux favoris", "Added to favorites", "Añadido a favoritos")}"
                } else {
                    tr("Ajouté aux favoris", "Added to favorites", "Añadido a favoritos")
                },
                color = Color.White.copy(alpha = 0.94f),
                fontSize = 12.5.sp,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f, fill = false)
            )
            Text(
                text = tr("Voir", "View", "Ver"),
                color = AfroOrange,
                fontSize = 12.5.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1
            )
        }
    }
}

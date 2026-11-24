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
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.afrocuisto.app.data.repository.RecipeRepository
import com.afrocuisto.app.data.repository.AiChefRepository
import com.afrocuisto.app.data.repository.CommunityRepository
import com.afrocuisto.app.data.repository.ShoppingRepository
import com.afrocuisto.app.data.repository.UserPreferencesRepository
import com.afrocuisto.app.data.repository.UserPreferencesState
import com.afrocuisto.app.service.CookingTimerService
import com.afrocuisto.app.ui.components.InteractiveTimerPill
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.screens.aichef.AiChefScreen
import com.afrocuisto.app.ui.screens.community.CommunityScreen
import com.afrocuisto.app.ui.screens.favorites.FavoritesScreen
import com.afrocuisto.app.ui.screens.home.HomeScreen
import com.afrocuisto.app.ui.screens.market.MarketScreen
import com.afrocuisto.app.ui.screens.profile.ProfileScreen
import com.afrocuisto.app.ui.screens.recipe.CategoryRecipesScreen
import com.afrocuisto.app.ui.screens.recipe.RecipeDetailScreen
import com.afrocuisto.app.ui.screens.recipe.RecipeListScreen
import com.afrocuisto.app.ui.screens.splash.SplashScreen
import kotlinx.coroutines.delay

@Composable
fun NavGraph(
    navController: NavHostController = rememberNavController(),
    recipeRepository: RecipeRepository = remember { RecipeRepository() },
    shoppingRepository: ShoppingRepository = remember { ShoppingRepository() },
    userPreferencesRepository: UserPreferencesRepository? = null,
    externalRecipeId: String? = null,
    onExternalRecipeConsumed: () -> Unit = {}
) {
    val context = LocalContext.current
    val haptics = rememberAfroHaptics()
    val prefsRepo = userPreferencesRepository
        ?: remember { UserPreferencesRepository(context.applicationContext) }
    val aiChefRepository = remember { AiChefRepository(context.applicationContext) }
    val communityRepository = remember { CommunityRepository(context.applicationContext) }
    val userPrefs by prefsRepo.preferencesFlow.collectAsState(initial = UserPreferencesState())
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val homeScrollState = rememberScrollState()
    val shoppingItems by shoppingRepository.items.collectAsState()
    val timerState by CookingTimerService.timerState.collectAsState()
    val pendingMarketCount = remember(shoppingItems) { shoppingItems.count { !it.isChecked } }

    var activeRecipeId by rememberSaveable { mutableStateOf<String?>(null) }
    var displayedRecipeId by rememberSaveable { mutableStateOf<String?>(null) }
    if (activeRecipeId != null) {
        displayedRecipeId = activeRecipeId
    }

    fun closeRecipeDetail(withHaptic: Boolean = true) {
        if (withHaptic) haptics.navigationTap()
        activeRecipeId = null
    }

    BackHandler(enabled = activeRecipeId != null) {
        closeRecipeDetail(withHaptic = true)
    }

    fun openRecipeDetail(recipeId: String, withHaptic: Boolean = true) {
        if (recipeId.isBlank()) return
        if (withHaptic) haptics.navigationTap()
        activeRecipeId = recipeId
    }

    fun switchBottomTab(route: String) {
        activeRecipeId = null
        navController.navigate(route) {
            popUpTo(Screen.Home.route) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    fun navigateToMarketTab() {
        haptics.navigationTap()
        activeRecipeId = null
        switchBottomTab(Screen.Market.route)
    }

    fun popWithHaptic() {
        haptics.navigationTap()
        navController.popBackStack()
    }

    val skipInitialSplash = remember {
        !externalRecipeId.isNullOrBlank() || CookingTimerService.timerState.value.isActive
    }
    var showSplash by rememberSaveable { mutableStateOf(!skipInitialSplash) }
    var mountMainScaffold by rememberSaveable { mutableStateOf(skipInitialSplash) }

    LaunchedEffect(externalRecipeId) {
        if (!externalRecipeId.isNullOrBlank()) {
            showSplash = false
            mountMainScaffold = true
            openRecipeDetail(externalRecipeId, withHaptic = false)
            onExternalRecipeConsumed()
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
    val tabScreenModifier = Modifier
        .fillMaxSize()
        .statusBarsPadding()
        .navigationBarsPadding()
        .padding(bottom = 63.dp)
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
                    startDestination = Screen.Home.route,
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
                        Box(tabScreenModifier) {
                            MarketScreen(repository = shoppingRepository)
                        }
                    }

                    composable(Screen.Community.route) {
                        Box(tabScreenModifier) {
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
                                repository = recipeRepository,
                                shoppingRepository = shoppingRepository,
                                userPreferencesRepository = prefsRepo,
                                initialUserPrefs = userPrefs
                            )
                        }
                    }

                    composable(Screen.AiChef.route) {
                        Box(Modifier.fillMaxSize()) {
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

                    composable(Screen.Profile.route) {
                        Box(standardPushModifier) {
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
                                recipeRepository = recipeRepository,
                                shoppingRepository = shoppingRepository,
                                userPreferencesRepository = prefsRepo
                            )
                        }
                    }
                }

                if (!isRecipeDetailOpen && timerState.isActive) {
                    InteractiveTimerPill(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .navigationBarsPadding()
                            .padding(bottom = if (showBottomBar) 73.dp else 12.dp),
                        onOpenRecipe = { id ->
                            if (id.isNotBlank()) openRecipeDetail(id)
                        }
                    )
                }

                // Permanently composed bottom bar animated strictly on GPU (zero mount/unmount/reflow jank)
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .graphicsLayer {
                            translationY = bottomBarHideProgress * size.height
                            alpha = 1f - bottomBarHideProgress
                        }
                ) {
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
                    RecipeDetailScreen(
                        recipeId = targetId,
                        onBack = { closeRecipeDetail(withHaptic = true) },
                        onNavigateToMarket = ::navigateToMarketTab,
                        repository = recipeRepository,
                        shoppingRepository = shoppingRepository,
                        userPreferencesRepository = prefsRepo,
                        initialUserPrefs = userPrefs
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

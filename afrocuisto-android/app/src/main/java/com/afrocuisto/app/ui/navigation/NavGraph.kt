package com.afrocuisto.app.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.afrocuisto.app.data.repository.RecipeRepository
import com.afrocuisto.app.ui.components.InteractiveTimerPill
import com.afrocuisto.app.ui.screens.aichef.AiChefScreen
import com.afrocuisto.app.ui.screens.community.CommunityScreen
import com.afrocuisto.app.ui.screens.favorites.FavoritesScreen
import com.afrocuisto.app.ui.screens.home.HomeScreen
import com.afrocuisto.app.ui.screens.market.MarketScreen
import com.afrocuisto.app.ui.screens.profile.ProfileScreen
import com.afrocuisto.app.ui.screens.recipe.RecipeDetailScreen
import com.afrocuisto.app.ui.screens.recipe.RecipeListScreen

@Composable
fun NavGraph(
    navController: NavHostController = rememberNavController(),
    recipeRepository: RecipeRepository = remember { RecipeRepository() }
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val bottomBarRoutes = listOf(
        Screen.Home.route,
        Screen.Recipes.route,
        Screen.Favorites.route,
        Screen.Market.route,
        Screen.Community.route
    )

    val showBottomBar = currentRoute in bottomBarRoutes

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                CustomBottomNavBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onOpenAiChef = {
                        navController.navigate(Screen.AiChef.route)
                    }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            NavHost(
                navController = navController,
                startDestination = Screen.Home.route
            ) {
                composable(Screen.Home.route) {
                    HomeScreen(
                        onNavigateToRecipeDetail = { recipeId ->
                            navController.navigate(Screen.RecipeDetail.createRoute(recipeId))
                        },
                        onNavigateToAiChef = {
                            navController.navigate(Screen.AiChef.route)
                        },
                        onNavigateToProfile = {
                            navController.navigate(Screen.Profile.route)
                        },
                        onNavigateToRecipes = {
                            navController.navigate(Screen.Recipes.route)
                        },
                        repository = recipeRepository
                    )
                }

                composable(Screen.Recipes.route) {
                    RecipeListScreen(
                        onNavigateToRecipeDetail = { recipeId ->
                            navController.navigate(Screen.RecipeDetail.createRoute(recipeId))
                        },
                        repository = recipeRepository
                    )
                }

                composable(Screen.Favorites.route) {
                    FavoritesScreen(
                        onNavigateToRecipeDetail = { recipeId ->
                            navController.navigate(Screen.RecipeDetail.createRoute(recipeId))
                        },
                        repository = recipeRepository
                    )
                }

                composable(Screen.Market.route) {
                    MarketScreen()
                }

                composable(Screen.Community.route) {
                    CommunityScreen(
                        onNavigateToRecipeDetail = { recipeId ->
                            navController.navigate(Screen.RecipeDetail.createRoute(recipeId))
                        }
                    )
                }

                composable(
                    route = Screen.RecipeDetail.route,
                    arguments = listOf(navArgument("recipeId") { type = NavType.StringType })
                ) { backStackEntry ->
                    val recipeId = backStackEntry.arguments?.getString("recipeId") ?: "P02"
                    RecipeDetailScreen(
                        recipeId = recipeId,
                        onBack = { navController.popBackStack() },
                        repository = recipeRepository
                    )
                }

                composable(Screen.AiChef.route) {
                    AiChefScreen(
                        onBack = { navController.popBackStack() },
                        onNavigateToRecipeDetail = { recipeId ->
                            navController.navigate(Screen.RecipeDetail.createRoute(recipeId))
                        }
                    )
                }

                composable(Screen.Profile.route) {
                    ProfileScreen(
                        onBack = { navController.popBackStack() }
                    )
                }
            }

            // Floating Timer Pill Overlay across screens
            InteractiveTimerPill()
        }
    }
}

package com.afrocuisto.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.RestaurantMenu
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Recipes : Screen("recipes")
    object Favorites : Screen("favorites")
    object Market : Screen("market")
    object Community : Screen("community")
    object AiChef : Screen("ai_chef")
    object Profile : Screen("profile")
    object Onboarding : Screen("onboarding")
    object Login : Screen("login")
    object Register : Screen("register")

    object RecipeDetail : Screen("recipe_detail/{recipeId}") {
        fun createRoute(recipeId: String) = "recipe_detail/$recipeId"
    }

    object CategoryRecipes : Screen("category_recipes/{category}") {
        fun createRoute(category: String) = "category_recipes/$category"
    }
}

data class BottomNavItem(
    val route: String,
    val title: String,
    val icon: ImageVector
)

val bottomNavItems = listOf(
    BottomNavItem(Screen.Home.route, "Accueil", Icons.Default.Home),
    BottomNavItem(Screen.Recipes.route, "Recettes", Icons.Default.RestaurantMenu),
    BottomNavItem(Screen.Favorites.route, "Favoris", Icons.Default.Bookmark),
    BottomNavItem(Screen.Market.route, "Marché", Icons.Default.ShoppingBag),
    BottomNavItem(Screen.Community.route, "Communauté", Icons.Default.People)
)

package com.afrocuisto.app.ui.navigation

import androidx.annotation.DrawableRes
import com.afrocuisto.app.R

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
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
    @DrawableRes val selectedIconRes: Int,
    @DrawableRes val unselectedIconRes: Int
)

val bottomNavItems = listOf(
    BottomNavItem(
        route = Screen.Home.route,
        title = "Accueil",
        selectedIconRes = R.drawable.ic_solar_home_bold,
        unselectedIconRes = R.drawable.ic_solar_home_linear
    ),
    BottomNavItem(
        route = Screen.Recipes.route,
        title = "Recettes",
        selectedIconRes = R.drawable.ic_solar_recipes_bold,
        unselectedIconRes = R.drawable.ic_solar_recipes_linear
    ),
    BottomNavItem(
        route = Screen.Favorites.route,
        title = "Favoris",
        selectedIconRes = R.drawable.ic_solar_bookmark_bold,
        unselectedIconRes = R.drawable.ic_solar_bookmark_linear
    ),
    BottomNavItem(
        route = Screen.Market.route,
        title = "Marché",
        selectedIconRes = R.drawable.ic_solar_bag_bold,
        unselectedIconRes = R.drawable.ic_solar_bag_linear
    ),
    BottomNavItem(
        route = Screen.Community.route,
        title = "Communauté",
        selectedIconRes = R.drawable.ic_solar_users_bold,
        unselectedIconRes = R.drawable.ic_solar_users_linear
    )
)

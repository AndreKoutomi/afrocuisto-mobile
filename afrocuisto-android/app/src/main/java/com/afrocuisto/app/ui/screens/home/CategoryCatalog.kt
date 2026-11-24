package com.afrocuisto.app.ui.screens.home

import androidx.annotation.DrawableRes
import androidx.compose.ui.graphics.Color
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.Recipe
import java.util.Locale

data class DishCategorySpec(
    val id: String,
    val label: String,
    val subtitle: String,
    @DrawableRes val iconRes: Int,
    val gradientStart: Color,
    val gradientEnd: Color
)

val HOME_CATEGORIES = listOf(
    DishCategorySpec(
        id = "sauces",
        label = "Sauces",
        subtitle = "Sauces onctueuses, mijotées et potages traditionnels",
        iconRes = R.drawable.ic_solar_cat_ladle_outline,
        gradientStart = Color(0xFFFF7A3D),
        gradientEnd = Color(0xFFFB5607)
    ),
    DishCategorySpec(
        id = "pates",
        label = "Pâtes",
        subtitle = "Pâtes, céréales et accompagnements du terroir",
        iconRes = R.drawable.ic_solar_cat_fork_knife_outline,
        gradientStart = Color(0xFFFBBF24),
        gradientEnd = Color(0xFFD97706)
    ),
    DishCategorySpec(
        id = "grillades",
        label = "Grillades",
        subtitle = "Viandes braisées, brochettes et saveurs fumées",
        iconRes = R.drawable.ic_solar_cat_flame_outline,
        gradientStart = Color(0xFFFB567C),
        gradientEnd = Color(0xFFE11D48)
    ),
    DishCategorySpec(
        id = "boissons",
        label = "Boissons",
        subtitle = "Infusions glacées, jus naturels et cocktails maison",
        iconRes = R.drawable.ic_solar_cat_cup_hot_outline,
        gradientStart = Color(0xFF2DD4BF),
        gradientEnd = Color(0xFF0D9488)
    ),
    DishCategorySpec(
        id = "poissons",
        label = "Poissons",
        subtitle = "Poissons grillés, fumés et fruits de mer",
        iconRes = R.drawable.ic_solar_cat_fish_outline,
        gradientStart = Color(0xFF60A5FA),
        gradientEnd = Color(0xFF2563EB)
    ),
    DishCategorySpec(
        id = "vegetal",
        label = "Végétal",
        subtitle = "Recettes 100% végétales, légumes et légumineuses",
        iconRes = R.drawable.ic_solar_cat_leaf_outline,
        gradientStart = Color(0xFF84CC16),
        gradientEnd = Color(0xFF4D7C0F)
    )
)

fun findCategorySpec(categoryId: String): DishCategorySpec? {
    val normalized = categoryId.trim().lowercase(Locale.FRENCH)
    return HOME_CATEGORIES.firstOrNull {
        it.id.equals(normalized, ignoreCase = true) ||
            it.label.equals(normalized, ignoreCase = true)
    }
}

fun categoryMatchesRecipe(categoryId: String, recipe: Recipe): Boolean {
    val cat = recipe.category.lowercase(Locale.FRENCH)
    val text = "${recipe.name} ${recipe.description.orEmpty()}".lowercase(Locale.FRENCH)
    return when (categoryId.lowercase(Locale.FRENCH)) {
        "sauces" -> cat.contains("sauce") || cat.contains("potage")
        "pates" -> cat.contains("pâte") || cat.contains("pate") || cat.contains("céréale")
        "grillades" -> cat.contains("grillade") || cat.contains("viande")
        "boissons" -> cat.contains("boisson") || cat.contains("cocktail") || cat.contains("jus")
        "poissons" -> cat.contains("poisson") || text.contains("poisson") || text.contains("crabe")
        "vegetal" -> cat.contains("végét") || cat.contains("veget") || text.contains("haricot") || text.contains("hibiscus")
        else -> true
    }
}

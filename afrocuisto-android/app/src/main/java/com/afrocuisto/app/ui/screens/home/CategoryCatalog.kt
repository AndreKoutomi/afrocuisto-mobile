package com.afrocuisto.app.ui.screens.home

import androidx.annotation.DrawableRes
import androidx.compose.ui.graphics.Color
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.Recipe
import com.afrocuisto.app.data.repository.HomeSection
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

private val DYNAMIC_CATEGORY_GRADIENTS = listOf(
    Color(0xFFFB5607) to Color(0xFFEA580C),
    Color(0xFF10B981) to Color(0xFF059669),
    Color(0xFF8B5CF6) to Color(0xFF6D28D9),
    Color(0xFFEC4899) to Color(0xFFBE185D),
    Color(0xFF0EA5E9) to Color(0xFF0369A1),
    Color(0xFFF59E0B) to Color(0xFFB45309)
)

fun buildDynamicCategorySpec(name: String): DishCategorySpec {
    val cleanName = name.trim()
    val idx = (cleanName.lowercase(Locale.FRENCH).hashCode().let { if (it < 0) -it else it }) % DYNAMIC_CATEGORY_GRADIENTS.size
    val (start, end) = DYNAMIC_CATEGORY_GRADIENTS[idx]
    return DishCategorySpec(
        id = cleanName,
        label = cleanName,
        subtitle = "Recettes « $cleanName »",
        iconRes = R.drawable.ic_solar_recipes_linear,
        gradientStart = start,
        gradientEnd = end
    )
}

private fun matchesBaseCategoryLabel(rawCategory: String): Boolean {
    val norm = rawCategory.trim().lowercase(Locale.FRENCH)
    if (norm.isBlank()) return true
    return HOME_CATEGORIES.any { base ->
        base.id.equals(norm, ignoreCase = true) ||
            base.label.equals(norm, ignoreCase = true) ||
            when (base.id) {
                "sauces" -> norm.contains("sauce") || norm.contains("potage")
                "pates" -> norm.contains("pâte") || norm.contains("pate") || norm.contains("céréale")
                "grillades" -> norm.contains("grillade") || norm.contains("viande")
                "boissons" -> norm.contains("boisson") || norm.contains("cocktail") || norm.contains("jus")
                "poissons" -> norm.contains("poisson")
                "vegetal" -> norm.contains("végét") || norm.contains("veget")
                else -> false
            }
    }
}

fun buildAllCategories(
    recipes: List<Recipe>,
    homeSections: List<HomeSection> = emptyList()
): List<DishCategorySpec> {
    val seen = mutableSetOf<String>()
    val extras = mutableListOf<DishCategorySpec>()

    // 1. Catégories déclarées dans les sections Admin CMS ("categories" / "category")
    homeSections
        .filter { it.isActive && (it.sectionType.equals("categories", ignoreCase = true) || it.sectionType.equals("category", ignoreCase = true)) }
        .forEach { sec ->
            val candidates = if (sec.itemIds.isNotEmpty()) sec.itemIds else listOf(sec.title)
            candidates.forEach { raw ->
                val clean = raw.trim()
                val key = clean.lowercase(Locale.FRENCH)
                if (clean.isNotBlank() && !matchesBaseCategoryLabel(clean) && seen.add(key)) {
                    extras += buildDynamicCategorySpec(clean)
                }
            }
        }

    // 2. Nouvelles catégories découvertes depuis les recettes créées sur l'Admin
    recipes.forEach { recipe ->
        val clean = recipe.category.trim()
        val key = clean.lowercase(Locale.FRENCH)
        if (clean.isNotBlank() && !matchesBaseCategoryLabel(clean) && seen.add(key)) {
            extras += buildDynamicCategorySpec(clean)
        }
    }

    return HOME_CATEGORIES + extras
}

fun findCategorySpec(categoryId: String): DishCategorySpec? {
    val normalized = categoryId.trim().lowercase(Locale.FRENCH)
    if (normalized.isBlank()) return null
    return HOME_CATEGORIES.firstOrNull {
        it.id.equals(normalized, ignoreCase = true) ||
            it.label.equals(normalized, ignoreCase = true)
    } ?: buildDynamicCategorySpec(categoryId.trim())
}

fun categoryMatchesRecipe(categoryId: String, recipe: Recipe): Boolean {
    val cat = recipe.category.lowercase(Locale.FRENCH)
    val text = "${recipe.name} ${recipe.description.orEmpty()}".lowercase(Locale.FRENCH)
    val target = categoryId.trim().lowercase(Locale.FRENCH)
    return when (target) {
        "sauces" -> cat.contains("sauce") || cat.contains("potage")
        "pates" -> cat.contains("pâte") || cat.contains("pate") || cat.contains("céréale")
        "grillades" -> cat.contains("grillade") || cat.contains("viande")
        "boissons" -> cat.contains("boisson") || cat.contains("cocktail") || cat.contains("jus")
        "poissons" -> cat.contains("poisson") || text.contains("poisson") || text.contains("crabe")
        "vegetal" -> cat.contains("végét") || cat.contains("veget") || text.contains("haricot") || text.contains("hibiscus")
        else -> cat == target || cat.contains(target)
    }
}

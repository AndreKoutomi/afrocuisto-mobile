package com.afrocuisto.app.ui.i18n

import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import com.afrocuisto.app.data.repository.AppLanguage

val LocalAppLanguage = staticCompositionLocalOf { AppLanguage.FR }

@Composable
fun tr(fr: String, en: String, es: String): String = when (LocalAppLanguage.current) {
    AppLanguage.FR -> fr
    AppLanguage.EN -> en
    AppLanguage.ES -> es
}

fun trLang(lang: AppLanguage, fr: String, en: String, es: String): String = when (lang) {
    AppLanguage.FR -> fr
    AppLanguage.EN -> en
    AppLanguage.ES -> es
}

fun translateThemeLabel(modeId: String, lang: AppLanguage): String = when (modeId) {
    "system" -> trLang(lang, "Système", "System", "Sistema")
    "light" -> trLang(lang, "Clair", "Light", "Claro")
    "dark" -> trLang(lang, "Sombre", "Dark", "Oscuro")
    else -> modeId
}

fun translateDifficulty(difficulty: String, lang: AppLanguage): String {
    if (lang == AppLanguage.FR) return difficulty
    return when (difficulty.trim().lowercase()) {
        "facile", "easy", "fácil" -> trLang(lang, "Facile", "Easy", "Fácil")
        "moyen", "moyenne", "medium", "medio" -> trLang(lang, "Moyen", "Medium", "Medio")
        "difficile", "expert", "hard", "difícil" -> trLang(lang, "Difficile", "Hard", "Difícil")
        else -> difficulty
    }
}

fun translateCategory(category: String, lang: AppLanguage): String {
    if (lang == AppLanguage.FR) return category
    return when (category.trim().lowercase()) {
        "tous", "tout", "all" -> trLang(lang, "Tous", "All", "Todos")
        "pâtes & céréales", "pates & cereales" -> trLang(lang, "Pâtes & Céréales", "Pastas & Grains", "Pastas y Cereales")
        "sauces & potages" -> trLang(lang, "Sauces & Potages", "Sauces & Stews", "Salsas y Sopas")
        "grillades & viandes" -> trLang(lang, "Grillades & Viandes", "Grills & Meats", "Parrillas y Carnes")
        "poissons & fruits de mer" -> trLang(lang, "Poissons & Fruits de mer", "Fish & Seafood", "Pescados y Mariscos")
        "boissons & cocktails" -> trLang(lang, "Boissons & Cocktails", "Drinks & Cocktails", "Bebidas y Cócteles")
        "desserts & douceurs" -> trLang(lang, "Desserts & Douceurs", "Desserts & Sweets", "Postres y Dulces")
        "petits-déjeuners", "petit-déjeuner" -> trLang(lang, "Petits-déjeuners", "Breakfasts", "Desayunos")
        "accompagnements" -> trLang(lang, "Accompagnements", "Side Dishes", "Guarniciones")
        "entrées & amuse-bouches" -> trLang(lang, "Entrées & Amuse-bouches", "Starters & Snacks", "Entrantes y Aperitivos")
        "épices & terroir" -> trLang(lang, "Épices & Terroir", "Spices & Terroir", "Especias y Terroir")
        else -> category
    }
}

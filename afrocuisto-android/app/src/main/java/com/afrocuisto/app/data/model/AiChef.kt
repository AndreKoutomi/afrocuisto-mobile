package com.afrocuisto.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class AiChefIngredient(
    val name: String,
    val amount: String? = null
)

@Serializable
data class AiChefRecipeResult(
    val id: String = "",
    val dishName: String = "",
    val region: String = "",
    val category: String? = null,
    val totalTime: String = "",
    val prepTime: String? = null,
    val cookTime: String? = null,
    val difficulty: String = "Facile",
    val servings: String? = null,
    val usedIngredients: List<AiChefIngredient> = emptyList(),
    val missingIngredients: List<AiChefIngredient> = emptyList(),
    val steps: List<String> = emptyList(),
    val suggestedSides: List<String> = emptyList(),
    val chefTip: String? = null,
    val wineOrDrinkPairing: String? = null
)

@Serializable
data class AiChefMessage(
    val id: String = "",
    val sender: String = "ai", // "ai" | "user"
    val text: String? = null,
    val recipe: AiChefRecipeResult? = null,
    val isGuardrail: Boolean = false,
    val timestamp: Long = System.currentTimeMillis(),
    val quickSuggestions: List<String> = emptyList(),
    val reactionEmoji: String? = null,
    val audioSpoken: Boolean = false
)

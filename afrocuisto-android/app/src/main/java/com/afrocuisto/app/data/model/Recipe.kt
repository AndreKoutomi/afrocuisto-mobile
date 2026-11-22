package com.afrocuisto.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Ingredient(
    val name: String = "",
    val amount: String = "",
    val unit: String = "",
    val isOptional: Boolean = false,
    val substitute: String? = null
)

@Serializable
data class Recipe(
    val id: String = "",
    val name: String = "",
    val alias: String? = null,
    val region: String = "",
    val category: String = "",
    val difficulty: String = "Facile",
    val prepTime: String = "15 min",
    val cookTime: String = "30 min",
    val image: String = "",
    val ingredients: List<Ingredient> = emptyList(),
    val techniqueTitle: String? = null,
    val techniqueDescription: String? = null,
    val description: String? = null,
    val steps: List<String> = emptyList(),
    val diasporaSubstitutes: String? = null,
    val suggestedSides: List<String>? = null,
    val benefits: String? = null,
    val pedagogicalNote: String? = null,
    val type: String? = null,
    val base: String? = null,
    val isFeatured: Boolean = false,
    val style: String? = null,
    val origineHumaine: String? = null,
    val videoUrl: String? = null,
    val rating: Double = 4.8
)

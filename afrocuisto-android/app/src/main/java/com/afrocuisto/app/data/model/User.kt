package com.afrocuisto.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    val id: String = "",
    val email: String = "",
    val name: String = "Gourmet Afro",
    val avatarUrl: String? = null,
    val country: String = "🇧🇯 Bénin",
    val role: String = "Gourmet Passionné",
    val bio: String = "Passionné de cuisine africaine traditionnelle et créative.",
    val favoriteRecipesCount: Int = 0,
    val cookedRecipesCount: Int = 0,
    val storiesCount: Int = 0
)

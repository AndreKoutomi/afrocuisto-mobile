package com.afrocuisto.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class PostComment(
    val id: String = "",
    val postId: String = "",
    val authorName: String = "",
    val authorAvatar: String? = null,
    val authorRole: String? = null,
    val content: String = "",
    val createdAt: String = "",
    val likesCount: Int = 0,
    val isLiked: Boolean = false
)

@Serializable
data class CommunityPost(
    val id: String = "",
    val authorName: String = "",
    val authorAvatar: String? = null,
    val authorRole: String? = "Cuisinier Amateur",
    val authorCountry: String? = "🇧🇯 Bénin",
    val content: String = "",
    val imageUrl: String? = null,
    val recipeId: String? = null,
    val recipeName: String? = null,
    val recipeImage: String? = null,
    val region: String? = null,
    val type: String = "general",
    val tags: List<String> = emptyList(),
    val likesCount: Int = 0,
    val commentsCount: Int = 0,
    val sharesCount: Int = 0,
    val isLiked: Boolean = false,
    val myReaction: String? = null,
    val reactionCounts: Map<String, Int> = emptyMap(),
    val isBookmarked: Boolean = false,
    val createdAt: String = "",
    val comments: List<PostComment> = emptyList()
)

@Serializable
data class CommunityStory(
    val id: String = "",
    val authorName: String = "",
    val authorAvatar: String? = null,
    val title: String = "",
    val caption: String? = null,
    val imageUrl: String = "",
    val videoBadge: Boolean = false,
    val recipeName: String? = null,
    val recipeId: String? = null,
    val isLive: Boolean = false,
    val isViewed: Boolean = false,
    val duration: Int = 15,
    val viewsCount: Int = 0,
    val likesCount: Int = 0,
    val isLiked: Boolean = false
)

@Serializable
data class CommunityGroup(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val membersCount: Int = 0,
    val postsCount: Int = 0,
    val emoji: String = "🍲",
    val isJoined: Boolean = false
)

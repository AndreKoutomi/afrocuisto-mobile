package com.afrocuisto.app.data.repository

import com.afrocuisto.app.data.model.CommunityGroup
import com.afrocuisto.app.data.model.CommunityPost
import com.afrocuisto.app.data.model.CommunityStory
import com.afrocuisto.app.data.model.PostComment
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class CommunityRepository {

    private val _posts = MutableStateFlow<List<CommunityPost>>(getMockPosts())
    val posts: Flow<List<CommunityPost>> = _posts.asStateFlow()

    private val _stories = MutableStateFlow<List<CommunityStory>>(getMockStories())
    val stories: Flow<List<CommunityStory>> = _stories.asStateFlow()

    private val _groups = MutableStateFlow<List<CommunityGroup>>(getMockGroups())
    val groups: Flow<List<CommunityGroup>> = _groups.asStateFlow()

    fun toggleLikePost(postId: String) {
        val updated = _posts.value.map { post ->
            if (post.id == postId) {
                val newLiked = !post.isLiked
                post.copy(
                    isLiked = newLiked,
                    likesCount = if (newLiked) post.likesCount + 1 else post.likesCount - 1
                )
            } else post
        }
        _posts.value = updated
    }

    fun addPost(content: String, recipeName: String?, imageUrl: String?) {
        val newPost = CommunityPost(
            id = "post_${System.currentTimeMillis()}",
            authorName = "Moi (Gourmet)",
            authorAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
            authorRole = "Gourmet Passionné",
            authorCountry = "🇧🇯 Bénin",
            content = content,
            recipeName = recipeName,
            imageUrl = imageUrl,
            likesCount = 0,
            commentsCount = 0,
            createdAt = "À l'instant"
        )
        _posts.value = listOf(newPost) + _posts.value
    }

    companion object {
        fun getMockPosts(): List<CommunityPost> = listOf(
            CommunityPost(
                id = "p1",
                authorName = "Awa N'Diaye",
                authorAvatar = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
                authorRole = "Chef Étoilé",
                authorCountry = "🇸🇳 Sénégal",
                content = "J'ai cuisiné un Amiwô au poulet braisé ce midi ! Un vrai régal avec la pimentade maison. Qui d'autre adore ce plat béninois ? 🌶️🍗",
                recipeName = "Amiwô au Poulet Braisé",
                recipeImage = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80",
                region = "Bénin",
                likesCount = 48,
                commentsCount = 12,
                isLiked = true,
                createdAt = "Il y a 2h",
                comments = listOf(
                    PostComment(
                        id = "c1",
                        postId = "p1",
                        authorName = "Koffi A.",
                        content = "La sauce pimentée fait toute la différence ! 👌",
                        createdAt = "Il y a 1h",
                        likesCount = 4
                    )
                )
            ),
            CommunityPost(
                id = "p2",
                authorName = "Koffi Adjovi",
                authorAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                authorRole = "Terroir Master",
                authorCountry = "🇧🇯 Bénin",
                content = "Atassi réussi du premier coup avec la friture de tomate et les œufs durs ! Merci pour les astuces de trempage des haricots.",
                recipeName = "Atassi Complet Royale",
                recipeImage = "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
                region = "Bénin",
                likesCount = 35,
                commentsCount = 5,
                createdAt = "Il y a 5h"
            )
        )

        fun getMockStories(): List<CommunityStory> = listOf(
            CommunityStory(
                id = "s1",
                authorName = "Chef Mireille",
                authorAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
                title = "Secrets du Mafé",
                imageUrl = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
                isLive = true
            ),
            CommunityStory(
                id = "s2",
                authorName = "Togo Gourmet",
                authorAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
                title = "Atassi du Dimanche",
                imageUrl = "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80"
            )
        )

        fun getMockGroups(): List<CommunityGroup> = listOf(
            CommunityGroup(
                id = "g1",
                name = "Les Rois de la Pâte (Wô & Amiwô)",
                description = "Échanges de recettes, dosages et astuces pour la pâte rouge et blanche.",
                membersCount = 3420,
                postsCount = 180,
                emoji = "🍲",
                isJoined = true
            ),
            CommunityGroup(
                id = "g2",
                name = "Passion Grillades & Suya",
                description = "Tout sur les marinades Kankan, Tchatchanga et grillades d'Afrique de l'Ouest.",
                membersCount = 2150,
                postsCount = 95,
                emoji = "🔥"
            )
        )
    }
}

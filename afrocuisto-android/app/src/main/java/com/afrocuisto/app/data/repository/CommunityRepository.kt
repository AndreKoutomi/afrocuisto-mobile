package com.afrocuisto.app.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.afrocuisto.app.data.model.CommunityGroup
import com.afrocuisto.app.data.model.CommunityPost
import com.afrocuisto.app.data.model.CommunityStory
import com.afrocuisto.app.data.model.PostComment
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

private val Context.communityDataStore by preferencesDataStore(name = "afrocuisto_community")

class CommunityRepository(context: Context) {
    private val appContext = context.applicationContext
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val postsKey = stringPreferencesKey("posts_v1")
    private val json = Json { ignoreUnknownKeys = true }

    val posts: Flow<List<CommunityPost>> = appContext.communityDataStore.data
        .catch { emit(androidx.datastore.preferences.core.emptyPreferences()) }
        .map { preferences ->
            preferences[postsKey]?.let(::decodePosts) ?: getMockPosts()
        }

    val stories: Flow<List<CommunityStory>> = kotlinx.coroutines.flow.flowOf(getMockStories())
    val groups: Flow<List<CommunityGroup>> = kotlinx.coroutines.flow.flowOf(getMockGroups())

    fun toggleLikePost(postId: String) = toggleReaction(postId, "heart")

    /** One reaction per person and post: selecting a second reaction replaces the first. */
    fun toggleReaction(postId: String, reaction: String) {
        updatePosts { posts ->
            posts.map { post ->
                if (post.id != postId) return@map post
                val oldReaction = post.myReaction ?: if (post.isLiked) "heart" else null
                val nextReaction = if (oldReaction == reaction) null else reaction
                val counts = post.reactionCounts.toMutableMap()
                oldReaction?.let { old ->
                    val nextCount = (counts[old] ?: if (old == "heart") post.likesCount else 0) - 1
                    if (nextCount <= 0) counts.remove(old) else counts[old] = nextCount
                }
                nextReaction?.let { next -> counts[next] = (counts[next] ?: 0) + 1 }
                post.copy(
                    myReaction = nextReaction,
                    isLiked = nextReaction != null,
                    likesCount = counts.values.sum(),
                    reactionCounts = counts
                )
            }
        }
    }

    fun toggleBookmark(postId: String) {
        updatePosts { posts -> posts.map { post ->
            if (post.id == postId) post.copy(isBookmarked = !post.isBookmarked) else post
        } }
    }

    fun addPost(
        content: String,
        recipeName: String?,
        recipeId: String?,
        imageUrl: String?,
        authorName: String,
        authorAvatar: String?,
        authorRole: String,
        authorCountry: String
    ) {
        val text = content.trim()
        if (text.isBlank()) return
        val post = CommunityPost(
            id = "post_${UUID.randomUUID()}",
            authorName = authorName.trim().ifBlank { "Gourmet Afro" },
            authorAvatar = authorAvatar,
            authorRole = authorRole,
            authorCountry = authorCountry,
            content = text,
            imageUrl = imageUrl,
            recipeId = recipeId,
            recipeName = recipeName?.trim()?.takeIf(String::isNotBlank),
            recipeImage = null,
            region = authorCountry,
            type = if (recipeName.isNullOrBlank()) "general" else "recipe",
            createdAt = "À l’instant"
        )
        updatePosts { listOf(post) + it }
    }

    fun addComment(postId: String, content: String, authorName: String, authorAvatar: String?) {
        val text = content.trim()
        if (text.isBlank()) return
        val comment = PostComment(
            id = "comment_${UUID.randomUUID()}",
            postId = postId,
            authorName = authorName.trim().ifBlank { "Gourmet Afro" },
            authorAvatar = authorAvatar,
            content = text,
            createdAt = "À l’instant"
        )
        updatePosts { posts -> posts.map { post ->
            if (post.id == postId) post.copy(
                comments = post.comments + comment,
                commentsCount = post.commentsCount + 1
            ) else post
        } }
    }

    fun toggleCommentLike(postId: String, commentId: String) {
        updatePosts { posts -> posts.map { post ->
            if (post.id != postId) return@map post
            post.copy(comments = post.comments.map { comment ->
                if (comment.id != commentId) comment else {
                    val liked = !comment.isLiked
                    comment.copy(isLiked = liked, likesCount = (comment.likesCount + if (liked) 1 else -1).coerceAtLeast(0))
                }
            })
        } }
    }

    fun recordShare(postId: String) {
        updatePosts { posts -> posts.map { post ->
            if (post.id == postId) post.copy(sharesCount = post.sharesCount + 1) else post
        } }
    }

    fun deletePost(postId: String) {
        updatePosts { posts -> posts.filterNot { it.id == postId } }
    }

    suspend fun importPostImage(uri: Uri): String? = withContext(Dispatchers.IO) {
        runCatching {
            val resolver = appContext.contentResolver
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return@withContext null
            var sampleSize = 1
            while (bounds.outWidth / sampleSize > 1600 || bounds.outHeight / sampleSize > 1600) sampleSize *= 2
            val bitmap = resolver.openInputStream(uri)?.use { stream ->
                BitmapFactory.decodeStream(stream, null, BitmapFactory.Options().apply { inSampleSize = sampleSize })
            } ?: return@withContext null
            val directory = File(appContext.filesDir, "community").apply { mkdirs() }
            val image = File(directory, "post_${UUID.randomUUID()}.jpg")
            FileOutputStream(image).use { output ->
                check(bitmap.compress(Bitmap.CompressFormat.JPEG, 88, output))
            }
            bitmap.recycle()
            image.toURI().toString()
        }.getOrNull()
    }

    private fun updatePosts(transform: (List<CommunityPost>) -> List<CommunityPost>) {
        scope.launch {
            appContext.communityDataStore.edit { preferences ->
                val current = preferences[postsKey]?.let(::decodePosts) ?: getMockPosts()
                preferences[postsKey] = json.encodeToString(transform(current))
            }
        }
    }

    private fun decodePosts(raw: String): List<CommunityPost>? =
        runCatching { json.decodeFromString<List<CommunityPost>>(raw) }.getOrNull()

    companion object {
        fun getMockPosts(): List<CommunityPost> = listOf(
            CommunityPost(
                id = "p1",
                authorName = "Awa N'Diaye",
                authorAvatar = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
                authorRole = "Cheffe du terroir",
                authorCountry = "🇸🇳 Sénégal",
                content = "J'ai cuisiné un Amiwô au poulet braisé ce midi ! Un vrai régal avec la pimentade maison. Qui d'autre adore ce plat béninois ? 🌶️🍗",
                recipeName = "Amiwô au Poulet Braisé",
                recipeId = "P02",
                recipeImage = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=85",
                region = "Bénin",
                likesCount = 48,
                reactionCounts = mapOf("heart" to 44, "fire" to 4),
                commentsCount = 1,
                isLiked = true,
                myReaction = "heart",
                createdAt = "Il y a 2 h",
                comments = listOf(
                    PostComment(
                        id = "c1",
                        postId = "p1",
                        authorName = "Koffi A.",
                        content = "La sauce pimentée fait toute la différence ! 👌",
                        createdAt = "Il y a 1 h",
                        likesCount = 4
                    )
                )
            ),
            CommunityPost(
                id = "p2",
                authorName = "Koffi Adjovi",
                authorAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                authorRole = "Cuisinier du terroir",
                authorCountry = "🇧🇯 Bénin",
                content = "Atassi réussi du premier coup avec la friture de tomate et les œufs durs ! Merci pour les astuces de trempage des haricots.",
                recipeName = "Atassi Complet Royal",
                recipeId = "P04",
                recipeImage = "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=85",
                region = "Bénin",
                likesCount = 35,
                reactionCounts = mapOf("heart" to 31, "clap" to 4),
                commentsCount = 0,
                createdAt = "Il y a 5 h"
            )
        )

        fun getMockStories(): List<CommunityStory> = listOf(
            CommunityStory(
                id = "s1",
                authorName = "Chef Mireille",
                authorAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
                title = "Secrets du Mafé",
                imageUrl = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
                isLive = true
            ),
            CommunityStory(
                id = "s2",
                authorName = "Togo Gourmet",
                authorAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
                title = "Atassi du dimanche",
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

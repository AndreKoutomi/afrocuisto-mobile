package com.afrocuisto.app.ui.screens.community

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.CommunityPost
import com.afrocuisto.app.data.model.PostComment
import com.afrocuisto.app.data.model.Recipe
import com.afrocuisto.app.data.repository.CommunityRepository
import com.afrocuisto.app.data.repository.RecipeRepository
import com.afrocuisto.app.data.repository.UserPreferencesState
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.AfroPullToRefreshBox
import com.afrocuisto.app.ui.components.EditorialPageHeader
import com.afrocuisto.app.ui.components.EditorialSearchBar
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import kotlinx.coroutines.launch

private val CommunityRadius28 = RoundedCornerShape(28.dp)
private val CommunityTopSheetRadius28 = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)

private data class FeedFilter(val id: String, val label: String)
private data class ReactionChoice(val id: String, val emoji: String, val label: String)

private val feedFilters = listOf(
    FeedFilter("all", "Pour vous"),
    FeedFilter("recipe", "Recettes"),
    FeedFilter("question", "Questions"),
    FeedFilter("mine", "Mes posts"),
    FeedFilter("saved", "Enregistrés")
)

private val reactions = listOf(
    ReactionChoice("heart", "❤️", "J’aime"),
    ReactionChoice("fire", "🔥", "Chaud"),
    ReactionChoice("clap", "👏", "Bravo"),
    ReactionChoice("yum", "😋", "Miam")
)

@Composable
fun CommunityScreen(
    onNavigateToRecipeDetail: (String) -> Unit,
    repository: CommunityRepository,
    recipeRepository: RecipeRepository,
    userPreferences: UserPreferencesState
) {
    val isDark = isAfroDarkTheme()
    val colors = MaterialTheme.colorScheme
    val posts by repository.posts.collectAsState(initial = CommunityRepository.getMockPosts())
    val recipes by recipeRepository.recipes.collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    val haptics = rememberAfroHaptics()
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("all") }
    var showCreatePost by remember { mutableStateOf(false) }
    var commentsPostId by remember { mutableStateOf<String?>(null) }
    var fullscreenImagePost by remember { mutableStateOf<CommunityPost?>(null) }
    val currentUserName = userPreferences.displayName

    val filteredPosts = remember(posts, searchQuery, selectedFilter, currentUserName) {
        val query = searchQuery.trim()
        posts.filter { post ->
            val matchesQuery = query.isBlank() || listOfNotNull(
                post.authorName,
                post.content,
                post.recipeName,
                post.region
            ).any { it.contains(query, ignoreCase = true) }
            val matchesFilter = when (selectedFilter) {
                "recipe" -> !post.recipeName.isNullOrBlank() || post.type == "recipe"
                "question" -> post.type == "question" || post.content.contains("?")
                "mine" -> post.authorName.equals(currentUserName, ignoreCase = true)
                "saved" -> post.isBookmarked
                else -> true
            }
            matchesQuery && matchesFilter
        }
    }

    val surface = if (isDark) colors.background else Color(0xFFF8F9FA)
    val cardSurface = if (isDark) colors.surface else Color.White
    val ink = if (isDark) colors.onBackground else Color(0xFF1E1E2D)
    val secondary = if (isDark) colors.onSurfaceVariant else Color(0xFF777C78)
    val subtle = if (isDark) Color.White.copy(alpha = 0.07f) else Color(0xFFF0F1EF)
    val border = if (isDark) colors.outline.copy(alpha = 0.36f) else Color(0xFFE8E9E5)

    Column(Modifier.fillMaxSize().background(surface)) {
        EditorialPageHeader(
            title = "Communauté",
            trailingAction = {
                Surface(
                    color = AfroOrange,
                    contentColor = Color.White,
                    shape = CommunityRadius28,
                    modifier = Modifier.afroSpringClickable(
                        pressedScale = 0.94f,
                        haptic = AfroHapticKind.SUCCESS
                    ) { showCreatePost = true }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_add_linear),
                            contentDescription = null,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(Modifier.width(5.dp))
                        Text("Publier", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        ) {
            EditorialSearchBar(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = "Chercher un plat, une idée, un cuisinier…",
                shape = CommunityRadius28
            )
        }

        LazyRow(
            contentPadding = PaddingValues(horizontal = 18.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            flingBehavior = rememberSmoothFlingBehavior()
        ) {
            items(feedFilters, key = { it.id }) { filter ->
                val selected = selectedFilter == filter.id
                FilterChip(
                    selected = selected,
                    onClick = {
                        haptics.selectionTick()
                        selectedFilter = filter.id
                    },
                    label = { Text(filter.label, fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium) },
                    shape = CommunityRadius28,
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = ink,
                        selectedLabelColor = surface,
                        containerColor = cardSurface,
                        labelColor = secondary
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = selected,
                        borderColor = border,
                        selectedBorderColor = ink
                    )
                )
            }
        }

        AfroPullToRefreshBox(
            onRefresh = { recipeRepository.refreshFromSupabase() },
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(top = 10.dp, bottom = 30.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            flingBehavior = rememberSmoothFlingBehavior()
        ) {
            if (selectedFilter == "all" && searchQuery.isBlank()) {
                item(key = "post_composer") {
                    PostComposerPrompt(
                        name = currentUserName,
                        avatarUrl = userPreferences.avatarUrl,
                        isDark = isDark,
                        cardSurface = cardSurface,
                        border = border,
                        secondary = secondary,
                        onClick = { showCreatePost = true }
                    )
                }
            }

            item(key = "feed_intro") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 22.dp)
                        .padding(top = 2.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            when (selectedFilter) {
                                "recipe" -> "À cuisiner ensemble"
                                "question" -> "Questions du terroir"
                                "mine" -> "Vos publications"
                                "saved" -> "À garder sous la main"
                                else -> "Le fil gourmand"
                            },
                            color = ink,
                            fontSize = 19.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            "${filteredPosts.size} ${if (filteredPosts.size == 1) "publication" else "publications"}",
                            color = secondary,
                            fontSize = 12.sp
                        )
                    }
                    Text("RÉCENT", color = AfroOrange, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                }
            }

            if (filteredPosts.isEmpty()) {
                item(key = "empty_community") {
                    EmptyCommunityState(
                        filter = selectedFilter,
                        ink = ink,
                        secondary = secondary,
                        cardSurface = cardSurface,
                        border = border,
                        onCreate = { showCreatePost = true },
                        onClearSearch = { searchQuery = ""; selectedFilter = "all" }
                    )
                }
            } else {
                items(filteredPosts, key = { it.id }, contentType = { "community_post" }) { post ->
                    CommunityPostCard(
                        post = post,
                        currentUserName = currentUserName,
                        isDark = isDark,
                        cardSurface = cardSurface,
                        border = border,
                        ink = ink,
                        secondary = secondary,
                        subtle = subtle,
                        onReact = { reaction ->
                            haptics.selectionTick()
                            repository.toggleReaction(post.id, reaction)
                        },
                        onComments = { commentsPostId = post.id },
                        onBookmark = {
                            haptics.selectionTick()
                            repository.toggleBookmark(post.id)
                        },
                        onShare = {
                            repository.recordShare(post.id)
                            val shareText = buildString {
                                append("${post.authorName} sur AfroCuisto : ${post.content}")
                                post.recipeName?.let { append("\nRecette : $it") }
                            }
                            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TEXT, shareText)
                            }
                            runCatching { context.startActivity(Intent.createChooser(shareIntent, "Partager cette publication")) }
                        },
                        onRecipeClick = { post.recipeId?.let(onNavigateToRecipeDetail) },
                        onImageClick = {
                            haptics.navigationTap()
                            fullscreenImagePost = post
                        },
                        onDelete = { repository.deletePost(post.id) }
                    )
                }
            }
        }
        }
    }

    if (showCreatePost) {
        CreatePostSheet(
            authorName = userPreferences.displayName,
            authorRole = userPreferences.roleTitle,
            authorCountry = userPreferences.favoriteTerroir,
            authorAvatar = userPreferences.avatarUrl,
            recipes = recipes,
            isDark = isDark,
            onDismiss = { showCreatePost = false },
            onPublish = { content, recipe, imageUri ->
                scope.launch {
                    val imageUrl = imageUri?.let { repository.importPostImage(it) }
                    repository.addPost(
                        content = content,
                        recipeName = recipe?.name,
                        recipeId = recipe?.id,
                        imageUrl = imageUrl,
                        authorName = userPreferences.displayName,
                        authorAvatar = userPreferences.avatarUrl,
                        authorRole = userPreferences.roleTitle,
                        authorCountry = userPreferences.favoriteTerroir
                    )
                    haptics.actionSuccess()
                    showCreatePost = false
                }
            }
        )
    }

    val commentsPost = commentsPostId?.let { id -> posts.firstOrNull { it.id == id } }
    if (commentsPost != null) {
        CommentsSheet(
            post = commentsPost,
            authorName = userPreferences.displayName,
            authorAvatar = userPreferences.avatarUrl,
            isDark = isDark,
            onDismiss = { commentsPostId = null },
            onAddComment = { repository.addComment(commentsPost.id, it, userPreferences.displayName, userPreferences.avatarUrl) },
            onLikeComment = { comment -> repository.toggleCommentLike(commentsPost.id, comment.id) }
        )
    }

    fullscreenImagePost?.let { post ->
        val img = post.imageUrl ?: post.recipeImage
        if (!img.isNullOrBlank()) {
            FullScreenPostImageDialog(
                imageUrl = img,
                authorName = post.authorName,
                recipeName = post.recipeName,
                onDismiss = { fullscreenImagePost = null }
            )
        }
    }
}

@Composable
private fun PostComposerPrompt(
    name: String,
    avatarUrl: String,
    isDark: Boolean,
    cardSurface: Color,
    border: Color,
    secondary: Color,
    onClick: () -> Unit
) {
    Surface(
        color = cardSurface,
        shape = CommunityRadius28,
        border = BorderStroke(1.dp, border),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp)
            .clip(CommunityRadius28)
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(model = avatarUrl, contentDescription = name, contentScale = ContentScale.Crop, modifier = Modifier.size(38.dp).clip(CircleShape))
            Spacer(Modifier.width(11.dp))
            Surface(color = if (isDark) Color(0xFF252522) else Color(0xFFF4F4F1), shape = CommunityRadius28, modifier = Modifier.weight(1f)) {
                Text("Une découverte à partager ?", color = secondary, fontSize = 13.sp, modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp))
            }
            Spacer(Modifier.width(10.dp))
            Icon(
                painter = painterResource(id = R.drawable.ic_solar_gallery_linear),
                contentDescription = "Ajouter une photo",
                tint = AfroOrange,
                modifier = Modifier.size(21.dp)
            )
        }
    }
}

@Composable
private fun CommunityPostCard(
    post: CommunityPost,
    currentUserName: String,
    isDark: Boolean,
    cardSurface: Color,
    border: Color,
    ink: Color,
    secondary: Color,
    subtle: Color,
    onReact: (String) -> Unit,
    onComments: () -> Unit,
    onBookmark: () -> Unit,
    onShare: () -> Unit,
    onRecipeClick: () -> Unit,
    onImageClick: () -> Unit,
    onDelete: () -> Unit
) {
    val ownPost = post.authorName.equals(currentUserName, ignoreCase = true)
    var showPostMenu by remember { mutableStateOf(false) }
    val image = post.imageUrl ?: post.recipeImage
    Surface(
        color = cardSurface,
        shape = CommunityRadius28,
        border = BorderStroke(1.dp, border),
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 8.dp, top = 14.dp, bottom = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AsyncImage(
                    model = post.authorAvatar,
                    contentDescription = post.authorName,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.size(44.dp).clip(CircleShape).background(subtle)
                )
                Spacer(Modifier.width(11.dp))
                Column(Modifier.weight(1f)) {
                    Text(post.authorName, color = ink, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(listOfNotNull(post.authorRole, post.createdAt).joinToString(" · "), color = secondary, fontSize = 10.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Box {
                    IconButton(onClick = { showPostMenu = true }) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_menu_dots_linear),
                            contentDescription = "Options de la publication",
                            tint = secondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    DropdownMenu(expanded = showPostMenu, onDismissRequest = { showPostMenu = false }) {
                        if (ownPost) {
                            DropdownMenuItem(
                                text = { Text("Supprimer la publication") },
                                onClick = { showPostMenu = false; onDelete() },
                                leadingIcon = {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_close_linear),
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            )
                        } else {
                            DropdownMenuItem(text = { Text("Publication signalée") }, onClick = { showPostMenu = false })
                        }
                    }
                }
            }

            Text(
                post.content,
                modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = if (image == null) 14.dp else 12.dp),
                color = ink,
                fontSize = 13.5.sp,
                lineHeight = 20.sp
            )

            if (image != null) {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp)
                        .height(210.dp).clip(CommunityRadius28)
                        .background(subtle)
                        .clickable(onClick = onImageClick)
                ) {
                    AsyncImage(model = image, contentDescription = post.recipeName ?: "Photo partagée", contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                    if (!post.recipeName.isNullOrBlank()) {
                        Surface(
                            color = Color.Black.copy(alpha = 0.56f),
                            shape = CommunityRadius28,
                            modifier = Modifier.align(Alignment.BottomStart).padding(10.dp)
                                .clickable(enabled = post.recipeId != null, onClick = onRecipeClick)
                        ) {
                            Row(Modifier.padding(horizontal = 12.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_cat_fork_knife_outline),
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(Modifier.width(6.dp))
                                Text(post.recipeName, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                        }
                    }
                }
            } else if (!post.recipeName.isNullOrBlank()) {
                RecipeLinkCard(post = post, subtle = subtle, onClick = onRecipeClick)
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 15.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                reactions.forEach { reaction ->
                    ReactionButton(
                        reaction = reaction,
                        count = post.reactionCounts[reaction.id] ?: if (reaction.id == "heart" && post.reactionCounts.isEmpty()) post.likesCount else 0,
                        selected = post.myReaction == reaction.id || (reaction.id == "heart" && post.isLiked && post.myReaction == null),
                        secondary = secondary,
                        subtle = subtle,
                        onClick = { onReact(reaction.id) }
                    )
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onBookmark) {
                    Icon(
                        painter = painterResource(
                            id = if (post.isBookmarked) R.drawable.ic_solar_bookmark_bold else R.drawable.ic_solar_bookmark_linear
                        ),
                        contentDescription = if (post.isBookmarked) "Retirer des enregistrés" else "Enregistrer",
                        tint = if (post.isBookmarked) AfroOrange else secondary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(start = 13.dp, end = 13.dp, bottom = 11.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = onComments, contentPadding = PaddingValues(horizontal = 8.dp, vertical = 5.dp)) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_chat_dots_linear),
                        contentDescription = null,
                        tint = secondary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(Modifier.width(7.dp))
                    Text("${post.commentsCount} commentaires", color = secondary, fontSize = 11.sp)
                }
                Spacer(Modifier.weight(1f))
                TextButton(onClick = onShare, contentPadding = PaddingValues(horizontal = 8.dp, vertical = 5.dp)) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_share_linear),
                        contentDescription = null,
                        tint = secondary,
                        modifier = Modifier.size(17.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(if (post.sharesCount > 0) "${post.sharesCount}" else "Partager", color = secondary, fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
private fun RecipeLinkCard(post: CommunityPost, subtle: Color, onClick: () -> Unit) {
    Surface(
        color = subtle,
        shape = CommunityRadius28,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp)
            .clip(CommunityRadius28)
            .clickable(enabled = post.recipeId != null, onClick = onClick)
    ) {
        Row(Modifier.padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(
                painter = painterResource(id = R.drawable.ic_solar_cat_fork_knife_outline),
                contentDescription = null,
                tint = AfroOrange,
                modifier = Modifier.size(19.dp)
            )
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text("RECETTE À DÉCOUVRIR", color = AfroOrange, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                Text(post.recipeName.orEmpty(), color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (post.recipeId != null) Text("Voir", color = AfroOrange, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ReactionButton(
    reaction: ReactionChoice,
    count: Int,
    selected: Boolean,
    secondary: Color,
    subtle: Color,
    onClick: () -> Unit
) {
    val background by animateColorAsState(
        targetValue = if (selected) AfroOrange.copy(alpha = 0.14f) else subtle,
        animationSpec = tween(160),
        label = "reactionBackground"
    )
    Surface(
        color = background,
        shape = CommunityRadius28,
        border = if (selected) BorderStroke(1.dp, AfroOrange.copy(alpha = 0.36f)) else null,
        modifier = Modifier.afroSpringClickable(
            pressedScale = 0.88f,
            haptic = AfroHapticKind.SELECTION,
            onClick = onClick
        )
    ) {
        Row(Modifier.padding(horizontal = 9.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(reaction.emoji, fontSize = 14.sp)
            if (count > 0) {
                Spacer(Modifier.width(4.dp))
                Text(count.toString(), color = if (selected) AfroOrange else secondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreatePostSheet(
    authorName: String,
    authorRole: String,
    authorCountry: String,
    authorAvatar: String,
    recipes: List<Recipe>,
    isDark: Boolean,
    onDismiss: () -> Unit,
    onPublish: (String, Recipe?, Uri?) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val colors = MaterialTheme.colorScheme
    val ink = colors.onSurface
    val secondary = colors.onSurfaceVariant
    var content by remember { mutableStateOf("") }
    var selectedRecipe by remember { mutableStateOf<Recipe?>(null) }
    var selectedImage by remember { mutableStateOf<Uri?>(null) }
    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { selectedImage = it }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        shape = CommunityTopSheetRadius28,
        containerColor = colors.surface,
        tonalElevation = 0.dp
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().imePadding().navigationBarsPadding()
                .padding(horizontal = 20.dp).padding(bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Column {
                    Text("Nouvelle publication", color = ink, fontSize = 21.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Partagez un moment de votre cuisine.", color = secondary, fontSize = 12.sp)
                }
                IconButton(onClick = onDismiss) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_close_linear),
                        contentDescription = "Fermer",
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = authorAvatar, contentDescription = authorName, contentScale = ContentScale.Crop, modifier = Modifier.size(42.dp).clip(CircleShape))
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(authorName, color = ink, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text("$authorRole · $authorCountry", color = secondary, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }

            OutlinedTextField(
                value = content,
                onValueChange = { content = it.take(1000) },
                modifier = Modifier.fillMaxWidth().heightIn(min = 120.dp),
                placeholder = { Text("Qu'avez-vous préparé aujourd'hui ?") },
                shape = CommunityRadius28,
                minLines = 4,
                maxLines = 6,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AfroOrange,
                    unfocusedBorderColor = colors.outline.copy(alpha = 0.45f)
                )
            )

            if (recipes.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Associer une recette", color = secondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(end = 2.dp)) {
                        items(recipes, key = { it.id }) { recipe ->
                            val selected = selectedRecipe?.id == recipe.id
                            Surface(
                                color = if (selected) AfroOrange.copy(alpha = 0.12f) else if (isDark) Color.White.copy(alpha = 0.06f) else Color(0xFFF3F4F1),
                                shape = CommunityRadius28,
                                border = BorderStroke(1.dp, if (selected) AfroOrange else colors.outline.copy(alpha = 0.2f)),
                                modifier = Modifier.clip(CommunityRadius28).clickable { selectedRecipe = if (selected) null else recipe }
                            ) {
                                Text(recipe.name, color = if (selected) AfroOrange else ink, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp), maxLines = 1)
                            }
                        }
                    }
                }
            }

            selectedImage?.let { uri ->
                Box(Modifier.fillMaxWidth().height(160.dp).clip(CommunityRadius28)) {
                    AsyncImage(model = uri, contentDescription = "Photo à publier", contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                    IconButton(onClick = { selectedImage = null }, modifier = Modifier.align(Alignment.TopEnd).padding(8.dp).background(Color.Black.copy(alpha = 0.55f), CircleShape)) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_close_linear),
                            contentDescription = "Retirer la photo",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    color = if (isDark) Color.White.copy(alpha = 0.07f) else Color(0xFFF3F4F1),
                    shape = CommunityRadius28,
                    modifier = Modifier.weight(1f).clip(CommunityRadius28).clickable { imagePicker.launch("image/*") }
                ) {
                    Row(Modifier.padding(horizontal = 14.dp, vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_gallery_linear),
                            contentDescription = null,
                            tint = AfroOrange,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(if (selectedImage == null) "Ajouter une photo" else "Changer la photo", color = ink, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
                Text("${content.length}/1000", color = secondary, fontSize = 10.sp)
            }

            Button(
                onClick = { onPublish(content.trim(), selectedRecipe, selectedImage) },
                enabled = content.isNotBlank(),
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = CommunityRadius28,
                colors = ButtonDefaults.buttonColors(containerColor = AfroOrange)
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_solar_send_linear),
                    contentDescription = null,
                    modifier = Modifier.size(17.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text("Publier", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CommentsSheet(
    post: CommunityPost,
    authorName: String,
    authorAvatar: String,
    isDark: Boolean,
    onDismiss: () -> Unit,
    onAddComment: (String) -> Unit,
    onLikeComment: (PostComment) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var draft by remember(post.id) { mutableStateOf("") }
    val colors = MaterialTheme.colorScheme
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        shape = CommunityTopSheetRadius28,
        containerColor = colors.surface,
        tonalElevation = 0.dp
    ) {
        Column(Modifier.fillMaxWidth().heightIn(min = 320.dp, max = 640.dp).imePadding().navigationBarsPadding()) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Discussion", color = colors.onSurface, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                    Text("${post.commentsCount} commentaires", color = colors.onSurfaceVariant, fontSize = 11.sp)
                }
                IconButton(onClick = onDismiss) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_close_linear),
                        contentDescription = "Fermer",
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            LazyColumn(
                modifier = Modifier.weight(1f, fill = false).fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 18.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (post.comments.isEmpty()) {
                    item {
                        Text("Lancez la discussion : partagez une astuce ou posez votre question.", color = colors.onSurfaceVariant, fontSize = 13.sp, modifier = Modifier.padding(vertical = 28.dp))
                    }
                }
                items(post.comments, key = { it.id }) { comment ->
                    CommentRow(comment = comment, isDark = isDark, onLike = { onLikeComment(comment) })
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AsyncImage(model = authorAvatar, contentDescription = authorName, contentScale = ContentScale.Crop, modifier = Modifier.size(35.dp).clip(CircleShape))
                Spacer(Modifier.width(9.dp))
                BasicTextField(
                    value = draft,
                    onValueChange = { draft = it.take(500) },
                    modifier = Modifier.weight(1f).clip(CommunityRadius28).background(if (isDark) Color.White.copy(alpha = 0.07f) else Color(0xFFF2F3F0)).padding(horizontal = 15.dp, vertical = 12.dp),
                    textStyle = TextStyle(color = colors.onSurface, fontSize = 13.sp),
                    singleLine = true,
                    decorationBox = { inner ->
                        if (draft.isBlank()) Text("Écrire un commentaire…", color = colors.onSurfaceVariant, fontSize = 12.sp)
                        inner()
                    }
                )
                IconButton(
                    onClick = { val value = draft.trim(); if (value.isNotEmpty()) { onAddComment(value); draft = "" } },
                    enabled = draft.isNotBlank()
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_send_linear),
                        contentDescription = "Envoyer",
                        tint = if (draft.isNotBlank()) AfroOrange else colors.onSurfaceVariant,
                        modifier = Modifier.size(19.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun CommentRow(comment: PostComment, isDark: Boolean, onLike: () -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        AsyncImage(
            model = comment.authorAvatar ?: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
            contentDescription = comment.authorName,
            contentScale = ContentScale.Crop,
            modifier = Modifier.size(36.dp).clip(CircleShape)
        )
        Spacer(Modifier.width(10.dp))
        Surface(color = if (isDark) Color.White.copy(alpha = 0.06f) else Color(0xFFF4F4F1), shape = CommunityRadius28, modifier = Modifier.weight(1f)) {
            Column(Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(comment.authorName, color = MaterialTheme.colorScheme.onSurface, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(7.dp))
                    Text(comment.createdAt, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 9.sp)
                }
                Spacer(Modifier.height(4.dp))
                Text(comment.content, color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp, lineHeight = 17.sp)
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            IconButton(onClick = onLike, modifier = Modifier.size(34.dp)) {
                Icon(
                    painter = painterResource(
                        id = if (comment.isLiked) R.drawable.ic_solar_heart_liked else R.drawable.ic_solar_heart_linear
                    ),
                    contentDescription = "Aimer le commentaire",
                    tint = if (comment.isLiked) AfroOrange else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(16.dp)
                )
            }
            if (comment.likesCount > 0) Text(comment.likesCount.toString(), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 9.sp)
        }
    }
}

@Composable
private fun EmptyCommunityState(
    filter: String,
    ink: Color,
    secondary: Color,
    cardSurface: Color,
    border: Color,
    onCreate: () -> Unit,
    onClearSearch: () -> Unit
) {
    Surface(
        color = cardSurface,
        shape = CommunityRadius28,
        border = BorderStroke(1.dp, border),
        modifier = Modifier.fillMaxWidth().padding(horizontal = 18.dp)
    ) {
        Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(58.dp)
                    .clip(CommunityRadius28)
                    .background(AfroOrange.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(
                        id = if (filter == "saved") R.drawable.ic_solar_bookmark_linear else R.drawable.ic_solar_users_linear
                    ),
                    contentDescription = null,
                    tint = AfroOrange,
                    modifier = Modifier.size(28.dp)
                )
            }
            Spacer(Modifier.height(12.dp))
            Text(if (filter == "saved") "Rien d’enregistré pour l’instant" else "Aucune publication ici", color = ink, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(5.dp))
            Text("Partagez une recette, une question ou une petite victoire en cuisine.", color = secondary, fontSize = 12.sp)
            Spacer(Modifier.height(14.dp))
            TextButton(onClick = if (filter == "all") onCreate else onClearSearch) {
                Text(if (filter == "all") "Créer une publication" else "Voir tout le fil", color = AfroOrange, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun FullScreenPostImageDialog(
    imageUrl: String,
    authorName: String,
    recipeName: String?,
    onDismiss: () -> Unit
) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF0A0B0F))
                .pointerInput(Unit) {
                    detectTransformGestures { _, pan, zoom, _ ->
                        val nextScale = (scale * zoom).coerceIn(1f, 4f)
                        scale = nextScale
                        offset = if (nextScale > 1.02f) offset + pan else Offset.Zero
                    }
                }
                .pointerInput(Unit) {
                    detectTapGestures(
                        onDoubleTap = {
                            if (scale > 1.2f) {
                                scale = 1f
                                offset = Offset.Zero
                            } else {
                                scale = 2.4f
                            }
                        },
                        onTap = {
                            if (scale <= 1.05f) onDismiss()
                        }
                    )
                }
        ) {
            AsyncImage(
                model = imageUrl,
                contentDescription = recipeName ?: "Image de $authorName",
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        scaleX = scale
                        scaleY = scale
                        translationX = offset.x
                        translationY = offset.y
                    }
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 18.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = CommunityRadius28,
                    color = Color.Black.copy(alpha = 0.55f)
                ) {
                    Text(
                        text = authorName,
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }

                Surface(
                    shape = CommunityRadius28,
                    color = Color.Black.copy(alpha = 0.62f),
                    modifier = Modifier.afroSpringClickable(
                        pressedScale = 0.88f,
                        haptic = AfroHapticKind.NAVIGATION,
                        onClick = onDismiss
                    )
                ) {
                    Box(
                        modifier = Modifier.size(42.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_close_linear),
                            contentDescription = "Fermer l'image",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            if (!recipeName.isNullOrBlank()) {
                Surface(
                    shape = CommunityRadius28,
                    color = Color.Black.copy(alpha = 0.62f),
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .navigationBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 22.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_cat_fork_knife_outline),
                            contentDescription = null,
                            tint = AfroOrange,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = recipeName,
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}

package com.afrocuisto.app.ui.screens.recipe

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.MediaController
import android.widget.VideoView
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.AsyncImage
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.Recipe
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AfroOrange

private val ExtraEmerald = Color(0xFF10B981)

@Composable
fun RecipeCookingVideoSection(
    recipe: Recipe,
    isDark: Boolean
) {
    val colorScheme = MaterialTheme.colorScheme
    val ink = if (isDark) colorScheme.onSurface else Color(0xFF1E1E2D)
    val muted = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF64748B)
    val cardBg = if (isDark) colorScheme.surfaceVariant else Color(0xFFF8FAFC)
    val borderColor = if (isDark) colorScheme.outline else Color(0xFFE2E8F0)

    val rawUrl = recipe.videoUrl?.trim().orEmpty()
    val hasVideo = rawUrl.isNotBlank()
    var isPlaying by remember(recipe.id) { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            Text(
                text = "Vidéo de cuisson",
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = ink
            )
            Text(
                text = "Préparation pas à pas en images",
                fontSize = 12.sp,
                color = muted
            )
        }

        Spacer(Modifier.height(12.dp))

        Surface(
            shape = RoundedCornerShape(28.dp),
            color = cardBg,
            border = BorderStroke(1.dp, borderColor),
            modifier = Modifier.fillMaxWidth()
        ) {
            AnimatedContent(
                targetState = isPlaying && hasVideo,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "recipeVideoPlayerState"
            ) { playing ->
                if (playing) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp)
                            .clip(RoundedCornerShape(28.dp))
                            .background(Color.Black)
                    ) {
                        val youtubeId = remember(rawUrl) { extractYouTubeVideoId(rawUrl) }
                        if (youtubeId != null) {
                            InAppYouTubePlayer(
                                videoId = youtubeId,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            InAppNativeVideoPlayer(
                                videoUrl = rawUrl,
                                modifier = Modifier.fillMaxSize()
                            )
                        }

                        Surface(
                            shape = CircleShape,
                            color = Color.Black.copy(alpha = 0.65f),
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(10.dp)
                                .clickable { isPlaying = false }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Fermer la vidéo",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = "Fermer",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(190.dp)
                            .clip(RoundedCornerShape(28.dp))
                            .then(
                                if (hasVideo) Modifier.clickable { isPlaying = true }
                                else Modifier
                            )
                    ) {
                        if (recipe.image.isNotBlank()) {
                            AsyncImage(
                                model = recipe.image,
                                contentDescription = recipe.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        colors = listOf(
                                            Color.Black.copy(alpha = 0.2f),
                                            Color.Black.copy(alpha = 0.72f)
                                        )
                                    )
                                )
                        )

                        Column(
                            modifier = Modifier.align(Alignment.Center),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = if (hasVideo) AfroOrange else Color.White.copy(alpha = 0.24f),
                                modifier = Modifier.size(56.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.PlayArrow,
                                        contentDescription = "Lire la vidéo",
                                        tint = Color.White,
                                        modifier = Modifier.size(30.dp)
                                    )
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = if (hasVideo) "Lancer la vidéo de cuisson" else "Vidéo bientôt disponible",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                            Text(
                                text = "Cuisson : ${recipe.cookTime}",
                                fontSize = 11.5.sp,
                                color = Color.White.copy(alpha = 0.85f)
                            )
                        }
                    }
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun InAppYouTubePlayer(
    videoId: String,
    modifier: Modifier = Modifier
) {
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    val embedHtml = remember(videoId) {
        """
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
            iframe { width: 100%; height: 100%; border: 0; }
          </style>
        </head>
        <body>
          <iframe
            src="https://www.youtube.com/embed/$videoId?autoplay=1&playsinline=1&rel=0&modestbranding=1"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </body>
        </html>
        """.trimIndent()
    }

    DisposableEffect(videoId) {
        onDispose {
            webViewRef?.apply {
                stopLoading()
                loadUrl("about:blank")
                destroy()
            }
        }
    }

    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            WebView(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(android.graphics.Color.BLACK)
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mediaPlaybackRequiresUserGesture = false
                settings.cacheMode = WebSettings.LOAD_DEFAULT
                webChromeClient = WebChromeClient()
                webViewClient = WebViewClient()
                loadDataWithBaseURL(
                    "https://afrocuisto.app",
                    embedHtml,
                    "text/html",
                    "utf-8",
                    null
                )
                webViewRef = this
            }
        }
    )
}

@Composable
private fun InAppNativeVideoPlayer(
    videoUrl: String,
    modifier: Modifier = Modifier
) {
    var isBuffering by remember(videoUrl) { mutableStateOf(true) }
    var videoViewRef by remember { mutableStateOf<VideoView?>(null) }

    DisposableEffect(videoUrl) {
        onDispose {
            videoViewRef?.stopPlayback()
        }
    }

    Box(modifier = modifier) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                VideoView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    val controller = MediaController(ctx)
                    controller.setAnchorView(this)
                    setMediaController(controller)
                    setOnPreparedListener { mp ->
                        isBuffering = false
                        mp.isLooping = false
                        start()
                    }
                    setOnErrorListener { _, _, _ ->
                        isBuffering = false
                        true
                    }
                    setVideoURI(Uri.parse(videoUrl))
                    requestFocus()
                    videoViewRef = this
                }
            }
        )
        if (isBuffering) {
            CircularProgressIndicator(
                color = AfroOrange,
                modifier = Modifier
                    .align(Alignment.Center)
                    .size(34.dp)
            )
        }
    }
}

private fun extractYouTubeVideoId(rawUrl: String): String? {
    val trimmed = rawUrl.trim()
    val lower = trimmed.lowercase()
    return when {
        lower.contains("youtube.com/watch") -> {
            Uri.parse(trimmed).getQueryParameter("v")?.takeIf { it.isNotBlank() }
        }
        lower.contains("youtu.be/") -> {
            trimmed.substringAfter("youtu.be/").substringBefore("?").substringBefore("/").trim().ifBlank { null }
        }
        lower.contains("youtube.com/shorts/") -> {
            trimmed.substringAfter("shorts/").substringBefore("?").substringBefore("/").trim().ifBlank { null }
        }
        lower.contains("youtube.com/embed/") -> {
            trimmed.substringAfter("embed/").substringBefore("?").substringBefore("/").trim().ifBlank { null }
        }
        else -> null
    }
}

@Composable
fun RecipeRatingAndNoteSection(
    recipe: Recipe,
    isDark: Boolean,
    onInputFocusChanged: (Boolean) -> Unit = {}
) {
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val haptics = rememberAfroHaptics()
    val colorScheme = MaterialTheme.colorScheme
    val ink = if (isDark) colorScheme.onSurface else Color(0xFF1E1E2D)
    val muted = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF64748B)
    val cardBg = if (isDark) colorScheme.surfaceVariant else Color(0xFFF8FAFC)
    val borderColor = if (isDark) colorScheme.outline else Color(0xFFE2E8F0)

    val prefs = remember(context) {
        context.applicationContext.getSharedPreferences("afrocuisto_recipe_notes_prefs", Context.MODE_PRIVATE)
    }
    var rating by remember(recipe.id) {
        mutableIntStateOf(prefs.getInt("rating_${recipe.id}", 0))
    }
    var note by remember(recipe.id) {
        mutableStateOf(prefs.getString("note_${recipe.id}", "").orEmpty())
    }
    var savedBanner by remember(recipe.id) { mutableStateOf(false) }

    val ratingLabel = when (rating) {
        1 -> "À améliorer"
        2 -> "Sympa"
        3 -> "Très bon"
        4 -> "Délicieux"
        5 -> "Coup de cœur !"
        else -> "Touchez une étoile pour noter"
    }

    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Votre note & avis",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = ink
                )
                Text(
                    text = "Notez « ${recipe.name} » et gardez vos astuces",
                    fontSize = 12.sp,
                    color = muted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            if (savedBanner) {
                Surface(shape = CircleShape, color = ExtraEmerald.copy(alpha = 0.14f)) {
                    Text(
                        text = "Enregistré ✓",
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = ExtraEmerald,
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        Surface(
            shape = RoundedCornerShape(28.dp),
            color = cardBg,
            border = BorderStroke(1.dp, borderColor),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        (1..5).forEach { star ->
                            val active = star <= rating
                            val scale by animateFloatAsState(
                                targetValue = if (active) 1.12f else 1f,
                                animationSpec = spring(dampingRatio = 0.6f),
                                label = "recipeStarScale_$star"
                            )
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (active) AfroOrange.copy(alpha = 0.14f)
                                        else Color.Transparent
                                    )
                                    .clickable {
                                        haptics.selectionTick()
                                        rating = star
                                        savedBanner = false
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (active) Icons.Filled.Star else Icons.Outlined.StarBorder,
                                    contentDescription = "$star étoiles",
                                    tint = if (active) AfroOrange else muted,
                                    modifier = Modifier
                                        .size(28.dp)
                                        .scale(scale)
                                )
                            }
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = ratingLabel,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (rating > 0) AfroOrange else muted
                    )
                }

                Spacer(Modifier.height(14.dp))

                OutlinedTextField(
                    value = note,
                    onValueChange = {
                        note = it
                        savedBanner = false
                    },
                    placeholder = {
                        Text(
                            "Ajoutez votre note personnelle, dosage d'épices ou avis...",
                            fontSize = 13.sp,
                            color = muted
                        )
                    },
                    minLines = 3,
                    maxLines = 5,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
                    shape = RoundedCornerShape(28.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = ink,
                        unfocusedTextColor = ink,
                        focusedBorderColor = AfroOrange,
                        unfocusedBorderColor = borderColor,
                        focusedContainerColor = if (isDark) colorScheme.surface else Color.White,
                        unfocusedContainerColor = if (isDark) colorScheme.surface else Color.White
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { onInputFocusChanged(it.isFocused) }
                )

                Spacer(Modifier.height(14.dp))

                Button(
                    onClick = {
                        haptics.actionSuccess()
                        prefs.edit()
                            .putInt("rating_${recipe.id}", rating)
                            .putString("note_${recipe.id}", note.trim())
                            .apply()
                        savedBanner = true
                    },
                    enabled = rating > 0 || note.isNotBlank(),
                    shape = RoundedCornerShape(28.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = AfroOrange,
                        disabledContainerColor = AfroOrange.copy(alpha = 0.35f)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp)
                ) {
                    Text(
                        text = "Enregistrer ma note",
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
fun RecipeSuggestionsSection(
    currentRecipe: Recipe,
    allRecipes: List<Recipe>,
    isDark: Boolean,
    onRecipeClick: (String) -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    val ink = if (isDark) colorScheme.onSurface else Color(0xFF1E1E2D)
    val muted = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF64748B)
    val cardBg = if (isDark) colorScheme.surface else Color.White
    val borderColor = if (isDark) colorScheme.outline else Color(0xFFE8EAEE)

    val suggestions = remember(allRecipes, currentRecipe.id, currentRecipe.category, currentRecipe.region) {
        val sameCategory = allRecipes.filter {
            it.id != currentRecipe.id && it.category.equals(currentRecipe.category, ignoreCase = true)
        }
        sameCategory.ifEmpty {
            allRecipes.filter { it.id != currentRecipe.id && it.region.equals(currentRecipe.region, ignoreCase = true) }
        }
    }

    if (suggestions.isEmpty()) return

    Column(modifier = Modifier.fillMaxWidth()) {
        Column {
            Text(
                text = "Suggestions pour vous",
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = ink
            )
            Text(
                text = "Autres plats dans « ${currentRecipe.category} »",
                fontSize = 12.sp,
                color = muted
            )
        }

        Spacer(Modifier.height(12.dp))

        LazyRow(
            contentPadding = PaddingValues(horizontal = 0.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            flingBehavior = rememberSmoothFlingBehavior()
        ) {
            items(suggestions, key = { it.id }) { item ->
                Surface(
                    shape = RoundedCornerShape(28.dp),
                    color = cardBg,
                    border = BorderStroke(1.dp, borderColor),
                    modifier = Modifier
                        .width(170.dp)
                        .afroSpringClickable(
                            pressedScale = 0.96f,
                            haptic = AfroHapticKind.SELECTION
                        ) { onRecipeClick(item.id) }
                ) {
                    Column {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(112.dp)
                                .clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
                                .background(if (isDark) colorScheme.surfaceVariant else Color(0xFFF3F4F6))
                        ) {
                            AsyncImage(
                                model = item.image,
                                contentDescription = item.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                            Surface(
                                shape = CircleShape,
                                color = Color.Black.copy(alpha = 0.65f),
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(3.dp)
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_star_linear),
                                        contentDescription = null,
                                        tint = AfroOrange,
                                        modifier = Modifier.size(11.dp)
                                    )
                                    Text(
                                        text = "${item.rating}",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            }
                        }

                        Column(modifier = Modifier.padding(11.dp)) {
                            Text(
                                text = item.name,
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = ink,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(Modifier.height(2.dp))
                            Text(
                                text = "${item.region} • ${item.prepTime}",
                                fontSize = 11.sp,
                                color = muted,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}

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
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
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
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
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
import androidx.compose.ui.platform.LocalDensity
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
import com.afrocuisto.app.ui.components.RecipeImageOrSkeleton
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberKeyboardDismisser
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.i18n.tr
import com.afrocuisto.app.ui.theme.AfroOrange
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.security.MessageDigest

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
                text = tr("Vidéo de cuisson", "Cooking video", "Video de cocina"),
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = ink
            )
            Text(
                text = tr("Préparation pas à pas en images", "Step-by-step preparation in video", "Preparación paso a paso en video"),
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
                        RecipeImageOrSkeleton(
                            model = recipe.image,
                            contentDescription = recipe.name,
                            contentScale = ContentScale.Crop,
                            iconSize = 36.dp,
                            modifier = Modifier.fillMaxSize()
                        )
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
                                text = if (hasVideo) {
                                    tr("Lancer la vidéo de cuisson", "Play cooking video", "Reproducir video de cocina")
                                } else {
                                    tr("Vidéo bientôt disponible", "Video coming soon", "Video disponible pronto")
                                },
                                fontSize = 13.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                            Text(
                                text = "${tr("Cuisson", "Cook time", "Cocción")} : ${recipe.cookTime}",
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

private enum class ReviewSubmissionState {
    EDITABLE,
    SUCCESS,
    LOCKED
}

private fun computeRecipeVersionSignature(recipe: Recipe): String {
    val canonical = buildString {
        append(recipe.id.trim()).append('|')
        append(recipe.name.trim()).append('|')
        append(recipe.alias?.trim().orEmpty()).append('|')
        append(recipe.region.trim()).append('|')
        append(recipe.category.trim()).append('|')
        append(recipe.difficulty.trim()).append('|')
        append(recipe.prepTime.trim()).append('|')
        append(recipe.cookTime.trim()).append('|')
        append(recipe.image.trim()).append('|')
        append(recipe.description?.trim().orEmpty()).append('|')
        recipe.ingredients.forEach { ing ->
            append(ing.name.trim()).append(':')
            append(ing.amount.trim()).append(':')
            append(ing.unit.trim()).append(':')
            append(ing.isOptional).append(':')
            append(ing.substitute?.trim().orEmpty()).append(';')
        }
        append('|')
        recipe.steps.forEach { step ->
            append(step.trim()).append(';')
        }
        append('|')
        append(recipe.techniqueTitle?.trim().orEmpty()).append('|')
        append(recipe.techniqueDescription?.trim().orEmpty()).append('|')
        append(recipe.diasporaSubstitutes?.trim().orEmpty()).append('|')
        recipe.suggestedSides?.forEach { side ->
            append(side.trim()).append(';')
        }
        append('|')
        append(recipe.benefits?.trim().orEmpty()).append('|')
        append(recipe.pedagogicalNote?.trim().orEmpty()).append('|')
        append(recipe.type?.trim().orEmpty()).append('|')
        append(recipe.base?.trim().orEmpty()).append('|')
        append(recipe.style?.trim().orEmpty()).append('|')
        append(recipe.origineHumaine?.trim().orEmpty()).append('|')
        append(recipe.videoUrl?.trim().orEmpty())
    }
    val digest = MessageDigest.getInstance("SHA-256").digest(canonical.toByteArray(Charsets.UTF_8))
    return digest.joinToString("") { "%02x".format(it) }
}

@Composable
fun RecipeRatingAndNoteSection(
    recipe: Recipe,
    isDark: Boolean,
    onInputFocusChanged: (Boolean) -> Unit = {}
) {
    val context = LocalContext.current
    val dismissKeyboard = rememberKeyboardDismisser()
    val haptics = rememberAfroHaptics()
    val colorScheme = MaterialTheme.colorScheme
    val ink = if (isDark) colorScheme.onSurface else Color(0xFF1E1E2D)
    val muted = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF64748B)
    val cardBg = if (isDark) colorScheme.surfaceVariant else Color(0xFFF8FAFC)
    val borderColor = if (isDark) colorScheme.outline else Color(0xFFE2E8F0)

    val prefs = remember(context) {
        context.applicationContext.getSharedPreferences("afrocuisto_recipe_notes_prefs", Context.MODE_PRIVATE)
    }
    val recipeSignature = remember(recipe) { computeRecipeVersionSignature(recipe) }

    val savedRating = remember(recipe.id, recipeSignature) {
        prefs.getInt("rating_${recipe.id}", 0)
    }
    val savedNote = remember(recipe.id, recipeSignature) {
        prefs.getString("note_${recipe.id}", "").orEmpty()
    }
    val savedSignature = remember(recipe.id, recipeSignature) {
        prefs.getString("rated_signature_${recipe.id}", null)
    }

    val isLegacyAlreadyRated = savedSignature == null && savedRating > 0
    val isAlreadyRatedForCurrentVersion = savedSignature == recipeSignature || isLegacyAlreadyRated
    val wasRecipeUpdatedSinceLastRating = savedSignature != null && savedSignature != recipeSignature

    LaunchedEffect(recipe.id, recipeSignature, isLegacyAlreadyRated) {
        if (isLegacyAlreadyRated) {
            prefs.edit().putString("rated_signature_${recipe.id}", recipeSignature).apply()
        }
    }

    DisposableEffect(recipe.id) {
        onDispose { onInputFocusChanged(false) }
    }

    var rating by remember(recipe.id, recipeSignature) {
        mutableIntStateOf(if (wasRecipeUpdatedSinceLastRating) 0 else savedRating)
    }
    var note by remember(recipe.id, recipeSignature) {
        mutableStateOf(if (wasRecipeUpdatedSinceLastRating) "" else savedNote)
    }
    var submissionState by remember(recipe.id, recipeSignature) {
        mutableStateOf(
            if (isAlreadyRatedForCurrentVersion) ReviewSubmissionState.LOCKED
            else ReviewSubmissionState.EDITABLE
        )
    }

    val submitBringIntoViewRequester = remember { BringIntoViewRequester() }
    var isFieldFocused by remember { mutableStateOf(false) }
    val imeBottomPx = WindowInsets.ime.getBottom(LocalDensity.current)
    LaunchedEffect(isFieldFocused, imeBottomPx) {
        if (isFieldFocused && imeBottomPx > 0) {
            delay(50L)
            submitBringIntoViewRequester.bringIntoView()
        }
    }
    val buttonScale = remember { Animatable(1f) }

    LaunchedEffect(submissionState, recipe.id, recipeSignature) {
        if (submissionState == ReviewSubmissionState.SUCCESS) {
            delay(2000L)
            submissionState = ReviewSubmissionState.LOCKED
        }
    }

    LaunchedEffect(submissionState) {
        if (submissionState == ReviewSubmissionState.SUCCESS) {
            buttonScale.snapTo(0.95f)
            buttonScale.animateTo(
                targetValue = 1f,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioMediumBouncy,
                    stiffness = Spring.StiffnessMedium
                )
            )
        }
    }

    val isInteractive = submissionState == ReviewSubmissionState.EDITABLE
    val isSuccess = submissionState == ReviewSubmissionState.SUCCESS
    val isLocked = submissionState == ReviewSubmissionState.LOCKED

    val ratingLabel = when (rating) {
        1 -> tr("À améliorer", "Needs improvement", "Por mejorar")
        2 -> tr("Sympa", "Nice", "Bien")
        3 -> tr("Très bon", "Very good", "Muy bueno")
        4 -> tr("Délicieux", "Delicious", "Delicioso")
        5 -> tr("Coup de cœur !", "Favorite!", "¡Favorito!")
        else -> tr("Touchez une étoile pour noter", "Tap a star to rate", "Toca una estrella para calificar")
    }

    val lockedSurfaceGrey = if (isDark) Color(0xFF2B2825) else Color(0xFFE2E8F0)
    val lockedContentGrey = if (isDark) Color(0xFF78736D) else Color(0xFF94A3B8)
    val lockedStarEmptyGrey = if (isDark) Color(0xFF3E3B37) else Color(0xFFCBD5E1)
    val lockedFieldBg = if (isDark) Color(0xFF1C1A18) else Color(0xFFF1F5F9)

    val activeStarTint by animateColorAsState(
        targetValue = when {
            isLocked -> lockedContentGrey
            isSuccess -> ExtraEmerald
            else -> AfroOrange
        },
        animationSpec = tween(durationMillis = 320),
        label = "recipeRatingActiveStarTint"
    )
    val inactiveStarTint by animateColorAsState(
        targetValue = if (isLocked) lockedStarEmptyGrey else muted,
        animationSpec = tween(durationMillis = 320),
        label = "recipeRatingInactiveStarTint"
    )
    val activeStarHalo by animateColorAsState(
        targetValue = when {
            isLocked -> lockedSurfaceGrey.copy(alpha = 0.65f)
            isSuccess -> ExtraEmerald.copy(alpha = 0.14f)
            else -> AfroOrange.copy(alpha = 0.14f)
        },
        animationSpec = tween(durationMillis = 320),
        label = "recipeRatingActiveStarHalo"
    )
    val ratingCaptionColor by animateColorAsState(
        targetValue = when {
            isLocked -> muted
            isSuccess -> ExtraEmerald
            rating > 0 -> AfroOrange
            else -> muted
        },
        animationSpec = tween(durationMillis = 320),
        label = "recipeRatingCaptionColor"
    )

    val normalFieldBg = if (isDark) colorScheme.surface else Color.White
    val disabledFieldBg by animateColorAsState(
        targetValue = if (isLocked) lockedFieldBg else normalFieldBg,
        animationSpec = tween(durationMillis = 320),
        label = "recipeNoteDisabledBg"
    )
    val disabledFieldText by animateColorAsState(
        targetValue = if (isLocked) lockedContentGrey else ink,
        animationSpec = tween(durationMillis = 320),
        label = "recipeNoteDisabledText"
    )
    val disabledFieldBorder by animateColorAsState(
        targetValue = if (isLocked) borderColor.copy(alpha = 0.7f) else ExtraEmerald.copy(alpha = 0.55f),
        animationSpec = tween(durationMillis = 320),
        label = "recipeNoteDisabledBorder"
    )

    val buttonContainerColor by animateColorAsState(
        targetValue = when (submissionState) {
            ReviewSubmissionState.EDITABLE -> {
                if (rating > 0) AfroOrange
                else if (isDark) Color(0xFF2E2A27) else AfroOrange.copy(alpha = 0.35f)
            }
            ReviewSubmissionState.SUCCESS -> ExtraEmerald
            ReviewSubmissionState.LOCKED -> lockedSurfaceGrey
        },
        animationSpec = tween(durationMillis = 320),
        label = "recipeSubmitButtonBg"
    )
    val buttonContentColor by animateColorAsState(
        targetValue = when (submissionState) {
            ReviewSubmissionState.EDITABLE -> {
                if (rating > 0) Color.White
                else if (isDark) lockedContentGrey else Color.White.copy(alpha = 0.9f)
            }
            ReviewSubmissionState.SUCCESS -> Color.White
            ReviewSubmissionState.LOCKED -> lockedContentGrey
        },
        animationSpec = tween(durationMillis = 320),
        label = "recipeSubmitButtonContent"
    )

    val subtitleText = when {
        wasRecipeUpdatedSinceLastRating && isInteractive ->
            tr("La recette a évolué · Donnez votre nouvel avis", "Recipe updated · Share your new review", "La receta cambió · Deja tu nueva opinión")
        isLocked ->
            tr("Avis enregistré · Modifiable uniquement si la recette change", "Review saved · Editable only if the recipe changes", "Reseña guardada · Editable solo si la receta cambia")
        else ->
            tr("Notez « ${recipe.name} » et gardez vos astuces", "Rate \"${recipe.name}\" and save your tips", "Califica \"${recipe.name}\" y guarda tus consejos")
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
                    text = tr("Votre note & avis", "Your rating & review", "Tu calificación y opinión"),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = ink
                )
                Text(
                    text = subtitleText,
                    fontSize = 12.sp,
                    color = if (wasRecipeUpdatedSinceLastRating && isInteractive) AfroOrange else muted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            AnimatedContent(
                targetState = submissionState,
                transitionSpec = {
                    (fadeIn(tween(220)) + scaleIn(initialScale = 0.9f)).togetherWith(
                        fadeOut(tween(160)) + scaleOut(targetScale = 0.9f)
                    )
                },
                label = "recipeReviewStatusPill"
            ) { state ->
                when (state) {
                    ReviewSubmissionState.SUCCESS -> {
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
                    ReviewSubmissionState.LOCKED -> {
                        Surface(shape = CircleShape, color = lockedSurfaceGrey) {
                            Text(
                                text = "Déjà noté",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = lockedContentGrey,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                            )
                        }
                    }
                    ReviewSubmissionState.EDITABLE -> {
                        Spacer(Modifier.width(1.dp))
                    }
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
                                targetValue = if (active && !isLocked) 1.12f else 1f,
                                animationSpec = spring(dampingRatio = 0.6f),
                                label = "recipeStarScale_$star"
                            )
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(if (active) activeStarHalo else Color.Transparent)
                                    .then(
                                        if (isInteractive) {
                                            Modifier.clickable {
                                                haptics.selectionTick()
                                                rating = star
                                            }
                                        } else {
                                            Modifier
                                        }
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (active) Icons.Filled.Star else Icons.Outlined.StarBorder,
                                    contentDescription = "$star étoiles",
                                    tint = if (active) activeStarTint else inactiveStarTint,
                                    modifier = Modifier
                                        .size(28.dp)
                                        .scale(scale)
                                )
                            }
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = if (isLocked && rating > 0) "$ratingLabel · $rating/5" else ratingLabel,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = ratingCaptionColor
                    )
                }

                Spacer(Modifier.height(14.dp))

                OutlinedTextField(
                    value = note,
                    onValueChange = {
                        if (isInteractive) {
                            note = it
                        }
                    },
                    enabled = isInteractive,
                    readOnly = !isInteractive,
                    placeholder = {
                        Text(
                            text = if (isLocked) {
                                "Aucun commentaire ajouté pour cette recette."
                            } else {
                                "Ajoutez votre note personnelle, dosage d'épices ou avis..."
                            },
                            fontSize = 13.sp,
                            color = if (isLocked) lockedContentGrey else muted
                        )
                    },
                    minLines = 3,
                    maxLines = 5,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { dismissKeyboard() }),
                    shape = RoundedCornerShape(28.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = ink,
                        unfocusedTextColor = ink,
                        disabledTextColor = disabledFieldText,
                        focusedBorderColor = AfroOrange,
                        unfocusedBorderColor = borderColor,
                        disabledBorderColor = disabledFieldBorder,
                        focusedContainerColor = normalFieldBg,
                        unfocusedContainerColor = normalFieldBg,
                        disabledContainerColor = disabledFieldBg,
                        disabledPlaceholderColor = lockedContentGrey
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { focusState ->
                            val focused = isInteractive && focusState.isFocused
                            isFieldFocused = focused
                            onInputFocusChanged(focused)
                        }
                )

                Spacer(Modifier.height(14.dp))

                Button(
                    onClick = {
                        if (!isInteractive || rating <= 0) return@Button
                        val trimmedNote = note.trim()
                        note = trimmedNote
                        isFieldFocused = false
                        dismissKeyboard()
                        onInputFocusChanged(false)
                        haptics.actionSuccess()
                        prefs.edit()
                            .putInt("rating_${recipe.id}", rating)
                            .putString("note_${recipe.id}", trimmedNote)
                            .putString("rated_signature_${recipe.id}", recipeSignature)
                            .putLong("rated_at_${recipe.id}", System.currentTimeMillis())
                            .apply()
                        submissionState = ReviewSubmissionState.SUCCESS
                    },
                    enabled = isInteractive && rating > 0,
                    shape = RoundedCornerShape(28.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = buttonContainerColor,
                        contentColor = buttonContentColor,
                        disabledContainerColor = buttonContainerColor,
                        disabledContentColor = buttonContentColor
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp)
                        .scale(buttonScale.value)
                ) {
                    AnimatedContent(
                        targetState = submissionState,
                        transitionSpec = {
                            (fadeIn(tween(200)) + scaleIn(initialScale = 0.92f)).togetherWith(
                                fadeOut(tween(150)) + scaleOut(targetScale = 0.92f)
                            )
                        },
                        label = "recipeSubmitButtonContentAnim"
                    ) { state ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(7.dp)
                        ) {
                            when (state) {
                                ReviewSubmissionState.EDITABLE -> {
                                    Text(
                                        text = tr("Enregistrer ma note", "Save my rating", "Guardar mi calificación"),
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = buttonContentColor
                                    )
                                }
                                ReviewSubmissionState.SUCCESS -> {
                                    Icon(
                                        imageVector = Icons.Filled.CheckCircle,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        text = tr("Avis enregistré avec succès !", "Review saved successfully!", "¡Opinión guardada con éxito!"),
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White
                                    )
                                }
                                ReviewSubmissionState.LOCKED -> {
                                    Icon(
                                        imageVector = Icons.Filled.Check,
                                        contentDescription = null,
                                        tint = buttonContentColor,
                                        modifier = Modifier.size(17.dp)
                                    )
                                    Text(
                                        text = tr("Avis déjà enregistré", "Review already saved", "Opinión ya guardada"),
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = buttonContentColor
                                    )
                                }
                            }
                        }
                    }
                }
                Spacer(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(12.dp)
                        .bringIntoViewRequester(submitBringIntoViewRequester)
                )
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
                text = tr("Suggestions pour vous", "Suggestions for you", "Sugerencias para ti"),
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = ink
            )
            Text(
                text = tr(
                    "Autres plats dans « ${currentRecipe.category} »",
                    "More dishes in \"${currentRecipe.category}\"",
                    "Más platos en \"${currentRecipe.category}\""
                ),
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
                            RecipeImageOrSkeleton(
                                model = item.image,
                                contentDescription = item.name,
                                contentScale = ContentScale.Crop,
                                iconSize = 26.dp,
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

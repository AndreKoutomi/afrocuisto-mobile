package com.afrocuisto.app.ui.screens.recipe

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.TipsAndUpdates
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.Ingredient
import com.afrocuisto.app.data.repository.RecipeRepository
import com.afrocuisto.app.data.repository.ShoppingRepository
import com.afrocuisto.app.data.repository.UserPreferencesRepository
import com.afrocuisto.app.data.repository.UserPreferencesState
import com.afrocuisto.app.service.CookingTimerService
import com.afrocuisto.app.ui.components.CookingTimerDockCard
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AccentEmerald
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.DifficultyEasy
import com.afrocuisto.app.ui.theme.DifficultyHard
import com.afrocuisto.app.ui.theme.DifficultyMedium
import com.afrocuisto.app.ui.theme.ExpressivePillShape
import com.afrocuisto.app.ui.theme.NexaFontFamily
import com.afrocuisto.app.ui.theme.StarGold
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import com.afrocuisto.app.ui.theme.nexaTitleEmphasis
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Locale

private data class RecipeDetailPalette(
    val sheet: Color,
    val elevatedCard: Color,
    val warmSurface: Color,
    val warmBorder: Color,
    val border: Color,
    val ink: Color,
    val secondary: Color,
    val muted: Color,
    val emeraldSoft: Color,
    val emeraldBorder: Color
)

@Composable
private fun rememberRecipePalette(isDark: Boolean): RecipeDetailPalette {
    return remember(isDark) {
        if (isDark) {
            RecipeDetailPalette(
                sheet = Color(0xFF141312),
                elevatedCard = Color(0xFF1D1B19),
                warmSurface = Color(0xFF241B15),
                warmBorder = Color(0xFF3A291F),
                border = Color(0xFF2B2825),
                ink = Color(0xFFF7F5F0),
                secondary = Color(0xFFC8C2BA),
                muted = Color(0xFF8E8880),
                emeraldSoft = Color(0xFF10281F),
                emeraldBorder = Color(0xFF1E4D3B)
            )
        } else {
            RecipeDetailPalette(
                sheet = Color(0xFFFFFFFF),
                elevatedCard = Color(0xFFFAF9F6),
                warmSurface = Color(0xFFFFF6EE),
                warmBorder = Color(0xFFF6E5D5),
                border = Color(0xFFEBE7E0),
                ink = Color(0xFF19221D),
                secondary = Color(0xFF4F5A53),
                muted = Color(0xFF7B847E),
                emeraldSoft = Color(0xFFECFDF5),
                emeraldBorder = Color(0xFFA7F3D0)
            )
        }
    }
}

private fun scaleIngredientAmount(amount: String, servings: Int): String {
    if (servings == 4 || amount.isBlank()) return amount
    val match = Regex("^\\s*(\\d+(?:[.,]\\d+)?(?:/\\d+)?)\\s*(.*)$").matchEntire(amount) ?: return amount
    val rawNumber = match.groupValues[1]
    val value = if ('/' in rawNumber) {
        val (numerator, denominator) = rawNumber.split('/')
        numerator.replace(',', '.').toFloatOrNull()?.div(denominator.toFloatOrNull() ?: 0f)
    } else {
        rawNumber.replace(',', '.').toFloatOrNull()
    }
    if (value == null || !value.isFinite()) return amount
    val scaled = value * servings / 4f
    val formatted = String.format(Locale.US, "%.2f", scaled).trimEnd('0').trimEnd('.')
    return formatted + match.groupValues[2].let { if (it.isEmpty()) "" else " $it" }
}

private data class ParsedDuration(
    val seconds: Int,
    val label: String
)

private fun parseDurationFromText(text: String): ParsedDuration? {
    if (text.isBlank()) return null
    val regex = Regex("(\\d+)\\s*(?:à\\s*(\\d+)\\s*)?(h(?:eures?)?|min(?:utes?)?|sec(?:ondes?)?)", RegexOption.IGNORE_CASE)
    val match = regex.find(text) ?: return null
    val baseValue = match.groupValues[2].toIntOrNull() ?: match.groupValues[1].toIntOrNull() ?: return null
    val unitRaw = match.groupValues[3].lowercase()
    return when {
        unitRaw.startsWith("h") -> ParsedDuration(
            seconds = (baseValue * 3600).coerceAtLeast(60),
            label = "$baseValue h"
        )
        unitRaw.startsWith("sec") -> ParsedDuration(
            seconds = baseValue.coerceAtLeast(10),
            label = "$baseValue s"
        )
        else -> ParsedDuration(
            seconds = (baseValue * 60).coerceAtLeast(60),
            label = "$baseValue min"
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RecipeDetailScreen(
    recipeId: String,
    onBack: () -> Unit,
    onNavigateToMarket: () -> Unit = {},
    onNavigateToRecipeDetail: (String) -> Unit = {},
    repository: RecipeRepository = remember { RecipeRepository() },
    shoppingRepository: ShoppingRepository = remember { ShoppingRepository() },
    userPreferencesRepository: UserPreferencesRepository? = null,
    initialUserPrefs: UserPreferencesState = UserPreferencesState()
) {
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current
    val coroutineScope = rememberCoroutineScope()
    val isDark = isAfroDarkTheme()
    val palette = rememberRecipePalette(isDark)
    val prefsRepo = userPreferencesRepository ?: remember { UserPreferencesRepository(context.applicationContext) }
    val userPrefs by prefsRepo.preferencesFlow.collectAsState(initial = initialUserPrefs)

    val allRecipes by repository.recipes.collectAsState(initial = emptyList())
    val recipe = remember(recipeId, allRecipes) {
        allRecipes.find { it.id == recipeId } ?: repository.getRecipeById(recipeId)
    }
    val favoriteIds by repository.favoriteIds.collectAsState(initial = emptySet())
    val shoppingItems by shoppingRepository.items.collectAsState()
    val timerState by CookingTimerService.timerState.collectAsState()

    LaunchedEffect(recipeId) {
        repository.refreshFromSupabase()
    }

    if (recipe == null) {
        Box(modifier = Modifier.fillMaxSize().background(palette.sheet), contentAlignment = Alignment.Center) {
            Text("Recette introuvable", color = palette.ink, fontWeight = FontWeight.Bold)
        }
        return
    }

    val scrollState = rememberScrollState()
    var servings by remember(recipe.id) { mutableIntStateOf(userPrefs.defaultServings) }
    var hasAppliedInitialPrefServings by remember(recipe.id) { mutableStateOf(false) }
    LaunchedEffect(userPrefs.defaultServings) {
        if (!hasAppliedInitialPrefServings && userPrefs.defaultServings != 4) {
            servings = userPrefs.defaultServings
            hasAppliedInitialPrefServings = true
        }
    }
    var checkedIngredients by remember(recipe.id) { mutableStateOf(emptySet<Int>()) }
    var recentlyAddedNames by remember(recipe.id) { mutableStateOf(emptySet<String>()) }
    var addedToastCount by remember(recipe.id) { mutableIntStateOf(0) }
    var addedToastVersion by remember(recipe.id) { mutableIntStateOf(0) }

    var activeStep by remember(recipe.id) { mutableIntStateOf(0) }
    var completedSteps by remember(recipe.id) { mutableStateOf(emptySet<Int>()) }
    var isDescriptionExpanded by remember(recipe.id) { mutableStateOf(false) }
    var isChefSecretExpanded by remember(recipe.id) { mutableStateOf(true) }
    var isNoteInputFocused by remember(recipe.id) { mutableStateOf(false) }
    var showBelowFold by remember(recipe.id) { mutableStateOf(false) }
    LaunchedEffect(recipe.id) {
        androidx.compose.runtime.withFrameNanos { }
        showBelowFold = true
    }

    val cartIconBounce = remember { Animatable(1f) }
    val likeBounce = remember { Animatable(1f) }

    // Auto-hide toast banner after 5s
    LaunchedEffect(addedToastVersion) {
        if (addedToastVersion > 0) {
            delay(5000L)
            addedToastCount = 0
        }
    }

    val checkedCount = checkedIngredients.size
    val allIngredientsChecked = recipe.ingredients.isNotEmpty() && checkedCount == recipe.ingredients.size
    val pendingCartCount = remember(shoppingItems) { shoppingItems.count { !it.isChecked } }

    val inCartIngredientNames = remember(shoppingItems, recipe.name, recentlyAddedNames) {
        val fromRepo = shoppingItems
            .filter { !it.isChecked && (it.recipeName == null || it.recipeName.equals(recipe.name, ignoreCase = true) || recipe.name.contains(it.recipeName, ignoreCase = true)) }
            .map { it.name.lowercase() }
            .toSet()
        fromRepo + recentlyAddedNames.map { it.lowercase() }
    }

    val defaultCookDuration = remember(recipe.cookTime, recipe.prepTime) {
        parseDurationFromText(recipe.cookTime)
            ?: parseDurationFromText(recipe.prepTime)
            ?: ParsedDuration(1800, "30 min")
    }

    var customTimerMinutes by remember(recipe.id) {
        mutableIntStateOf((defaultCookDuration.seconds / 60).coerceIn(1, 240))
    }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            CookingTimerService.refreshNotification(context)
        }
    }

    fun startRecipeTimer(stepTitle: String, seconds: Int) {
        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
        CookingTimerService.start(
            context = context,
            recipeName = recipe.name,
            stepTitle = stepTitle,
            seconds = seconds,
            recipeId = recipe.id
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val hasPerm = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!hasPerm) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    val isTimerActive = timerState.isActive

    val missingIngredientIndices = remember(recipe.ingredients, inCartIngredientNames) {
        recipe.ingredients.indices.filter { idx ->
            recipe.ingredients[idx].name.lowercase() !in inCartIngredientNames
        }.toSet()
    }

    val collapseProgress by remember {
        derivedStateOf { ((scrollState.value - 210f) / 170f).coerceIn(0f, 1f) }
    }

    val view = LocalView.current
    val useLightStatusBarIcons = collapseProgress < 0.55f || isDark
    DisposableEffect(view, useLightStatusBarIcons, isDark, userPrefs.keepScreenOnInRecipe) {
        val window = (view.context as? Activity)?.window
        val controller = window?.let { WindowCompat.getInsetsController(it, view) }
        val prevKeepScreenOn = view.keepScreenOn
        view.keepScreenOn = userPrefs.keepScreenOnInRecipe
        controller?.isAppearanceLightStatusBars = !useLightStatusBarIcons
        onDispose {
            view.keepScreenOn = prevKeepScreenOn
            controller?.isAppearanceLightStatusBars = !isDark
        }
    }

    LaunchedEffect(completedSteps.size, recipe.steps.size) {
        if (recipe.steps.isNotEmpty() && completedSteps.size == recipe.steps.size) {
            prefsRepo.markRecipeCooked(recipe.id)
        }
    }

    fun addSelectedIngredientsToCart(indicesToAdd: Set<Int>) {
        if (indicesToAdd.isEmpty()) return
        val entries: List<Pair<Ingredient, String>> = indicesToAdd.sorted().mapNotNull { idx ->
            val ing = recipe.ingredients.getOrNull(idx) ?: return@mapNotNull null
            val scaledQty = "${scaleIngredientAmount(ing.amount, servings)} ${ing.unit}".trim()
            ing to scaledQty
        }
        if (entries.isEmpty()) return

        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
        val count = shoppingRepository.addRecipeIngredients(
            recipeName = recipe.name,
            recipeCategory = recipe.category,
            entries = entries
        )
        recentlyAddedNames = recentlyAddedNames + entries.map { it.first.name }
        checkedIngredients = emptySet()
        addedToastCount = count
        addedToastVersion += 1

        coroutineScope.launch {
            cartIconBounce.snapTo(0.82f)
            cartIconBounce.animateTo(
                targetValue = 1f,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioMediumBouncy,
                    stiffness = Spring.StiffnessMedium
                )
            )
        }
    }

    val difficultyColor = remember(recipe.difficulty) {
        when (recipe.difficulty.lowercase()) {
            "facile" -> DifficultyEasy
            "difficile", "expert" -> DifficultyHard
            else -> DifficultyMedium
        }
    }

    val hasChefNotes = !recipe.techniqueDescription.isNullOrBlank() ||
        !recipe.diasporaSubstitutes.isNullOrBlank() ||
        !recipe.benefits.isNullOrBlank() ||
        !recipe.suggestedSides.isNullOrEmpty()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(palette.sheet)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(
                    state = scrollState,
                    flingBehavior = rememberSmoothFlingBehavior()
                )
        ) {
            // 1. PARALLAX HERO SECTION
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(380.dp)
            ) {
                AsyncImage(
                    model = recipe.image,
                    contentDescription = recipe.name,
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer {
                            translationY = scrollState.value * 0.38f
                        },
                    contentScale = ContentScale.Crop
                )

                // Top atmospheric scrim for status bar & floating buttons
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .align(Alignment.TopCenter)
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.Black.copy(alpha = 0.52f), Color.Transparent)
                            )
                        )
                )

                // Bottom editorial scrim for badges & smooth sheet transition
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(145.dp)
                        .align(Alignment.BottomCenter)
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.Transparent, Color.Black.copy(alpha = 0.58f))
                            )
                        )
                )

                // Hero Floating Badges Row
                Row(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .fillMaxWidth()
                        .padding(start = 20.dp, end = 20.dp, bottom = 38.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = ExpressivePillShape,
                        color = palette.sheet.copy(alpha = 0.94f),
                        shadowElevation = 4.dp
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                tint = StarGold,
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(Modifier.width(5.dp))
                            Text(
                                text = String.format(Locale.FRENCH, "%.1f", recipe.rating),
                                color = palette.ink,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Text(
                                text = "  ·  ${recipe.category}",
                                color = palette.muted,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    Surface(
                        shape = ExpressivePillShape,
                        color = Color.Black.copy(alpha = 0.52f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 11.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(difficultyColor)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = recipe.difficulty,
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // 2. MAIN EDITORIAL SHEET
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-28).dp)
                    .clip(RoundedCornerShape(topStart = 30.dp, topEnd = 30.dp))
                    .background(palette.sheet)
                    .padding(horizontal = 22.dp)
            ) {
                Spacer(Modifier.height(12.dp))
                Box(
                    Modifier
                        .align(Alignment.CenterHorizontally)
                        .width(40.dp)
                        .height(4.dp)
                        .clip(CircleShape)
                        .background(palette.border)
                )
                Spacer(Modifier.height(18.dp))

                // Optional Dish Alias Tag
                if (!recipe.alias.isNullOrBlank()) {
                    Text(
                        text = recipe.alias.uppercase(Locale.FRENCH),
                        color = AfroOrange,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.1.sp
                    )
                    Spacer(Modifier.height(5.dp))
                }

                // Dish Title
                Text(
                    text = recipe.name,
                    color = palette.ink,
                    fontSize = 27.sp,
                    lineHeight = 33.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = (-0.5).sp,
                    modifier = Modifier.nexaTitleEmphasis()
                )
                Spacer(Modifier.height(6.dp))

                Text(
                    text = "${recipe.region.ifBlank { "Cuisine africaine" }}  ·  Préparation ${recipe.prepTime}  ·  Cuisson ${recipe.cookTime}",
                    color = palette.muted,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )

                // Expandable Story / Description
                if (!recipe.description.isNullOrBlank()) {
                    Spacer(Modifier.height(12.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .animateContentSize(
                                animationSpec = spring(
                                    dampingRatio = Spring.DampingRatioNoBouncy,
                                    stiffness = Spring.StiffnessMediumLow
                                )
                            )
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) { isDescriptionExpanded = !isDescriptionExpanded }
                    ) {
                        Text(
                            text = recipe.description,
                            color = palette.secondary,
                            fontSize = 14.sp,
                            lineHeight = 21.sp,
                            maxLines = if (isDescriptionExpanded) 12 else 2,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (recipe.description.length > 95) {
                            Spacer(Modifier.height(3.dp))
                            Text(
                                text = if (isDescriptionExpanded) "Voir moins" else "Lire l'histoire du plat",
                                color = AfroOrange,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Spacer(Modifier.height(20.dp))

                // 3. DYNAMIC METRICS & ANIMATED PORTIONS SCALER
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(28.dp),
                    color = palette.warmSurface,
                    border = BorderStroke(1.dp, palette.warmBorder)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 15.dp, horizontal = 8.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RecipeFact(
                            icon = Icons.Default.Timer,
                            value = recipe.cookTime.ifBlank { recipe.prepTime },
                            label = "Cuisson",
                            palette = palette
                        )

                        FactDivider(palette.warmBorder)

                        // Interactive Animated Portions Stepper
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                StepperCircleButton(
                                    icon = Icons.Default.Remove,
                                    description = "Réduire les portions",
                                    enabled = servings > 1,
                                    palette = palette,
                                    onClick = {
                                        if (servings > 1) {
                                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            servings -= 1
                                        }
                                    }
                                )

                                AnimatedContent(
                                    targetState = servings,
                                    transitionSpec = {
                                        if (targetState > initialState) {
                                            (slideInVertically { h -> h } + fadeIn()).togetherWith(
                                                slideOutVertically { h -> -h } + fadeOut()
                                            )
                                        } else {
                                            (slideInVertically { h -> -h } + fadeIn()).togetherWith(
                                                slideOutVertically { h -> h } + fadeOut()
                                            )
                                        }.using(SizeTransform(clip = false))
                                    },
                                    label = "servingsCounter"
                                ) { count ->
                                    Text(
                                        text = "$count pers.",
                                        color = palette.ink,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }

                                StepperCircleButton(
                                    icon = Icons.Default.Add,
                                    description = "Augmenter les portions",
                                    enabled = servings < 20,
                                    palette = palette,
                                    onClick = {
                                        if (servings < 20) {
                                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            servings += 1
                                        }
                                    }
                                )
                            }
                            Spacer(Modifier.height(5.dp))
                            Text("Portions", color = palette.muted, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        }

                        FactDivider(palette.warmBorder)

                        RecipeFact(
                            icon = Icons.Default.LocalFireDepartment,
                            value = "380 kcal",
                            label = "Par portion",
                            palette = palette
                        )
                    }
                }

                // Dynamic Portions Scaling Indicator Pill
                AnimatedVisibility(
                    visible = servings != 4,
                    enter = expandVertically() + fadeIn(),
                    exit = shrinkVertically() + fadeOut()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 10.dp),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Surface(
                            shape = ExpressivePillShape,
                            color = AfroOrange.copy(alpha = 0.12f),
                            modifier = Modifier
                                .clip(ExpressivePillShape)
                                .clickable {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    servings = 4
                                }
                        ) {
                            Text(
                                text = "Quantités ajustées pour $servings pers. · Réinitialiser (4)",
                                color = AfroOrange,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(28.dp))

                // 4. DYNAMIC INGREDIENTS CHECKLIST & CART INTEGRATION
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Ingrédients",
                                color = palette.ink,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Spacer(Modifier.width(8.dp))
                            Surface(
                                shape = ExpressivePillShape,
                                color = if (checkedCount > 0) AfroOrange.copy(alpha = 0.14f) else palette.elevatedCard
                            ) {
                                Text(
                                    text = if (checkedCount > 0) "$checkedCount/${recipe.ingredients.size} cochés" else "${recipe.ingredients.size}",
                                    color = if (checkedCount > 0) AfroOrange else palette.muted,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
                                )
                            }
                        }
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = "Cochez les ingrédients à ajouter à votre panier",
                            color = palette.muted,
                            fontSize = 12.sp
                        )
                    }

                    if (recipe.ingredients.isNotEmpty()) {
                        Surface(
                            shape = ExpressivePillShape,
                            color = if (allIngredientsChecked) AfroOrange else palette.warmSurface,
                            border = BorderStroke(1.dp, if (allIngredientsChecked) AfroOrange else palette.warmBorder),
                            modifier = Modifier
                                .clip(ExpressivePillShape)
                                .clickable {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    checkedIngredients = if (allIngredientsChecked) {
                                        emptySet()
                                    } else {
                                        recipe.ingredients.indices.toSet()
                                    }
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.DoneAll,
                                    contentDescription = null,
                                    tint = if (allIngredientsChecked) Color.White else AfroOrange,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(Modifier.width(5.dp))
                                Text(
                                    text = if (allIngredientsChecked) "Décocher" else "Tout cocher",
                                    color = if (allIngredientsChecked) Color.White else AfroOrange,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                // Selection progress bar
                if (recipe.ingredients.isNotEmpty()) {
                    val ingredientProgress by animateFloatAsState(
                        targetValue = checkedCount.toFloat() / recipe.ingredients.size.coerceAtLeast(1),
                        animationSpec = spring(
                            dampingRatio = Spring.DampingRatioNoBouncy,
                            stiffness = Spring.StiffnessMediumLow
                        ),
                        label = "ingredientSelectionProgress"
                    )
                    AnimatedVisibility(
                        visible = checkedCount > 0,
                        enter = expandVertically() + fadeIn(),
                        exit = shrinkVertically() + fadeOut()
                    ) {
                        Box(
                            modifier = Modifier
                                .padding(top = 10.dp)
                                .fillMaxWidth()
                                .height(4.dp)
                                .clip(CircleShape)
                                .background(palette.border)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(ingredientProgress)
                                    .height(4.dp)
                                    .clip(CircleShape)
                                    .background(AfroOrange)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(14.dp))

                // Mode Diaspora priority callout when enabled in Profile preferences
                if (userPrefs.diasporaSubstitutesFirst && !recipe.diasporaSubstitutes.isNullOrBlank()) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp),
                        shape = RoundedCornerShape(28.dp),
                        color = palette.warmSurface,
                        border = BorderStroke(1.dp, AfroOrange.copy(alpha = 0.35f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Icon(
                                imageVector = Icons.Default.TipsAndUpdates,
                                contentDescription = null,
                                tint = AfroOrange,
                                modifier = Modifier
                                    .padding(top = 2.dp)
                                    .size(17.dp)
                            )
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "Mode Diaspora · Alternative d'ingrédients",
                                    color = AfroOrange,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.ExtraBold
                                )
                                Spacer(Modifier.height(2.dp))
                                Text(
                                    text = recipe.diasporaSubstitutes,
                                    color = palette.secondary,
                                    fontSize = 12.5.sp,
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }
                }

                // Interactive Ingredient Cards
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    recipe.ingredients.forEachIndexed { index, ingredient ->
                        val isChecked = index in checkedIngredients
                        val isInCart = ingredient.name.lowercase() in inCartIngredientNames
                        val scaledAmountText = "${scaleIngredientAmount(ingredient.amount, servings)} ${ingredient.unit}".trim()

                        IngredientSelectableRow(
                            ingredient = ingredient,
                            scaledQuantity = scaledAmountText,
                            isChecked = isChecked,
                            isInCart = isInCart,
                            palette = palette,
                            onToggle = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                checkedIngredients = if (isChecked) {
                                    checkedIngredients - index
                                } else {
                                    checkedIngredients + index
                                }
                            }
                        )
                    }
                }

                // Animated Confirmation Toast Banner when items are added to Cart
                AnimatedVisibility(
                    visible = addedToastCount > 0,
                    enter = expandVertically(animationSpec = spring(stiffness = Spring.StiffnessMediumLow)) + fadeIn(),
                    exit = shrinkVertically() + fadeOut()
                ) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 12.dp),
                        shape = RoundedCornerShape(28.dp),
                        color = palette.emeraldSoft,
                        border = BorderStroke(1.dp, palette.emeraldBorder)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(CircleShape)
                                        .background(AccentEmerald),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                                Spacer(Modifier.width(10.dp))
                                Text(
                                    text = if (addedToastCount == 1) "1 ingrédient ajouté au panier" else "$addedToastCount ingrédients ajoutés au panier",
                                    color = palette.ink,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(Modifier.width(8.dp))

                            Surface(
                                shape = ExpressivePillShape,
                                color = AccentEmerald,
                                modifier = Modifier
                                    .clip(ExpressivePillShape)
                                    .clickable { onNavigateToMarket() }
                            ) {
                                Text(
                                    text = "Voir le panier",
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }
                }

                // Inline Dynamic Add-to-Cart Button under Ingredients
                if (recipe.ingredients.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    val inlineCartState = when {
                        checkedCount > 0 -> "checked:$checkedCount"
                        missingIngredientIndices.isEmpty() -> "all_in_cart"
                        missingIngredientIndices.size < recipe.ingredients.size -> "missing:${missingIngredientIndices.size}"
                        else -> "all:${recipe.ingredients.size}"
                    }
                    AnimatedContent(
                        targetState = inlineCartState,
                        transitionSpec = {
                            fadeIn(tween(200)).togetherWith(fadeOut(tween(150)))
                        },
                        label = "inlineCartActionButton"
                    ) { stateKey ->
                        when {
                            stateKey.startsWith("checked:") -> {
                                Button(
                                    onClick = { addSelectedIngredientsToCart(checkedIngredients) },
                                    shape = RoundedCornerShape(28.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = AfroOrange,
                                        contentColor = Color.White
                                    ),
                                    contentPadding = PaddingValues(horizontal = 18.dp, vertical = 14.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_bag_bold),
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(19.dp)
                                    )
                                    Spacer(Modifier.width(9.dp))
                                    Text(
                                        text = if (checkedCount == 1) {
                                            "Ajouter l'ingrédient coché au panier"
                                        } else {
                                            "Ajouter les $checkedCount ingrédients cochés au panier"
                                        },
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 14.sp
                                    )
                                }
                            }
                            stateKey == "all_in_cart" -> {
                                Surface(
                                    shape = RoundedCornerShape(28.dp),
                                    color = palette.emeraldSoft,
                                    border = BorderStroke(1.dp, palette.emeraldBorder),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(28.dp))
                                        .clickable { onNavigateToMarket() }
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = 16.dp, vertical = 13.dp),
                                        horizontalArrangement = Arrangement.Center,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            painter = painterResource(id = R.drawable.ic_solar_bag_bold),
                                            contentDescription = null,
                                            tint = AccentEmerald,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(Modifier.width(8.dp))
                                        Text(
                                            text = "Tous les ingrédients sont au panier · Ouvrir Mon marché",
                                            color = AccentEmerald,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        )
                                    }
                                }
                            }
                            stateKey.startsWith("missing:") -> {
                                Surface(
                                    shape = RoundedCornerShape(28.dp),
                                    color = palette.warmSurface,
                                    border = BorderStroke(1.dp, palette.warmBorder),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(28.dp))
                                        .clickable {
                                            addSelectedIngredientsToCart(missingIngredientIndices)
                                        }
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = 16.dp, vertical = 13.dp),
                                        horizontalArrangement = Arrangement.Center,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            painter = painterResource(id = R.drawable.ic_solar_bag_linear),
                                            contentDescription = null,
                                            tint = AfroOrange,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(Modifier.width(8.dp))
                                        Text(
                                            text = "Ajouter les ${missingIngredientIndices.size} ingrédients manquants au panier",
                                            color = AfroOrange,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.5.sp
                                        )
                                    }
                                }
                            }
                            else -> {
                                Surface(
                                    shape = RoundedCornerShape(28.dp),
                                    color = palette.warmSurface,
                                    border = BorderStroke(1.dp, palette.warmBorder),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(28.dp))
                                        .clickable {
                                            addSelectedIngredientsToCart(recipe.ingredients.indices.toSet())
                                        }
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = 16.dp, vertical = 13.dp),
                                        horizontalArrangement = Arrangement.Center,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            painter = painterResource(id = R.drawable.ic_solar_bag_linear),
                                            contentDescription = null,
                                            tint = AfroOrange,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(Modifier.width(8.dp))
                                        Text(
                                            text = "Ajouter tous les ingrédients (${recipe.ingredients.size}) au panier",
                                            color = AfroOrange,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.5.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(Modifier.height(30.dp))

                if (!showBelowFold) {
                    Spacer(Modifier.height(520.dp))
                } else {
                // 5. INTERACTIVE PREPARATION STEPS WITH SMART TIMERS
                val stepProgressTarget = if (recipe.steps.isEmpty()) {
                    0f
                } else {
                    val byCompleted = completedSteps.size.toFloat() / recipe.steps.size
                    val byActive = (activeStep + 1).toFloat() / recipe.steps.size
                    maxOf(byCompleted, byActive)
                }
                val animatedStepProgress by animateFloatAsState(
                    targetValue = stepProgressTarget,
                    animationSpec = spring(
                        dampingRatio = Spring.DampingRatioNoBouncy,
                        stiffness = Spring.StiffnessMediumLow
                    ),
                    label = "stepProgress"
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Préparation",
                        color = palette.ink,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    if (recipe.steps.isNotEmpty()) {
                        Text(
                            text = if (completedSteps.size == recipe.steps.size) {
                                "Toutes les étapes terminées"
                            } else {
                                "Étape ${activeStep + 1} sur ${recipe.steps.size}"
                            },
                            color = if (completedSteps.size == recipe.steps.size) AccentEmerald else palette.muted,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                if (recipe.steps.isNotEmpty()) {
                    Spacer(Modifier.height(10.dp))
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .height(5.dp)
                            .clip(CircleShape)
                            .background(palette.border)
                    ) {
                        Box(
                            Modifier
                                .fillMaxWidth(animatedStepProgress)
                                .height(5.dp)
                                .clip(CircleShape)
                                .background(
                                    if (completedSteps.size == recipe.steps.size) AccentEmerald else AfroOrange
                                )
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    recipe.steps.forEachIndexed { index, step ->
                        val isActive = index == activeStep
                        val isCompleted = index in completedSteps
                        val stepDuration = remember(step) { parseDurationFromText(step) }

                        PreparationStepCard(
                            stepIndex = index,
                            stepText = step,
                            isActive = isActive,
                            isCompleted = isCompleted,
                            stepDuration = stepDuration,
                            palette = palette,
                            onSelectStep = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                activeStep = index
                            },
                            onToggleComplete = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                if (isCompleted) {
                                    completedSteps = completedSteps - index
                                } else {
                                    completedSteps = completedSteps + index
                                    if (index < recipe.steps.lastIndex) {
                                        activeStep = index + 1
                                    }
                                }
                            },
                            onStartStepTimer = { duration ->
                                startRecipeTimer(
                                    stepTitle = "Étape ${index + 1} · ${duration.label}",
                                    seconds = duration.seconds
                                )
                            }
                        )
                    }
                }

                if (recipe.steps.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                activeStep = (activeStep - 1).coerceAtLeast(0)
                            },
                            enabled = activeStep > 0,
                            shape = RoundedCornerShape(28.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = palette.elevatedCard,
                                contentColor = palette.ink,
                                disabledContainerColor = palette.elevatedCard.copy(alpha = 0.5f),
                                disabledContentColor = palette.muted.copy(alpha = 0.5f)
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                        ) {
                            Text("Précédente", fontWeight = FontWeight.Bold)
                        }

                        val isLastStep = activeStep == recipe.steps.lastIndex
                        Button(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                completedSteps = completedSteps + activeStep
                                if (!isLastStep) {
                                    activeStep = (activeStep + 1).coerceAtMost(recipe.steps.lastIndex)
                                }
                            },
                            shape = RoundedCornerShape(28.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isLastStep && completedSteps.size == recipe.steps.size) AccentEmerald else AfroOrange,
                                contentColor = Color.White
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                        ) {
                            Text(
                                text = if (isLastStep) "Terminer l'étape" else "Étape suivante",
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // 6. CHEF SECRETS, SUBSTITUTES & SUGGESTED SIDES
                if (hasChefNotes) {
                    Spacer(Modifier.height(28.dp))
                    val chevronRotation by animateFloatAsState(
                        targetValue = if (isChefSecretExpanded) 180f else 0f,
                        animationSpec = tween(220),
                        label = "chefSecretChevron"
                    )

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .animateContentSize(
                                animationSpec = spring(
                                    dampingRatio = Spring.DampingRatioNoBouncy,
                                    stiffness = Spring.StiffnessMediumLow
                                )
                            ),
                        shape = RoundedCornerShape(28.dp),
                        color = palette.warmSurface,
                        border = BorderStroke(1.dp, palette.warmBorder)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { isChefSecretExpanded = !isChefSecretExpanded }
                                .padding(18.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(34.dp)
                                            .clip(CircleShape)
                                            .background(AfroOrange.copy(alpha = 0.15f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.TipsAndUpdates,
                                            contentDescription = null,
                                            tint = AfroOrange,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                    Spacer(Modifier.width(11.dp))
                                    Column {
                                        Text(
                                            text = recipe.techniqueTitle?.takeIf { it.isNotBlank() } ?: "Astuces & Secrets du Chef",
                                            color = palette.ink,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.ExtraBold
                                        )
                                        Text(
                                            text = "Conseils techniques & accompagnements",
                                            color = palette.muted,
                                            fontSize = 11.5.sp
                                        )
                                    }
                                }

                                Icon(
                                    imageVector = Icons.Default.ExpandMore,
                                    contentDescription = null,
                                    tint = palette.muted,
                                    modifier = Modifier
                                        .size(22.dp)
                                        .rotate(chevronRotation)
                                )
                            }

                            if (isChefSecretExpanded) {
                                if (!recipe.techniqueDescription.isNullOrBlank()) {
                                    Spacer(Modifier.height(12.dp))
                                    Text(
                                        text = recipe.techniqueDescription,
                                        color = palette.secondary,
                                        fontSize = 13.5.sp,
                                        lineHeight = 20.sp
                                    )
                                }

                                if (!recipe.diasporaSubstitutes.isNullOrBlank()) {
                                    Spacer(Modifier.height(12.dp))
                                    Text(
                                        text = "Alternative Diaspora",
                                        color = AfroOrange,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                    Spacer(Modifier.height(3.dp))
                                    Text(
                                        text = recipe.diasporaSubstitutes,
                                        color = palette.secondary,
                                        fontSize = 13.sp,
                                        lineHeight = 19.sp
                                    )
                                }

                                if (!recipe.benefits.isNullOrBlank()) {
                                    Spacer(Modifier.height(12.dp))
                                    Text(
                                        text = "Atouts nutritionnels",
                                        color = AccentEmerald,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                    Spacer(Modifier.height(3.dp))
                                    Text(
                                        text = recipe.benefits,
                                        color = palette.secondary,
                                        fontSize = 13.sp,
                                        lineHeight = 19.sp
                                    )
                                }

                                if (!recipe.suggestedSides.isNullOrEmpty()) {
                                    Spacer(Modifier.height(14.dp))
                                    Text(
                                        text = "Accompagnements recommandés",
                                        color = palette.ink,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(Modifier.height(8.dp))
                                    FlowRow(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        recipe.suggestedSides.forEach { side ->
                                            Surface(
                                                shape = ExpressivePillShape,
                                                color = palette.sheet,
                                                border = BorderStroke(1.dp, palette.warmBorder)
                                            ) {
                                                Text(
                                                    text = side,
                                                    color = palette.ink,
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                } // end showBelowFold

                Spacer(Modifier.height(8.dp))
            } // end MAIN EDITORIAL SHEET

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(palette.sheet)
                    .padding(horizontal = 22.dp)
            ) {
                RecipeCookingVideoSection(
                    recipe = recipe,
                    isDark = isDark
                )

                Spacer(Modifier.height(24.dp))
                RecipeRatingAndNoteSection(
                    recipe = recipe,
                    isDark = isDark,
                    onInputFocusChanged = { isNoteInputFocused = it }
                )

                Spacer(Modifier.height(24.dp))
                RecipeSuggestionsSection(
                    currentRecipe = recipe,
                    allRecipes = allRecipes,
                    isDark = isDark,
                    onRecipeClick = onNavigateToRecipeDetail
                )

                // Generous bottom clearance so the floating bottom dock never overlaps content
                Spacer(Modifier.height(128.dp))
                Spacer(Modifier.navigationBarsPadding())
            }
        }

        // 7. ADAPTIVE STICKY TOP BAR (Morphs cleanly on scroll)
        val topBarBg = palette.sheet.copy(alpha = collapseProgress)
        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .background(topBarBg)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 18.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                AdaptiveTopIconButton(
                    collapseProgress = collapseProgress,
                    palette = palette,
                    onClick = onBack
                ) { tint ->
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Retour",
                        tint = tint,
                        modifier = Modifier.size(21.dp)
                    )
                }

                // Collapsed Sticky Title
                Text(
                    text = recipe.name,
                    color = palette.ink.copy(alpha = collapseProgress),
                    fontSize = 15.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 12.dp)
                        .graphicsLayer {
                            alpha = collapseProgress
                            translationY = (1f - collapseProgress) * 10.dp.toPx()
                        }
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Live Cart Shortcut Pill with Animated Bounce & Count
                    Box(modifier = Modifier.scale(cartIconBounce.value)) {
                        AdaptiveCartTopButton(
                            pendingCount = pendingCartCount,
                            collapseProgress = collapseProgress,
                            palette = palette,
                            onClick = onNavigateToMarket
                        )
                    }

                    // Adaptive Favorite Heart Button with Spring Bounce
                    val isLiked = favoriteIds.contains(recipe.id)
                    Box(modifier = Modifier.scale(likeBounce.value)) {
                        AdaptiveTopIconButton(
                            collapseProgress = collapseProgress,
                            palette = palette,
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                repository.toggleFavorite(recipe.id)
                                coroutineScope.launch {
                                    likeBounce.snapTo(0.80f)
                                    likeBounce.animateTo(
                                        targetValue = 1f,
                                        animationSpec = spring(
                                            dampingRatio = Spring.DampingRatioMediumBouncy,
                                            stiffness = Spring.StiffnessMedium
                                        )
                                    )
                                }
                            }
                        ) { tint ->
                            Icon(
                                painter = painterResource(
                                    id = if (isLiked) R.drawable.ic_solar_heart_liked else R.drawable.ic_solar_heart_linear
                                ),
                                contentDescription = "Favori",
                                tint = if (isLiked) Color.Unspecified else tint,
                                modifier = Modifier.size(21.dp)
                            )
                        }
                    }
                }
            }

            if (collapseProgress > 0.08f) {
                HorizontalDivider(
                    thickness = 1.dp,
                    color = palette.border.copy(alpha = collapseProgress)
                )
            }
        }

        // 8. SMART CONTEXTUAL FLOATING BOTTOM DOCK
        if (!isNoteInputFocused) {
            Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            palette.sheet.copy(alpha = 0f),
                            palette.sheet.copy(alpha = 0.92f),
                            palette.sheet
                        )
                    )
                )
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            val dockMode = when {
                checkedCount > 0 -> "cart_selection"
                isTimerActive -> "live_timer"
                else -> "cook_ready"
            }

            AnimatedContent(
                targetState = dockMode,
                transitionSpec = {
                    (slideInVertically { it / 2 } + fadeIn(tween(220))).togetherWith(
                        slideOutVertically { it / 2 } + fadeOut(tween(160))
                    )
                },
                label = "floatingBottomDock"
            ) { mode ->
                when (mode) {
                    "cart_selection" -> {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(28.dp),
                            color = AfroOrange,
                            shadowElevation = 10.dp
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { addSelectedIngredientsToCart(checkedIngredients) }
                                    .padding(horizontal = 14.dp, vertical = 11.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                IconButton(
                                    onClick = { checkedIngredients = emptySet() },
                                    modifier = Modifier
                                        .size(34.dp)
                                        .background(Color.White.copy(alpha = 0.20f), CircleShape)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Annuler la sélection",
                                        tint = Color.White,
                                        modifier = Modifier.size(17.dp)
                                    )
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center,
                                    modifier = Modifier.weight(1f).padding(horizontal = 8.dp)
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_bag_bold),
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        text = "Ajouter au panier ($checkedCount)",
                                        color = Color.White,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 15.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                Surface(
                                    shape = ExpressivePillShape,
                                    color = Color.White.copy(alpha = 0.22f)
                                ) {
                                    Text(
                                        text = "$servings pers.",
                                        color = Color.White,
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                    )
                                }
                            }
                        }
                    }

                    "live_timer" -> {
                        CookingTimerDockCard(
                            timerState = timerState,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    else -> {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(28.dp),
                            color = if (isDark) palette.elevatedCard else palette.sheet,
                            border = BorderStroke(1.dp, palette.border),
                            shadowElevation = 10.dp
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(38.dp)
                                            .clip(CircleShape)
                                            .background(AfroOrange.copy(alpha = 0.12f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            painter = painterResource(id = R.drawable.ic_solar_stopwatch_linear),
                                            contentDescription = null,
                                            tint = AfroOrange,
                                            modifier = Modifier.size(19.dp)
                                        )
                                    }

                                    Column {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Surface(
                                                shape = CircleShape,
                                                color = palette.elevatedCard,
                                                border = BorderStroke(1.dp, palette.border),
                                                modifier = Modifier
                                                    .size(24.dp)
                                                    .clip(CircleShape)
                                                    .clickable(enabled = customTimerMinutes > 1) {
                                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                        val step = if (customTimerMinutes > 10) 5 else 1
                                                        customTimerMinutes = (customTimerMinutes - step).coerceAtLeast(1)
                                                    }
                                            ) {
                                                Box(contentAlignment = Alignment.Center) {
                                                    Icon(
                                                        imageVector = Icons.Default.Remove,
                                                        contentDescription = "Réduire la durée",
                                                        tint = if (customTimerMinutes > 1) palette.ink else palette.muted,
                                                        modifier = Modifier.size(13.dp)
                                                    )
                                                }
                                            }

                                            AnimatedContent(
                                                targetState = customTimerMinutes,
                                                transitionSpec = {
                                                    fadeIn(tween(150)).togetherWith(fadeOut(tween(120)))
                                                },
                                                label = "customTimerMinCounter"
                                            ) { mins ->
                                                Text(
                                                    text = "$mins min",
                                                    style = TextStyle(
                                                        fontFamily = NexaFontFamily,
                                                        fontWeight = FontWeight.ExtraBold,
                                                        fontSize = 15.5.sp,
                                                        fontFeatureSettings = "tnum"
                                                    ),
                                                    color = palette.ink
                                                )
                                            }

                                            Surface(
                                                shape = CircleShape,
                                                color = palette.elevatedCard,
                                                border = BorderStroke(1.dp, palette.border),
                                                modifier = Modifier
                                                    .size(24.dp)
                                                    .clip(CircleShape)
                                                    .clickable(enabled = customTimerMinutes < 240) {
                                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                        val step = if (customTimerMinutes >= 10) 5 else 1
                                                        customTimerMinutes = (customTimerMinutes + step).coerceAtMost(240)
                                                    }
                                            ) {
                                                Box(contentAlignment = Alignment.Center) {
                                                    Icon(
                                                        imageVector = Icons.Default.Add,
                                                        contentDescription = "Augmenter la durée",
                                                        tint = palette.ink,
                                                        modifier = Modifier.size(13.dp)
                                                    )
                                                }
                                            }
                                        }

                                        Spacer(Modifier.height(2.dp))
                                        Text(
                                            text = "Minuteur cuisson",
                                            color = palette.muted,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }

                                Button(
                                    onClick = {
                                        startRecipeTimer(
                                            stepTitle = "Cuisson · $customTimerMinutes min",
                                            seconds = customTimerMinutes * 60
                                        )
                                    },
                                    shape = RoundedCornerShape(28.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = AfroOrange,
                                        contentColor = Color.White
                                    ),
                                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp),
                                    modifier = Modifier.height(42.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.PlayArrow,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(17.dp)
                                    )
                                    Spacer(Modifier.width(5.dp))
                                    Text(
                                        text = "Démarrer",
                                        color = Color.White,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 13.5.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
        }
    }
}

@Composable
private fun IngredientSelectableRow(
    ingredient: Ingredient,
    scaledQuantity: String,
    isChecked: Boolean,
    isInCart: Boolean,
    palette: RecipeDetailPalette,
    onToggle: () -> Unit
) {
    val bgColor = when {
        isChecked -> AfroOrange.copy(alpha = 0.10f)
        isInCart -> palette.emeraldSoft.copy(alpha = 0.55f)
        else -> palette.elevatedCard
    }
    val borderColor = when {
        isChecked -> AfroOrange.copy(alpha = 0.55f)
        isInCart -> palette.emeraldBorder
        else -> palette.border
    }
    val checkCircleBg = if (isChecked) AfroOrange else palette.sheet

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .clickable(onClick = onToggle),
        shape = RoundedCornerShape(28.dp),
        color = bgColor,
        border = BorderStroke(1.dp, borderColor)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 13.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(checkCircleBg)
                    .then(
                        if (isChecked) Modifier else Modifier.border(1.5.dp, palette.muted.copy(alpha = 0.45f), CircleShape)
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isChecked) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Sélectionné",
                        tint = Color.White,
                        modifier = Modifier.size(15.dp)
                    )
                }
            }

            Spacer(Modifier.width(12.dp))

            // Ingredient Name & Optional Substitute
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = ingredient.name,
                    color = palette.ink,
                    fontSize = 14.sp,
                    fontWeight = if (isChecked) FontWeight.Bold else FontWeight.SemiBold,
                    lineHeight = 19.sp
                )
                if (!ingredient.substitute.isNullOrBlank() || ingredient.isOptional) {
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = buildString {
                            if (ingredient.isOptional) append("Optionnel")
                            if (!ingredient.substitute.isNullOrBlank()) {
                                if (isNotEmpty()) append(" · ")
                                append("Alt : ${ingredient.substitute}")
                            }
                        },
                        color = palette.muted,
                        fontSize = 11.5.sp
                    )
                }
            }

            Spacer(Modifier.width(8.dp))

            // Right Side: Quantity Pill + "Panier" Badge if already in cart
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (isInCart && !isChecked) {
                    Surface(
                        shape = ExpressivePillShape,
                        color = AccentEmerald.copy(alpha = 0.14f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_solar_bag_bold),
                                contentDescription = "Déjà au panier",
                                tint = AccentEmerald,
                                modifier = Modifier.size(11.dp)
                            )
                            Spacer(Modifier.width(3.dp))
                            Text(
                                text = "Panier",
                                color = AccentEmerald,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                    }
                }

                if (scaledQuantity.isNotBlank()) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (isChecked) AfroOrange.copy(alpha = 0.16f) else palette.sheet,
                        border = BorderStroke(1.dp, if (isChecked) AfroOrange.copy(alpha = 0.35f) else palette.border)
                    ) {
                        Text(
                            text = scaledQuantity,
                            color = if (isChecked) AfroOrange else palette.ink,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier
                                .widthIn(min = 44.dp)
                                .padding(horizontal = 9.dp, vertical = 5.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PreparationStepCard(
    stepIndex: Int,
    stepText: String,
    isActive: Boolean,
    isCompleted: Boolean,
    stepDuration: ParsedDuration?,
    palette: RecipeDetailPalette,
    onSelectStep: () -> Unit,
    onToggleComplete: () -> Unit,
    onStartStepTimer: (ParsedDuration) -> Unit
) {
    val cardBg = when {
        isActive -> palette.warmSurface
        isCompleted -> palette.emeraldSoft.copy(alpha = 0.45f)
        else -> palette.elevatedCard
    }
    val cardBorder = when {
        isActive -> AfroOrange.copy(alpha = 0.55f)
        isCompleted -> palette.emeraldBorder
        else -> palette.border
    }
    val badgeBg = when {
        isCompleted -> AccentEmerald
        isActive -> AfroOrange
        else -> palette.sheet
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .clickable(onClick = onSelectStep),
        shape = RoundedCornerShape(28.dp),
        color = cardBg,
        border = BorderStroke(1.dp, cardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(badgeBg)
                        .then(
                            if (!isActive && !isCompleted) {
                                Modifier.border(1.dp, palette.border, CircleShape)
                            } else {
                                Modifier
                            }
                        )
                        .clickable(onClick = onToggleComplete),
                    contentAlignment = Alignment.Center
                ) {
                    if (isCompleted) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = "Étape terminée",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    } else {
                        Text(
                            text = "${stepIndex + 1}",
                            color = if (isActive) Color.White else AfroOrange,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }

                Spacer(Modifier.width(13.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = stepText,
                        color = when {
                            isCompleted && !isActive -> palette.muted
                            isActive -> palette.ink
                            else -> palette.secondary
                        },
                        fontSize = 14.sp,
                        lineHeight = 22.sp,
                        fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal,
                        textDecoration = if (isCompleted && !isActive) TextDecoration.LineThrough else TextDecoration.None
                    )

                    if (isActive || stepDuration != null) {
                        AnimatedVisibility(
                            visible = isActive,
                            enter = expandVertically() + fadeIn(),
                            exit = shrinkVertically() + fadeOut()
                        ) {
                            Row(
                                modifier = Modifier.padding(top = 10.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                if (stepDuration != null) {
                                    Surface(
                                        shape = ExpressivePillShape,
                                        color = AfroOrange,
                                        modifier = Modifier
                                            .clip(ExpressivePillShape)
                                            .clickable { onStartStepTimer(stepDuration) }
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Timer,
                                                contentDescription = null,
                                                tint = Color.White,
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Spacer(Modifier.width(5.dp))
                                            Text(
                                                text = "Minuteur · ${stepDuration.label}",
                                                color = Color.White,
                                                fontSize = 11.5.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }

                                Surface(
                                    shape = ExpressivePillShape,
                                    color = if (isCompleted) AccentEmerald.copy(alpha = 0.15f) else palette.sheet,
                                    border = BorderStroke(
                                        1.dp,
                                        if (isCompleted) AccentEmerald else palette.border
                                    ),
                                    modifier = Modifier
                                        .clip(ExpressivePillShape)
                                        .clickable(onClick = onToggleComplete)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Check,
                                            contentDescription = null,
                                            tint = if (isCompleted) AccentEmerald else palette.muted,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(Modifier.width(4.dp))
                                        Text(
                                            text = if (isCompleted) "Fait" else "Marquer fait",
                                            color = if (isCompleted) AccentEmerald else palette.ink,
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StepperCircleButton(
    icon: ImageVector,
    description: String,
    enabled: Boolean,
    palette: RecipeDetailPalette,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .size(28.dp)
            .clip(CircleShape)
            .clickable(enabled = enabled, onClick = onClick),
        shape = CircleShape,
        color = if (enabled) palette.sheet else palette.sheet.copy(alpha = 0.45f),
        border = BorderStroke(1.dp, palette.warmBorder)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = icon,
                contentDescription = description,
                tint = if (enabled) AfroOrange else palette.muted,
                modifier = Modifier.size(15.dp)
            )
        }
    }
}

@Composable
private fun AdaptiveTopIconButton(
    collapseProgress: Float,
    palette: RecipeDetailPalette,
    onClick: () -> Unit,
    iconContent: @Composable (tint: Color) -> Unit
) {
    val bg = lerp(Color.Black.copy(alpha = 0.44f), palette.elevatedCard, collapseProgress)
    val iconTint = lerp(Color.White, palette.ink, collapseProgress)
    val borderAlpha = collapseProgress

    Surface(
        modifier = Modifier
            .size(42.dp)
            .clip(CircleShape)
            .clickable(onClick = onClick),
        shape = CircleShape,
        color = bg,
        border = if (borderAlpha > 0.1f) BorderStroke(1.dp, palette.border.copy(alpha = borderAlpha)) else null
    ) {
        Box(contentAlignment = Alignment.Center) {
            iconContent(iconTint)
        }
    }
}

@Composable
private fun AdaptiveCartTopButton(
    pendingCount: Int,
    collapseProgress: Float,
    palette: RecipeDetailPalette,
    onClick: () -> Unit
) {
    val bg = lerp(Color.Black.copy(alpha = 0.44f), palette.elevatedCard, collapseProgress)
    val iconTint = lerp(Color.White, palette.ink, collapseProgress)

    Surface(
        modifier = Modifier
            .height(42.dp)
            .clip(ExpressivePillShape)
            .clickable(onClick = onClick),
        shape = ExpressivePillShape,
        color = bg,
        border = if (collapseProgress > 0.1f) {
            BorderStroke(1.dp, palette.border.copy(alpha = collapseProgress))
        } else {
            null
        }
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                painter = painterResource(
                    id = if (pendingCount > 0) R.drawable.ic_solar_bag_bold else R.drawable.ic_solar_bag_linear
                ),
                contentDescription = "Voir le panier",
                tint = if (pendingCount > 0 && collapseProgress > 0.5f) AfroOrange else iconTint,
                modifier = Modifier.size(19.dp)
            )
            if (pendingCount > 0) {
                Surface(
                    shape = CircleShape,
                    color = AfroOrange,
                    modifier = Modifier.height(20.dp)
                ) {
                    AnimatedContent(
                        targetState = pendingCount,
                        transitionSpec = {
                            (scaleIn() + fadeIn()).togetherWith(scaleOut() + fadeOut())
                        },
                        label = "topCartCountBadge"
                    ) { count ->
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .height(20.dp)
                                .widthIn(min = 20.dp)
                                .padding(horizontal = 5.dp)
                        ) {
                            Text(
                                text = "$count",
                                color = Color.White,
                                fontSize = 11.sp,
                                lineHeight = 12.sp,
                                fontWeight = FontWeight.ExtraBold,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RecipeFact(
    icon: ImageVector,
    value: String,
    label: String,
    palette: RecipeDetailPalette
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = AfroOrange,
            modifier = Modifier.size(19.dp)
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = value,
            color = palette.ink,
            fontSize = 13.5.sp,
            fontWeight = FontWeight.ExtraBold,
            maxLines = 1
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = label,
            color = palette.muted,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun FactDivider(color: Color) {
    Box(
        Modifier
            .width(1.dp)
            .height(38.dp)
            .background(color)
    )
}

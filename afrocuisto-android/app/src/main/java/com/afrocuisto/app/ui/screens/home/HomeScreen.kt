package com.afrocuisto.app.ui.screens.home

import androidx.annotation.DrawableRes
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsDraggedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PagerDefaults
import androidx.compose.foundation.pager.PagerSnapDistance
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.RestaurantMenu
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.util.lerp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.Recipe
import com.afrocuisto.app.data.repository.HomeSection
import com.afrocuisto.app.data.repository.RecipeRepository
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.AfroPullToRefreshBox
import com.afrocuisto.app.ui.components.AppleAiGlowCard
import com.afrocuisto.app.ui.components.ProductLikeButton
import com.afrocuisto.app.ui.components.afroCardPressMotion
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.NexaFontFamily
import com.afrocuisto.app.ui.theme.StarGold
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import com.afrocuisto.app.ui.theme.nexaTitleEmphasis
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Locale
import kotlin.math.PI
import kotlin.math.absoluteValue
import kotlin.math.sin

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToRecipeDetail: (String) -> Unit,
    onNavigateToCategory: (String) -> Unit = {},
    onNavigateToAiChef: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToRecipes: () -> Unit,
    onNavigateToMarket: () -> Unit = {},
    onNavigateToCommunity: () -> Unit = {},
    carouselAutoScroll: Boolean = true,
    avatarUrl: String = "",
    repository: RecipeRepository = remember { RecipeRepository() },
    homeScrollState: ScrollState = rememberScrollState()
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val focusManager = LocalFocusManager.current
    val searchFocusRequester = remember { FocusRequester() }

    val recipes by repository.recipes.collectAsState(initial = emptyList())
    val homeSections by repository.homeSections.collectAsState(initial = emptyList())
    val favoriteIds by repository.favoriteIds.collectAsState(initial = emptySet())

    var searchQuery by remember { mutableStateOf("") }
    var isSearchFocused by remember { mutableStateOf(false) }
    var showNotificationsDialog by remember { mutableStateOf(false) }

    val popularRecipes = remember(recipes) {
        recipes.sortedByDescending { it.rating }
    }

    val filteredRecipes = remember(recipes, searchQuery) {
        val q = searchQuery.trim()
        if (q.isBlank()) {
            recipes
        } else {
            recipes.filter { recipe ->
                recipe.name.contains(q, ignoreCase = true) ||
                    recipe.region.contains(q, ignoreCase = true) ||
                    recipe.category.contains(q, ignoreCase = true) ||
                    recipe.ingredients.any { it.name.contains(q, ignoreCase = true) }
            }
        }
    }

    val heroSection = remember(homeSections) {
        homeSections.firstOrNull { it.sectionType == "carousel_hero" }
    }

    val carouselRecipes = remember(recipes, heroSection) {
        if (heroSection != null && heroSection.itemIds.isNotEmpty()) {
            val byId = recipes.associateBy { it.id }
            heroSection.itemIds.mapNotNull { byId[it] }.ifEmpty { recipes.take(5) }
        } else {
            val feat = recipes.filter { it.isFeatured }
            if (feat.size >= 3) feat else recipes.take(5)
        }
    }

    val isSearching = searchQuery.isNotBlank()
    val scrollState = homeScrollState
    val smoothFling = rememberSmoothFlingBehavior()
    val showHeaderDivider by remember { derivedStateOf { scrollState.value > 4 } }

    val canvasBg = if (isDark) colorScheme.background else Color(0xFFF8F9FA)
    val headerBg = if (isDark) colorScheme.background else Color(0xFFF8F9FA)
    val titleColor = if (isDark) colorScheme.onBackground else Color(0xFF1E1E2D)
    val subtitleColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF64748B)
    val borderColor = if (isDark) colorScheme.outline else Color(0xFFE2E8F0)
    val placeholderColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF94A3B8)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(canvasBg)
    ) {
        // 1. FIXED HEADER (stays pinned on vertical scroll)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(headerBg)
        ) {
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 12.dp)
            ) {
                val availableCenterWidth = (maxWidth - 76.dp).coerceAtLeast(180.dp)
                val baseSearchWidth = (availableCenterWidth - 52.dp).coerceAtLeast(172.dp)
                val expandedSearchWidth = (baseSearchWidth + 30.dp).coerceAtMost(availableCenterWidth - 12.dp)

                val animatedSearchWidth by animateDpAsState(
                    targetValue = if (isSearchFocused) expandedSearchWidth else baseSearchWidth,
                    animationSpec = spring(
                        dampingRatio = 0.84f,
                        stiffness = Spring.StiffnessMediumLow
                    ),
                    label = "appleStyleSearchWidth"
                )

                val animatedSearchBorder by animateColorAsState(
                    targetValue = if (isSearchFocused) AfroOrange.copy(alpha = 0.7f) else borderColor,
                    label = "searchBorderColor"
                )

                // Left: Solar User Profile Icon -> dedicated Profile screen
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .align(Alignment.CenterStart)
                        .clip(CircleShape)
                        .background(if (isDark) colorScheme.surfaceVariant else Color.White)
                        .afroSpringClickable(
                            pressedScale = 0.86f,
                            haptic = AfroHapticKind.NONE
                        ) {
                            focusManager.clearFocus()
                            onNavigateToProfile()
                        },
                    contentAlignment = Alignment.Center
                ) {
                    if (avatarUrl.isNotBlank()) {
                        AsyncImage(
                            model = avatarUrl,
                            contentDescription = "Photo de profil",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize().clip(CircleShape)
                        )
                    } else {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_user_circle_linear),
                            contentDescription = "Profil utilisateur",
                            tint = titleColor,
                            modifier = Modifier.size(31.dp)
                        )
                    }
                }

                // Center: Pill Search Bar with smooth +30dp Apple-style expansion
                Surface(
                    modifier = Modifier
                        .width(animatedSearchWidth)
                        .height(38.dp)
                        .align(Alignment.Center)
                        .clip(RoundedCornerShape(20.dp))
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) {
                            searchFocusRequester.requestFocus()
                        },
                    shape = RoundedCornerShape(20.dp),
                    color = if (isDark) colorScheme.surface else Color.White,
                    border = BorderStroke(1.dp, animatedSearchBorder)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 13.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Rechercher",
                            tint = if (isSearchFocused) AfroOrange else placeholderColor,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(modifier = Modifier.weight(1f)) {
                            if (searchQuery.isEmpty()) {
                                Text(
                                    text = "Plat, pays ou ingrédient...",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = placeholderColor,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            BasicTextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                singleLine = true,
                                textStyle = TextStyle(
                                    fontFamily = NexaFontFamily,
                                    color = titleColor,
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Medium
                                ),
                                cursorBrush = SolidColor(AfroOrange),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .focusRequester(searchFocusRequester)
                                    .onFocusChanged { isSearchFocused = it.isFocused }
                            )
                        }
                        if (searchQuery.isNotBlank() || isSearchFocused) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Fermer",
                                tint = placeholderColor,
                                modifier = Modifier
                                    .size(15.dp)
                                    .clickable {
                                        searchQuery = ""
                                        focusManager.clearFocus()
                                    }
                            )
                        }
                    }
                }

                // Right: Outlined Solar Notification Bell
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .align(Alignment.CenterEnd)
                        .clip(CircleShape)
                        .afroSpringClickable(
                            pressedScale = 0.85f,
                            haptic = AfroHapticKind.SELECTION
                        ) { showNotificationsDialog = true },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_bell_linear),
                        contentDescription = "Notifications",
                        tint = titleColor,
                        modifier = Modifier.size(23.dp)
                    )
                }
            }

            AnimatedVisibility(
                visible = showHeaderDivider,
                enter = fadeIn(tween(150)),
                exit = fadeOut(tween(150))
            ) {
                HorizontalDivider(
                    thickness = 1.dp,
                    color = borderColor.copy(alpha = 0.75f)
                )
            }
        }

        // 2. SCROLLABLE BODY BELOW FIXED HEADER
        AfroPullToRefreshBox(
            onRefresh = { repository.refreshFromSupabase() },
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(state = scrollState, flingBehavior = smoothFling)
        ) {
            // 3. Faithful Portrait Dish Carousel with Apple-style Smooth Auto-Scroll
            if (!isSearching && carouselRecipes.isNotEmpty()) {
                Spacer(modifier = Modifier.height(6.dp))

                AppleAutoScrollDishCarousel(
                    recipes = carouselRecipes,
                    favoriteIds = favoriteIds,
                    autoScrollEnabled = carouselAutoScroll,
                    onToggleFavorite = { repository.toggleFavorite(it) },
                    onRecipeClick = onNavigateToRecipeDetail
                )

                Spacer(modifier = Modifier.height(10.dp))

                // 4. Frigo Magique Card (exact FigCraft geometry + Apple AI Glow)
                Home1FridgeBanner(
                    onClick = onNavigateToAiChef,
                    modifier = Modifier.padding(horizontal = 20.dp)
                )

                Spacer(modifier = Modifier.height(22.dp))

                // 5. Horizontal Categories Carousel (28dp colored cards with Solar outlined icons)
                HomeCategoriesSection(
                    onCategoryClick = { clickedId -> onNavigateToCategory(clickedId) },
                    titleColor = titleColor
                )
            }

            Spacer(modifier = Modifier.height(22.dp))

            // 6. Sections dynamiques configurées depuis l'Admin CMS (ou repli par défaut)
            val dynamicBodySections = remember(homeSections, heroSection) {
                homeSections.filter { it.id != heroSection?.id }
            }

            if (isSearching) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(7.dp)
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_star_linear),
                            contentDescription = null,
                            tint = titleColor,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Recettes (${filteredRecipes.size})",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = titleColor,
                            modifier = Modifier.nexaTitleEmphasis()
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (filteredRecipes.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.RestaurantMenu,
                                contentDescription = null,
                                tint = placeholderColor,
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Aucune recette trouvée",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = titleColor
                            )
                            Text(
                                text = "Essayez un autre mot-clé",
                                fontSize = 12.5.sp,
                                color = subtitleColor
                            )
                        }
                    }
                } else {
                    filteredRecipes.chunked(2).forEach { rowRecipes ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 20.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            rowRecipes.forEach { recipe ->
                                Box(modifier = Modifier.weight(1f)) {
                                    SunRecipeCard(
                                        recipe = recipe,
                                        isFavorite = favoriteIds.contains(recipe.id),
                                        onToggleFavorite = { repository.toggleFavorite(recipe.id) },
                                        onClick = { onNavigateToRecipeDetail(recipe.id) }
                                    )
                                }
                            }
                            if (rowRecipes.size == 1) {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            } else if (dynamicBodySections.isNotEmpty()) {
                val recipesById = remember(recipes) { recipes.associateBy { it.id } }

                dynamicBodySections.forEach { section: HomeSection ->
                    val sectionRecipes = if (section.itemIds.isEmpty()) {
                        popularRecipes
                    } else {
                        section.itemIds.mapNotNull { recipesById[it] }
                    }

                    when (section.sectionType) {
                        "carousel_hero" -> {
                            if (sectionRecipes.isNotEmpty()) {
                                AppleAutoScrollDishCarousel(
                                    recipes = sectionRecipes,
                                    favoriteIds = favoriteIds,
                                    autoScrollEnabled = carouselAutoScroll,
                                    onToggleFavorite = { repository.toggleFavorite(it) },
                                    onRecipeClick = onNavigateToRecipeDetail
                                )
                                Spacer(modifier = Modifier.height(22.dp))
                            }
                        }

                        "express_horizontal" -> {
                            HomeExpressRecipesSection(
                                recipes = sectionRecipes,
                                favoriteIds = favoriteIds,
                                onToggleFavorite = { repository.toggleFavorite(it) },
                                onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                                onNavigateToRecipes = onNavigateToRecipes,
                                titleColor = titleColor,
                                subtitleColor = subtitleColor,
                                borderColor = borderColor,
                                sectionTitle = section.title.ifBlank { "Prêt en un éclair" }
                            )
                            Spacer(modifier = Modifier.height(22.dp))
                        }

                        "daily_menu" -> {
                            HomeDailyMenuSection(
                                recipes = sectionRecipes.ifEmpty { recipes },
                                favoriteIds = favoriteIds,
                                onToggleFavorite = { repository.toggleFavorite(it) },
                                onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                                onNavigateToAiChef = onNavigateToAiChef,
                                titleColor = titleColor,
                                subtitleColor = subtitleColor,
                                borderColor = borderColor,
                                sectionTitle = section.title.ifBlank { "Menu du Jour" }
                            )
                            Spacer(modifier = Modifier.height(22.dp))
                        }

                        "terroir_atlas" -> {
                            HomeTerroirAtlasSection(
                                recipes = sectionRecipes.ifEmpty { recipes },
                                favoriteIds = favoriteIds,
                                onToggleFavorite = { repository.toggleFavorite(it) },
                                onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                                titleColor = titleColor,
                                subtitleColor = subtitleColor,
                                borderColor = borderColor
                            )
                            Spacer(modifier = Modifier.height(22.dp))
                        }

                        "chef_secrets" -> {
                            HomeChefSecretsSection(
                                onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                                onNavigateToAiChef = onNavigateToAiChef,
                                titleColor = titleColor,
                                subtitleColor = subtitleColor
                            )
                            Spacer(modifier = Modifier.height(22.dp))
                        }

                        "weekly_challenge" -> {
                            HomeWeeklyChallengeSection(
                                onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                                onNavigateToCommunity = onNavigateToCommunity,
                                onNavigateToMarket = onNavigateToMarket,
                                titleColor = titleColor,
                                subtitleColor = subtitleColor,
                                borderColor = borderColor
                            )
                            Spacer(modifier = Modifier.height(22.dp))
                        }

                        else -> {
                            // "popular_grid" ou toute autre section grille de recettes
                            if (sectionRecipes.isNotEmpty()) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 20.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(7.dp)
                                    ) {
                                        Icon(
                                            painter = painterResource(id = R.drawable.ic_solar_star_linear),
                                            contentDescription = null,
                                            tint = titleColor,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Text(
                                            text = section.title.ifBlank { "Les Plus Populaires" },
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = titleColor,
                                            modifier = Modifier.nexaTitleEmphasis()
                                        )
                                    }
                                    Text(
                                        text = "Tout voir",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = AfroOrange,
                                        modifier = Modifier.afroSpringClickable(
                                            pressedScale = 0.90f,
                                            haptic = AfroHapticKind.NONE
                                        ) { onNavigateToRecipes() }
                                    )
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                sectionRecipes.take(8).chunked(2).forEach { rowRecipes ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = 20.dp),
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        rowRecipes.forEach { recipe ->
                                            Box(modifier = Modifier.weight(1f)) {
                                                SunRecipeCard(
                                                    recipe = recipe,
                                                    isFavorite = favoriteIds.contains(recipe.id),
                                                    onToggleFavorite = { repository.toggleFavorite(recipe.id) },
                                                    onClick = { onNavigateToRecipeDetail(recipe.id) }
                                                )
                                            }
                                        }
                                        if (rowRecipes.size == 1) {
                                            Spacer(modifier = Modifier.weight(1f))
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(12.dp))
                                }

                                Spacer(modifier = Modifier.height(10.dp))
                            }
                        }
                    }
                }
            } else {
                // Repli par défaut si aucune section dynamique n'est configurée en base
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(7.dp)
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_star_linear),
                            contentDescription = null,
                            tint = titleColor,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Les Plus Populaires",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = titleColor,
                            modifier = Modifier.nexaTitleEmphasis()
                        )
                    }
                    Text(
                        text = "Tout voir",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = AfroOrange,
                        modifier = Modifier.afroSpringClickable(
                            pressedScale = 0.90f,
                            haptic = AfroHapticKind.NONE
                        ) { onNavigateToRecipes() }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                popularRecipes.take(8).chunked(2).forEach { rowRecipes ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        rowRecipes.forEach { recipe ->
                            Box(modifier = Modifier.weight(1f)) {
                                SunRecipeCard(
                                    recipe = recipe,
                                    isFavorite = favoriteIds.contains(recipe.id),
                                    onToggleFavorite = { repository.toggleFavorite(recipe.id) },
                                    onClick = { onNavigateToRecipeDetail(recipe.id) }
                                )
                            }
                        }
                        if (rowRecipes.size == 1) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }

                if (recipes.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(14.dp))

                    HomeDailyMenuSection(
                        recipes = recipes,
                        favoriteIds = favoriteIds,
                        onToggleFavorite = { repository.toggleFavorite(it) },
                        onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                        onNavigateToAiChef = onNavigateToAiChef,
                        titleColor = titleColor,
                        subtitleColor = subtitleColor,
                        borderColor = borderColor
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    HomeTerroirAtlasSection(
                        recipes = recipes,
                        favoriteIds = favoriteIds,
                        onToggleFavorite = { repository.toggleFavorite(it) },
                        onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                        titleColor = titleColor,
                        subtitleColor = subtitleColor,
                        borderColor = borderColor
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    HomeExpressRecipesSection(
                        recipes = recipes,
                        favoriteIds = favoriteIds,
                        onToggleFavorite = { repository.toggleFavorite(it) },
                        onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                        onNavigateToRecipes = onNavigateToRecipes,
                        titleColor = titleColor,
                        subtitleColor = subtitleColor,
                        borderColor = borderColor
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    HomeChefSecretsSection(
                        onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                        onNavigateToAiChef = onNavigateToAiChef,
                        titleColor = titleColor,
                        subtitleColor = subtitleColor
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    HomeWeeklyChallengeSection(
                        onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                        onNavigateToCommunity = onNavigateToCommunity,
                        onNavigateToMarket = onNavigateToMarket,
                        titleColor = titleColor,
                        subtitleColor = subtitleColor,
                        borderColor = borderColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))
        }
        }
    }

    if (showNotificationsDialog) {
        val sheetBg = if (isDark) colorScheme.surface else Color.White
        val subtleBg = if (isDark) colorScheme.surfaceVariant else Color(0xFFF8FAFC)
        ModalBottomSheet(
            onDismissRequest = { showNotificationsDialog = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
            containerColor = sheetBg,
            scrimColor = Color(0xFF0F172A).copy(alpha = 0.45f)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 22.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(subtleBg)
                            .border(1.dp, borderColor, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_bell_linear),
                            contentDescription = null,
                            tint = titleColor,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "Notifications",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 19.sp,
                            color = titleColor,
                            modifier = Modifier.nexaTitleEmphasis()
                        )
                        Text(
                            text = "Alertes et nouveautés AfroCuisto",
                            fontSize = 12.sp,
                            color = subtitleColor
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(28.dp),
                    color = subtleBg,
                    border = BorderStroke(1.dp, borderColor),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "Aucune nouvelle notification pour le moment.",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = titleColor
                        )
                        Text(
                            text = "Vos alertes de cuisson, nouveautés de la communauté et mises à jour de l'application apparaîtront ici.",
                            fontSize = 12.5.sp,
                            lineHeight = 18.sp,
                            color = subtitleColor
                        )
                    }
                }

                Button(
                    onClick = { showNotificationsDialog = false },
                    shape = RoundedCornerShape(28.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isDark) Color.White else Color(0xFF1E1E2D),
                        contentColor = if (isDark) Color(0xFF1E1E2D) else Color.White
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text(
                        text = "Fermer",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))
            }
        }
    }
}

/**
 * Bidirectional infinite-loop portrait dish carousel:
 * - True gesture wrap-around in both directions (left & right) with symmetrical side-card peeks
 * - GPU-only draw-phase transforms (`graphicsLayer` without per-frame recomposition) + internal photo parallax
 * - Responsive spring snap physics (`PagerSnapDistance.atMost(1)`) + interactive pill pagination indicator
 */
@Composable
private fun AppleAutoScrollDishCarousel(
    recipes: List<Recipe>,
    favoriteIds: Set<String>,
    autoScrollEnabled: Boolean = true,
    onToggleFavorite: (String) -> Unit,
    onRecipeClick: (String) -> Unit
) {
    val itemCount = recipes.size
    if (itemCount == 0) return

    val isDark = isAfroDarkTheme()
    val haptics = LocalHapticFeedback.current
    val coroutineScope = rememberCoroutineScope()

    val isLooping = itemCount > 1
    val virtualCount = if (isLooping) itemCount * 2000 else 1

    androidx.compose.runtime.key(itemCount, virtualCount) {
    val startPage = remember(itemCount) {
        if (isLooping) {
            val mid = virtualCount / 2
            mid - (mid % itemCount)
        } else {
            0
        }
    }

    val pagerState = rememberPagerState(
        initialPage = startPage,
        pageCount = { virtualCount }
    )
    val isDragged by pagerState.interactionSource.collectIsDraggedAsState()

    // Silently keep virtual index centered when idle so loop never hits an edge even after thousands of swipes
    LaunchedEffect(itemCount) {
        if (!isLooping) return@LaunchedEffect
        snapshotFlow { pagerState.isScrollInProgress to pagerState.settledPage }
            .collect { (scrolling, settled) ->
                if (!scrolling && (settled - startPage).absoluteValue > itemCount * 500) {
                    val actualIdx = ((settled % itemCount) + itemCount) % itemCount
                    pagerState.scrollToPage(startPage + actualIdx)
                }
            }
    }

    // Subtle haptic tick when user manually swipes to a new card
    var wasDraggedRecently by remember { mutableStateOf(false) }
    LaunchedEffect(isDragged) {
        if (isDragged) wasDraggedRecently = true
    }
    LaunchedEffect(pagerState.settledPage) {
        if (wasDraggedRecently) {
            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
            wasDraggedRecently = false
        }
    }

    // Forward-only seamless auto-advance (never rewinds backwards; pauses immediately on touch)
    LaunchedEffect(itemCount, isDragged, pagerState.settledPage, autoScrollEnabled) {
        if (!isLooping || !autoScrollEnabled || isDragged) return@LaunchedEffect
        delay(4400L)
        if (!isDragged && !pagerState.isScrollInProgress) {
            pagerState.animateScrollToPage(
                page = pagerState.currentPage + 1,
                animationSpec = spring(
                    dampingRatio = 0.88f,
                    stiffness = Spring.StiffnessLow
                )
            )
        }
    }

    val flingBehavior = PagerDefaults.flingBehavior(
        state = pagerState,
        pagerSnapDistance = PagerSnapDistance.atMost(1),
        snapPositionalThreshold = 0.16f,
        snapAnimationSpec = spring(
            dampingRatio = 0.86f,
            stiffness = Spring.StiffnessMediumLow
        )
    )

    val activeRealIndex by remember(itemCount) {
        derivedStateOf {
            ((pagerState.currentPage % itemCount) + itemCount) % itemCount
        }
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        HorizontalPager(
            state = pagerState,
            contentPadding = PaddingValues(horizontal = 36.dp, vertical = 18.dp),
            pageSpacing = 12.dp,
            beyondViewportPageCount = 2,
            flingBehavior = flingBehavior,
            key = { page ->
                val idx = ((page % itemCount) + itemCount) % itemCount
                "${page}_${recipes[idx].id}"
            },
            modifier = Modifier.fillMaxWidth()
        ) { page ->
            val realIndex = ((page % itemCount) + itemCount) % itemCount
            val recipe = recipes[realIndex]

            PortraitDishCarouselCard(
                recipe = recipe,
                isFavorite = favoriteIds.contains(recipe.id),
                isDark = isDark,
                pageOffsetProvider = {
                    if (page in 0 until pagerState.pageCount) pagerState.getOffsetDistanceInPages(page) else 0f
                },
                onToggleFavorite = {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    onToggleFavorite(recipe.id)
                },
                onClick = {
                    val currentPage = pagerState.currentPage
                    if (page != currentPage && !pagerState.isScrollInProgress) {
                        // Tapping a peeking side card smoothly centers it first
                        coroutineScope.launch {
                            pagerState.animateScrollToPage(
                                page = page,
                                animationSpec = spring(
                                    dampingRatio = 0.86f,
                                    stiffness = Spring.StiffnessMediumLow
                                )
                            )
                        }
                    } else {
                        onRecipeClick(recipe.id)
                    }
                },
                modifier = Modifier.graphicsLayer {
                    val signedOffset = if (page in 0 until pagerState.pageCount) pagerState.getOffsetDistanceInPages(page) else 0f
                    val absOffset = signedOffset.absoluteValue.coerceIn(0f, 1f)
                    val scale = lerp(start = 0.92f, stop = 1f, fraction = 1f - absOffset)
                    scaleX = scale
                    scaleY = scale
                    translationY = absOffset * 6.dp.toPx()
                }
            )
        }

        if (itemCount > 1) {
            Spacer(modifier = Modifier.height(2.dp))

            // Interactive Animated Pill Pagination Indicator
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                for (index in 0 until itemCount) {
                    val isSelected = index == activeRealIndex
                    val pillWidth by animateDpAsState(
                        targetValue = if (isSelected) 22.dp else 6.dp,
                        animationSpec = spring(
                            dampingRatio = 0.80f,
                            stiffness = Spring.StiffnessMedium
                        ),
                        label = "carouselIndicatorWidth"
                    )
                    val pillColor by animateColorAsState(
                        targetValue = if (isSelected) {
                            AfroOrange
                        } else if (isDark) {
                            Color.White.copy(alpha = 0.22f)
                        } else {
                            Color(0xFFCBD5E1)
                        },
                        animationSpec = tween(200),
                        label = "carouselIndicatorColor"
                    )

                    Box(
                        modifier = Modifier
                            .width(pillWidth)
                            .height(6.dp)
                            .clip(CircleShape)
                            .background(pillColor)
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) {
                                val current = pagerState.currentPage
                                val currentMod = ((current % itemCount) + itemCount) % itemCount
                                var delta = index - currentMod
                                if (delta > itemCount / 2) delta -= itemCount
                                if (delta < -itemCount / 2) delta += itemCount
                                if (delta != 0) {
                                    coroutineScope.launch {
                                        pagerState.animateScrollToPage(
                                            page = current + delta,
                                            animationSpec = spring(
                                                dampingRatio = 0.86f,
                                                stiffness = Spring.StiffnessMediumLow
                                            )
                                        )
                                    }
                                }
                            }
                    )
                }
            }
        }
    }
    }
}

@Composable
private fun PortraitDishCarouselCard(
    recipe: Recipe,
    isFavorite: Boolean,
    isDark: Boolean,
    pageOffsetProvider: () -> Float,
    onToggleFavorite: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val pressScale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioNoBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "carouselCardPressScale"
    )

    val imageRequest = remember(recipe.id, recipe.image) {
        ImageRequest.Builder(context)
            .data(recipe.image)
            .memoryCacheKey("carousel_${recipe.id}")
            .crossfade(180)
            .build()
    }

    val descriptionText = recipe.description?.takeIf { it.isNotBlank() }
        ?: "Spécialité authentique de ${recipe.region.ifBlank { "terroir africain" }}, préparée avec des épices et ingrédients frais."

    val frameBorderColor = if (isDark) Color.White.copy(alpha = 0.16f) else Color.White
    val ratingText = remember(recipe.rating) { String.format(Locale.FRANCE, "%.1f", recipe.rating) }
    val subtitleTag = remember(recipe.alias, recipe.category) {
        (recipe.alias?.takeIf { it.isNotBlank() } ?: recipe.category).uppercase(Locale.FRENCH)
    }

    Card(
        onClick = onClick,
        interactionSource = interactionSource,
        modifier = modifier
            .fillMaxWidth()
            .height(352.dp)
            .graphicsLayer {
                scaleX = pressScale
                scaleY = pressScale
            },
        shape = RoundedCornerShape(30.dp),
        border = BorderStroke(2.5.dp, frameBorderColor),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isDark) 6.dp else 7.dp,
            pressedElevation = 10.dp
        )
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            // 1. Full-bleed dish photo with GPU counter-parallax on horizontal drag
            AsyncImage(
                model = imageRequest,
                contentDescription = recipe.name,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        val offset = pageOffsetProvider().coerceIn(-1f, 1f)
                        val centeredProgress = 1f - offset.absoluteValue
                        val imageScale = 1f + 0.09f * centeredProgress
                        scaleX = imageScale
                        scaleY = imageScale
                        translationX = offset * 28.dp.toPx() * centeredProgress
                    }
            )

            // 2. Multi-stop cinematic vignette & warm editorial bottom scrim
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colorStops = arrayOf(
                                0.0f to Color.Black.copy(alpha = 0.30f),
                                0.24f to Color.Transparent,
                                0.48f to Color.Black.copy(alpha = 0.14f),
                                0.72f to Color.Black.copy(alpha = 0.72f),
                                1.0f to Color.Black.copy(alpha = 0.92f)
                            )
                        )
                    )
            )

            // 3. Top Metadata Bar: Glassmorphic Rating + Region + PrepTime Pill & Like Button
            Row(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Color.Black.copy(alpha = 0.48f),
                    border = BorderStroke(0.8.dp, Color.White.copy(alpha = 0.18f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Star,
                            contentDescription = null,
                            tint = StarGold,
                            modifier = Modifier.size(13.5.dp)
                        )
                        Text(
                            text = ratingText,
                            color = Color.White,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                        if (recipe.region.isNotBlank()) {
                            Text(
                                text = "· ${recipe.region.substringBefore(" &")}",
                                color = Color.White.copy(alpha = 0.88f),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1
                            )
                        }
                        if (recipe.prepTime.isNotBlank()) {
                            Text(
                                text = "· ${recipe.prepTime}",
                                color = Color(0xFFFDBA74),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1
                            )
                        }
                    }
                }

                ProductLikeButton(
                    isLiked = isFavorite,
                    onClick = onToggleFavorite,
                    buttonSize = 36.dp,
                    iconSize = 19.dp
                )
            }

            // 4. Bottom Editorial Content with subtle foreground depth motion
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .padding(horizontal = 18.dp, vertical = 16.dp)
                    .graphicsLayer {
                        val offset = pageOffsetProvider().coerceIn(-1f, 1f)
                        translationX = -offset * 8.dp.toPx()
                        alpha = lerp(start = 0.68f, stop = 1f, fraction = 1f - offset.absoluteValue)
                    }
            ) {
                if (subtitleTag.isNotBlank()) {
                    Text(
                        text = subtitleTag,
                        color = Color(0xFFFDBA74),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.0.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }

                Text(
                    text = recipe.name,
                    modifier = Modifier.nexaTitleEmphasis(),
                    color = Color.White,
                    fontSize = 20.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    lineHeight = 25.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(5.dp))

                Text(
                    text = descriptionText,
                    color = Color.White.copy(alpha = 0.86f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Normal,
                    lineHeight = 16.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(13.dp))

                // Non-intercepting visual CTA pill (Card handles click & lets horizontal gestures pass cleanly)
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(42.dp),
                    shape = RoundedCornerShape(21.dp),
                    color = Color.White,
                    shadowElevation = 2.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(start = 18.dp, end = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Découvrir la recette",
                            color = Color(0xFF19221D),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold
                        )

                        Box(
                            modifier = Modifier
                                .size(30.dp)
                                .clip(CircleShape)
                                .background(AfroOrange),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Home1FridgeBanner(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val cardBg = if (isDark) colorScheme.surface else Color.White
    val titleColor = if (isDark) colorScheme.onSurface else Color(0xFF000000)
    val bodyColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF111827)

    // Outer container reserves 17.dp top space so the 3D fridge pops above the card just like FigCraft
    Box(
        modifier = modifier.fillMaxWidth()
    ) {
        AppleAiGlowCard(
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 17.dp)
                .heightIn(min = 124.dp),
            cornerRadius = 28.dp,
            containerColor = cardBg,
            isDark = isDark
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 90.dp, end = 12.dp, top = 11.dp, bottom = 12.dp)
            ) {
                // Top-right orange magic wand button (scaled from FigCraft 78.25x78.25, radius 26.7)
                Surface(
                    modifier = Modifier
                        .size(30.dp)
                        .align(Alignment.TopEnd),
                    shape = RoundedCornerShape(10.dp),
                    color = AfroOrange,
                    shadowElevation = 3.dp
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_magic_stick_linear),
                            contentDescription = "Ouvrir Frigo Magique",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                // Text stack aligned to FigCraft proportions (single-line orange headline below button height)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp)
                ) {
                    Text(
                        text = "Frigo Magique",
                        color = titleColor,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(end = 36.dp)
                    )

                    Spacer(modifier = Modifier.height(5.dp))

                    Text(
                        text = "Que cuisiner avec vos restes ?",
                        color = AfroOrange,
                        fontSize = 14.sp,
                        lineHeight = 17.sp,
                        letterSpacing = (-0.25).sp,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "Trouvez à l'aide de l'IA des recettes toutes adaptées à ce que vous avez dans votre frigo. Ici tout s'utilise et votre frigo ne s'en plaint pas.",
                        color = bodyColor,
                        fontSize = 9.5.sp,
                        lineHeight = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Foreground 3D Fridge overlapping top edge of white card (matches FigCraft layer stack)
        Image(
            painter = painterResource(id = R.drawable.img_frigo_magique),
            contentDescription = "Frigo Magique",
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 11.dp, bottom = 7.dp)
                .width(68.dp)
                .height(134.dp)
        )
    }
}

@Composable
private fun HomeCategoriesSection(
    onCategoryClick: (String) -> Unit,
    titleColor: Color
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(7.dp)
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_solar_recipes_linear),
                    contentDescription = null,
                    tint = titleColor,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = "Catégories",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = titleColor,
                    modifier = Modifier.nexaTitleEmphasis()
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyRow(
            contentPadding = PaddingValues(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            flingBehavior = rememberSmoothFlingBehavior()
        ) {
            items(
                items = HOME_CATEGORIES,
                key = { it.id },
                contentType = { "category_card" }
            ) { category ->
                DishCategoryCard(
                    category = category,
                    onClick = { onCategoryClick(category.id) }
                )
            }
        }
    }
}

@Composable
private fun DishCategoryCard(
    category: DishCategorySpec,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val iconScale by animateFloatAsState(
        targetValue = if (isPressed) 1.14f else 1f,
        animationSpec = spring(
            dampingRatio = 0.50f,
            stiffness = Spring.StiffnessMedium
        ),
        label = "catIconScale"
    )
    val iconTilt by animateFloatAsState(
        targetValue = if (isPressed) -8f else 0f,
        animationSpec = spring(
            dampingRatio = 0.50f,
            stiffness = Spring.StiffnessMedium
        ),
        label = "catIconTilt"
    )

    Card(
        onClick = onClick,
        interactionSource = interactionSource,
        modifier = Modifier
            .width(164.dp)
            .height(62.dp)
            .afroCardPressMotion(interactionSource = interactionSource, pressedScale = 0.94f),
        shape = RoundedCornerShape(22.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp, pressedElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF151515))
                .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .graphicsLayer {
                        scaleX = iconScale
                        scaleY = iconScale
                        rotationZ = iconTilt
                    }
                    .background(Color.White.copy(alpha = 0.10f), RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = category.iconRes),
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(23.dp)
                )
            }

            Text(
                text = category.label,
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.ExtraBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
@OptIn(ExperimentalLayoutApi::class)
fun SunRecipeCard(
    recipe: Recipe,
    isFavorite: Boolean = false,
    onToggleFavorite: () -> Unit = {},
    onClick: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val imageZoom by animateFloatAsState(
        targetValue = if (isPressed) 1.06f else 1f,
        animationSpec = spring(
            dampingRatio = 0.72f,
            stiffness = Spring.StiffnessMediumLow
        ),
        label = "sunCardImageZoom"
    )

    val cardBg = if (isDark) colorScheme.surface else Color.White
    val borderColor = if (isDark) colorScheme.outline else Color(0xFFE2E8F0)
    val titleColor = if (isDark) colorScheme.onSurface else Color(0xFF000000)
    val bodyColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF1E1E2D)
    val ratingPillBg = if (isDark) Color(0xFF0B0B0F) else Color(0xFF000000)

    val ratingFormatted = String.format(Locale.FRANCE, "%.1f", recipe.rating)
    val shortCat = recipe.category.substringBefore(" &").ifBlank { "Plat" }
    val originText = if (recipe.region.isNotBlank()) "${recipe.region} | $shortCat" else shortCat
    val descriptionText = recipe.description?.takeIf { it.isNotBlank() }
        ?: "Spécialité authentique de ${recipe.region.ifBlank { "terroir africain" }}, préparée avec des épices et ingrédients frais."

    Card(
        onClick = onClick,
        interactionSource = interactionSource,
        modifier = Modifier
            .fillMaxWidth()
            .afroCardPressMotion(interactionSource = interactionSource, pressedScale = 0.96f),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = cardBg),
        border = BorderStroke(1.dp, borderColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp, pressedElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp)
        ) {
            // Dish Photo + Top-Right Translucent Dark Favorite Circle (FigCraft Product Card)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(122.dp)
                    .clip(RoundedCornerShape(18.dp))
            ) {
                AsyncImage(
                    model = recipe.image,
                    contentDescription = recipe.name,
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer {
                            scaleX = imageZoom
                            scaleY = imageZoom
                        },
                    contentScale = ContentScale.Crop
                )

                ProductLikeButton(
                    isLiked = isFavorite,
                    onClick = onToggleFavorite,
                    buttonSize = 26.dp,
                    iconSize = 15.dp,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // ExtraBold Recipe Title (1 line max)
            Text(
                text = recipe.name,
                fontSize = 13.5.sp,
                fontWeight = FontWeight.ExtraBold,
                color = titleColor,
                lineHeight = 16.5.sp,
                minLines = 1,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(5.dp))

            // 2-Line Max Recipe Description
            Text(
                text = descriptionText,
                fontSize = 10.sp,
                lineHeight = 13.sp,
                fontWeight = FontWeight.Normal,
                color = bodyColor,
                minLines = 2,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(7.dp))

            // Category / Origin Metadata with Solar Clipboard Icon
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_solar_clipboard_list_linear),
                    contentDescription = null,
                    tint = titleColor,
                    modifier = Modifier.size(13.dp)
                )
                Text(
                    text = originText,
                    fontSize = 10.sp,
                    color = titleColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    fontWeight = FontWeight.Normal
                )
            }

            Spacer(modifier = Modifier.height(9.dp))

            // Les pilules peuvent passer sur plusieurs lignes quand la durée est longue.
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
                itemVerticalAlignment = Alignment.CenterVertically
            ) {
                ProductCardMetricPill(
                    backgroundColor = AfroOrange,
                    iconRes = R.drawable.ic_solar_stopwatch_linear,
                    label = recipe.prepTime
                )
                ProductCardMetricPill(
                    backgroundColor = ratingPillBg,
                    iconRes = R.drawable.ic_solar_star_linear,
                    label = ratingFormatted
                )
            }
        }
    }
}

@Composable
private fun ProductCardMetricPill(
    backgroundColor: Color,
    iconRes: Int,
    label: String
) {
    Surface(
        shape = RoundedCornerShape(50),
        color = backgroundColor
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                painter = painterResource(id = iconRes),
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(12.dp)
            )
            Text(
                text = label,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                maxLines = 1
            )
        }
    }
}

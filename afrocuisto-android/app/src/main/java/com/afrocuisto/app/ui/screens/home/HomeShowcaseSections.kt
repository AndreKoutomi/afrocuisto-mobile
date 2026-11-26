package com.afrocuisto.app.ui.screens.home

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
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
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material.icons.rounded.LocalFireDepartment
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.Restaurant
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.material.icons.rounded.Verified
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.Recipe
import com.afrocuisto.app.ui.components.AfroWindowWidthClass
import com.afrocuisto.app.ui.components.ProductLikeButton
import com.afrocuisto.app.ui.components.rememberAfroWindowWidthClass
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.AfroOrangeLight
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import com.afrocuisto.app.ui.theme.nexaTitleEmphasis
import java.util.Calendar
import java.util.Locale

// ============================================================================
// 1. MENU DU JOUR & INSPIRATION DU MOMENT (Context-Aware Pairing Card)
// ============================================================================

private data class DailyMenuPairing(
    val tabId: String,
    val tabLabel: String,
    val badge: String,
    val title: String,
    val subtitle: String,
    val mainRecipeId: String,
    val pairingNote: String,
    val totalMinutesLabel: String,
    val servingsLabel: String
)

private val DAILY_MENUS = listOf(
    DailyMenuPairing(
        tabId = "midi",
        tabLabel = "Déjeuner",
        badge = "MENU DU MIDI",
        title = "Atassi Royale & Bissap Glacé",
        subtitle = "Un duo généreux, complet en protéines végétales et prêt rapidement pour une pause équilibrée.",
        mainRecipeId = "P11",
        pairingNote = "Accord : Jus de Bissap à la Menthe",
        totalMinutesLabel = "15 min",
        servingsLabel = "4 pers."
    ),
    DailyMenuPairing(
        tabId = "soir",
        tabLabel = "Dîner",
        badge = "TABLE DU SOIR",
        title = "Amiwô Royal au Poulet Braisé",
        subtitle = "La signature festive béninoise, veloutée à la tomate fraîche et relevée d'un trait de gingembre.",
        mainRecipeId = "P02",
        pairingNote = "Accord : Pimentade maison & Bissap",
        totalMinutesLabel = "35 min",
        servingsLabel = "4 pers."
    ),
    DailyMenuPairing(
        tabId = "weekend",
        tabLabel = "Convivial",
        badge = "PARTAGE & GRILL",
        title = "Brochettes Suya & Sauce Dékoun",
        subtitle = "Saveurs fumées au Kankan torréfié et sauce graine onctueuse pour réunir toute la table.",
        mainRecipeId = "V03",
        pairingNote = "Accord : Oignons rouges & citron vert",
        totalMinutesLabel = "30 min",
        servingsLabel = "4 pers."
    )
)

@Composable
fun HomeDailyMenuSection(
    recipes: List<Recipe>,
    favoriteIds: Set<String>,
    onToggleFavorite: (String) -> Unit,
    onNavigateToRecipeDetail: (String) -> Unit,
    onNavigateToAiChef: () -> Unit,
    titleColor: Color,
    subtitleColor: Color,
    borderColor: Color,
    sectionTitle: String = "Menu du Moment"
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptic = LocalHapticFeedback.current

    val menus = remember(recipes) {
        val hasMockIds = DAILY_MENUS.any { m -> recipes.any { it.id == m.mainRecipeId } }
        if (recipes.isEmpty() || hasMockIds) {
            DAILY_MENUS
        } else {
            val tabMeta = listOf(
                Triple("midi", "Déjeuner", "DÉJEUNER"),
                Triple("soir", "Dîner", "DÎNER"),
                Triple("weekend", "Convivial", "CONVIVIAL")
            )
            tabMeta.mapIndexed { idx, (tabId, tabLabel, badge) ->
                val recipe = recipes[idx % recipes.size]
                DailyMenuPairing(
                    tabId = tabId,
                    tabLabel = tabLabel,
                    badge = badge,
                    title = recipe.name,
                    subtitle = recipe.description?.takeIf { it.isNotBlank() }
                        ?: "Spécialité ${recipe.region.ifBlank { "africaine" }} sélectionnée pour votre table.",
                    mainRecipeId = recipe.id,
                    pairingNote = listOfNotNull(
                        recipe.region.takeIf { it.isNotBlank() },
                        recipe.category.takeIf { it.isNotBlank() }
                    ).joinToString(" • ").ifBlank { "Sélection du jour" },
                    totalMinutesLabel = recipe.prepTime.ifBlank { "20 min" },
                    servingsLabel = "4 pers."
                )
            }
        }
    }

    val defaultIndex = remember {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        when {
            hour < 15 -> 0
            hour < 21 -> 1
            else -> 2
        }
    }
    var selectedTab by remember { mutableIntStateOf(defaultIndex) }
    val activeMenu = menus[selectedTab.coerceIn(0, menus.lastIndex)]
    val mainRecipe = remember(recipes, activeMenu.mainRecipeId) {
        recipes.firstOrNull { it.id == activeMenu.mainRecipeId } ?: recipes.firstOrNull()
    }
    val todayLabel = remember {
        java.text.SimpleDateFormat("EEE d MMM", java.util.Locale.FRENCH)
            .format(java.util.Date())
            .replaceFirstChar { it.uppercase() }
    }

    val cardBg = if (isDark) colorScheme.surface else Color.White
    val widthClass = rememberAfroWindowWidthClass()
    val isTablet = widthClass != AfroWindowWidthClass.COMPACT

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(7.dp)
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_solar_cat_fork_knife_outline),
                    contentDescription = null,
                    tint = titleColor,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = sectionTitle,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = titleColor,
                    modifier = Modifier.nexaTitleEmphasis()
                )
            }
            Surface(
                shape = RoundedCornerShape(50),
                color = AfroOrange.copy(alpha = 0.12f)
            ) {
                Text(
                    text = todayLabel,
                    color = AfroOrange,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (widthClass == AfroWindowWidthClass.EXPANDED) {
            // Landscape tablet: all 3 moments side-by-side with zero stretching and zero side gaps
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                menus.forEachIndexed { idx, menu ->
                    val targetRecipe = recipes.firstOrNull { it.id == menu.mainRecipeId } ?: mainRecipe
                    val companionRecipes = remember(recipes, targetRecipe?.id) {
                        recipes.filter { it.id != targetRecipe?.id }.take(2)
                    }
                    DailyMenuCard(
                        menu = menu,
                        targetRecipe = targetRecipe,
                        companionRecipes = companionRecipes,
                        favoriteIds = favoriteIds,
                        isHighlighted = idx == defaultIndex,
                        cardBg = cardBg,
                        titleColor = titleColor,
                        subtitleColor = subtitleColor,
                        borderColor = borderColor,
                        isDark = isDark,
                        onToggleFavorite = onToggleFavorite,
                        onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                        onNavigateToAiChef = onNavigateToAiChef,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        } else if (isTablet) {
            // Portrait tablet: horizontal strip of full-proportion cards
            val cardData = remember(menus, recipes, mainRecipe) {
                menus.map { menu ->
                    val targetRecipe = recipes.firstOrNull { it.id == menu.mainRecipeId } ?: mainRecipe
                    val companionRecipes = recipes.filter { it.id != targetRecipe?.id }.take(2)
                    Triple(menu, targetRecipe, companionRecipes)
                }
            }
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                itemsIndexed(cardData, key = { _, (m, _, _) -> m.tabId }) { idx, (menu, targetRecipe, companionRecipes) ->
                    DailyMenuCard(
                        menu = menu,
                        targetRecipe = targetRecipe,
                        companionRecipes = companionRecipes,
                        favoriteIds = favoriteIds,
                        isHighlighted = idx == defaultIndex,
                        cardBg = cardBg,
                        titleColor = titleColor,
                        subtitleColor = subtitleColor,
                        borderColor = borderColor,
                        isDark = isDark,
                        onToggleFavorite = onToggleFavorite,
                        onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                        onNavigateToAiChef = onNavigateToAiChef,
                        modifier = Modifier.width(320.dp)
                    )
                }
            }
        } else {
            // Mobile phone: original 3-tab selector + animated single card (unchanged)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(50),
                color = if (isDark) colorScheme.surfaceVariant else Color(0xFFF1EFEA)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    menus.forEachIndexed { idx, item ->
                        val active = idx == selectedTab
                        val tabBg by animateColorAsState(
                            targetValue = if (active) AfroOrange else Color.Transparent,
                            animationSpec = tween(220),
                            label = "dailyMenuTabBg"
                        )
                        val tabText by animateColorAsState(
                            targetValue = if (active) Color.White else subtitleColor,
                            animationSpec = tween(220),
                            label = "dailyMenuTabText"
                        )
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(50))
                                .background(tabBg)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) {
                                    haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    selectedTab = idx
                                }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = item.tabLabel,
                                fontSize = 12.sp,
                                fontWeight = if (active) FontWeight.Bold else FontWeight.SemiBold,
                                color = tabText,
                                maxLines = 1,
                                softWrap = false,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            AnimatedContent(
                targetState = activeMenu,
                transitionSpec = { fadeIn(tween(240)) togetherWith fadeOut(tween(180)) },
                label = "dailyMenuCardTransition"
            ) { menu ->
                val targetRecipe = recipes.firstOrNull { it.id == menu.mainRecipeId } ?: mainRecipe
                val companionRecipes = remember(recipes, targetRecipe?.id) {
                    recipes.filter { it.id != targetRecipe?.id }.take(2)
                }
                DailyMenuCard(
                    menu = menu,
                    targetRecipe = targetRecipe,
                    companionRecipes = companionRecipes,
                    favoriteIds = favoriteIds,
                    isHighlighted = false,
                    cardBg = cardBg,
                    titleColor = titleColor,
                    subtitleColor = subtitleColor,
                    borderColor = borderColor,
                    isDark = isDark,
                    onToggleFavorite = onToggleFavorite,
                    onNavigateToRecipeDetail = onNavigateToRecipeDetail,
                    onNavigateToAiChef = onNavigateToAiChef,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
private fun DailyMenuCard(
    menu: DailyMenuPairing,
    targetRecipe: Recipe?,
    companionRecipes: List<Recipe>,
    favoriteIds: Set<String>,
    isHighlighted: Boolean,
    cardBg: Color,
    titleColor: Color,
    subtitleColor: Color,
    borderColor: Color,
    isDark: Boolean,
    onToggleFavorite: (String) -> Unit,
    onNavigateToRecipeDetail: (String) -> Unit,
    onNavigateToAiChef: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colorScheme = MaterialTheme.colorScheme
    Card(
        onClick = { targetRecipe?.let { onNavigateToRecipeDetail(it.id) } },
        modifier = modifier,
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = cardBg),
        border = if (isHighlighted) {
            BorderStroke(1.5.dp, AfroOrange.copy(alpha = 0.55f))
        } else {
            BorderStroke(1.dp, borderColor)
        },
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    // Top hero media strip
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(166.dp)
                            .padding(10.dp)
                            .clip(RoundedCornerShape(22.dp))
                    ) {
                        AsyncImage(
                            model = targetRecipe?.image,
                            contentDescription = menu.title,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )

                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        colorStops = arrayOf(
                                            0.0f to Color.Black.copy(alpha = 0.20f),
                                            0.5f to Color.Transparent,
                                            1.0f to Color.Black.copy(alpha = 0.72f)
                                        )
                                    )
                                )
                        )

                        // Top-left time & servings pill
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = Color.Black.copy(alpha = 0.56f),
                            modifier = Modifier
                                .align(Alignment.TopStart)
                                .padding(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_stopwatch_linear),
                                    contentDescription = null,
                                    tint = AfroOrange,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = "${menu.totalMinutesLabel} • ${menu.servingsLabel}",
                                    color = Color.White,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // Top-right unified ProductLikeButton
                        if (targetRecipe != null) {
                            ProductLikeButton(
                                isLiked = favoriteIds.contains(targetRecipe.id),
                                onClick = { onToggleFavorite(targetRecipe.id) },
                                buttonSize = 32.dp,
                                iconSize = 17.dp,
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(10.dp)
                            )
                        }

                        // Bottom-left clear dish origin/category
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = AfroOrange,
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(10.dp)
                        ) {
                            Text(
                                text = menu.badge,
                                color = Color.White,
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 0.8.sp,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    // Bottom Editorial Text + Clear Actions
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 16.dp)
                    ) {
                        Text(
                            text = menu.title,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = titleColor,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = menu.subtitle,
                            fontSize = 12.5.sp,
                            lineHeight = 17.5.sp,
                            color = subtitleColor,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(28.dp),
                                color = AfroOrange,
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(28.dp))
                                    .clickable {
                                        targetRecipe?.let { onNavigateToRecipeDetail(it.id) }
                                    }
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 11.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.Restaurant,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Voir la recette",
                                        color = Color.White,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(28.dp),
                                color = if (isDark) colorScheme.surfaceVariant else Color(0xFFF4F1EA),
                                border = BorderStroke(1.dp, borderColor),
                                modifier = Modifier
                                    .clip(RoundedCornerShape(28.dp))
                                    .clickable(onClick = onNavigateToAiChef)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.AutoAwesome,
                                        contentDescription = null,
                                        tint = AfroOrange,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Text(
                                        text = "Adapter",
                                        color = titleColor,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        if (companionRecipes.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(14.dp))
                            HorizontalDivider(color = borderColor.copy(alpha = 0.7f))
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Également au menu aujourd'hui",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = subtitleColor
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                companionRecipes.forEach { companion ->
                                    Surface(
                                        shape = RoundedCornerShape(18.dp),
                                        color = if (isDark) colorScheme.surfaceVariant else Color(0xFFF8F7F4),
                                        border = BorderStroke(1.dp, borderColor),
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(18.dp))
                                            .clickable { onNavigateToRecipeDetail(companion.id) }
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(8.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            AsyncImage(
                                                model = companion.image,
                                                contentDescription = companion.name,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier
                                                    .size(36.dp)
                                                    .clip(RoundedCornerShape(10.dp))
                                            )
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = companion.name,
                                                    fontSize = 11.5.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = titleColor,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                                Text(
                                                    text = companion.prepTime.ifBlank { "20 min" },
                                                    fontSize = 10.sp,
                                                    color = subtitleColor,
                                                    maxLines = 1
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

// ============================================================================
// 2. VOYAGE PAR TERROIRS D'AFRIQUE (Interactive Regional Culinary Atlas)
// ============================================================================

private data class TerroirSpec(
    val id: String,
    val name: String,
    val tagline: String,
    val matchKeyword: String,
    val imageUrl: String,
    val accent: Color
)

private val AFRICAN_TERROIRS = listOf(
    TerroirSpec(
        id = "benin",
        name = "Bénin",
        tagline = "Amiwô, Atassi & sauces royales",
        matchKeyword = "Bénin",
        imageUrl = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80",
        accent = Color(0xFFFB5607)
    ),
    TerroirSpec(
        id = "togo",
        name = "Togo & Lagunes",
        tagline = "Dékoun & poissons fumés",
        matchKeyword = "Togo",
        imageUrl = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
        accent = Color(0xFF0D9488)
    ),
    TerroirSpec(
        id = "niger",
        name = "Niger & Sahel",
        tagline = "Grillades Suya & Kankan",
        matchKeyword = "Niger",
        imageUrl = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
        accent = Color(0xFFD97706)
    ),
    TerroirSpec(
        id = "senegal",
        name = "Sénégal",
        tagline = "Bissap rubis & arômes frais",
        matchKeyword = "Sénégal",
        imageUrl = "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80",
        accent = Color(0xFFE11D48)
    )
)

@Composable
fun HomeTerroirAtlasSection(
    recipes: List<Recipe>,
    favoriteIds: Set<String>,
    onToggleFavorite: (String) -> Unit,
    onNavigateToRecipeDetail: (String) -> Unit,
    titleColor: Color,
    subtitleColor: Color,
    borderColor: Color
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptic = LocalHapticFeedback.current
    var selectedTerroirId by remember { mutableStateOf<String?>(null) }

    val selectedTerroir = AFRICAN_TERROIRS.firstOrNull { it.id == selectedTerroirId }
    val matchingRecipes = remember(recipes, selectedTerroir) {
        if (selectedTerroir == null) emptyList()
        else recipes.filter { it.region.contains(selectedTerroir.matchKeyword, ignoreCase = true) }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(7.dp)
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_globe_linear),
                        contentDescription = null,
                        tint = titleColor,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Voyage par Terroirs",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = titleColor,
                        modifier = Modifier.nexaTitleEmphasis()
                    )
                }
            }
            if (selectedTerroir != null) {
                Text(
                    text = "Fermer",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = AfroOrange,
                    modifier = Modifier.clickable { selectedTerroirId = null }
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
                items = AFRICAN_TERROIRS,
                key = { it.id },
                contentType = { "terroir_card" }
            ) { terroir ->
                val isSelected = selectedTerroirId == terroir.id
                val count = recipes.count { it.region.contains(terroir.matchKeyword, ignoreCase = true) }
                val scale by animateFloatAsState(
                    targetValue = if (isSelected) 1.03f else 1f,
                    animationSpec = spring(dampingRatio = 0.78f, stiffness = Spring.StiffnessMediumLow),
                    label = "terroirCardScale"
                )

                Card(
                    onClick = {
                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        selectedTerroirId = if (isSelected) null else terroir.id
                    },
                    modifier = Modifier
                        .width(156.dp)
                        .height(168.dp)
                        .graphicsLayer {
                            scaleX = scale
                            scaleY = scale
                        },
                    shape = RoundedCornerShape(28.dp),
                    border = BorderStroke(
                        width = if (isSelected) 2.dp else 1.dp,
                        color = if (isSelected) terroir.accent else Color.White.copy(alpha = 0.25f)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        AsyncImage(
                            model = terroir.imageUrl,
                            contentDescription = terroir.name,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        colorStops = arrayOf(
                                            0.0f to Color.Black.copy(alpha = 0.12f),
                                            0.48f to terroir.accent.copy(alpha = 0.22f),
                                            1.0f to Color.Black.copy(alpha = 0.88f)
                                        )
                                    )
                                )
                        )

                        Surface(
                            shape = RoundedCornerShape(50),
                            color = Color.Black.copy(alpha = 0.45f),
                            modifier = Modifier
                                .align(Alignment.TopStart)
                                .padding(10.dp)
                        ) {
                            Text(
                                text = "$count ${if (count > 1) "plats" else "plat"}",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                            )
                        }

                        Column(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .fillMaxWidth()
                                .padding(14.dp)
                        ) {
                            Text(
                                text = terroir.name,
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                maxLines = 1
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = terroir.tagline,
                                color = Color.White.copy(alpha = 0.86f),
                                fontSize = 10.5.sp,
                                lineHeight = 13.5.sp,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }

        // Smooth inline regional discovery tray when a terroir is tapped
        AnimatedVisibility(
            visible = selectedTerroir != null && matchingRecipes.isNotEmpty(),
            enter = expandVertically(tween(260)) + fadeIn(tween(220)),
            exit = shrinkVertically(tween(200)) + fadeOut(tween(160))
        ) {
            selectedTerroir?.let { terroir ->
                Surface(
                    shape = RoundedCornerShape(28.dp),
                    color = if (isDark) colorScheme.surface else Color.White,
                    border = BorderStroke(1.dp, borderColor),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 20.dp, end = 20.dp, top = 12.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(
                            text = "Spécialités • ${terroir.name}",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = terroir.accent
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        matchingRecipes.forEachIndexed { idx, recipe ->
                            if (idx > 0) {
                                HorizontalDivider(
                                    thickness = 0.7.dp,
                                    color = borderColor.copy(alpha = 0.7f),
                                    modifier = Modifier.padding(vertical = 8.dp)
                                )
                            }
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .clickable { onNavigateToRecipeDetail(recipe.id) },
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AsyncImage(
                                    model = recipe.image,
                                    contentDescription = recipe.name,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(54.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = recipe.name,
                                        modifier = Modifier.nexaTitleEmphasis(),
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = titleColor,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "${recipe.prepTime} • ${recipe.difficulty} • ★ ${String.format(Locale.FRANCE, "%.1f", recipe.rating)}",
                                        fontSize = 11.sp,
                                        color = subtitleColor
                                    )
                                }
                                ProductLikeButton(
                                    isLiked = favoriteIds.contains(recipe.id),
                                    onClick = { onToggleFavorite(recipe.id) },
                                    buttonSize = 28.dp,
                                    iconSize = 15.dp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ============================================================================
// 3. PRÊT EN UN ÉCLAIR (Horizontal Quick-Cook Carousel)
// ============================================================================

@Composable
fun HomeExpressRecipesSection(
    recipes: List<Recipe>,
    favoriteIds: Set<String>,
    onToggleFavorite: (String) -> Unit,
    onNavigateToRecipeDetail: (String) -> Unit,
    onNavigateToRecipes: () -> Unit,
    titleColor: Color,
    subtitleColor: Color,
    borderColor: Color,
    sectionTitle: String = "Prêt en un éclair"
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val cardBg = if (isDark) colorScheme.surface else Color.White

    val expressSorted = remember(recipes) {
        recipes.sortedBy { recipe ->
            Regex("(\\d+)").find(recipe.prepTime)?.groupValues?.getOrNull(1)?.toIntOrNull() ?: 30
        }
    }

    if (expressSorted.isEmpty()) return

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_solar_stopwatch_linear),
                    contentDescription = null,
                    tint = titleColor,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = sectionTitle,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = titleColor,
                    modifier = Modifier.nexaTitleEmphasis()
                )
            }
            Text(
                text = "Voir tout",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = AfroOrange,
                modifier = Modifier.clickable(onClick = onNavigateToRecipes)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyRow(
            contentPadding = PaddingValues(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            flingBehavior = rememberSmoothFlingBehavior()
        ) {
            items(
                items = expressSorted,
                key = { "express_${it.id}" },
                contentType = { "express_recipe_card" }
            ) { recipe ->
                Card(
                    onClick = { onNavigateToRecipeDetail(recipe.id) },
                    modifier = Modifier
                        .width(288.dp)
                        .height(106.dp),
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = cardBg),
                    border = BorderStroke(1.dp, borderColor),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(86.dp)
                                .clip(RoundedCornerShape(20.dp))
                        ) {
                            AsyncImage(
                                model = recipe.image,
                                contentDescription = recipe.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                            ProductLikeButton(
                                isLiked = favoriteIds.contains(recipe.id),
                                onClick = { onToggleFavorite(recipe.id) },
                                buttonSize = 24.dp,
                                iconSize = 13.dp,
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(5.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.Center
                        ) {
                            Surface(
                                shape = RoundedCornerShape(50),
                                color = AfroOrange.copy(alpha = if (isDark) 0.22f else 0.12f)
                            ) {
                                Text(
                                    text = "${recipe.prepTime} • ${recipe.difficulty}",
                                    color = AfroOrange,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(5.dp))

                            Text(
                                text = recipe.name,
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = titleColor,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )

                            Spacer(modifier = Modifier.height(2.dp))

                            Text(
                                text = recipe.region,
                                fontSize = 11.sp,
                                color = subtitleColor,
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

// ============================================================================
// 4. SECRETS DU TERROIR & GESTES DE CHEF (Interactive Masterclass Cards)
// ============================================================================

private data class ChefSecretSpec(
    val id: String,
    val tag: String,
    val title: String,
    val preview: String,
    val fullTechnique: String,
    val diasporaSubstitute: String,
    val linkedRecipeId: String?,
    val linkedRecipeLabel: String,
    val bgStart: Color,
    val bgEnd: Color
)

private val CHEF_SECRETS = listOf(
    ChefSecretSpec(
        id = "amiwo_smooth",
        tag = "GESTE DE CHEF",
        title = "Amiwô velouté sans grumeaux",
        preview = "Versez la farine en pluie fine sur bouillon frémissant, jamais à gros bouillons.",
        fullTechnique = "Filtrez soigneusement le bouillon tomaté, baissez à léger frémissement et délayez 3 c. à soupe de farine dans un peu de bouillon tiède avant d'incorporer le reste en pluie continue à la spatule en bois.",
        diasporaSubstitute = "Hors d'Afrique : remplacez la farine de maïs locale par de la polenta très fine ou de la farine de maïs PAN blanche précuite.",
        linkedRecipeId = "P02",
        linkedRecipeLabel = "Ouvrir la recette Amiwô",
        bgStart = Color(0xFF1F1B18),
        bgEnd = Color(0xFF3A2314)
    ),
    ChefSecretSpec(
        id = "piment_control",
        tag = "ART DES ÉPICES",
        title = "Parfumer au piment sans brûler",
        preview = "Un piment frais entier non percé libère tout son parfum fruité en douceur.",
        fullTechnique = "Déposez un piment habanero frais et intact dans votre sauce les 10 dernières minutes de cuisson sans jamais l'écraser. Retirez-le au service ou écrasez-le à part en pimentade pour les amateurs de feu.",
        diasporaSubstitute = "Alternative douce : utilisez du piment végétarien antillais (aji dulce) qui offre exactement le même bouquet aromatique sans piquant.",
        linkedRecipeId = null,
        linkedRecipeLabel = "Poser une question au Chef IA",
        bgStart = Color(0xFF2B1418),
        bgEnd = Color(0xFF5A1D24)
    ),
    ChefSecretSpec(
        id = "dekoun_velvet",
        tag = "SAUCE GRAINE",
        title = "Obtenir la brillance du Dékoun",
        preview = "Laissez frémir à découvert en fin de cuisson pour révéler l'huile rouge naturelle.",
        fullTechnique = "Portez d'abord l'extrait de noix de palme dilué à bonne ébullition 20 minutes jusqu'à apparition d'un fin voile d'huile rouge, puis ajoutez le gombo uniquement sur les 8 dernières minutes à découvert.",
        diasporaSubstitute = "En épicerie exotique : privilégiez la crème de noix de palme 100 % pure en boîte (sauce graine) diluée à l'eau tiède et filtrée.",
        linkedRecipeId = "S05",
        linkedRecipeLabel = "Ouvrir la recette Dékoun",
        bgStart = Color(0xFF132623),
        bgEnd = Color(0xFF1F423B)
    ),
    ChefSecretSpec(
        id = "atassi_gold",
        tag = "ASTUCE EXPRESS",
        title = "La teinte dorée de l'Atassi",
        preview = "Cuisez le riz directement dans le bouillon parfumé des haricots.",
        fullTechnique = "Conservez l'eau de cuisson riche des haricots œil noir, ajoutez une pincée de potasse naturelle (ou une pointe de bicarbonate alimentaire) et laissez le riz absorber tout le jus à couvert hors du feu 5 minutes.",
        diasporaSubstitute = "Astuce rapide semaine : les haricots cornille (black-eyed peas) en bocal rincés + un trait de bouillon réduisent la cuisson à 15 min.",
        linkedRecipeId = "P11",
        linkedRecipeLabel = "Ouvrir la recette Atassi",
        bgStart = Color(0xFF1D2231),
        bgEnd = Color(0xFF2D3550)
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeChefSecretsSection(
    onNavigateToRecipeDetail: (String) -> Unit,
    onNavigateToAiChef: () -> Unit,
    titleColor: Color,
    subtitleColor: Color
) {
    val haptic = LocalHapticFeedback.current
    var activeSecret by remember { mutableStateOf<ChefSecretSpec?>(null) }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(7.dp)
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_cat_flame_outline),
                        contentDescription = null,
                        tint = titleColor,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Secrets du Terroir",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = titleColor,
                        modifier = Modifier.nexaTitleEmphasis()
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyRow(
            contentPadding = PaddingValues(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            flingBehavior = rememberSmoothFlingBehavior()
        ) {
            items(
                items = CHEF_SECRETS,
                key = { it.id },
                contentType = { "chef_secret_card" }
            ) { secret ->
                Card(
                    onClick = {
                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        activeSecret = secret
                    },
                    modifier = Modifier
                        .width(252.dp)
                        .height(164.dp),
                    shape = RoundedCornerShape(28.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.linearGradient(listOf(secret.bgStart, secret.bgEnd))
                            )
                            .padding(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(50),
                                    color = AfroOrange.copy(alpha = 0.24f)
                                ) {
                                    Text(
                                        text = secret.tag,
                                        color = AfroOrangeLight,
                                        fontSize = 9.5.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        letterSpacing = 0.8.sp,
                                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Rounded.ChevronRight,
                                    contentDescription = null,
                                    tint = Color.White.copy(alpha = 0.75f),
                                    modifier = Modifier.size(18.dp)
                                )
                            }

                            Column {
                                Text(
                                    text = secret.title,
                                    color = Color.White,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    lineHeight = 19.sp,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = secret.preview,
                                    color = Color.White.copy(alpha = 0.78f),
                                    fontSize = 11.5.sp,
                                    lineHeight = 15.sp,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Interactive Masterclass Detail Bottom Sheet
    activeSecret?.let { secret ->
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        val colorScheme = MaterialTheme.colorScheme
        val isDark = isAfroDarkTheme()

        ModalBottomSheet(
            onDismissRequest = { activeSecret = null },
            sheetState = sheetState,
            containerColor = if (isDark) colorScheme.surface else Color.White,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 22.dp)
                    .padding(bottom = 24.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(50),
                    color = AfroOrange.copy(alpha = 0.14f)
                ) {
                    Text(
                        text = secret.tag,
                        color = AfroOrange,
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.8.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = secret.title,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = titleColor
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = secret.fullTechnique,
                    fontSize = 14.sp,
                    lineHeight = 21.sp,
                    color = titleColor.copy(alpha = 0.88f)
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Diaspora substitute callout card
                Surface(
                    shape = RoundedCornerShape(22.dp),
                    color = if (isDark) colorScheme.surfaceVariant else Color(0xFFFFF6F0),
                    border = BorderStroke(1.dp, AfroOrange.copy(alpha = 0.25f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.SwapHoriz,
                            contentDescription = null,
                            tint = AfroOrange,
                            modifier = Modifier
                                .padding(top = 2.dp)
                                .size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Alternative Diaspora",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = AfroOrange
                            )
                            Spacer(modifier = Modifier.height(3.dp))
                            Text(
                                text = secret.diasporaSubstitute,
                                fontSize = 13.sp,
                                lineHeight = 18.5.sp,
                                color = titleColor.copy(alpha = 0.86f)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                Surface(
                    shape = RoundedCornerShape(50),
                    color = AfroOrange,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(50))
                        .clickable {
                            val targetId = secret.linkedRecipeId
                            activeSecret = null
                            if (targetId != null) {
                                onNavigateToRecipeDetail(targetId)
                            } else {
                                onNavigateToAiChef()
                            }
                        }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 13.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = secret.linkedRecipeLabel,
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(
                            imageVector = Icons.Rounded.ChevronRight,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

// ============================================================================
// 5. DÉFI CULINAIRE DE LA SEMAINE & PASSERELLES ÉCOSYSTÈME
// ============================================================================

@Composable
fun HomeWeeklyChallengeSection(
    onNavigateToRecipeDetail: (String) -> Unit,
    onNavigateToCommunity: () -> Unit,
    onNavigateToMarket: () -> Unit,
    titleColor: Color,
    subtitleColor: Color,
    borderColor: Color
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptic = LocalHapticFeedback.current
    var hasJoinedChallenge by remember { mutableStateOf(false) }

    val participantCount = if (hasJoinedChallenge) 143 else 142
    val progressTarget = if (hasJoinedChallenge) 0.78f else 0.71f
    val animatedProgress by animateFloatAsState(
        targetValue = progressTarget,
        animationSpec = spring(dampingRatio = 0.82f, stiffness = Spring.StiffnessLow),
        label = "challengeProgress"
    )

    val cardBg = if (isDark) colorScheme.surface else Color.White

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Weekly Community Cooking Challenge Card (28.dp)
        Card(
            onClick = { onNavigateToRecipeDetail("P02") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg),
            border = BorderStroke(1.dp, borderColor),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(AfroOrange.copy(alpha = 0.14f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.EmojiEvents,
                                contentDescription = null,
                                tint = AfroOrange,
                                modifier = Modifier.size(19.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "DÉFI DE LA SEMAINE",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 0.8.sp,
                                color = AfroOrange
                            )
                            Text(
                                text = "Maîtrisez l'Amiwô Royal",
                                fontSize = 15.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = titleColor,
                                modifier = Modifier.nexaTitleEmphasis()
                            )
                        }
                    }

                    // Overlapping community chef avatars
                    Box(modifier = Modifier.width(66.dp).height(28.dp)) {
                        val avatars = listOf(
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80",
                            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
                            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80"
                        )
                        avatars.forEachIndexed { i, url ->
                            AsyncImage(
                                model = url,
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .offset(x = (i * 18).dp)
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .border(1.5.dp, cardBg, CircleShape)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Préparez l'Amiwô béninois cette semaine et partagez votre dressage avec la communauté AfroCuisto.",
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    color = subtitleColor
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "$participantCount cuisiniers participent",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = titleColor
                    )
                    Text(
                        text = "Objectif : 200 plats",
                        fontSize = 11.sp,
                        color = subtitleColor
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Seamless custom rounded gradient progress bar (avoids M3 gap & trailing dot artifact)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(50))
                        .background(AfroOrange.copy(alpha = 0.14f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(animatedProgress.coerceIn(0.05f, 1f))
                            .clip(RoundedCornerShape(50))
                            .background(
                                Brush.horizontalGradient(
                                    listOf(AfroOrange, AfroOrangeLight)
                                )
                            )
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    val ctaBg by animateColorAsState(
                        targetValue = if (hasJoinedChallenge) Color(0xFF10B981) else AfroOrange,
                        animationSpec = tween(250),
                        label = "challengeCtaBg"
                    )
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = ctaBg,
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(50))
                            .clickable {
                                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                hasJoinedChallenge = !hasJoinedChallenge
                            }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 10.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = if (hasJoinedChallenge) Icons.Rounded.Check else Icons.Rounded.Verified,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (hasJoinedChallenge) "Défi accepté" else "Relever le défi",
                                color = Color.White,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(50),
                        color = if (isDark) colorScheme.surfaceVariant else Color(0xFFF4F1EA),
                        border = BorderStroke(1.dp, borderColor),
                        modifier = Modifier
                            .clip(RoundedCornerShape(50))
                            .clickable(onClick = onNavigateToCommunity)
                    ) {
                        Text(
                            text = "Communauté",
                            color = titleColor,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
                        )
                    }
                }
            }
        }

        // Clean Ecosystem Quick-Shortcut Strip (Marché des épices)
        Card(
            onClick = onNavigateToMarket,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg),
            border = BorderStroke(1.dp, borderColor),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(AfroOrange.copy(alpha = 0.13f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_bag_bold),
                        contentDescription = null,
                        tint = AfroOrange,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Marché & Épices du Terroir",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = titleColor
                    )
                    Text(
                        text = "Poudre Kankan, fleurs d'hibiscus, huile rouge & liste de courses",
                        fontSize = 11.5.sp,
                        color = subtitleColor,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Icon(
                    imageVector = Icons.Rounded.ChevronRight,
                    contentDescription = null,
                    tint = subtitleColor,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

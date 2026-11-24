package com.afrocuisto.app.ui.screens.recipe

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.afrocuisto.app.data.repository.RecipeRepository
import com.afrocuisto.app.ui.components.EditorialPageHeader
import com.afrocuisto.app.ui.components.EditorialSearchBar
import com.afrocuisto.app.ui.components.afroStaggeredEntrance
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.screens.home.SunRecipeCard
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import java.util.Locale

private val RECIPE_FILTER_TABS = listOf("Tout", "Sauces", "Pâtes", "Grillades")

@Composable
fun RecipeListScreen(
    onNavigateToRecipeDetail: (String) -> Unit,
    repository: RecipeRepository = remember { RecipeRepository() }
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptics = rememberAfroHaptics()
    val recipes by repository.recipes.collectAsState(initial = emptyList())
    val favoriteIds by repository.favoriteIds.collectAsState(initial = emptySet())

    var searchQuery by remember { mutableStateOf("") }
    var selectedTab by remember { mutableStateOf("Tout") }

    val filteredRecipes = remember(recipes, searchQuery, selectedTab) {
        recipes.filter { recipe ->
            val q = searchQuery.trim()
            val matchesQuery = q.isBlank() ||
                recipe.name.contains(q, ignoreCase = true) ||
                recipe.region.contains(q, ignoreCase = true) ||
                recipe.category.contains(q, ignoreCase = true) ||
                recipe.ingredients.any { it.name.contains(q, ignoreCase = true) }

            val catLower = recipe.category.lowercase(Locale.FRENCH)
            val matchesTab = when (selectedTab) {
                "Tout" -> true
                "Sauces" -> catLower.contains("sauce") || catLower.contains("potage")
                "Pâtes" -> catLower.contains("pâte") || catLower.contains("pate") || catLower.contains("céréale")
                "Grillades" -> catLower.contains("grillade") || catLower.contains("viande")
                else -> true
            }
            matchesQuery && matchesTab
        }
    }

    val canvasBg = if (isDark) colorScheme.background else Color(0xFFF8F9FA)
    val titleColor = if (isDark) colorScheme.onBackground else Color(0xFF1E1E2D)
    val placeholderColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF94A3B8)
    val segTrackColor = if (isDark) colorScheme.surfaceVariant else Color(0xFFF1F2F6)
    val segActiveBg = if (isDark) colorScheme.surface else Color.White
    val segInactiveText = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF8F92A1)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(canvasBg)
    ) {
        EditorialPageHeader(title = "Toutes les recettes") {
            EditorialSearchBar(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = "Plat, pays ou ingrédient..."
            )

            Spacer(modifier = Modifier.height(14.dp))

            AppleSlidingSegmentedFilter(
                tabs = RECIPE_FILTER_TABS,
                selectedTab = selectedTab,
                onTabSelected = { tab ->
                    if (tab != selectedTab) {
                        haptics.selectionTick()
                        selectedTab = tab
                    }
                },
                trackColor = segTrackColor,
                activePillColor = segActiveBg,
                activeTextColor = titleColor,
                inactiveTextColor = segInactiveText
            )
        }

        if (filteredRecipes.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 120.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Aucune recette trouvée",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = titleColor
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Essayez un autre plat, pays ou ingrédient",
                        fontSize = 13.sp,
                        color = placeholderColor
                    )
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 4.dp, bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                flingBehavior = rememberSmoothFlingBehavior(),
                modifier = Modifier.fillMaxSize()
            ) {
                itemsIndexed(
                    items = filteredRecipes,
                    key = { _, recipe -> recipe.id },
                    contentType = { _, _ -> "recipe_card" }
                ) { index, recipe ->
                    Box(
                        modifier = Modifier
                            .animateItem(
                                fadeInSpec = tween(220),
                                placementSpec = spring(
                                    dampingRatio = 0.78f,
                                    stiffness = Spring.StiffnessMediumLow
                                ),
                                fadeOutSpec = tween(160)
                            )
                            .afroStaggeredEntrance(index = index, triggerKey = selectedTab)
                    ) {
                        SunRecipeCard(
                            recipe = recipe,
                            isFavorite = favoriteIds.contains(recipe.id),
                            onToggleFavorite = { repository.toggleFavorite(recipe.id) },
                            onClick = { onNavigateToRecipeDetail(recipe.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AppleSlidingSegmentedFilter(
    tabs: List<String>,
    selectedTab: String,
    onTabSelected: (String) -> Unit,
    trackColor: Color,
    activePillColor: Color,
    activeTextColor: Color,
    inactiveTextColor: Color,
    modifier: Modifier = Modifier
) {
    val selectedIndex = tabs.indexOf(selectedTab).coerceAtLeast(0)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .height(42.dp),
        shape = RoundedCornerShape(16.dp),
        color = trackColor
    ) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .padding(4.dp)
        ) {
            val tabWidth = maxWidth / tabs.size
            val indicatorOffset by animateDpAsState(
                targetValue = tabWidth * selectedIndex,
                animationSpec = spring(
                    dampingRatio = 0.76f,
                    stiffness = Spring.StiffnessMedium
                ),
                label = "appleSegmentSlide"
            )

            Surface(
                modifier = Modifier
                    .offset(x = indicatorOffset)
                    .width(tabWidth)
                    .fillMaxHeight(),
                shape = RoundedCornerShape(13.dp),
                color = activePillColor,
                shadowElevation = 2.dp
            ) {}

            Row(modifier = Modifier.fillMaxSize()) {
                tabs.forEach { tab ->
                    val isSelected = tab == selectedTab
                    val interactionSource = remember { MutableInteractionSource() }
                    val isPressed by interactionSource.collectIsPressedAsState()
                    val labelScale by animateFloatAsState(
                        targetValue = when {
                            isPressed -> 0.92f
                            isSelected -> 1.03f
                            else -> 1f
                        },
                        animationSpec = spring(
                            dampingRatio = 0.65f,
                            stiffness = Spring.StiffnessMedium
                        ),
                        label = "segmentLabelScale"
                    )
                    val textColor by animateColorAsState(
                        targetValue = if (isSelected) activeTextColor else inactiveTextColor,
                        animationSpec = tween(durationMillis = 200, easing = FastOutSlowInEasing),
                        label = "appleSegmentText"
                    )

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clip(RoundedCornerShape(13.dp))
                            .clickable(
                                interactionSource = interactionSource,
                                indication = null
                            ) { onTabSelected(tab) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = tab,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = textColor,
                            maxLines = 1,
                            modifier = Modifier.graphicsLayer {
                                scaleX = labelScale
                                scaleY = labelScale
                            }
                        )
                    }
                }
            }
        }
    }
}

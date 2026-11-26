package com.afrocuisto.app.ui.screens.recipe

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.filled.RestaurantMenu
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.lazy.grid.itemsIndexed
import com.afrocuisto.app.data.repository.RecipeRepository
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.AfroPullToRefreshBox
import com.afrocuisto.app.ui.components.adaptiveGridColumns
import com.afrocuisto.app.ui.components.rememberAfroWindowWidthClass
import com.afrocuisto.app.ui.components.EditorialSearchBar
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.afroStaggeredEntrance
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.screens.home.HOME_CATEGORIES
import com.afrocuisto.app.ui.screens.home.SunRecipeCard
import com.afrocuisto.app.ui.screens.home.categoryMatchesRecipe
import com.afrocuisto.app.ui.screens.home.findCategorySpec
import com.afrocuisto.app.ui.theme.isAfroDarkTheme

@Composable
fun CategoryRecipesScreen(
    categoryId: String,
    onBack: () -> Unit,
    onNavigateToRecipeDetail: (String) -> Unit,
    repository: RecipeRepository = remember { RecipeRepository() }
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val recipes by repository.recipes.collectAsState(initial = emptyList())
    val favoriteIds by repository.favoriteIds.collectAsState(initial = emptySet())

    val categorySpec = remember(categoryId) {
        findCategorySpec(categoryId) ?: HOME_CATEGORIES.first()
    }

    var searchQuery by remember { mutableStateOf("") }

    val categoryRecipes = remember(recipes, categorySpec.id, searchQuery) {
        val base = recipes.filter { categoryMatchesRecipe(categorySpec.id, it) }
        val q = searchQuery.trim()
        if (q.isBlank()) {
            base
        } else {
            base.filter { recipe ->
                recipe.name.contains(q, ignoreCase = true) ||
                    recipe.region.contains(q, ignoreCase = true) ||
                    recipe.ingredients.any { it.name.contains(q, ignoreCase = true) }
            }
        }
    }

    val canvasBg = if (isDark) colorScheme.background else Color(0xFFF8F9FA)
    val titleColor = if (isDark) colorScheme.onBackground else Color(0xFF1E1E2D)
    val subtitleColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF64748B)
    val placeholderColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF94A3B8)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(canvasBg)
    ) {
        // Dedicated Category Hero Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp)
                .clip(RoundedCornerShape(28.dp))
                .background(
                    Brush.linearGradient(
                        colors = listOf(categorySpec.gradientStart, categorySpec.gradientEnd)
                    )
                )
        ) {
            // Subtle top-left highlight glow matching Home category cards
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.24f),
                                Color.Transparent
                            ),
                            radius = 360f
                        )
                    )
            )

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
                    Surface(
                        shape = CircleShape,
                        color = Color.White.copy(alpha = 0.22f),
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .afroSpringClickable(
                                pressedScale = 0.85f,
                                haptic = AfroHapticKind.NONE,
                                onClick = onBack
                            )
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                                contentDescription = "Retour",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(50),
                        color = Color.White.copy(alpha = 0.22f)
                    ) {
                        Text(
                            text = "${categoryRecipes.size} ${if (categoryRecipes.size > 1) "recettes" else "recette"}",
                            color = Color.White,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(18.dp),
                        color = Color.White.copy(alpha = 0.20f),
                        modifier = Modifier.size(54.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                painter = painterResource(id = categorySpec.iconRes),
                                contentDescription = categorySpec.label,
                                tint = Color.White,
                                modifier = Modifier.size(34.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = categorySpec.label,
                            color = Color.White,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.ExtraBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = categorySpec.subtitle,
                            color = Color.White.copy(alpha = 0.90f),
                            fontSize = 12.sp,
                            lineHeight = 16.sp,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }

        // Category-scoped search bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 4.dp)
        ) {
            EditorialSearchBar(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = "Rechercher dans ${categorySpec.label}..."
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        AfroPullToRefreshBox(
            onRefresh = { repository.refreshFromSupabase() },
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
        if (categoryRecipes.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp, vertical = 32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.RestaurantMenu,
                        contentDescription = null,
                        tint = placeholderColor,
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Aucun plat trouvé",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = titleColor
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (searchQuery.isBlank()) {
                            "Cette catégorie sera bientôt enrichie."
                        } else {
                            "Essayez un autre mot-clé dans ${categorySpec.label}."
                        },
                        fontSize = 13.sp,
                        color = subtitleColor
                    )
                }
            }
        } else {
            val gridColumns = adaptiveGridColumns(rememberAfroWindowWidthClass())
            LazyVerticalGrid(
                columns = GridCells.Fixed(gridColumns),
                contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 4.dp, bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                flingBehavior = rememberSmoothFlingBehavior(),
                modifier = Modifier.fillMaxSize()
            ) {
                itemsIndexed(
                    items = categoryRecipes,
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
                            .afroStaggeredEntrance(index = index, triggerKey = categorySpec.id)
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
}

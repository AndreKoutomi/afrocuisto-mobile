package com.afrocuisto.app.ui.screens.favorites

import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior

import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.afrocuisto.app.R
import com.afrocuisto.app.data.repository.RecipeRepository
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.lazy.grid.itemsIndexed
import com.afrocuisto.app.ui.components.EditorialPageHeader
import com.afrocuisto.app.ui.components.EditorialSearchBar
import com.afrocuisto.app.ui.components.afroStaggeredEntrance
import com.afrocuisto.app.ui.screens.home.SunRecipeCard
import com.afrocuisto.app.ui.theme.isAfroDarkTheme

@Composable
fun FavoritesScreen(
    onNavigateToRecipeDetail: (String) -> Unit,
    repository: RecipeRepository = remember { RecipeRepository() }
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val recipes by repository.recipes.collectAsState(initial = emptyList())
    val favoriteIds by repository.favoriteIds.collectAsState(initial = emptySet())

    var searchQuery by remember { mutableStateOf("") }

    val favoriteRecipes = remember(recipes, favoriteIds, searchQuery) {
        val q = searchQuery.trim()
        recipes.filter { recipe ->
            favoriteIds.contains(recipe.id) && (
                q.isBlank() ||
                    recipe.name.contains(q, ignoreCase = true) ||
                    recipe.region.contains(q, ignoreCase = true) ||
                    recipe.category.contains(q, ignoreCase = true)
                )
        }
    }

    val canvasBg = if (isDark) colorScheme.background else Color(0xFFF8F9FA)
    val titleColor = if (isDark) colorScheme.onBackground else Color(0xFF1E1E2D)
    val placeholderColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF94A3B8)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(canvasBg)
    ) {
        EditorialPageHeader(title = "Mes favoris") {
            EditorialSearchBar(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = "Rechercher un favori..."
            )
        }

        if (favoriteRecipes.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 120.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_bookmark_linear),
                        contentDescription = null,
                        tint = placeholderColor,
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = if (searchQuery.isBlank()) {
                            "Aucun favori enregistré"
                        } else {
                            "Aucun favori trouvé"
                        },
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = titleColor
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Enregistrez vos plats préférés pour les retrouver ici",
                        fontSize = 12.5.sp,
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
                    items = favoriteRecipes,
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
                                fadeOutSpec = tween(180)
                            )
                            .afroStaggeredEntrance(index = index)
                    ) {
                        SunRecipeCard(
                            recipe = recipe,
                            isFavorite = true,
                            onToggleFavorite = { repository.toggleFavorite(recipe.id) },
                            onClick = { onNavigateToRecipeDetail(recipe.id) }
                        )
                    }
                }
            }
        }
    }
}

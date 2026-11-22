package com.afrocuisto.app.ui.screens.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocalCafe
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.OutdoorGrill
import androidx.compose.material.icons.filled.RestaurantMenu
import androidx.compose.material.icons.filled.RiceBowl
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SoupKitchen
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.afrocuisto.app.data.model.Recipe
import com.afrocuisto.app.data.repository.RecipeRepository
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.DifficultyEasy
import com.afrocuisto.app.ui.theme.DifficultyHard
import com.afrocuisto.app.ui.theme.DifficultyMedium
import java.util.Locale

data class CategoryRailItem(
    val id: String,
    val name: String,
    val icon: ImageVector
)

val HOME_CATEGORIES = listOf(
    CategoryRailItem("popular", "Populaires", Icons.Default.LocalFireDepartment),
    CategoryRailItem("sauce", "Sauces", Icons.Default.SoupKitchen),
    CategoryRailItem("pate", "Pâtes", Icons.Default.RiceBowl),
    CategoryRailItem("grill", "Grillades", Icons.Default.OutdoorGrill),
    CategoryRailItem("boisson", "Boissons", Icons.Default.LocalCafe)
)

@Composable
fun HomeScreen(
    onNavigateToRecipeDetail: (String) -> Unit,
    onNavigateToAiChef: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToRecipes: () -> Unit,
    repository: RecipeRepository = remember { RecipeRepository() }
) {
    val colorScheme = MaterialTheme.colorScheme
    val recipes by repository.recipes.collectAsState(initial = emptyList())
    val favoriteIds by repository.favoriteIds.collectAsState(initial = emptySet())
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("popular") }

    val popularRecipes = remember(recipes) { recipes.sortedByDescending { it.rating } }

    val filteredRecipes = remember(recipes, searchQuery, selectedCategory) {
        recipes.filter { r ->
            val matchesSearch = searchQuery.isBlank() ||
                r.name.contains(searchQuery, ignoreCase = true) ||
                r.region.contains(searchQuery, ignoreCase = true)
            val matchesCategory = selectedCategory == "popular" ||
                r.category.contains(selectedCategory, ignoreCase = true)
            matchesSearch && matchesCategory
        }
    }

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorScheme.background)
            .statusBarsPadding()
            .verticalScroll(scrollState)
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        // 1. Editorial Top Bar (Monogram Avatar + Notification Bell)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(RoundedCornerShape(24.dp))
                    .clickable { onNavigateToProfile() }
                    .padding(end = 8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(colorScheme.primaryContainer)
                        .border(1.5.dp, colorScheme.primary.copy(alpha = 0.25f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "AC",
                        color = colorScheme.primary,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "GASTRONOMIE AFRICAINE",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.sp,
                        color = colorScheme.primary
                    )
                    Text(
                        text = "AfroCuisto",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = colorScheme.onBackground
                    )
                }
            }

            Box {
                IconButton(
                    onClick = onNavigateToProfile,
                    modifier = Modifier
                        .size(42.dp)
                        .background(colorScheme.surface, CircleShape)
                        .border(1.dp, colorScheme.outline, CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = "Notifications",
                        tint = colorScheme.onSurface,
                        modifier = Modifier.size(19.dp)
                    )
                }

                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(top = 9.dp, end = 9.dp)
                        .size(8.dp)
                        .background(colorScheme.primary, CircleShape)
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 2. Editorial Headline
        Column(modifier = Modifier.padding(horizontal = 20.dp)) {
            Text(
                text = buildAnnotatedString {
                    append("Que cuisiner\n")
                    withStyle(style = SpanStyle(color = colorScheme.primary, fontWeight = FontWeight.Black)) {
                        append("aujourd'hui ?")
                    }
                },
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                lineHeight = 34.sp,
                letterSpacing = (-0.6).sp,
                color = colorScheme.onBackground
            )
        }

        Spacer(modifier = Modifier.height(18.dp))

        // 3. Search Bar + Chef IA Quick Action
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text(
                        text = "Chercher un plat, une région...",
                        fontSize = 14.sp,
                        color = colorScheme.onSurfaceVariant
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Rechercher",
                        tint = colorScheme.primary
                    )
                },
                trailingIcon = {
                    if (searchQuery.isNotBlank()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Effacer",
                                tint = colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                shape = RoundedCornerShape(18.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colorScheme.primary,
                    unfocusedBorderColor = colorScheme.outline,
                    focusedContainerColor = colorScheme.surface,
                    unfocusedContainerColor = colorScheme.surface
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.width(10.dp))

            Surface(
                shape = RoundedCornerShape(18.dp),
                color = colorScheme.primary,
                shadowElevation = 4.dp,
                modifier = Modifier
                    .size(54.dp)
                    .clickable { onNavigateToAiChef() }
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = "Frigo Magique IA",
                        tint = colorScheme.onPrimary,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(22.dp))

        // 4. Category Rail
        LazyRow(
            contentPadding = PaddingValues(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            items(HOME_CATEGORIES) { cat ->
                val isSelected = selectedCategory == cat.id

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.clickable { selectedCategory = cat.id }
                ) {
                    Surface(
                        modifier = Modifier.size(56.dp),
                        shape = CircleShape,
                        color = if (isSelected) colorScheme.primary else colorScheme.surface,
                        border = BorderStroke(
                            1.dp,
                            if (isSelected) colorScheme.primary else colorScheme.outline
                        ),
                        shadowElevation = if (isSelected) 4.dp else 1.dp
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = cat.icon,
                                contentDescription = cat.name,
                                tint = if (isSelected) colorScheme.onPrimary else colorScheme.onSurface,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(7.dp))

                    Text(
                        text = cat.name,
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        color = if (isSelected) colorScheme.primary else colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(26.dp))

        // 5. Section Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = if (searchQuery.isNotBlank()) "RÉSULTATS" else "SÉLECTION DU JOUR",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.sp,
                    color = colorScheme.primary
                )
                Text(
                    text = if (searchQuery.isNotBlank()) "Recettes trouvées" else "Les Plus Populaires",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = colorScheme.onBackground
                )
            }

            if (searchQuery.isBlank() && selectedCategory == "popular") {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = colorScheme.primaryContainer,
                    modifier = Modifier.clickable { onNavigateToRecipes() }
                ) {
                    Text(
                        text = "Voir tout",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 6. Recipe Grid Cards (2-column Grid)
        val displayRecipes = remember(filteredRecipes, popularRecipes, searchQuery, selectedCategory) {
            if (searchQuery.isNotBlank() || selectedCategory != "popular") {
                filteredRecipes
            } else {
                popularRecipes
            }
        }

        if (displayRecipes.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(colorScheme.primaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.RestaurantMenu,
                            contentDescription = null,
                            tint = colorScheme.primary,
                            modifier = Modifier.size(26.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Aucune recette trouvée",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Essayez un autre mot-clé ou une autre catégorie",
                        fontSize = 13.sp,
                        color = colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            displayRecipes.take(8).chunked(2).forEach { rowRecipes ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
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
                Spacer(modifier = Modifier.height(14.dp))
            }
        }

        Spacer(modifier = Modifier.height(124.dp))
    }
}

@Composable
fun SunRecipeCard(
    recipe: Recipe,
    isFavorite: Boolean = false,
    onToggleFavorite: () -> Unit = {},
    onClick: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme

    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = colorScheme.surfaceContainerLowest),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp, pressedElevation = 6.dp),
        border = BorderStroke(1.dp, colorScheme.outlineVariant)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // 1. Image Container
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(144.dp)
                    .clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp, bottomStart = 14.dp, bottomEnd = 14.dp))
            ) {
                AsyncImage(
                    model = recipe.image,
                    contentDescription = recipe.name,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.Black.copy(alpha = 0.28f),
                                    Color.Transparent,
                                    Color.Black.copy(alpha = 0.36f)
                                )
                            )
                        )
                )

                // Top Left: Prep Time Tag
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color.Black.copy(alpha = 0.56f),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.18f)),
                    modifier = Modifier
                        .padding(8.dp)
                        .align(Alignment.TopStart)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Timer,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(11.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = recipe.prepTime,
                            color = Color.White,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                // Top Right: Bookmark Button
                IconButton(
                    onClick = onToggleFavorite,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .size(32.dp)
                        .background(colorScheme.surface.copy(alpha = 0.92f), CircleShape)
                ) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                        contentDescription = "Favori",
                        tint = if (isFavorite) AfroOrange else colorScheme.onSurface,
                        modifier = Modifier.size(16.dp)
                    )
                }

                // Bottom Right: Brand Orange Rating Pill
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = AfroOrange,
                    shadowElevation = 2.dp,
                    modifier = Modifier
                        .padding(8.dp)
                        .align(Alignment.BottomEnd)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(11.dp)
                        )
                        Spacer(modifier = Modifier.width(3.dp))
                        Text(
                            text = String.format(Locale.US, "%.1f", recipe.rating),
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // 2. Card Content
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 12.dp)
            ) {
                Text(
                    text = recipe.name,
                    fontSize = 14.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = colorScheme.onSurface,
                    lineHeight = 19.sp,
                    maxLines = 2,
                    minLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (recipe.region.isNotBlank()) recipe.region else recipe.category,
                        fontSize = 11.5.sp,
                        color = colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.weight(1f, fill = false)
                    )

                    val diffColor = when (recipe.difficulty) {
                        "Facile" -> DifficultyEasy
                        "Difficile" -> DifficultyHard
                        else -> DifficultyMedium
                    }
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .background(diffColor, CircleShape)
                    )
                }
            }
        }
    }
}

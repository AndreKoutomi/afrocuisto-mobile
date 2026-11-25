package com.afrocuisto.app.ui.screens.market

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Calendar
import java.util.TimeZone
import kotlin.math.roundToInt
import coil.compose.AsyncImage
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.BoutiqueCartItem
import com.afrocuisto.app.data.model.BoutiqueCategory
import com.afrocuisto.app.data.model.BoutiqueOrder
import com.afrocuisto.app.data.model.BoutiqueProduct
import com.afrocuisto.app.data.model.BoutiqueSort
import com.afrocuisto.app.data.model.MarketCurrency
import com.afrocuisto.app.data.repository.BoutiqueRepository
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val BoutiqueRadius24 = RoundedCornerShape(24.dp)
private val BoutiqueRadius16 = RoundedCornerShape(16.dp)
private val BoutiqueEmerald = Color(0xFF10B981)

@Composable
fun BoutiqueContent(
    products: List<BoutiqueProduct>,
    cart: List<BoutiqueCartItem>,
    searchQuery: String,
    currency: MarketCurrency,
    onAddProduct: (BoutiqueProduct) -> Unit,
    onUpdateQuantity: (String, Int) -> Unit,
    onOpenProductDetail: (BoutiqueProduct) -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = isAfroDarkTheme()
    val colorScheme = MaterialTheme.colorScheme
    val haptics = rememberAfroHaptics()

    var selectedCategory by remember { mutableStateOf(BoutiqueCategory.ALL) }
    var selectedSort by remember { mutableStateOf(BoutiqueSort.POPULAR) }

    val cartQtyById = remember(cart) { cart.associate { it.product.id to it.quantity } }

    val filteredProducts = remember(products, searchQuery, selectedCategory, selectedSort) {
        val q = searchQuery.trim()
        val base = products.filter { p ->
            val matchCat = selectedCategory == BoutiqueCategory.ALL || p.category == selectedCategory
            val matchQuery = q.isBlank() ||
                p.name.contains(q, ignoreCase = true) ||
                p.subtitle.contains(q, ignoreCase = true) ||
                p.origin.contains(q, ignoreCase = true) ||
                p.category.label.contains(q, ignoreCase = true)
            val matchSortFilter = when (selectedSort) {
                BoutiqueSort.ORGANIC -> p.isOrganic
                else -> true
            }
            matchCat && matchQuery && matchSortFilter
        }
        when (selectedSort) {
            BoutiqueSort.PRICE_ASC -> base.sortedBy { it.priceFcfa }
            BoutiqueSort.PRICE_DESC -> base.sortedByDescending { it.priceFcfa }
            BoutiqueSort.POPULAR -> base.sortedByDescending { it.reviewsCount }
            BoutiqueSort.ORGANIC -> base
        }
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = 20.dp,
            end = 20.dp,
            top = 8.dp,
            bottom = 28.dp
        ),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        flingBehavior = rememberSmoothFlingBehavior()
    ) {
        // 1. Hero Banner Marché Frais
        item(key = "boutique_hero") {
            BoutiqueHeroBanner()
        }

        // 2. Category Chips (Ingrédients, Fruits, Légumes, Épices, Céréales, Huiles, Poissons)
        item(key = "boutique_categories") {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                flingBehavior = rememberSmoothFlingBehavior()
            ) {
                items(BoutiqueCategory.entries) { category ->
                    val selected = category == selectedCategory
                    Surface(
                        shape = CircleShape,
                        color = if (selected) {
                            if (isDark) AfroOrange else Color(0xFF1E1E2D)
                        } else {
                            if (isDark) colorScheme.surface else Color.White
                        },
                        border = BorderStroke(
                            1.dp,
                            if (selected) Color.Transparent
                            else if (isDark) colorScheme.outline else Color(0xFFE2E8F0)
                        ),
                        modifier = Modifier.afroSpringClickable(
                            pressedScale = 0.94f,
                            haptic = AfroHapticKind.SELECTION
                        ) { selectedCategory = category }
                    ) {
                        Text(
                            text = category.label,
                            fontSize = 12.sp,
                            lineHeight = 14.sp,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                            color = if (selected) Color.White else colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                        )
                    }
                }
            }
        }

        // 3. Sort & Quick Filter Row
        item(key = "boutique_sorts") {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                flingBehavior = rememberSmoothFlingBehavior()
            ) {
                items(BoutiqueSort.entries) { sort ->
                    val active = sort == selectedSort
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (active) AfroOrange.copy(alpha = 0.14f) else Color.Transparent,
                        border = BorderStroke(
                            1.dp,
                            if (active) AfroOrange.copy(alpha = 0.45f)
                            else if (isDark) colorScheme.outline else Color(0xFFE2E8F0)
                        ),
                        modifier = Modifier.afroSpringClickable(
                            pressedScale = 0.95f,
                            haptic = AfroHapticKind.SELECTION
                        ) { selectedSort = sort }
                    ) {
                        Text(
                            text = sort.label,
                            fontSize = 11.5.sp,
                            lineHeight = 14.sp,
                            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
                            color = if (active) AfroOrange else colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp)
                        )
                    }
                }
            }
        }

        // 4. Results header
        item(key = "boutique_count") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${filteredProducts.size} produit${if (filteredProducts.size > 1) "s" else ""} frais",
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = colorScheme.onSurfaceVariant
                )
                Text(
                    text = "100 % ingrédients & terroir",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BoutiqueEmerald
                )
            }
        }

        if (filteredProducts.isEmpty()) {
            item(key = "boutique_empty") {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 48.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_bag_linear),
                            contentDescription = null,
                            tint = colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(38.dp)
                        )
                        Spacer(Modifier.height(10.dp))
                        Text(
                            text = "Aucun ingrédient trouvé",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = colorScheme.onSurface
                        )
                        Text(
                            text = "Essayez une autre catégorie ou recherche",
                            fontSize = 12.5.sp,
                            color = colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            val rows = filteredProducts.chunked(2)
            items(rows, key = { row -> row.joinToString("_") { it.id } }) { rowProducts ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    rowProducts.forEach { product ->
                        Box(modifier = Modifier.weight(1f)) {
                            BoutiqueProductCard(
                                product = product,
                                cartQuantity = cartQtyById[product.id] ?: 0,
                                currency = currency,
                                onAdd = {
                                    haptics.actionSuccess()
                                    onAddProduct(product)
                                },
                                onChangeQty = { nextQty ->
                                    haptics.selectionTick()
                                    onUpdateQuantity(product.id, nextQty)
                                },
                                onClick = {
                                    haptics.navigationTap()
                                    onOpenProductDetail(product)
                                }
                            )
                        }
                    }
                    if (rowProducts.size == 1) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun BoutiqueHeroBanner() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(BoutiqueRadius24)
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFF1E1E2D), Color(0xFF31221A), Color(0xFFFB5607))
                )
            )
            .padding(18.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = CircleShape,
                    color = Color.White.copy(alpha = 0.18f)
                ) {
                    Text(
                        text = "MARCHÉ FRAIS • LIVRAISON 45 MIN",
                        fontSize = 10.sp,
                        lineHeight = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        letterSpacing = 0.6.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }

                Surface(
                    shape = CircleShape,
                    color = BoutiqueEmerald
                ) {
                    Text(
                        text = "100% Terroir",
                        fontSize = 10.5.sp,
                        lineHeight = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            Text(
                text = "Ingrédients, fruits & légumes du terroir",
                fontSize = 17.sp,
                lineHeight = 22.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = "Commandez vos produits frais récoltés le matin — livraison soignée à domicile.",
                fontSize = 12.sp,
                lineHeight = 16.sp,
                color = Color.White.copy(alpha = 0.85f)
            )
        }
    }
}

@Composable
private fun BoutiqueProductCard(
    product: BoutiqueProduct,
    cartQuantity: Int,
    currency: MarketCurrency,
    onAdd: () -> Unit,
    onChangeQty: (Int) -> Unit,
    onClick: () -> Unit
) {
    val isDark = isAfroDarkTheme()
    val colorScheme = MaterialTheme.colorScheme
    val cardBg = if (isDark) colorScheme.surface else Color.White
    val borderColor = if (cartQuantity > 0) AfroOrange.copy(alpha = 0.6f)
    else if (isDark) colorScheme.outline else Color(0xFFE8EAEE)

    Card(
        onClick = onClick,
        shape = BoutiqueRadius24,
        colors = CardDefaults.cardColors(containerColor = cardBg),
        border = BorderStroke(if (cartQuantity > 0) 1.5.dp else 1.dp, borderColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(116.dp)
                    .clip(BoutiqueRadius16)
                    .background(if (isDark) colorScheme.surfaceVariant else Color(0xFFF3F4F6))
            ) {
                AsyncImage(
                    model = product.imageUrl,
                    contentDescription = product.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(7.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (product.isOrganic) {
                        Surface(shape = CircleShape, color = BoutiqueEmerald) {
                            Text(
                                text = "Bio",
                                fontSize = 9.5.sp,
                                lineHeight = 11.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            Text(
                text = product.name,
                fontSize = 13.sp,
                lineHeight = 16.sp,
                fontWeight = FontWeight.ExtraBold,
                color = colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(Modifier.height(2.dp))

            Text(
                text = "${product.unitLabel} • ${product.origin}",
                fontSize = 10.5.sp,
                lineHeight = 13.sp,
                color = colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = formatBoutiquePrice(product.priceFcfa, currency),
                        fontSize = 13.sp,
                        lineHeight = 15.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = AfroOrange,
                        maxLines = 1
                    )
                }

                if (cartQuantity == 0) {
                    Surface(
                        shape = CircleShape,
                        color = AfroOrange,
                        modifier = Modifier
                            .size(30.dp)
                            .afroSpringClickable(pressedScale = 0.88f, haptic = AfroHapticKind.SUCCESS) {
                                onAdd()
                            }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_solar_add_linear),
                                contentDescription = "Ajouter",
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                } else {
                    Surface(
                        shape = CircleShape,
                        color = AfroOrange.copy(alpha = 0.14f),
                        border = BorderStroke(1.dp, AfroOrange.copy(alpha = 0.4f))
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(22.dp)
                                    .clip(CircleShape)
                                    .clickable { onChangeQty(cartQuantity - 1) },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_minus_linear),
                                    contentDescription = "Retirer",
                                    tint = AfroOrange,
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                            Text(
                                text = "$cartQuantity",
                                fontSize = 11.5.sp,
                                lineHeight = 13.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = AfroOrange,
                                modifier = Modifier.padding(horizontal = 5.dp)
                            )
                            Box(
                                modifier = Modifier
                                    .size(22.dp)
                                    .clip(CircleShape)
                                    .clickable { onChangeQty(cartQuantity + 1) },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_add_linear),
                                    contentDescription = "Ajouter",
                                    tint = AfroOrange,
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BoutiqueFloatingCartBar(
    itemCount: Int,
    subtotalFcfa: Double,
    currency: MarketCurrency,
    onOpenCart: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = CircleShape,
        color = Color(0xFF1E1E2D),
        shadowElevation = 10.dp,
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 14.dp)
            .afroSpringClickable(pressedScale = 0.97f, haptic = AfroHapticKind.SELECTION) {
                onOpenCart()
            }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp, vertical = 13.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = CircleShape, color = AfroOrange) {
                    Text(
                        text = "$itemCount",
                        fontSize = 12.sp,
                        lineHeight = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
                Spacer(Modifier.width(10.dp))
                Text(
                    text = "Voir mon panier",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Text(
                text = formatBoutiquePrice(subtotalFcfa, currency),
                fontSize = 14.sp,
                fontWeight = FontWeight.ExtraBold,
                color = AfroOrange
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BoutiqueProductDetailSheet(
    product: BoutiqueProduct,
    currency: MarketCurrency,
    onDismiss: () -> Unit,
    onAddToCart: (quantity: Int, note: String) -> Unit,
    onAddToShoppingList: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptics = rememberAfroHaptics()
    var quantity by remember(product.id) { mutableIntStateOf(0) }
    var note by remember(product.id) { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = if (isDark) colorScheme.surface else Color.White,
        scrimColor = Color.Transparent,
        tonalElevation = 0.dp,
        shape = RoundedCornerShape(0.dp),
        dragHandle = null
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            // Top Bar Plein Écran
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = onDismiss) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_arrow_left_linear),
                        contentDescription = "Fermer",
                        tint = colorScheme.onSurface
                    )
                }
                Text(
                    text = product.category.label,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = colorScheme.onSurface
                )
                IconButton(onClick = onDismiss) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_close_linear),
                        contentDescription = "Fermer",
                        tint = colorScheme.onSurfaceVariant
                    )
                }
            }

            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(240.dp)
                        .clip(BoutiqueRadius24)
                ) {
                    AsyncImage(
                        model = product.imageUrl,
                        contentDescription = product.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                Spacer(Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "${product.category.label} • ${product.origin}",
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = AfroOrange
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = product.name,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = colorScheme.onSurface
                        )
                        Text(
                            text = "${product.unitLabel} • ${product.subtitle}",
                            fontSize = 13.5.sp,
                            color = colorScheme.onSurfaceVariant
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = formatBoutiquePrice(product.priceFcfa, currency),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = AfroOrange
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))

                if (product.description.isNotBlank()) {
                    Text(
                        text = product.description,
                        fontSize = 14.sp,
                        lineHeight = 20.sp,
                        color = colorScheme.onSurface
                    )
                    Spacer(Modifier.height(14.dp))
                }

                if (product.culinaryTip.isNotBlank()) {
                    Surface(
                        shape = BoutiqueRadius16,
                        color = AfroOrange.copy(alpha = 0.08f),
                        border = BorderStroke(1.dp, AfroOrange.copy(alpha = 0.22f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = "ASTUCE CULINAIRE",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = AfroOrange
                            )
                            Spacer(Modifier.height(3.dp))
                            Text(
                                text = product.culinaryTip,
                                fontSize = 13.sp,
                                color = colorScheme.onSurface
                            )
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                }

                // Section Note conditionnelle : apparaît dès que l'utilisateur passe la quantité à 1 ou plus
                AnimatedVisibility(
                    visible = quantity >= 1,
                    enter = expandVertically() + fadeIn(),
                    exit = shrinkVertically() + fadeOut()
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Note sur le produit à commander",
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = colorScheme.onSurface
                        )
                        Spacer(Modifier.height(6.dp))
                        OutlinedTextField(
                            value = note,
                            onValueChange = { note = it },
                            placeholder = { Text("Ex: bien mûr, coupé en morceaux, sans pépins...") },
                            minLines = 2,
                            maxLines = 4,
                            shape = BoutiqueRadius16,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(Modifier.height(14.dp))
                    }
                }
            }

            // Barre d'actions fixe en bas du plein écran
            Surface(
                color = if (isDark) colorScheme.surface else Color.White,
                shadowElevation = 0.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = if (isDark) colorScheme.surfaceVariant else Color(0xFFF1F5F9)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(CircleShape)
                                        .clickable { if (quantity > 0) quantity-- },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_minus_linear),
                                        contentDescription = "Moins",
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Text(
                                    text = "$quantity",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 12.dp)
                                )
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(CircleShape)
                                        .clickable { if (quantity < 25) quantity++ },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_add_linear),
                                        contentDescription = "Plus",
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }

                        Button(
                            onClick = {
                                if (quantity > 0) {
                                    haptics.actionSuccess()
                                    onAddToCart(quantity, note.trim())
                                    onDismiss()
                                }
                            },
                            enabled = quantity > 0,
                            shape = CircleShape,
                            colors = ButtonDefaults.buttonColors(containerColor = AfroOrange),
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                        ) {
                            Text(
                                text = if (quantity > 0) {
                                    "Ajouter • ${formatBoutiquePrice(product.priceFcfa * quantity, currency)}"
                                } else {
                                    "Choisir une quantité"
                                },
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.5.sp
                            )
                        }
                    }

                    Spacer(Modifier.height(10.dp))

                    OutlinedButton(
                        onClick = {
                            haptics.selectionTick()
                            onAddToShoppingList()
                            onDismiss()
                        },
                        shape = CircleShape,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                    ) {
                        Text(
                            text = "Ajouter aussi à Ma Liste de courses",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BoutiqueCartSheet(
    cart: List<BoutiqueCartItem>,
    currency: MarketCurrency,
    onDismiss: () -> Unit,
    onUpdateQuantity: (String, Int) -> Unit,
    onPlaceOrder: (deliverySlot: String, address: String, paymentMethod: String) -> BoutiqueOrder?
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptics = rememberAfroHaptics()

    var deliverySlot by remember { mutableStateOf("Express 45 min") }
    var customSlotTimestampMillis by remember { mutableStateOf<Long?>(null) }
    var customSlotLabel by remember { mutableStateOf<String?>(null) }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }
    var pendingDateUtcMillis by remember { mutableStateOf<Long?>(null) }

    var address by remember { mutableStateOf("Cotonou, Haie Vive") }
    val paymentMethod = "Mobile Money"
    var confirmedOrder by remember { mutableStateOf<BoutiqueOrder?>(null) }

    val subtotal = cart.sumOf { it.lineTotalFcfa }
    val deliveryFee = if (subtotal == 0.0) 0.0 else BoutiqueRepository.STANDARD_DELIVERY_FEE_FCFA
    val total = subtotal + deliveryFee

    if (showDatePicker) {
        val todayStartUtc = remember {
            val localCal = Calendar.getInstance()
            Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
                set(
                    localCal.get(Calendar.YEAR),
                    localCal.get(Calendar.MONTH),
                    localCal.get(Calendar.DAY_OF_MONTH),
                    0, 0, 0
                )
                set(Calendar.MILLISECOND, 0)
            }.timeInMillis
        }
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = pendingDateUtcMillis ?: todayStartUtc,
            selectableDates = object : SelectableDates {
                override fun isSelectableDate(utcTimeMillis: Long): Boolean {
                    return utcTimeMillis >= todayStartUtc
                }
            }
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        pendingDateUtcMillis = datePickerState.selectedDateMillis ?: todayStartUtc
                        showDatePicker = false
                        showTimePicker = true
                    }
                ) {
                    Text("Suivant", fontWeight = FontWeight.Bold, color = AfroOrange)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Annuler")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    if (showTimePicker) {
        val nowCal = remember { Calendar.getInstance() }
        val timePickerState = rememberTimePickerState(
            initialHour = (nowCal.get(Calendar.HOUR_OF_DAY) + 1).coerceAtMost(22),
            initialMinute = 0,
            is24Hour = true
        )
        AlertDialog(
            onDismissRequest = { showTimePicker = false },
            title = { Text("Heure de livraison", fontWeight = FontWeight.ExtraBold) },
            text = {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    TimePicker(state = timePickerState)
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val utcCal = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
                            timeInMillis = pendingDateUtcMillis ?: System.currentTimeMillis()
                        }
                        val localCal = Calendar.getInstance().apply {
                            set(
                                utcCal.get(Calendar.YEAR),
                                utcCal.get(Calendar.MONTH),
                                utcCal.get(Calendar.DAY_OF_MONTH),
                                timePickerState.hour,
                                timePickerState.minute,
                                0
                            )
                            set(Calendar.MILLISECOND, 0)
                        }
                        val fmt = SimpleDateFormat("dd MMM • HH'h'mm", Locale.FRENCH)
                        val formatted = fmt.format(localCal.time)
                        customSlotTimestampMillis = localCal.timeInMillis
                        customSlotLabel = formatted
                        deliverySlot = formatted
                        showTimePicker = false
                    }
                ) {
                    Text("Confirmer", fontWeight = FontWeight.Bold, color = AfroOrange)
                }
            },
            dismissButton = {
                TextButton(onClick = { showTimePicker = false }) {
                    Text("Retour")
                }
            }
        )
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = if (isDark) colorScheme.surface else Color.White,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        AnimatedContent(
            targetState = confirmedOrder,
            transitionSpec = { fadeIn() togetherWith fadeOut() },
            label = "boutiqueCheckoutState"
        ) { order ->
            if (order != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Surface(shape = CircleShape, color = BoutiqueEmerald.copy(alpha = 0.14f)) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_check_circle_linear),
                            contentDescription = null,
                            tint = BoutiqueEmerald,
                            modifier = Modifier
                                .padding(16.dp)
                                .size(38.dp)
                        )
                    }
                    Spacer(Modifier.height(14.dp))
                    Text(
                        text = "Commande confirmée !",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = colorScheme.onSurface
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = "Référence ${order.id} • ${order.deliverySlot}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = AfroOrange
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "Vos ${order.items.sumOf { it.quantity }} ingrédients frais seront livrés à « ${order.address} » (${order.paymentMethod}).",
                        fontSize = 13.sp,
                        color = colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(18.dp))
                    Button(
                        onClick = onDismiss,
                        shape = CircleShape,
                        colors = ButtonDefaults.buttonColors(containerColor = AfroOrange),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Text("Fermer", fontWeight = FontWeight.Bold)
                    }
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "Mon Panier Boutique (${cart.sumOf { it.quantity }})",
                        fontSize = 19.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = colorScheme.onSurface
                    )
                    Spacer(Modifier.height(14.dp))

                    cart.forEach { line ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            AsyncImage(
                                model = line.product.imageUrl,
                                contentDescription = line.product.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(52.dp)
                                    .clip(RoundedCornerShape(12.dp))
                            )
                            Spacer(Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = line.product.name,
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "${line.product.unitLabel} • ${formatBoutiquePrice(line.lineTotalFcfa, currency)}",
                                    fontSize = 12.sp,
                                    color = AfroOrange,
                                    fontWeight = FontWeight.SemiBold
                                )
                                if (line.note.isNotBlank()) {
                                    Text(
                                        text = "Note : ${line.note}",
                                        fontSize = 11.sp,
                                        color = colorScheme.onSurfaceVariant,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .clip(CircleShape)
                                        .background(if (isDark) colorScheme.surfaceVariant else Color(0xFFF1F5F9))
                                        .clickable { onUpdateQuantity(line.product.id, line.quantity - 1) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_minus_linear),
                                        contentDescription = "Moins",
                                        modifier = Modifier.size(13.dp)
                                    )
                                }
                                Text(
                                    text = "${line.quantity}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .clip(CircleShape)
                                        .background(AfroOrange.copy(alpha = 0.14f))
                                        .clickable { onUpdateQuantity(line.product.id, line.quantity + 1) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_add_linear),
                                        contentDescription = "Plus",
                                        tint = AfroOrange,
                                        modifier = Modifier.size(13.dp)
                                    )
                                }
                            }
                        }
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                    Text(
                        text = "Créneau de livraison",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(6.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(listOf("Express 45 min", "Ce soir 18h-20h", "Demain 9h-12h")) { slot ->
                            val selected = slot == deliverySlot && customSlotLabel != deliverySlot
                            Surface(
                                shape = CircleShape,
                                color = if (selected) AfroOrange else Color.Transparent,
                                border = BorderStroke(1.dp, if (selected) AfroOrange else colorScheme.outline),
                                modifier = Modifier.clickable {
                                    deliverySlot = slot
                                    customSlotTimestampMillis = null
                                }
                            ) {
                                Text(
                                    text = slot,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (selected) Color.White else colorScheme.onSurface,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                )
                            }
                        }
                        item {
                            val isCustomSelected = customSlotLabel != null && deliverySlot == customSlotLabel
                            Surface(
                                shape = CircleShape,
                                color = if (isCustomSelected) AfroOrange else Color.Transparent,
                                border = BorderStroke(1.dp, if (isCustomSelected) AfroOrange else colorScheme.outline),
                                modifier = Modifier.clickable { showDatePicker = true }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_stopwatch_linear),
                                        contentDescription = null,
                                        tint = if (isCustomSelected) Color.White else AfroOrange,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Text(
                                        text = if (isCustomSelected) customSlotLabel!! else "Date & heure",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isCustomSelected) Color.White else colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    DynamicDeliveryDelayGauge(
                        deliverySlot = deliverySlot,
                        itemCount = cart.sumOf { it.quantity },
                        isDark = isDark,
                        customTargetMillis = customSlotTimestampMillis
                    )

                    Spacer(Modifier.height(12.dp))

                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
                        label = { Text("Adresse de livraison") },
                        singleLine = true,
                        shape = BoutiqueRadius16,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(Modifier.height(12.dp))

                    Text(
                        text = "Moyen de paiement",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(6.dp))
                    Surface(
                        shape = BoutiqueRadius16,
                        color = if (isDark) colorScheme.surfaceVariant else Color(0xFFF8FAFC),
                        border = BorderStroke(1.dp, AfroOrange.copy(alpha = 0.4f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = AfroOrange.copy(alpha = 0.14f),
                                modifier = Modifier.size(34.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_wallet_money_linear),
                                        contentDescription = "Mobile Money",
                                        tint = AfroOrange,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Mobile Money",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = colorScheme.onSurface
                                )
                                Text(
                                    text = "MTN MoMo • Moov Money • Celtiis",
                                    fontSize = 11.sp,
                                    color = colorScheme.onSurfaceVariant
                                )
                            }
                            Surface(
                                shape = CircleShape,
                                color = BoutiqueEmerald.copy(alpha = 0.14f)
                            ) {
                                Text(
                                    text = "Unique mode",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = BoutiqueEmerald,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Sous-total", fontSize = 13.sp, color = colorScheme.onSurfaceVariant)
                        Text(formatBoutiquePrice(subtotal, currency), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Livraison", fontSize = 13.sp, color = colorScheme.onSurfaceVariant)
                        Text(
                            text = formatBoutiquePrice(deliveryFee, currency),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = colorScheme.onSurface
                        )
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total à payer", fontSize = 15.5.sp, fontWeight = FontWeight.ExtraBold)
                        Text(
                            text = formatBoutiquePrice(total, currency),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = AfroOrange
                        )
                    }

                    Spacer(Modifier.height(16.dp))

                    Button(
                        onClick = {
                            if (address.isNotBlank()) {
                                haptics.actionSuccess()
                                confirmedOrder = onPlaceOrder(deliverySlot, address, paymentMethod)
                            }
                        },
                        enabled = cart.isNotEmpty() && address.isNotBlank(),
                        shape = CircleShape,
                        colors = ButtonDefaults.buttonColors(containerColor = AfroOrange),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        Text(
                            text = "Commander • ${formatBoutiquePrice(total, currency)}",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 14.5.sp
                        )
                    }

                    Spacer(Modifier.height(20.dp))
                }
            }
        }
    }
}

@Composable
private fun DynamicDeliveryDelayGauge(
    deliverySlot: String,
    itemCount: Int,
    isDark: Boolean,
    customTargetMillis: Long? = null,
    compact: Boolean = false
) {
    val colorScheme = MaterialTheme.colorScheme
    val estimatedMinutes = (24 + (itemCount * 2).coerceAtMost(18)).coerceIn(25, 42)

    data class DeliveryGaugeConfig(
        val targetProgress: Float,
        val accentColor: Color,
        val badge: String,
        val headline: String,
        val detail: String
    )

    val config = when {
        deliverySlot == "Express 45 min" -> DeliveryGaugeConfig(
            targetProgress = 0.88f,
            accentColor = BoutiqueEmerald,
            badge = "Express",
            headline = "Livraison estimée : ~$estimatedMinutes min",
            detail = "Préparation immédiate ($itemCount article${if (itemCount > 1) "s" else ""}) • Coursier dédié"
        )
        deliverySlot == "Ce soir 18h-20h" -> DeliveryGaugeConfig(
            targetProgress = 0.58f,
            accentColor = AfroOrange,
            badge = "Planifié",
            headline = "Créneau ciblé : 18h00 – 20h00",
            detail = "Récolte de l'après-midi ($itemCount article${if (itemCount > 1) "s" else ""}) • Tri fraîcheur"
        )
        deliverySlot == "Demain 9h-12h" -> DeliveryGaugeConfig(
            targetProgress = 0.32f,
            accentColor = Color(0xFF3B82F6),
            badge = "Matinal",
            headline = "Livraison matinale : 09h00 – 12h00",
            detail = "Cueilli à l'aube ($itemCount article${if (itemCount > 1) "s" else ""}) • Chaîne du froid préservée"
        )
        customTargetMillis != null -> {
            val diffMins = ((customTargetMillis - System.currentTimeMillis()) / 60_000L).coerceAtLeast(15L)
            when {
                diffMins <= 60L -> DeliveryGaugeConfig(
                    targetProgress = 0.86f,
                    accentColor = BoutiqueEmerald,
                    badge = "Bientôt",
                    headline = "Livraison prévue dans ~$diffMins min",
                    detail = "Créneau personnalisé ($deliverySlot) • $itemCount article${if (itemCount > 1) "s" else ""}"
                )
                diffMins <= 360L -> {
                    val h = diffMins / 60L
                    val m = diffMins % 60L
                    DeliveryGaugeConfig(
                        targetProgress = 0.60f,
                        accentColor = AfroOrange,
                        badge = "Aujourd'hui",
                        headline = "Dans ${h}h${m.toString().padStart(2, '0')} ($deliverySlot)",
                        detail = "Créneau sur mesure • $itemCount article${if (itemCount > 1) "s" else ""} préparés à temps"
                    )
                }
                else -> {
                    val h = diffMins / 60L
                    DeliveryGaugeConfig(
                        targetProgress = 0.34f,
                        accentColor = Color(0xFF3B82F6),
                        badge = "Programmé",
                        headline = "Prévu le $deliverySlot",
                        detail = "Dans ~${h}h • $itemCount article${if (itemCount > 1) "s" else ""} récoltés juste avant départ"
                    )
                }
            }
        }
        else -> DeliveryGaugeConfig(
            targetProgress = 0.54f,
            accentColor = AfroOrange,
            badge = "Programmé",
            headline = "Créneau choisi : $deliverySlot",
            detail = "Livraison planifiée ($itemCount article${if (itemCount > 1) "s" else ""}) • Coursier dédié"
        )
    }

    val animatedProgress by animateFloatAsState(
        targetValue = config.targetProgress,
        animationSpec = spring(dampingRatio = 0.72f, stiffness = 220f),
        label = "deliveryGaugeProgress"
    )
    val animatedAccent by animateColorAsState(
        targetValue = config.accentColor,
        animationSpec = tween(durationMillis = 320, easing = FastOutSlowInEasing),
        label = "deliveryGaugeColor"
    )

    Surface(
        shape = BoutiqueRadius16,
        color = if (isDark) colorScheme.surfaceVariant else if (compact) Color.White else Color(0xFFF8FAFC),
        border = BorderStroke(1.dp, animatedAccent.copy(alpha = 0.28f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(if (compact) 10.dp else 12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Surface(
                        shape = CircleShape,
                        color = animatedAccent.copy(alpha = 0.14f),
                        modifier = Modifier.size(if (compact) 24.dp else 28.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_solar_delivery_linear),
                                contentDescription = null,
                                tint = animatedAccent,
                                modifier = Modifier.size(if (compact) 13.dp else 15.dp)
                            )
                        }
                    }
                    AnimatedContent(
                        targetState = config.headline,
                        transitionSpec = { fadeIn(tween(220)) togetherWith fadeOut(tween(150)) },
                        label = "deliveryHeadline"
                    ) { headline ->
                        Text(
                            text = headline,
                            fontSize = if (compact) 11.5.sp else 12.5.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = colorScheme.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                Spacer(Modifier.width(6.dp))
                Surface(
                    shape = CircleShape,
                    color = animatedAccent.copy(alpha = 0.14f)
                ) {
                    Text(
                        text = config.badge,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = animatedAccent,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(Modifier.height(if (compact) 8.dp else 10.dp))

            val trackColor = if (isDark) Color.White.copy(alpha = 0.12f) else Color(0xFFE2E8F0)
            val courierSize = if (compact) 24.dp else 28.dp
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(courierSize),
                contentAlignment = Alignment.CenterStart
            ) {
                val trackHeightPx = 6.dp
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(courierSize)
                ) {
                    val trackY = size.height / 2f
                    val strokePx = trackHeightPx.toPx()
                    val padX = (courierSize / 2).toPx()
                    val usableW = (size.width - padX * 2f).coerceAtLeast(1f)

                    drawLine(
                        color = trackColor,
                        start = Offset(padX, trackY),
                        end = Offset(padX + usableW, trackY),
                        strokeWidth = strokePx,
                        cap = StrokeCap.Round
                    )

                    val fillEndX = padX + usableW * animatedProgress.coerceIn(0.05f, 1f)
                    drawLine(
                        color = animatedAccent,
                        start = Offset(padX, trackY),
                        end = Offset(fillEndX, trackY),
                        strokeWidth = strokePx,
                        cap = StrokeCap.Round
                    )
                }

                val maxOffsetPx = with(androidx.compose.ui.platform.LocalDensity.current) {
                    (maxWidth - courierSize).toPx().coerceAtLeast(0f)
                }
                val courierOffsetX = (maxOffsetPx * animatedProgress.coerceIn(0.05f, 1f)).roundToInt()
                Surface(
                    shape = CircleShape,
                    color = if (isDark) colorScheme.surface else Color.White,
                    border = BorderStroke(1.5.dp, animatedAccent),
                    modifier = Modifier
                        .offset { IntOffset(courierOffsetX, 0) }
                        .size(courierSize)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_delivery_linear),
                            contentDescription = "Livreur",
                            tint = animatedAccent,
                            modifier = Modifier.size(if (compact) 13.dp else 15.dp)
                        )
                    }
                }
            }

            Spacer(Modifier.height(3.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Text(
                    text = "Chez vous",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = animatedAccent
                )
            }

            if (!compact) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = config.detail,
                    fontSize = 11.sp,
                    color = colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BoutiqueOrdersSheet(
    orders: List<BoutiqueOrder>,
    currency: MarketCurrency,
    onDismiss: () -> Unit,
    onMarkDelivered: (String) -> Unit = {}
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptics = rememberAfroHaptics()
    val dateFmt = remember { SimpleDateFormat("dd MMM • HH:mm", Locale.FRENCH) }
    var selectedOrder by remember { mutableStateOf<BoutiqueOrder?>(null) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = if (isDark) colorScheme.surface else Color.White,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        AnimatedContent(
            targetState = selectedOrder,
            transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(150)) },
            label = "ordersSheetContent"
        ) { orderDetail ->
            if (orderDetail != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 8.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(CircleShape)
                            .clickable { selectedOrder = null }
                            .padding(vertical = 4.dp, horizontal = 2.dp)
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_arrow_left_linear),
                            contentDescription = "Retour",
                            tint = AfroOrange,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = "Retour aux commandes",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = AfroOrange
                        )
                    }

                    Spacer(Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Commande ${orderDetail.id}",
                            fontSize = 19.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = colorScheme.onSurface
                        )
                        Surface(shape = CircleShape, color = BoutiqueEmerald.copy(alpha = 0.14f)) {
                            Text(
                                text = if (orderDetail.isDelivered) "Livrée" else "En préparation",
                                fontSize = 10.5.sp,
                                lineHeight = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = BoutiqueEmerald,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                            )
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "${dateFmt.format(Date(orderDetail.createdAt))} • ${orderDetail.deliverySlot}",
                        fontSize = 12.sp,
                        color = colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Livraison à : ${orderDetail.address}",
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colorScheme.onSurface
                    )

                    Spacer(Modifier.height(12.dp))

                    DynamicDeliveryDelayGauge(
                        deliverySlot = orderDetail.deliverySlot,
                        itemCount = orderDetail.items.sumOf { it.quantity },
                        isDark = isDark
                    )

                    Spacer(Modifier.height(14.dp))

                    Text(
                        text = "Articles commandés (${orderDetail.items.sumOf { it.quantity }})",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = colorScheme.onSurface
                    )
                    Spacer(Modifier.height(8.dp))

                    orderDetail.items.forEach { line ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            AsyncImage(
                                model = line.product.imageUrl,
                                contentDescription = line.product.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(12.dp))
                            )
                            Spacer(Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${line.product.name} × ${line.quantity}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colorScheme.onSurface
                                )
                                Text(
                                    text = line.product.unitLabel,
                                    fontSize = 11.5.sp,
                                    color = colorScheme.onSurfaceVariant
                                )
                                if (line.note.isNotBlank()) {
                                    Text(
                                        text = "Note : ${line.note}",
                                        fontSize = 11.sp,
                                        color = AfroOrange
                                    )
                                }
                            }
                            Text(
                                text = formatBoutiquePrice(line.lineTotalFcfa, currency),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = colorScheme.onSurface
                            )
                        }
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Sous-total", fontSize = 13.sp, color = colorScheme.onSurfaceVariant)
                        Text(formatBoutiquePrice(orderDetail.subtotalFcfa, currency), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Livraison", fontSize = 13.sp, color = colorScheme.onSurfaceVariant)
                        Text(formatBoutiquePrice(orderDetail.deliveryFeeFcfa, currency), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Paiement", fontSize = 13.sp, color = colorScheme.onSurfaceVariant)
                        Text(orderDetail.paymentMethod, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total payé", fontSize = 15.5.sp, fontWeight = FontWeight.ExtraBold)
                        Text(
                            text = formatBoutiquePrice(orderDetail.totalFcfa, currency),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = AfroOrange
                        )
                    }
                    if (!orderDetail.isDelivered) {
                        Spacer(Modifier.height(14.dp))
                        Button(
                            onClick = {
                                haptics.actionSuccess()
                                onMarkDelivered(orderDetail.id)
                                selectedOrder = orderDetail.copy(isDelivered = true)
                            },
                            shape = CircleShape,
                            colors = ButtonDefaults.buttonColors(containerColor = BoutiqueEmerald),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            Text(
                                text = "Confirmer la livraison",
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                    Spacer(Modifier.height(18.dp))
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "Mes commandes (${orders.size})",
                        fontSize = 19.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = colorScheme.onSurface
                    )
                    Spacer(Modifier.height(12.dp))

                    if (orders.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 36.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_clipboard_list_linear),
                                    contentDescription = null,
                                    tint = colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(36.dp)
                                )
                                Spacer(Modifier.height(10.dp))
                                Text(
                                    text = "Aucune commande passée",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colorScheme.onSurface
                                )
                                Text(
                                    text = "Vos commandes d'ingrédients apparaîtront ici.",
                                    fontSize = 12.5.sp,
                                    color = colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    } else {
                        orders.forEach { order ->
                            Surface(
                                shape = BoutiqueRadius16,
                                color = if (isDark) colorScheme.surfaceVariant else Color(0xFFF8FAFC),
                                border = BorderStroke(1.dp, if (isDark) colorScheme.outline else Color(0xFFE2E8F0)),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 12.dp)
                                    .afroSpringClickable(
                                        pressedScale = 0.98f,
                                        haptic = AfroHapticKind.SELECTION
                                    ) { selectedOrder = order }
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = order.id,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = colorScheme.onSurface
                                        )
                                        Surface(shape = CircleShape, color = BoutiqueEmerald.copy(alpha = 0.14f)) {
                                            Text(
                                                text = if (order.isDelivered) "Livrée" else "En préparation",
                                                fontSize = 10.5.sp,
                                                lineHeight = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = BoutiqueEmerald,
                                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                                            )
                                        }
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    Text(
                                        text = "${dateFmt.format(Date(order.createdAt))} • ${order.deliverySlot}",
                                        fontSize = 11.5.sp,
                                        color = colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = "${order.items.sumOf { it.quantity }} articles • ${order.address}",
                                        fontSize = 12.sp,
                                        color = colorScheme.onSurface,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Spacer(Modifier.height(10.dp))

                                    DynamicDeliveryDelayGauge(
                                        deliverySlot = order.deliverySlot,
                                        itemCount = order.items.sumOf { it.quantity },
                                        isDark = isDark,
                                        compact = true
                                    )

                                    Spacer(Modifier.height(10.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "${order.paymentMethod} • Voir les détails →",
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = colorScheme.onSurfaceVariant
                                        )
                                        Text(
                                            text = formatBoutiquePrice(order.totalFcfa, currency),
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = AfroOrange
                                        )
                                    }
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                }
            }
        }
    }
}

private fun formatBoutiquePrice(amountFcfa: Double, currency: MarketCurrency): String {
    return when (currency) {
        MarketCurrency.FCFA -> {
            val nf = NumberFormat.getNumberInstance(Locale.FRANCE).apply { maximumFractionDigits = 0 }
            "${nf.format(amountFcfa)} FCFA"
        }
        MarketCurrency.EUR -> {
            val eur = amountFcfa / 655.957
            String.format(Locale.FRANCE, "%.2f €", eur)
        }
    }
}

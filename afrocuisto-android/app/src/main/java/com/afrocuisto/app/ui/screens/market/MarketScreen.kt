package com.afrocuisto.app.ui.screens.market

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
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
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.zIndex
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.BoutiqueProduct
import com.afrocuisto.app.data.model.MarketCurrency
import com.afrocuisto.app.data.model.ShoppingItem
import com.afrocuisto.app.data.repository.BoutiqueRepository
import com.afrocuisto.app.data.repository.ShoppingRepository
import com.afrocuisto.app.ui.components.AfroHapticKind
import com.afrocuisto.app.ui.components.AfroPullToRefreshBox
import com.afrocuisto.app.ui.components.EditorialPageHeader
import com.afrocuisto.app.ui.components.EditorialSearchBar
import com.afrocuisto.app.ui.components.afroCardPressMotion
import com.afrocuisto.app.ui.components.afroSpringClickable
import com.afrocuisto.app.ui.components.afroStaggeredEntrance
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberSmoothFlingBehavior
import com.afrocuisto.app.ui.theme.AccentEmerald
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import kotlinx.coroutines.delay
import java.text.NumberFormat
import java.util.Locale

private val MarketRadius28 = RoundedCornerShape(28.dp)
private val MarketTopSheetRadius28 = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)

private enum class MarketTab {
    BOUTIQUE,
    ACTIVE
}

private enum class ActiveListFilter(val label: String) {
    ALL("Tout"),
    PENDING("À acheter"),
    CHECKED("Dans le panier")
}

private val MARKET_CATEGORIES = listOf(
    "Légumes & Frais",
    "Viandes & Poissons",
    "Céréales & Féculents",
    "Huiles & Conserves",
    "Épices & Terroir"
)

private val QUICK_QUANTITIES = listOf("250 g", "500 g", "1 kg", "1 boîte", "1 bouquet", "2 pièces")

@Composable
fun MarketScreen(
    repository: ShoppingRepository = remember { ShoppingRepository() },
    boutiqueRepository: BoutiqueRepository = remember { BoutiqueRepository() }
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptics = rememberAfroHaptics()

    val items by repository.items.collectAsState()
    val archivedItems by repository.archivedItems.collectAsState()
    val currency by repository.currency.collectAsState()

    val boutiqueProducts by boutiqueRepository.products.collectAsState()
    val boutiqueCart by boutiqueRepository.cart.collectAsState()
    val boutiqueOrders by boutiqueRepository.orders.collectAsState()

    var selectedTab by remember { mutableStateOf(MarketTab.BOUTIQUE) }
    var showArchivesInList by remember { mutableStateOf(false) }
    var activeFilter by remember { mutableStateOf(ActiveListFilter.ALL) }
    var searchOrQuickName by remember { mutableStateOf("") }

    var editorTarget by remember { mutableStateOf<MarketEditorTarget?>(null) }
    var selectedBoutiqueProduct by remember { mutableStateOf<BoutiqueProduct?>(null) }
    var showBoutiqueCartSheet by remember { mutableStateOf(false) }
    var showBoutiqueOrdersSheet by remember { mutableStateOf(false) }
    var showClearArchivesDialog by remember { mutableStateOf(false) }
    var archiveBannerMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(archiveBannerMessage) {
        if (archiveBannerMessage != null) {
            delay(3600L)
            archiveBannerMessage = null
        }
    }

    val checkedItems = remember(items) { items.filter { it.isChecked } }
    val pendingItems = remember(items) { items.filterNot { it.isChecked } }

    val totalEstimated = remember(items) { items.sumOf { it.price ?: 0.0 } }
    val checkedTotal = remember(checkedItems) { checkedItems.sumOf { it.price ?: 0.0 } }
    val remainingTotal = remember(pendingItems) { pendingItems.sumOf { it.price ?: 0.0 } }
    val pricedCount = remember(items) { items.count { (it.price ?: 0.0) > 0.0 } }

    val filteredActiveItems = remember(items, searchOrQuickName, activeFilter) {
        val q = searchOrQuickName.trim()
        items.filter { item ->
            val matchesQuery = q.isEmpty() ||
                item.name.contains(q, ignoreCase = true) ||
                item.category.contains(q, ignoreCase = true) ||
                (item.recipeName?.contains(q, ignoreCase = true) == true)
            val matchesStatus = when (activeFilter) {
                ActiveListFilter.ALL -> true
                ActiveListFilter.PENDING -> !item.isChecked
                ActiveListFilter.CHECKED -> item.isChecked
            }
            matchesQuery && matchesStatus
        }
    }

    val filteredArchivedItems = remember(archivedItems, searchOrQuickName) {
        val q = searchOrQuickName.trim()
        if (q.isEmpty()) archivedItems
        else archivedItems.filter { item ->
            item.name.contains(q, ignoreCase = true) ||
                item.category.contains(q, ignoreCase = true) ||
                (item.recipeName?.contains(q, ignoreCase = true) == true) ||
                (item.archiveBatchLabel?.contains(q, ignoreCase = true) == true)
        }
    }

    val archiveBatches = remember(filteredArchivedItems) {
        filteredArchivedItems.groupBy { it.archiveBatchLabel ?: "Achats récents" }
    }
    val archivedTotalSpent = remember(archivedItems) { archivedItems.sumOf { it.price ?: 0.0 } }

    val canvasBg = if (isDark) colorScheme.background else Color(0xFFF8F9FA)

    val addReadyScale by animateFloatAsState(
        targetValue = if (searchOrQuickName.isNotBlank()) 1.06f else 1f,
        animationSpec = spring(dampingRatio = 0.58f, stiffness = Spring.StiffnessMedium),
        label = "addReadyScale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(canvasBg)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            EditorialPageHeader(
                title = if (selectedTab == MarketTab.BOUTIQUE) "Mon panier" else "Ma liste",
                trailingAction = {
                    AnimatedContent(
                        targetState = selectedTab,
                        transitionSpec = {
                            val forward = targetState == MarketTab.ACTIVE
                            (slideInHorizontally(tween(240)) { if (forward) it / 4 else -it / 4 } +
                                fadeIn(tween(240)) +
                                scaleIn(initialScale = 0.94f, animationSpec = tween(240)))
                                .togetherWith(
                                    slideOutHorizontally(tween(180)) { if (forward) -it / 4 else it / 4 } +
                                        fadeOut(tween(180)) +
                                        scaleOut(targetScale = 0.94f, animationSpec = tween(180))
                                )
                                .using(SizeTransform(clip = false))
                        },
                        label = "marketHeaderTrailingTransition"
                    ) { tab ->
                        if (tab == MarketTab.BOUTIQUE) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Bouton conditionnel "Mes commandes" uniquement sur Boutique
                                Surface(
                                    shape = MarketRadius28,
                                    color = if (isDark) colorScheme.surfaceVariant else Color(0xFFF1F5F9),
                                    border = BorderStroke(1.dp, if (isDark) colorScheme.outline else Color(0xFFE2E8F0)),
                                    modifier = Modifier.afroSpringClickable(
                                        pressedScale = 0.94f,
                                        haptic = AfroHapticKind.SELECTION
                                    ) { showBoutiqueOrdersSheet = true }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                                    ) {
                                        Icon(
                                            painter = painterResource(id = R.drawable.ic_solar_clipboard_list_linear),
                                            contentDescription = "Mes commandes",
                                            tint = colorScheme.onSurface,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Text(
                                            text = if (boutiqueOrders.isNotEmpty()) {
                                                "Mes commandes (${boutiqueOrders.size})"
                                            } else {
                                                "Mes commandes"
                                            },
                                            fontSize = 11.5.sp,
                                            lineHeight = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = colorScheme.onSurface
                                        )
                                    }
                                }

                                // Bouton Panier Boutique sur la même ligne que le titre
                                val cartTotalCount = boutiqueCart.sumOf { it.quantity }
                                Surface(
                                    shape = MarketRadius28,
                                    color = AfroOrange.copy(alpha = 0.14f),
                                    border = BorderStroke(1.dp, AfroOrange.copy(alpha = 0.35f)),
                                    modifier = Modifier.afroSpringClickable(
                                        pressedScale = 0.92f,
                                        haptic = AfroHapticKind.SELECTION
                                    ) { showBoutiqueCartSheet = true }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                                    ) {
                                        Icon(
                                            painter = painterResource(
                                                id = if (cartTotalCount > 0) R.drawable.ic_solar_bag_bold else R.drawable.ic_solar_bag_linear
                                            ),
                                            contentDescription = "Panier Boutique",
                                            tint = AfroOrange,
                                            modifier = Modifier.size(15.dp)
                                        )
                                        if (cartTotalCount > 0) {
                                            Surface(shape = CircleShape, color = AfroOrange) {
                                                Text(
                                                    text = "$cartTotalCount",
                                                    fontSize = 10.5.sp,
                                                    lineHeight = 12.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    color = Color.White,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            Surface(
                                shape = MarketRadius28,
                                color = AfroOrange.copy(alpha = 0.14f)
                            ) {
                                AnimatedContent(
                                    targetState = if (showArchivesInList) archivedItems.size else pendingItems.size,
                                    transitionSpec = {
                                        (scaleIn(spring(dampingRatio = 0.65f)) + fadeIn()).togetherWith(
                                            scaleOut() + fadeOut()
                                        )
                                    },
                                    label = "marketPendingCounter"
                                ) { count ->
                                    Text(
                                        text = if (showArchivesInList) "$count archivés" else "$count à acheter",
                                        fontSize = 12.sp,
                                        lineHeight = 14.sp,
                                        color = AfroOrange,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    EditorialSearchBar(
                        value = searchOrQuickName,
                        onValueChange = { searchOrQuickName = it },
                        placeholder = when {
                            selectedTab == MarketTab.BOUTIQUE -> "Rechercher ingrédient, fruit, légume..."
                            showArchivesInList -> "Rechercher dans les archives..."
                            else -> "Rechercher ou ajouter (ex: Gombo...)"
                        },
                        leadingIcon = null,
                        shape = MarketRadius28,
                        modifier = Modifier.weight(1f)
                    )

                    if (selectedTab == MarketTab.ACTIVE && !showArchivesInList) {
                        Spacer(modifier = Modifier.width(10.dp))

                        Surface(
                            shape = MarketRadius28,
                            color = AfroOrange,
                            modifier = Modifier
                                .size(40.dp)
                                .graphicsLayer {
                                    scaleX = addReadyScale
                                    scaleY = addReadyScale
                                }
                                .afroSpringClickable(
                                    pressedScale = 0.86f,
                                    haptic = AfroHapticKind.SELECTION
                                ) {
                                    editorTarget = MarketEditorTarget.NewItem(
                                        prefillName = searchOrQuickName.trim()
                                    )
                                }
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_add_linear),
                                    contentDescription = "Ajouter un produit avec montant",
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Segmented Switcher: Boutique vs Ma liste (Archives intégrées dans Ma liste)
            MarketTabSwitcher(
                selectedTab = selectedTab,
                activeCount = items.size,
                onSelectTab = { tab ->
                    if (tab != selectedTab) {
                        haptics.selectionTick()
                        selectedTab = tab
                    }
                },
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 6.dp)
            )

            // Sous-sélecteur Ma liste / Archives uniquement sur l'onglet Ma liste
            AnimatedVisibility(
                visible = selectedTab == MarketTab.ACTIVE,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(
                        false to "Liste active (${items.size})",
                        true to "Archives (${archivedItems.size})"
                    ).forEach { (isArchive, label) ->
                        val selected = showArchivesInList == isArchive
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
                                pressedScale = 0.95f,
                                haptic = AfroHapticKind.SELECTION
                            ) { showArchivesInList = isArchive }
                        ) {
                            Text(
                                text = label,
                                fontSize = 12.sp,
                                lineHeight = 14.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                color = if (selected) Color.White else colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
                            )
                        }
                    }
                }
            }

            // Confirmation banner right after archiving
            AnimatedVisibility(
                visible = archiveBannerMessage != null,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                archiveBannerMessage?.let { msg ->
                    Surface(
                        shape = MarketRadius28,
                        color = AccentEmerald.copy(alpha = if (isDark) 0.22f else 0.12f),
                        border = BorderStroke(1.dp, AccentEmerald.copy(alpha = 0.35f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 4.dp)
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
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_check_circle_linear),
                                    contentDescription = null,
                                    tint = AccentEmerald,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = msg,
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = colorScheme.onSurface
                                )
                            }
                            Text(
                                text = "Voir",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = AccentEmerald,
                                modifier = Modifier
                                    .clip(MarketRadius28)
                                    .clickable {
                                        haptics.selectionTick()
                                        selectedTab = MarketTab.ACTIVE
                                        showArchivesInList = true
                                        archiveBannerMessage = null
                                    }
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }

            AfroPullToRefreshBox(
                onRefresh = {
                    delay(250L)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) {
            AnimatedContent(
                targetState = selectedTab to showArchivesInList,
                transitionSpec = {
                    fadeIn(tween(220)) togetherWith fadeOut(tween(180))
                },
                label = "marketTabContent",
                modifier = Modifier.fillMaxSize()
            ) { (tab, showArchives) ->
                when {
                    tab == MarketTab.BOUTIQUE -> {
                        BoutiqueContent(
                            products = boutiqueProducts,
                            cart = boutiqueCart,
                            searchQuery = searchOrQuickName,
                            currency = currency,
                            onAddProduct = { product -> boutiqueRepository.addToCart(product, 1) },
                            onUpdateQuantity = { id, qty -> boutiqueRepository.updateQuantity(id, qty) },
                            onOpenProductDetail = { product -> selectedBoutiqueProduct = product }
                        )
                    }

                    !showArchives -> {
                        ActiveMarketContent(
                            items = items,
                            filteredItems = filteredActiveItems,
                            pendingCount = pendingItems.size,
                            checkedCount = checkedItems.size,
                            totalEstimated = totalEstimated,
                            checkedTotal = checkedTotal,
                            remainingTotal = remainingTotal,
                            pricedCount = pricedCount,
                            currency = currency,
                            activeFilter = activeFilter,
                            onSelectFilter = { f ->
                                haptics.selectionTick()
                                activeFilter = f
                            },
                            onToggleCheck = { item ->
                                haptics.toggleSwitch(!item.isChecked)
                                repository.toggleCheck(item.id)
                            },
                            onEditItem = { item ->
                                haptics.selectionTick()
                                editorTarget = MarketEditorTarget.EditExisting(item)
                            },
                            onArchiveSingle = { item ->
                                haptics.actionSuccess()
                                repository.archiveSingleItem(item.id)
                                archiveBannerMessage = "\"${item.name}\" archivé"
                            },
                            onDeleteItem = { item ->
                                repository.deleteItem(item.id)
                            },
                            onMoveItem = { fromId, toId ->
                                repository.moveItem(fromId, toId)
                            },
                            onOpenAddSheet = {
                                haptics.selectionTick()
                                editorTarget = MarketEditorTarget.NewItem(searchOrQuickName.trim())
                            }
                        )
                    }

                    else -> {
                        ArchivedMarketContent(
                            archivedItems = archivedItems,
                            archiveBatches = archiveBatches,
                            totalSpent = archivedTotalSpent,
                            currency = currency,
                            onRestoreItem = { item ->
                                haptics.actionSuccess()
                                repository.restoreArchivedItem(item.id)
                            },
                            onRestoreBatch = { batchLabel ->
                                haptics.actionSuccess()
                                repository.restoreArchiveBatch(batchLabel)
                            },
                            onDeleteArchivedItem = { item ->
                                repository.deleteArchivedItem(item.id)
                            },
                            onRequestClearAll = {
                                haptics.destructiveTick()
                                showClearArchivesDialog = true
                            }
                        )
                    }
                }
            }
            }
        }

        // Sticky Bottom Archive Dock when 1+ items are marked on the Active list
        AnimatedVisibility(
            visible = selectedTab == MarketTab.ACTIVE && !showArchivesInList && checkedItems.isNotEmpty(),
            enter = slideInVertically(
                initialOffsetY = { it },
                animationSpec = spring(dampingRatio = 0.80f, stiffness = Spring.StiffnessMediumLow)
            ) + fadeIn(tween(200)),
            exit = slideOutVertically(targetOffsetY = { it }) + fadeOut(tween(180)),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
        ) {
            MarketArchiveActionDock(
                checkedCount = checkedItems.size,
                checkedTotal = checkedTotal,
                currency = currency,
                onClearChecked = {
                    haptics.destructiveTick()
                    repository.clearCheckedItems()
                },
                onArchiveChecked = {
                    haptics.actionSuccess()
                    val count = repository.archiveCheckedItems()
                    if (count > 0) {
                        val totalTxt = if (checkedTotal > 0.0) {
                            " • ${formatMarketAmount(checkedTotal, currency)}"
                        } else {
                            ""
                        }
                        archiveBannerMessage = "$count produit${if (count > 1) "s" else ""} archivé${if (count > 1) "s" else ""}$totalTxt"
                    }
                }
            )
        }

        // Add / Edit Product & Montant Sheet
        editorTarget?.let { target ->
            MarketItemEditorSheet(
                target = target,
                currency = currency,
                onDismiss = { editorTarget = null },
                onSaveNew = { name, qty, category, price ->
                    haptics.actionSuccess()
                    repository.addItem(
                        name = name,
                        quantity = qty,
                        category = category,
                        price = price
                    )
                    searchOrQuickName = ""
                    editorTarget = null
                },
                onSaveExisting = { id, name, qty, category, price ->
                    haptics.actionSuccess()
                    repository.updateItemDetails(
                        id = id,
                        name = name,
                        quantity = qty,
                        category = category,
                        price = price
                    )
                    editorTarget = null
                }
            )
        }

        if (showClearArchivesDialog) {
            AlertDialog(
                onDismissRequest = { showClearArchivesDialog = false },
                shape = MarketRadius28,
                title = {
                    Text(
                        text = "Vider les archives ?",
                        fontWeight = FontWeight.Bold
                    )
                },
                text = {
                    Text("Tous les produits archivés et l'historique de vos montants seront supprimés.")
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            haptics.destructiveTick()
                            repository.clearArchives()
                            showClearArchivesDialog = false
                        }
                    ) {
                        Text("Vider", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showClearArchivesDialog = false }) {
                        Text("Annuler")
                    }
                }
            )
        }

        selectedBoutiqueProduct?.let { product ->
            BoutiqueProductDetailSheet(
                product = product,
                currency = currency,
                onDismiss = { selectedBoutiqueProduct = null },
                onAddToCart = { qty, note -> boutiqueRepository.addToCart(product, qty, note) },
                onAddToShoppingList = {
                    repository.addItem(
                        name = product.name,
                        quantity = product.unitLabel,
                        category = product.category.label,
                        price = product.priceFcfa
                    )
                    archiveBannerMessage = "« ${product.name} » ajouté à Ma liste"
                }
            )
        }

        if (showBoutiqueCartSheet) {
            BoutiqueCartSheet(
                cart = boutiqueCart,
                currency = currency,
                onDismiss = { showBoutiqueCartSheet = false },
                onUpdateQuantity = { id, qty -> boutiqueRepository.updateQuantity(id, qty) },
                onPlaceOrder = { slot, addr, method ->
                    boutiqueRepository.placeOrder(
                        deliverySlot = slot,
                        address = addr,
                        paymentMethod = method
                    )
                }
            )
        }

        if (showBoutiqueOrdersSheet) {
            BoutiqueOrdersSheet(
                orders = boutiqueOrders,
                currency = currency,
                onDismiss = { showBoutiqueOrdersSheet = false },
                onMarkDelivered = { orderId -> boutiqueRepository.markOrderDelivered(orderId) }
            )
        }
    }
}

@Composable
private fun ActiveMarketContent(
    items: List<ShoppingItem>,
    filteredItems: List<ShoppingItem>,
    pendingCount: Int,
    checkedCount: Int,
    totalEstimated: Double,
    checkedTotal: Double,
    remainingTotal: Double,
    pricedCount: Int,
    currency: MarketCurrency,
    activeFilter: ActiveListFilter,
    onSelectFilter: (ActiveListFilter) -> Unit,
    onToggleCheck: (ShoppingItem) -> Unit,
    onEditItem: (ShoppingItem) -> Unit,
    onArchiveSingle: (ShoppingItem) -> Unit,
    onDeleteItem: (ShoppingItem) -> Unit,
    onMoveItem: (String, String) -> Unit,
    onOpenAddSheet: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptic = LocalHapticFeedback.current
    val lazyListState = rememberLazyListState()
    var draggedItemId by remember { mutableStateOf<String?>(null) }
    var dragOffsetY by remember { mutableFloatStateOf(0f) }

    if (items.isEmpty()) {
        MarketEmptyState(
            icon = R.drawable.ic_solar_bag_linear,
            title = "Votre liste de marché est vide",
            subtitle = "Ajoutez vos ingrédients avec leur montant ou importez-les directement depuis une fiche recette.",
            actionLabel = "Ajouter un ingrédient",
            onAction = onOpenAddSheet
        )
        return
    }

    val pendingSection = remember(filteredItems) { filteredItems.filterNot { it.isChecked } }
    val checkedSection = remember(filteredItems) { filteredItems.filter { it.isChecked } }
    val pendingIds = remember(pendingSection) { pendingSection.map { it.id }.toSet() }
    val checkedIds = remember(checkedSection) { checkedSection.map { it.id }.toSet() }

    LazyColumn(
        state = lazyListState,
        contentPadding = PaddingValues(
            start = 20.dp,
            end = 20.dp,
            top = 8.dp,
            bottom = if (checkedCount > 0) 116.dp else 28.dp
        ),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        flingBehavior = rememberSmoothFlingBehavior(),
        modifier = Modifier.fillMaxSize()
    ) {
        // 1. Hero Budget & Progress Dashboard Card (28.dp)
        item(key = "budget_dashboard") {
            MarketBudgetDashboardCard(
                totalCount = items.size,
                checkedCount = checkedCount,
                pricedCount = pricedCount,
                totalEstimated = totalEstimated,
                checkedTotal = checkedTotal,
                remainingTotal = remainingTotal,
                currency = currency
            )
        }

        // 2. Status Filter Chips (28.dp)
        item(key = "filter_chips") {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                flingBehavior = rememberSmoothFlingBehavior(),
                modifier = Modifier.padding(vertical = 4.dp)
            ) {
                items(ActiveListFilter.entries) { filter ->
                    val count = when (filter) {
                        ActiveListFilter.ALL -> items.size
                        ActiveListFilter.PENDING -> pendingCount
                        ActiveListFilter.CHECKED -> checkedCount
                    }
                    val selected = filter == activeFilter
                    Surface(
                        shape = MarketRadius28,
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
                        ) { onSelectFilter(filter) }
                    ) {
                        Text(
                            text = "${filter.label} ($count)",
                            fontSize = 12.sp,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                            color = if (selected) Color.White else colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 13.dp, vertical = 7.dp)
                        )
                    }
                }
            }
        }

        if (filteredItems.isEmpty()) {
            item(key = "empty_filtered") {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 42.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Aucun ingrédient dans cette vue.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            if (pendingSection.isNotEmpty()) {
                if (activeFilter == ActiveListFilter.ALL && checkedSection.isNotEmpty()) {
                    item(key = "header_pending") {
                        MarketSectionLabel(
                            title = "À ACHETER (${pendingSection.size})",
                            accent = AfroOrange
                        )
                    }
                }
                itemsIndexed(
                    items = pendingSection,
                    key = { _, item -> item.id },
                    contentType = { _, _ -> "shopping_item" }
                ) { index, item ->
                    val isDragging = draggedItemId == item.id
                    ShoppingItemCard(
                        item = item,
                        currency = currency,
                        isDragging = isDragging,
                        onToggle = { onToggleCheck(item) },
                        onEditPrice = { onEditItem(item) },
                        onArchiveSingle = { onArchiveSingle(item) },
                        onDelete = { onDeleteItem(item) },
                        modifier = Modifier
                            .zIndex(if (isDragging) 10f else 0f)
                            .graphicsLayer {
                                translationY = if (isDragging) dragOffsetY else 0f
                                val s = if (isDragging) 1.025f else 1f
                                scaleX = s
                                scaleY = s
                            }
                            .pointerInput(item.id, pendingIds) {
                                detectDragGesturesAfterLongPress(
                                    onDragStart = {
                                        draggedItemId = item.id
                                        dragOffsetY = 0f
                                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                    },
                                    onDragEnd = {
                                        draggedItemId = null
                                        dragOffsetY = 0f
                                    },
                                    onDragCancel = {
                                        draggedItemId = null
                                        dragOffsetY = 0f
                                    },
                                    onDrag = { change, dragAmount ->
                                        change.consume()
                                        dragOffsetY += dragAmount.y
                                        val visible = lazyListState.layoutInfo.visibleItemsInfo
                                        val currentInfo = visible.firstOrNull { it.key == item.id } ?: return@detectDragGesturesAfterLongPress
                                        val centerY = currentInfo.offset + dragOffsetY + currentInfo.size / 2f
                                        val targetInfo = visible.firstOrNull { info ->
                                            val k = info.key as? String ?: return@firstOrNull false
                                            k != item.id && k in pendingIds &&
                                                centerY >= info.offset && centerY <= info.offset + info.size
                                        }
                                        if (targetInfo != null) {
                                            val targetId = targetInfo.key as String
                                            val delta = targetInfo.offset - currentInfo.offset
                                            onMoveItem(item.id, targetId)
                                            dragOffsetY -= delta
                                            haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        }
                                    }
                                )
                            }
                            .then(
                                if (isDragging) Modifier else Modifier.animateItem(
                                    fadeInSpec = tween(220),
                                    placementSpec = spring(dampingRatio = 0.78f, stiffness = Spring.StiffnessMediumLow),
                                    fadeOutSpec = tween(180)
                                )
                            )
                            .afroStaggeredEntrance(index = index)
                    )
                }
            }

            if (checkedSection.isNotEmpty()) {
                if (activeFilter == ActiveListFilter.ALL) {
                    item(key = "header_checked") {
                        MarketSectionLabel(
                            title = "DANS LE PANIER (${checkedSection.size})",
                            accent = AccentEmerald,
                            modifier = Modifier.padding(top = 6.dp)
                        )
                    }
                }
                itemsIndexed(
                    items = checkedSection,
                    key = { _, item -> item.id },
                    contentType = { _, _ -> "shopping_item" }
                ) { index, item ->
                    val isDragging = draggedItemId == item.id
                    ShoppingItemCard(
                        item = item,
                        currency = currency,
                        isDragging = isDragging,
                        onToggle = { onToggleCheck(item) },
                        onEditPrice = { onEditItem(item) },
                        onArchiveSingle = { onArchiveSingle(item) },
                        onDelete = { onDeleteItem(item) },
                        modifier = Modifier
                            .zIndex(if (isDragging) 10f else 0f)
                            .graphicsLayer {
                                translationY = if (isDragging) dragOffsetY else 0f
                                val s = if (isDragging) 1.025f else 1f
                                scaleX = s
                                scaleY = s
                            }
                            .pointerInput(item.id, checkedIds) {
                                detectDragGesturesAfterLongPress(
                                    onDragStart = {
                                        draggedItemId = item.id
                                        dragOffsetY = 0f
                                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                    },
                                    onDragEnd = {
                                        draggedItemId = null
                                        dragOffsetY = 0f
                                    },
                                    onDragCancel = {
                                        draggedItemId = null
                                        dragOffsetY = 0f
                                    },
                                    onDrag = { change, dragAmount ->
                                        change.consume()
                                        dragOffsetY += dragAmount.y
                                        val visible = lazyListState.layoutInfo.visibleItemsInfo
                                        val currentInfo = visible.firstOrNull { it.key == item.id } ?: return@detectDragGesturesAfterLongPress
                                        val centerY = currentInfo.offset + dragOffsetY + currentInfo.size / 2f
                                        val targetInfo = visible.firstOrNull { info ->
                                            val k = info.key as? String ?: return@firstOrNull false
                                            k != item.id && k in checkedIds &&
                                                centerY >= info.offset && centerY <= info.offset + info.size
                                        }
                                        if (targetInfo != null) {
                                            val targetId = targetInfo.key as String
                                            val delta = targetInfo.offset - currentInfo.offset
                                            onMoveItem(item.id, targetId)
                                            dragOffsetY -= delta
                                            haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        }
                                    }
                                )
                            }
                            .then(
                                if (isDragging) Modifier else Modifier.animateItem(
                                    fadeInSpec = tween(220),
                                    placementSpec = spring(dampingRatio = 0.78f, stiffness = Spring.StiffnessMediumLow),
                                    fadeOutSpec = tween(180)
                                )
                            )
                            .afroStaggeredEntrance(index = index)
                    )
                }
            }
        }
    }
}

@Composable
private fun ArchivedMarketContent(
    archivedItems: List<ShoppingItem>,
    archiveBatches: Map<String, List<ShoppingItem>>,
    totalSpent: Double,
    currency: MarketCurrency,
    onRestoreItem: (ShoppingItem) -> Unit,
    onRestoreBatch: (String) -> Unit,
    onDeleteArchivedItem: (ShoppingItem) -> Unit,
    onRequestClearAll: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()

    if (archivedItems.isEmpty()) {
        MarketEmptyState(
            icon = R.drawable.ic_solar_clipboard_list_linear,
            title = "Aucune archive pour le moment",
            subtitle = "Marquez vos produits achetés puis appuyez sur Archiver pour conserver votre historique et vos montants.",
            actionLabel = null,
            onAction = {}
        )
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        flingBehavior = rememberSmoothFlingBehavior(),
        modifier = Modifier.fillMaxSize()
    ) {
        // Archive Summary Card (28.dp)
        item(key = "archive_summary") {
            Surface(
                shape = MarketRadius28,
                color = if (isDark) colorScheme.surface else Color.White,
                border = BorderStroke(1.dp, if (isDark) colorScheme.outline else Color(0xFFE2E8F0)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .clip(MarketRadius28)
                                .background(AccentEmerald.copy(alpha = 0.14f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_solar_archive_linear),
                                contentDescription = null,
                                tint = AccentEmerald,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Total archivé",
                                fontSize = 11.5.sp,
                                color = colorScheme.onSurfaceVariant,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = formatMarketAmount(totalSpent, currency),
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = colorScheme.onSurface
                            )
                            Text(
                                text = "${archivedItems.size} produit${if (archivedItems.size > 1) "s" else ""} • ${archiveBatches.size} session${if (archiveBatches.size > 1) "s" else ""}",
                                fontSize = 11.5.sp,
                                color = colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Surface(
                        shape = MarketRadius28,
                        color = Color(0xFFEF4444).copy(alpha = 0.12f),
                        modifier = Modifier.afroSpringClickable(
                            pressedScale = 0.92f,
                            haptic = AfroHapticKind.DESTRUCTIVE,
                            onClick = onRequestClearAll
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_solar_trash_linear),
                                contentDescription = "Vider les archives",
                                tint = Color(0xFFEF4444),
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Vider",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFEF4444)
                            )
                        }
                    }
                }
            }
        }

        // Grouped Archive Batches
        archiveBatches.forEach { (batchLabel, batchItems) ->
            val batchTotal = batchItems.sumOf { it.price ?: 0.0 }
            item(key = "batch_hdr_$batchLabel") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = batchLabel,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = colorScheme.onSurface
                        )
                        Text(
                            text = "${batchItems.size} article${if (batchItems.size > 1) "s" else ""} • ${formatMarketAmount(batchTotal, currency)}",
                            fontSize = 11.5.sp,
                            color = colorScheme.onSurfaceVariant
                        )
                    }

                    Surface(
                        shape = MarketRadius28,
                        color = AfroOrange.copy(alpha = 0.13f),
                        modifier = Modifier.afroSpringClickable(
                            pressedScale = 0.93f,
                            haptic = AfroHapticKind.SUCCESS
                        ) { onRestoreBatch(batchLabel) }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_solar_restart_linear),
                                contentDescription = "Tout racheter",
                                tint = AfroOrange,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(
                                text = "Tout racheter",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = AfroOrange
                            )
                        }
                    }
                }
            }

            itemsIndexed(
                items = batchItems,
                key = { _, item -> item.id }
            ) { index, item ->
                ArchivedItemCard(
                    item = item,
                    currency = currency,
                    onRestore = { onRestoreItem(item) },
                    onDelete = { onDeleteArchivedItem(item) },
                    modifier = Modifier
                        .animateItem()
                        .afroStaggeredEntrance(index = index)
                )
            }
        }
    }
}

@Composable
private fun MarketBudgetDashboardCard(
    totalCount: Int,
    checkedCount: Int,
    pricedCount: Int,
    totalEstimated: Double,
    checkedTotal: Double,
    remainingTotal: Double,
    currency: MarketCurrency
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val progress = if (totalCount > 0) checkedCount.toFloat() / totalCount.toFloat() else 0f
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = spring(dampingRatio = 0.80f, stiffness = Spring.StiffnessMediumLow),
        label = "marketProgress"
    )

    Surface(
        shape = MarketRadius28,
        color = if (isDark) colorScheme.surface else Color.White,
        border = BorderStroke(1.dp, if (isDark) colorScheme.outline else Color(0xFFE2E8F0)),
        shadowElevation = if (isDark) 0.dp else 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column {
                    Text(
                        text = "Budget marché estimé",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Medium,
                        color = colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = formatMarketAmount(totalEstimated, currency),
                        fontSize = 23.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = colorScheme.onSurface
                    )
                }

                Surface(
                    shape = MarketRadius28,
                    color = AccentEmerald.copy(alpha = 0.13f)
                ) {
                    Text(
                        text = "$checkedCount / $totalCount achetés",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = AccentEmerald,
                        modifier = Modifier.padding(horizontal = 11.dp, vertical = 5.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(MarketRadius28)
                    .background(if (isDark) colorScheme.surfaceVariant else Color(0xFFEDF2F7))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(animatedProgress.coerceIn(0f, 1f))
                        .fillMaxHeight()
                        .clip(MarketRadius28)
                        .background(
                            Brush.horizontalGradient(
                                listOf(AfroOrange, AccentEmerald)
                            )
                        )
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Dans le panier",
                        fontSize = 11.sp,
                        color = colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatMarketAmount(checkedTotal, currency),
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = AccentEmerald
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Produits chiffrés",
                        fontSize = 11.sp,
                        color = colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "$pricedCount / $totalCount",
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.onSurface
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Reste à payer",
                        fontSize = 11.sp,
                        color = colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatMarketAmount(remainingTotal, currency),
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = AfroOrange
                    )
                }
            }
        }
    }
}

@Composable
private fun MarketTabSwitcher(
    selectedTab: MarketTab,
    activeCount: Int,
    onSelectTab: (MarketTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val trackBg = if (isDark) colorScheme.surfaceVariant else Color(0xFFE9EEF5)
    val pillBg = if (isDark) colorScheme.surface else Color.White

    BoxWithConstraints(
        modifier = modifier
            .fillMaxWidth()
            .height(46.dp)
            .clip(MarketRadius28)
            .background(trackBg)
            .padding(4.dp)
    ) {
        val tabWidth = maxWidth / 2
        val targetOffset = if (selectedTab == MarketTab.BOUTIQUE) 0.dp else tabWidth
        val pillOffset by animateDpAsState(
            targetValue = targetOffset,
            animationSpec = spring(dampingRatio = 0.80f, stiffness = Spring.StiffnessMediumLow),
            label = "marketTabOffset"
        )

        Surface(
            modifier = Modifier
                .offset(x = pillOffset)
                .width(tabWidth)
                .fillMaxHeight(),
            shape = MarketRadius28,
            color = pillBg,
            shadowElevation = if (isDark) 0.dp else 2.dp
        ) {}

        Row(modifier = Modifier.fillMaxSize()) {
            listOf(
                Triple(MarketTab.BOUTIQUE, "Boutique", R.drawable.ic_solar_bag_linear),
                Triple(MarketTab.ACTIVE, "Ma liste ($activeCount)", R.drawable.ic_solar_clipboard_list_linear)
            ).forEach { (tab, label, iconRes) ->
                val isSelected = tab == selectedTab
                val textColor by animateColorAsState(
                    targetValue = if (isSelected) colorScheme.onSurface else colorScheme.onSurfaceVariant,
                    label = "marketTabColor"
                )
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clip(MarketRadius28)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) { onSelectTab(tab) },
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        painter = painterResource(id = iconRes),
                        contentDescription = null,
                        tint = if (isSelected) AfroOrange else colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = label,
                        fontSize = 13.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        color = textColor
                    )
                }
            }
        }
    }
}

@Composable
private fun MarketSectionLabel(
    title: String,
    accent: Color,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(7.dp)
                .clip(CircleShape)
                .background(accent)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = title,
            fontSize = 11.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 0.8.sp,
            color = accent
        )
    }
}

@Composable
private fun ShoppingItemCard(
    item: ShoppingItem,
    currency: MarketCurrency,
    isDragging: Boolean = false,
    onToggle: () -> Unit,
    onEditPrice: () -> Unit,
    onArchiveSingle: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val interactionSource = remember { MutableInteractionSource() }
    val baseCardBg = if (isDark) colorScheme.surface else Color.White
    val borderColor = if (isDragging) AfroOrange else if (isDark) colorScheme.outline else Color(0xFFE2E8F0)

    val cardBgColor by animateColorAsState(
        targetValue = if (item.isChecked) baseCardBg.copy(alpha = 0.72f) else baseCardBg,
        label = "itemBg"
    )
    val checkBg by animateColorAsState(
        targetValue = if (item.isChecked) AccentEmerald else Color.Transparent,
        label = "checkBg"
    )
    val checkPopScale by animateFloatAsState(
        targetValue = if (item.isChecked) 1.08f else 1f,
        animationSpec = spring(dampingRatio = 0.48f, stiffness = Spring.StiffnessMedium),
        label = "marketCheckPop"
    )

    Card(
        onClick = onToggle,
        interactionSource = interactionSource,
        modifier = modifier
            .fillMaxWidth()
            .animateContentSize()
            .afroCardPressMotion(interactionSource = interactionSource, pressedScale = 0.975f),
        shape = MarketRadius28,
        colors = CardDefaults.cardColors(containerColor = cardBgColor),
        border = BorderStroke(
            width = 1.dp,
            color = if (item.isChecked) AccentEmerald.copy(alpha = 0.35f) else borderColor
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 13.dp)
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
                    Surface(
                        modifier = Modifier
                            .size(25.dp)
                            .graphicsLayer {
                                scaleX = checkPopScale
                                scaleY = checkPopScale
                            },
                        shape = MarketRadius28,
                        color = checkBg,
                        border = if (item.isChecked) null else BorderStroke(
                            1.6.dp,
                            colorScheme.onSurfaceVariant.copy(alpha = 0.45f)
                        )
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            androidx.compose.animation.AnimatedVisibility(
                                visible = item.isChecked,
                                enter = scaleIn(spring(dampingRatio = 0.45f)) + fadeIn(),
                                exit = scaleOut() + fadeOut()
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_check_linear),
                                    contentDescription = "Acheté",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = item.name,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            textDecoration = if (item.isChecked) TextDecoration.LineThrough else TextDecoration.None,
                            color = if (item.isChecked) colorScheme.onSurfaceVariant else colorScheme.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )

                        Spacer(modifier = Modifier.height(3.dp))

                        Text(
                            text = "${item.quantity} • ${item.category}",
                            style = MaterialTheme.typography.bodySmall,
                            color = colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Interactive Montant Pill (28.dp)
                val hasPrice = (item.price ?: 0.0) > 0.0
                Surface(
                    shape = MarketRadius28,
                    color = if (hasPrice) {
                        if (item.isChecked) AccentEmerald.copy(alpha = 0.14f)
                        else AfroOrange.copy(alpha = 0.12f)
                    } else {
                        if (isDark) colorScheme.surfaceVariant else Color(0xFFF1F5F9)
                    },
                    border = if (!hasPrice) BorderStroke(
                        1.dp,
                        colorScheme.onSurfaceVariant.copy(alpha = 0.22f)
                    ) else null,
                    modifier = Modifier.afroSpringClickable(
                        pressedScale = 0.90f,
                        haptic = AfroHapticKind.SELECTION,
                        onClick = onEditPrice
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (hasPrice) {
                                formatMarketAmount(item.price!!, currency)
                            } else {
                                "+ Montant"
                            },
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = when {
                                hasPrice && item.isChecked -> AccentEmerald
                                hasPrice -> AfroOrange
                                else -> colorScheme.onSurfaceVariant
                            }
                        )
                        if (hasPrice) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(
                                painter = painterResource(id = R.drawable.ic_solar_pen_linear),
                                contentDescription = "Modifier le montant",
                                tint = if (item.isChecked) AccentEmerald else AfroOrange,
                                modifier = Modifier.size(12.dp)
                            )
                        }
                    }
                }
            }

            if (!item.recipeName.isNullOrBlank() || item.isChecked) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 37.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    if (!item.recipeName.isNullOrBlank()) {
                        Surface(
                            shape = MarketRadius28,
                            color = AfroOrange.copy(alpha = if (isDark) 0.18f else 0.10f),
                            modifier = Modifier.weight(1f, fill = false)
                        ) {
                            Text(
                                text = item.recipeName,
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = AfroOrange,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
                            )
                        }
                    } else {
                        Spacer(modifier = Modifier.width(1.dp))
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        androidx.compose.animation.AnimatedVisibility(visible = item.isChecked) {
                            Surface(
                                shape = MarketRadius28,
                                color = AccentEmerald.copy(alpha = 0.14f),
                                modifier = Modifier.afroSpringClickable(
                                    pressedScale = 0.90f,
                                    haptic = AfroHapticKind.SUCCESS,
                                    onClick = onArchiveSingle
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        painter = painterResource(id = R.drawable.ic_solar_archive_linear),
                                        contentDescription = "Archiver cet achat",
                                        tint = AccentEmerald,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Archiver",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = AccentEmerald
                                    )
                                }
                            }
                        }

                        Box(
                            modifier = Modifier
                                .size(30.dp)
                                .clip(MarketRadius28)
                                .afroSpringClickable(
                                    pressedScale = 0.80f,
                                    haptic = AfroHapticKind.DESTRUCTIVE,
                                    onClick = onDelete
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_solar_trash_linear),
                                contentDescription = "Supprimer",
                                tint = colorScheme.onSurfaceVariant.copy(alpha = 0.65f),
                                modifier = Modifier.size(17.dp)
                            )
                        }
                    }
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(MarketRadius28)
                            .afroSpringClickable(
                                pressedScale = 0.80f,
                                haptic = AfroHapticKind.DESTRUCTIVE,
                                onClick = onDelete
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_trash_linear),
                            contentDescription = "Supprimer",
                            tint = colorScheme.onSurfaceVariant.copy(alpha = 0.55f),
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ArchivedItemCard(
    item: ShoppingItem,
    currency: MarketCurrency,
    onRestore: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()

    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MarketRadius28,
        color = if (isDark) colorScheme.surface else Color.White,
        border = BorderStroke(1.dp, if (isDark) colorScheme.outline else Color(0xFFE2E8F0))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 13.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(MarketRadius28)
                        .background(AccentEmerald.copy(alpha = 0.14f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_check_linear),
                        contentDescription = null,
                        tint = AccentEmerald,
                        modifier = Modifier.size(14.dp)
                    )
                }

                Spacer(modifier = Modifier.width(11.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.name,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "${item.quantity} • ${item.category}",
                        fontSize = 11.5.sp,
                        color = colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (!item.recipeName.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            text = item.recipeName,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = AfroOrange,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            Column(horizontalAlignment = Alignment.End) {
                if ((item.price ?: 0.0) > 0.0) {
                    Text(
                        text = formatMarketAmount(item.price!!, currency),
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Surface(
                        shape = MarketRadius28,
                        color = AfroOrange.copy(alpha = 0.12f),
                        modifier = Modifier.afroSpringClickable(
                            pressedScale = 0.90f,
                            haptic = AfroHapticKind.SUCCESS,
                            onClick = onRestore
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_solar_restart_linear),
                                contentDescription = "Remettre au panier",
                                tint = AfroOrange,
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Racheter",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = AfroOrange
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(MarketRadius28)
                            .afroSpringClickable(
                                pressedScale = 0.80f,
                                haptic = AfroHapticKind.DESTRUCTIVE,
                                onClick = onDelete
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_solar_trash_linear),
                            contentDescription = "Supprimer de l'archive",
                            tint = colorScheme.onSurfaceVariant.copy(alpha = 0.55f),
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MarketArchiveActionDock(
    checkedCount: Int,
    checkedTotal: Double,
    currency: MarketCurrency,
    onClearChecked: () -> Unit,
    onArchiveChecked: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()

    Surface(
        shape = MarketTopSheetRadius28,
        color = if (isDark) colorScheme.surface else Color.White,
        border = BorderStroke(1.dp, if (isDark) colorScheme.outline else Color(0xFFE2E8F0)),
        shadowElevation = 10.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "$checkedCount produit${if (checkedCount > 1) "s" else ""} marqué${if (checkedCount > 1) "s" else ""}",
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = colorScheme.onSurface
                )
                Text(
                    text = if (checkedTotal > 0.0) {
                        "Total panier : ${formatMarketAmount(checkedTotal, currency)}"
                    } else {
                        "Prêts à être archivés"
                    },
                    fontSize = 11.5.sp,
                    color = AccentEmerald,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    shape = MarketRadius28,
                    color = colorScheme.surfaceVariant,
                    modifier = Modifier.afroSpringClickable(
                        pressedScale = 0.90f,
                        haptic = AfroHapticKind.DESTRUCTIVE,
                        onClick = onClearChecked
                    )
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_trash_linear),
                        contentDescription = "Supprimer les cochés",
                        tint = colorScheme.onSurfaceVariant,
                        modifier = Modifier
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                            .size(18.dp)
                    )
                }

                Button(
                    onClick = onArchiveChecked,
                    shape = MarketRadius28,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = AccentEmerald,
                        contentColor = Color.White
                    ),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_archive_linear),
                        contentDescription = null,
                        modifier = Modifier.size(17.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Archiver ($checkedCount)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun MarketEmptyState(
    icon: Int,
    title: String,
    subtitle: String,
    actionLabel: String?,
    onAction: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(68.dp)
                    .clip(MarketRadius28)
                    .background(AfroOrange.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = icon),
                    contentDescription = null,
                    tint = AfroOrange,
                    modifier = Modifier.size(32.dp)
                )
            }
            Spacer(modifier = Modifier.height(14.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = colorScheme.onSurfaceVariant,
                lineHeight = 18.sp
            )
            if (actionLabel != null) {
                Spacer(modifier = Modifier.height(18.dp))
                Button(
                    onClick = onAction,
                    shape = MarketRadius28,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = AfroOrange,
                        contentColor = Color.White
                    )
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_add_linear),
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(actionLabel, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

private sealed interface MarketEditorTarget {
    data class NewItem(val prefillName: String = "") : MarketEditorTarget
    data class EditExisting(val item: ShoppingItem) : MarketEditorTarget
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun MarketItemEditorSheet(
    target: MarketEditorTarget,
    currency: MarketCurrency,
    onDismiss: () -> Unit,
    onSaveNew: (name: String, quantity: String, category: String, price: Double?) -> Unit,
    onSaveExisting: (id: String, name: String, quantity: String, category: String, price: Double?) -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val existing = (target as? MarketEditorTarget.EditExisting)?.item
    var name by remember(target) {
        mutableStateOf(
            when (target) {
                is MarketEditorTarget.NewItem -> target.prefillName
                is MarketEditorTarget.EditExisting -> target.item.name
            }
        )
    }
    var quantity by remember(target) {
        mutableStateOf(existing?.quantity ?: "1")
    }
    var category by remember(target) {
        mutableStateOf(existing?.category ?: MARKET_CATEGORIES.first())
    }
    var priceText by remember(target) {
        mutableStateOf(
            existing?.price?.let { p ->
                if (currency == MarketCurrency.FCFA && p % 1.0 == 0.0) {
                    p.toInt().toString()
                } else {
                    p.toString()
                }
            } ?: ""
        )
    }

    val quickAmounts = remember(currency) {
        if (currency == MarketCurrency.FCFA) {
            listOf(500.0, 1000.0, 1500.0, 2000.0, 5000.0)
        } else {
            listOf(2.0, 5.0, 8.0, 10.0, 15.0)
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = if (isDark) colorScheme.surface else Color.White,
        shape = MarketTopSheetRadius28
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp)
                .padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (existing == null) "Ajouter un ingrédient" else "Modifier produit & montant",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = colorScheme.onSurface
                )
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(MarketRadius28)
                        .background(colorScheme.surfaceVariant)
                        .clickable(onClick = onDismiss),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_close_linear),
                        contentDescription = "Fermer",
                        tint = colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(17.dp)
                    )
                }
            }

            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Nom de l'ingrédient") },
                placeholder = { Text("Ex: Gombo frais, Poulet, Tomates...") },
                singleLine = true,
                shape = MarketRadius28,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AfroOrange,
                    cursorColor = AfroOrange
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = priceText,
                    onValueChange = { raw ->
                        priceText = raw.filter { it.isDigit() || it == '.' || it == ',' }
                    },
                    label = { Text("Montant (${currency.symbol})") },
                    placeholder = { Text(if (currency == MarketCurrency.FCFA) "1500" else "4.50") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    shape = MarketRadius28,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AfroOrange,
                        cursorColor = AfroOrange
                    ),
                    modifier = Modifier.weight(1f)
                )

                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it },
                    label = { Text("Quantité") },
                    placeholder = { Text("500 g") },
                    singleLine = true,
                    shape = MarketRadius28,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AfroOrange,
                        cursorColor = AfroOrange
                    ),
                    modifier = Modifier.weight(0.9f)
                )
            }

            // Quick Amount Chips (28.dp)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Montants rapides",
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colorScheme.onSurfaceVariant
                )
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    flingBehavior = rememberSmoothFlingBehavior()
                ) {
                    items(quickAmounts) { amt ->
                        Surface(
                            shape = MarketRadius28,
                            color = AfroOrange.copy(alpha = 0.12f),
                            modifier = Modifier.afroSpringClickable(
                                pressedScale = 0.92f,
                                haptic = AfroHapticKind.SELECTION
                            ) {
                                priceText = if (currency == MarketCurrency.FCFA) {
                                    amt.toInt().toString()
                                } else {
                                    amt.toString()
                                }
                            }
                        ) {
                            Text(
                                text = formatMarketAmount(amt, currency),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = AfroOrange,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }

            // Quick Quantity Chips (28.dp)
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                flingBehavior = rememberSmoothFlingBehavior()
            ) {
                items(QUICK_QUANTITIES) { qty ->
                    val selected = quantity.equals(qty, ignoreCase = true)
                    Surface(
                        shape = MarketRadius28,
                        color = if (selected) colorScheme.onSurface else colorScheme.surfaceVariant,
                        modifier = Modifier.afroSpringClickable(
                            pressedScale = 0.92f,
                            haptic = AfroHapticKind.SELECTION
                        ) { quantity = qty }
                    ) {
                        Text(
                            text = qty,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (selected) colorScheme.surface else colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            // Category Selection (28.dp)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Rayon / Catégorie",
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colorScheme.onSurfaceVariant
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    MARKET_CATEGORIES.forEach { cat ->
                        val selected = cat == category
                        Surface(
                            shape = MarketRadius28,
                            color = if (selected) AfroOrange else colorScheme.surfaceVariant,
                            modifier = Modifier.afroSpringClickable(
                                pressedScale = 0.94f,
                                haptic = AfroHapticKind.SELECTION
                            ) { category = cat }
                        ) {
                            Text(
                                text = cat,
                                fontSize = 11.5.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                color = if (selected) Color.White else colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }

            HorizontalDivider(color = colorScheme.outline.copy(alpha = 0.4f))

            Button(
                onClick = {
                    val parsedPrice = priceText.replace(',', '.').toDoubleOrNull()
                    if (existing == null) {
                        onSaveNew(name, quantity, category, parsedPrice)
                    } else {
                        onSaveExisting(existing.id, name, quantity, category, parsedPrice)
                    }
                },
                enabled = name.isNotBlank(),
                shape = MarketRadius28,
                colors = ButtonDefaults.buttonColors(
                    containerColor = AfroOrange,
                    contentColor = Color.White
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                Text(
                    text = if (existing == null) "Ajouter au marché" else "Enregistrer les modifications",
                    fontSize = 14.5.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

private fun formatMarketAmount(amount: Double, currency: MarketCurrency): String {
    return when (currency) {
        MarketCurrency.FCFA -> {
            val nf = NumberFormat.getIntegerInstance(Locale.FRANCE)
            "${nf.format(amount.toLong())} FCFA"
        }
        MarketCurrency.EUR -> {
            String.format(Locale.FRANCE, "%.2f €", amount)
        }
    }
}

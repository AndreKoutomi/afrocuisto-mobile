package com.afrocuisto.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.afrocuisto.app.R
import com.afrocuisto.app.data.model.Recipe
import com.afrocuisto.app.data.repository.AppNotification
import com.afrocuisto.app.data.repository.AppNotificationType
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import com.afrocuisto.app.ui.theme.nexaTitleEmphasis
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToInt

private val NotifEmerald = Color(0xFF10B981)
private val NotifDanger = Color(0xFFEF4444)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNotificationBottomSheet(
    notifications: List<AppNotification>,
    recipes: List<Recipe>,
    onDismiss: () -> Unit,
    onMarkAsRead: (String) -> Unit,
    onMarkAllAsRead: () -> Unit,
    onDelete: (String) -> Unit,
    onOpenRecipe: (String) -> Unit,
    onOpenMarket: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val sheetBg = if (isDark) colorScheme.surface else Color.White
    val subtleBg = if (isDark) colorScheme.surfaceVariant else Color(0xFFF8FAFC)
    val borderColor = if (isDark) colorScheme.outline else Color(0xFFE2E8F0)
    val titleColor = colorScheme.onSurface
    val subtitleColor = colorScheme.onSurfaceVariant
    val unreadCount = notifications.count { !it.isRead }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        containerColor = sheetBg,
        scrimColor = Color(0xFF0F172A).copy(alpha = 0.45f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
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
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "Notifications",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 19.sp,
                                color = titleColor,
                                modifier = Modifier.nexaTitleEmphasis()
                            )
                            if (unreadCount > 0) {
                                Surface(shape = CircleShape, color = AfroOrange) {
                                    Text(
                                        text = "$unreadCount",
                                        fontSize = 11.sp,
                                        lineHeight = 12.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                        Text(
                            text = if (notifications.isEmpty()) {
                                "Alertes et nouveautés AfroCuisto"
                            } else {
                                "Glissez pour marquer lu ou effacer"
                            },
                            fontSize = 12.sp,
                            color = subtitleColor
                        )
                    }
                }

                if (unreadCount > 0) {
                    TextButton(onClick = onMarkAllAsRead) {
                        Text(
                            text = "Tout lire",
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = AfroOrange
                        )
                    }
                }
            }

            if (notifications.isEmpty()) {
                Surface(
                    shape = RoundedCornerShape(24.dp),
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
                            text = "Nouvelles recettes ajoutées, confirmations de commandes et livraisons apparaîtront ici.",
                            fontSize = 12.5.sp,
                            lineHeight = 18.sp,
                            color = subtitleColor
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 470.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(notifications, key = { it.id }) { notif ->
                        val matchedRecipe = remember(notif.recipeId, recipes) {
                            notif.recipeId?.let { id -> recipes.find { it.id == id } }
                        }
                        SwipeableNotificationCard(
                            notification = notif,
                            recipe = matchedRecipe,
                            isDark = isDark,
                            onMarkAsRead = { onMarkAsRead(notif.id) },
                            onDelete = { onDelete(notif.id) },
                            onClick = {
                                onMarkAsRead(notif.id)
                                when {
                                    notif.recipeId != null -> {
                                        onDismiss()
                                        onOpenRecipe(notif.recipeId)
                                    }
                                    notif.actionRoute == "market" -> {
                                        onDismiss()
                                        onOpenMarket()
                                    }
                                }
                            }
                        )
                    }
                }
            }

            Button(
                onClick = onDismiss,
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
        }
    }
}

@Composable
private fun SwipeableNotificationCard(
    notification: AppNotification,
    recipe: Recipe?,
    isDark: Boolean,
    onMarkAsRead: () -> Unit,
    onDelete: () -> Unit,
    onClick: () -> Unit
) {
    val scope = rememberCoroutineScope()
    val haptics = rememberAfroHaptics()
    val density = LocalDensity.current
    val offsetX = remember(notification.id) { Animatable(0f) }
    var rawOffset by remember(notification.id) { mutableFloatStateOf(0f) }
    var removed by remember(notification.id) { mutableStateOf(false) }

    val revealWidthPx = with(density) { 142.dp.toPx() }
    val snapTriggerPx = with(density) { 46.dp.toPx() }

    AnimatedVisibility(
        visible = !removed,
        exit = shrinkVertically(tween(200)) + fadeOut(tween(180))
    ) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
        ) {
            val cardWidthPx = with(density) { maxWidth.toPx() }
            val halfCardPx = cardWidthPx * 0.5f
            val clampedRevealPx = minOf(revealWidthPx, halfCardPx)
            val swipingRight = offsetX.value > 0f
            val absOffset = abs(offsetX.value)
            val revealProgress = (absOffset / clampedRevealPx.coerceAtLeast(1f)).coerceIn(0f, 1f)

            val handleSwipeRelease: () -> Unit = {
                val current = rawOffset
                val absX = abs(current)
                val dir = if (current >= 0f) 1f else -1f
                scope.launch {
                    if (absX >= snapTriggerPx) {
                        haptics.selectionTick()
                        val snapTarget = dir * clampedRevealPx
                        rawOffset = snapTarget
                        offsetX.animateTo(
                            snapTarget,
                            spring(dampingRatio = 0.78f, stiffness = 360f)
                        )
                    } else {
                        rawOffset = 0f
                        offsetX.animateTo(
                            0f,
                            spring(dampingRatio = 0.82f, stiffness = 380f)
                        )
                    }
                }
            }

            // Stationary outer gesture host (never shifts with offsetX)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .pointerInput(notification.id, cardWidthPx) {
                        detectHorizontalDragGestures(
                            onHorizontalDrag = { change, dragAmount ->
                                change.consume()
                                rawOffset = (rawOffset + dragAmount).coerceIn(-halfCardPx, halfCardPx)
                                val target = rawOffset
                                scope.launch { offsetX.snapTo(target) }
                            },
                            onDragEnd = { handleSwipeRelease() },
                            onDragCancel = { handleSwipeRelease() }
                        )
                    }
            ) {
                // Background Action Tray (only visible while swiped so it never bleeds through)
                if (absOffset > 1f) {
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(if (isDark) Color(0xFF1A1E28) else Color(0xFFF1F5F9))
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        contentAlignment = if (swipingRight) Alignment.CenterStart else Alignment.CenterEnd
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .scale(0.82f + 0.18f * revealProgress)
                                .alpha(revealProgress)
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier
                                    .clip(RoundedCornerShape(14.dp))
                                    .clickable {
                                        haptics.selectionTick()
                                        onMarkAsRead()
                                        scope.launch {
                                            rawOffset = 0f
                                            offsetX.animateTo(
                                                0f,
                                                spring(dampingRatio = Spring.DampingRatioNoBouncy)
                                            )
                                        }
                                    }
                                    .padding(horizontal = 6.dp, vertical = 4.dp)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = if (notification.isRead) NotifEmerald.copy(alpha = 0.65f) else NotifEmerald,
                                    modifier = Modifier.size(40.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            painter = painterResource(id = R.drawable.ic_solar_check_circle_linear),
                                            contentDescription = "Lu",
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                                Text(
                                    text = "Lu",
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = NotifEmerald
                                )
                            }

                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier
                                    .clip(RoundedCornerShape(14.dp))
                                    .clickable {
                                        haptics.actionSuccess()
                                        scope.launch {
                                            val dir = if (offsetX.value >= 0f) 1f else -1f
                                            val exitTarget = dir * cardWidthPx * 1.15f
                                            rawOffset = exitTarget
                                            offsetX.animateTo(exitTarget, tween(170))
                                            removed = true
                                            onDelete()
                                        }
                                    }
                                    .padding(horizontal = 6.dp, vertical = 4.dp)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = NotifDanger,
                                    modifier = Modifier.size(40.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            painter = painterResource(id = R.drawable.ic_solar_trash_linear),
                                            contentDescription = "Effacer",
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                                Text(
                                    text = "Effacer",
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = NotifDanger
                                )
                            }
                        }
                    }
                }

                // Foreground Notification Card
                Box(
                    modifier = Modifier
                        .offset { IntOffset(offsetX.value.roundToInt(), 0) }
                        .fillMaxWidth()
                        .clickable {
                            if (abs(rawOffset) > 12f) {
                                scope.launch {
                                    rawOffset = 0f
                                    offsetX.animateTo(0f, spring())
                                }
                            } else {
                                onClick()
                            }
                        }
                ) {
                    if (notification.type == AppNotificationType.NEW_RECIPE) {
                        NewRecipeNotificationCard(
                            notification = notification,
                            recipe = recipe,
                            isDark = isDark
                        )
                    } else {
                        StandardNotificationCard(
                            notification = notification,
                            isDark = isDark
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun NewRecipeNotificationCard(
    notification: AppNotification,
    recipe: Recipe?,
    isDark: Boolean
) {
    val colorScheme = MaterialTheme.colorScheme
    val cardBg = if (isDark) colorScheme.surfaceVariant else Color.White
    val borderColor = if (!notification.isRead) {
        AfroOrange.copy(alpha = 0.45f)
    } else if (isDark) {
        colorScheme.outline
    } else {
        Color(0xFFE2E8F0)
    }
    val timeText = remember(notification.createdAtMillis) {
        SimpleDateFormat("HH:mm", Locale.FRENCH).format(Date(notification.createdAtMillis))
    }

    Surface(
        shape = RoundedCornerShape(20.dp),
        color = cardBg,
        border = BorderStroke(if (!notification.isRead) 1.5.dp else 1.dp, borderColor),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Dish Hero Image Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(Color(0xFF1E1E2D), Color(0xFF31221A), AfroOrange)
                        )
                    )
            ) {
                if (recipe != null && recipe.image.isNotBlank()) {
                    AsyncImage(
                        model = recipe.image,
                        contentDescription = recipe.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(
                                        Color.Black.copy(alpha = 0.15f),
                                        Color.Black.copy(alpha = 0.72f)
                                    )
                                )
                            )
                    )
                }

                // Top badges
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(shape = CircleShape, color = AfroOrange) {
                        Text(
                            text = "NOUVEAU PLAT",
                            fontSize = 9.5.sp,
                            lineHeight = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            letterSpacing = 0.5.sp,
                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                        )
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Color.Black.copy(alpha = 0.48f)
                        ) {
                            Text(
                                text = timeText,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                        if (!notification.isRead) {
                            Box(
                                modifier = Modifier
                                    .size(9.dp)
                                    .clip(CircleShape)
                                    .background(AfroOrange)
                                    .border(1.5.dp, Color.White, CircleShape)
                            )
                        }
                    }
                }

                // Bottom Dish Title & Meta
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(12.dp)
                ) {
                    Text(
                        text = recipe?.name ?: notification.title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (recipe != null) {
                        Text(
                            text = "${recipe.region} • ${recipe.prepTime} • ★ ${recipe.rating}",
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White.copy(alpha = 0.9f)
                        )
                    }
                }
            }

            // Bottom Body & CTA
            Column(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = recipe?.description?.takeIf { it.isNotBlank() } ?: notification.body,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    color = colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (notification.isRead) "Lu" else "Nouveau",
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (notification.isRead) colorScheme.onSurfaceVariant else NotifEmerald
                    )
                    Text(
                        text = "Découvrir la recette →",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = AfroOrange
                    )
                }
            }
        }
    }
}

@Composable
private fun StandardNotificationCard(
    notification: AppNotification,
    isDark: Boolean
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDelivered = notification.type == AppNotificationType.ORDER_DELIVERED
    val isOrder = notification.type == AppNotificationType.ORDER_CREATED || isDelivered
    val accent = when (notification.type) {
        AppNotificationType.ORDER_DELIVERED -> NotifEmerald
        AppNotificationType.ORDER_CREATED -> AfroOrange
        else -> colorScheme.primary
    }
    val iconRes = when (notification.type) {
        AppNotificationType.ORDER_DELIVERED -> R.drawable.ic_solar_delivery_linear
        AppNotificationType.ORDER_CREATED -> R.drawable.ic_solar_bag_bold
        else -> R.drawable.ic_solar_bell_linear
    }
    val cardBg = if (isDark) colorScheme.surfaceVariant else Color.White
    val borderColor = if (!notification.isRead) {
        accent.copy(alpha = 0.42f)
    } else if (isDark) {
        colorScheme.outline
    } else {
        Color(0xFFE2E8F0)
    }
    val timeText = remember(notification.createdAtMillis) {
        SimpleDateFormat("HH:mm", Locale.FRENCH).format(Date(notification.createdAtMillis))
    }

    Surface(
        shape = RoundedCornerShape(20.dp),
        color = cardBg,
        border = BorderStroke(if (!notification.isRead) 1.5.dp else 1.dp, borderColor),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Surface(
                shape = CircleShape,
                color = accent.copy(alpha = 0.14f),
                modifier = Modifier.size(40.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        painter = painterResource(id = iconRes),
                        contentDescription = null,
                        tint = accent,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = notification.title,
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = timeText,
                            fontSize = 10.5.sp,
                            color = colorScheme.onSurfaceVariant
                        )
                        if (!notification.isRead) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(accent)
                            )
                        }
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = notification.body,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    color = colorScheme.onSurfaceVariant,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
                if (isOrder) {
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = if (isDelivered) "Commande livrée • Voir dans Boutique →" else "Suivre ma commande →",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = accent
                    )
                }
            }
        }
    }
}

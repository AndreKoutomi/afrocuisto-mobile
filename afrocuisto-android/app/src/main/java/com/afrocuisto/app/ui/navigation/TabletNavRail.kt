package com.afrocuisto.app.ui.navigation

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.afrocuisto.app.R
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.isAfroDarkTheme

/**
 * Centered floating pill navigation bar rendered exclusively on tablets (>= 600dp).
 * Does not span the full screen width in landscape; mobile phones (< 600dp) keep [CustomBottomNavBar].
 */
@Composable
fun TabletFloatingNavBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit,
    onOpenAiChef: () -> Unit,
    marketBadgeCount: Int = 0,
    modifier: Modifier = Modifier
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptics = rememberAfroHaptics()

    val surfaceColor = if (isDark) colorScheme.surface.copy(alpha = 0.96f) else Color.White.copy(alpha = 0.97f)
    val borderColor = if (isDark) colorScheme.outline.copy(alpha = 0.7f) else Color(0xFFE5E7EB)
    val inactiveColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF475569)
    val activePillBg = AfroOrange.copy(alpha = if (isDark) 0.18f else 0.12f)

    Box(
        modifier = modifier
            .navigationBarsPadding()
            .padding(horizontal = 24.dp, vertical = 14.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier.widthIn(max = 780.dp),
            shape = CircleShape,
            color = surfaceColor,
            shadowElevation = 10.dp,
            border = BorderStroke(1.dp, borderColor)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                bottomNavItems.forEach { item ->
                    val selected = currentRoute == item.route
                    val interactionSource = remember { MutableInteractionSource() }
                    val isPressed by interactionSource.collectIsPressedAsState()
                    val itemColor by animateColorAsState(
                        targetValue = if (selected) AfroOrange else inactiveColor,
                        label = "tabletPillItemColor"
                    )
                    val pressScale by animateFloatAsState(
                        targetValue = if (isPressed) 0.92f else 1f,
                        animationSpec = spring(
                            dampingRatio = Spring.DampingRatioNoBouncy,
                            stiffness = Spring.StiffnessHigh
                        ),
                        label = "tabletPillPressScale"
                    )

                    Row(
                        modifier = Modifier
                            .graphicsLayer {
                                scaleX = pressScale
                                scaleY = pressScale
                            }
                            .clip(CircleShape)
                            .background(if (selected) activePillBg else Color.Transparent)
                            .clickable(
                                interactionSource = interactionSource,
                                indication = null
                            ) {
                                haptics.navigationTap()
                                if (item.route == Screen.AiChef.route) {
                                    onOpenAiChef()
                                } else if (!selected) {
                                    onNavigate(item.route)
                                }
                            }
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Box(contentAlignment = Alignment.TopEnd) {
                            Icon(
                                painter = painterResource(
                                    id = if (selected) item.selectedIconRes else item.unselectedIconRes
                                ),
                                contentDescription = item.title,
                                tint = itemColor,
                                modifier = Modifier.size(20.dp)
                            )

                            if (item.route == Screen.Market.route && marketBadgeCount > 0) {
                                AnimatedContent(
                                    targetState = marketBadgeCount,
                                    transitionSpec = {
                                        (scaleIn(spring(dampingRatio = 0.5f)) + fadeIn()).togetherWith(
                                            scaleOut() + fadeOut()
                                        )
                                    },
                                    label = "tabletPillMarketBadge",
                                    modifier = Modifier.offset(x = 7.dp, y = (-5).dp)
                                ) { count ->
                                    Box(
                                        modifier = Modifier
                                            .background(AfroOrange, CircleShape)
                                            .padding(horizontal = 4.dp, vertical = 1.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = if (count > 99) "99+" else "$count",
                                            color = Color.White,
                                            fontSize = 8.5.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            lineHeight = 9.sp
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.width(6.dp))

                        Text(
                            text = item.title,
                            color = itemColor,
                            fontSize = 12.5.sp,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                // Solid AfroOrange Chef IA pill button at the end of the floating bar
                val chefInteraction = remember { MutableInteractionSource() }
                val chefPressed by chefInteraction.collectIsPressedAsState()
                val chefScale by animateFloatAsState(
                    targetValue = if (chefPressed) 0.92f else 1f,
                    label = "tabletPillChefScale"
                )
                Row(
                    modifier = Modifier
                        .graphicsLayer {
                            scaleX = chefScale
                            scaleY = chefScale
                        }
                        .clip(CircleShape)
                        .background(AfroOrange)
                        .clickable(
                            interactionSource = chefInteraction,
                            indication = null
                        ) {
                            haptics.navigationTap()
                            onOpenAiChef()
                        }
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_solar_magic_stick_linear),
                        contentDescription = "Chef IA",
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Chef IA",
                        color = Color.White,
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        softWrap = false
                    )
                }
            }
        }
    }
}

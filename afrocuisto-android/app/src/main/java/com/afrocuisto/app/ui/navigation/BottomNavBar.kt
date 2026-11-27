package com.afrocuisto.app.ui.navigation

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.i18n.tr
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.isAfroDarkTheme

/**
 * Docked bottom navigation bar with spring physics, active icon lift/bounce,
 * animated market counter badge, and crisp linear-actuator navigation haptics.
 */
@Composable
fun CustomBottomNavBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit,
    onOpenAiChef: () -> Unit,
    marketBadgeCount: Int = 0
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val haptics = rememberAfroHaptics()

    val surfaceColor = if (isDark) colorScheme.surface else Color.White
    val dividerColor = if (isDark) colorScheme.outline else Color(0xFFEAECEF)
    val inactiveColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF475569)

    val selectedIndex = remember(currentRoute) {
        bottomNavItems.indexOfFirst { it.route == currentRoute }.coerceAtLeast(0)
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = surfaceColor,
        shadowElevation = 6.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
        ) {
            BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                val tabWidth = maxWidth / bottomNavItems.size
                val indicatorWidth = 42.dp
                val targetOffset = tabWidth * selectedIndex + (tabWidth - indicatorWidth) / 2

                val animatedOffset by animateDpAsState(
                    targetValue = targetOffset,
                    animationSpec = spring(
                        dampingRatio = 0.76f,
                        stiffness = Spring.StiffnessMediumLow
                    ),
                    label = "navTopIndicatorOffset"
                )

                HorizontalDivider(
                    thickness = 1.dp,
                    color = dividerColor
                )

                // Sliding active top indicator bar with subtle spring bounce
                Box(
                    modifier = Modifier
                        .offset(x = animatedOffset)
                        .width(indicatorWidth)
                        .height(2.5.dp)
                        .background(
                            color = AfroOrange,
                            shape = RoundedCornerShape(bottomStart = 2.dp, bottomEnd = 2.dp)
                        )
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(62.dp)
                    .padding(horizontal = 4.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                bottomNavItems.forEach { item ->
                    val selected = currentRoute == item.route
                    val interactionSource = remember { MutableInteractionSource() }
                    val isPressed by interactionSource.collectIsPressedAsState()

                    val itemColor by animateColorAsState(
                        targetValue = if (selected) AfroOrange else inactiveColor,
                        label = "navItemColor"
                    )

                    val pressScale by animateFloatAsState(
                        targetValue = if (isPressed) 0.86f else 1f,
                        animationSpec = spring(
                            dampingRatio = Spring.DampingRatioNoBouncy,
                            stiffness = Spring.StiffnessHigh
                        ),
                        label = "navPressScale"
                    )

                    val iconPop = remember { Animatable(1f) }
                    LaunchedEffect(selected) {
                        if (selected) {
                            iconPop.snapTo(0.84f)
                            iconPop.animateTo(
                                targetValue = 1.06f,
                                animationSpec = spring(
                                    dampingRatio = 0.46f,
                                    stiffness = Spring.StiffnessMedium
                                )
                            )
                            iconPop.animateTo(
                                targetValue = 1f,
                                animationSpec = spring(
                                    dampingRatio = 0.75f,
                                    stiffness = Spring.StiffnessMediumLow
                                )
                            )
                        }
                    }

                    val activeLiftDp by animateDpAsState(
                        targetValue = if (selected) (-1.5).dp else 0.dp,
                        animationSpec = spring(
                            dampingRatio = 0.72f,
                            stiffness = Spring.StiffnessMedium
                        ),
                        label = "navActiveLift"
                    )

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .graphicsLayer {
                                scaleX = pressScale
                                scaleY = pressScale
                            }
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
                            .padding(vertical = 8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            contentAlignment = Alignment.TopEnd,
                            modifier = Modifier
                                .offset(y = activeLiftDp)
                                .graphicsLayer {
                                    scaleX = iconPop.value
                                    scaleY = iconPop.value
                                }
                        ) {
                            Icon(
                                painter = painterResource(
                                    id = if (selected) item.selectedIconRes else item.unselectedIconRes
                                ),
                                contentDescription = item.title,
                                tint = itemColor,
                                modifier = Modifier.size(22.dp)
                            )

                            if (item.route == Screen.Market.route && marketBadgeCount > 0) {
                                AnimatedContent(
                                    targetState = marketBadgeCount,
                                    transitionSpec = {
                                        (scaleIn(spring(dampingRatio = 0.5f)) + fadeIn()).togetherWith(
                                            scaleOut() + fadeOut()
                                        )
                                    },
                                    label = "marketNavBadge",
                                    modifier = Modifier.offset(x = 8.dp, y = (-4).dp)
                                ) { count ->
                                    Box(
                                        modifier = Modifier
                                            .background(AfroOrange, CircleShape)
                                            .padding(horizontal = 4.5.dp, vertical = 1.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = if (count > 99) "99+" else "$count",
                                            color = Color.White,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            lineHeight = 10.sp
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        val localizedTitle = when (item.route) {
                            Screen.Home.route -> tr("Accueil", "Home", "Inicio")
                            Screen.Recipes.route -> tr("Recettes", "Recipes", "Recetas")
                            Screen.Favorites.route -> tr("Favoris", "Favorites", "Favoritos")
                            Screen.Market.route -> tr("Marché", "Market", "Mercado")
                            Screen.Community.route -> tr("Communauté", "Community", "Comunidad")
                            else -> item.title
                        }
                        Text(
                            text = localizedTitle,
                            color = itemColor,
                            fontSize = 11.sp,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}

package com.afrocuisto.app.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Window width breakpoints aligned with Material 3 adaptive guidance:
 * - [COMPACT]: < 600dp (phones — keeps original mobile layout untouched)
 * - [MEDIUM]: 600dp..839dp (portrait tablets, unfolded foldables)
 * - [EXPANDED]: >= 840dp (landscape tablets, large screens)
 */
enum class AfroWindowWidthClass {
    COMPACT,
    MEDIUM,
    EXPANDED
}

@Composable
fun rememberAfroWindowWidthClass(): AfroWindowWidthClass {
    val widthDp = LocalConfiguration.current.screenWidthDp
    return when {
        widthDp >= 840 -> AfroWindowWidthClass.EXPANDED
        widthDp >= 600 -> AfroWindowWidthClass.MEDIUM
        else -> AfroWindowWidthClass.COMPACT
    }
}

@Composable
fun rememberIsTablet(): Boolean = rememberAfroWindowWidthClass() != AfroWindowWidthClass.COMPACT

fun adaptiveGridColumns(widthClass: AfroWindowWidthClass): Int = when (widthClass) {
    AfroWindowWidthClass.COMPACT -> 2
    AfroWindowWidthClass.MEDIUM -> 3
    AfroWindowWidthClass.EXPANDED -> 4
}

/**
 * On phones ([AfroWindowWidthClass.COMPACT]), renders [content] full-bleed with zero changes.
 * On tablets, centers [content] within [maxWidth] so feeds, forms, and detail views stay readable.
 */
@Composable
fun AdaptiveCenteredContainer(
    modifier: Modifier = Modifier,
    maxWidth: Dp = 880.dp,
    content: @Composable BoxScope.() -> Unit
) {
    val isTablet = rememberIsTablet()
    if (!isTablet) {
        Box(modifier = modifier.fillMaxSize(), content = content)
    } else {
        Box(
            modifier = modifier.fillMaxSize(),
            contentAlignment = Alignment.TopCenter
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .widthIn(max = maxWidth),
                content = content
            )
        }
    }
}

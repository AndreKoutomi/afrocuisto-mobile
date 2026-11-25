package com.afrocuisto.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.NexaFontFamily
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import com.afrocuisto.app.ui.theme.nexaTitleEmphasis

/**
 * Shared editorial top header matching the Recipes screen across Favorites, Market, and Community.
 */
@Composable
fun EditorialPageHeader(
    title: String,
    modifier: Modifier = Modifier,
    trailingAction: (@Composable RowScope.() -> Unit)? = null,
    content: (@Composable ColumnScope.() -> Unit)? = null
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val titleColor = if (isDark) colorScheme.onBackground else Color(0xFF1E1E2D)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .animateContentSize(animationSpec = tween(durationMillis = 220))
            .padding(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            AnimatedContent(
                targetState = title,
                transitionSpec = {
                    (slideInVertically(tween(220)) { it / 3 } + fadeIn(tween(220)))
                        .togetherWith(slideOutVertically(tween(160)) { -it / 3 } + fadeOut(tween(160)))
                },
                label = "editorialHeaderTitle"
            ) { animatedTitle ->
                Text(
                    text = animatedTitle,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = (-0.4).sp,
                    color = titleColor,
                    modifier = Modifier.nexaTitleEmphasis()
                )
            }
            if (trailingAction != null) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    content = trailingAction
                )
            }
        }

        if (content != null) {
            Spacer(modifier = Modifier.height(14.dp))
            content()
        }
    }
}

/**
 * Shared 44.dp #FFFFFF / 12.dp-radius input bar matching the Recipes search bar.
 */
@Composable
fun EditorialSearchBar(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    leadingIcon: ImageVector? = Icons.Default.Search,
    shape: Shape = RoundedCornerShape(20.dp)
) {
    val colorScheme = MaterialTheme.colorScheme
    val isDark = isAfroDarkTheme()
    val titleColor = if (isDark) colorScheme.onBackground else Color(0xFF1E1E2D)
    val borderStrokeColor = if (isDark) colorScheme.outline else Color(0xFFE2E8F0)
    val placeholderColor = if (isDark) colorScheme.onSurfaceVariant else Color(0xFF94A3B8)
    var isFocused by remember { mutableStateOf(false) }
    val animatedBorderColor by animateColorAsState(
        targetValue = if (isFocused) AfroOrange.copy(alpha = 0.7f) else borderStrokeColor,
        label = "editorialSearchBorder"
    )

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .height(38.dp),
        shape = shape,
        color = if (isDark) colorScheme.surface else Color.White,
        border = BorderStroke(1.dp, animatedBorderColor)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 13.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (leadingIcon != null) {
                Icon(
                    imageVector = leadingIcon,
                    contentDescription = null,
                    tint = if (isFocused) AfroOrange else placeholderColor,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Box(modifier = Modifier.weight(1f)) {
                if (value.isEmpty()) {
                    Text(
                        text = placeholder,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = placeholderColor,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    singleLine = true,
                    textStyle = TextStyle(
                        fontFamily = NexaFontFamily,
                        color = titleColor,
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.Medium
                    ),
                    cursorBrush = SolidColor(AfroOrange),
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { isFocused = it.isFocused }
                )
            }
            if (value.isNotBlank() || isFocused) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Effacer",
                    tint = placeholderColor,
                    modifier = Modifier
                        .size(16.dp)
                        .afroSpringClickable(
                            pressedScale = 0.80f,
                            haptic = AfroHapticKind.SELECTION
                        ) { onValueChange("") }
                )
            }
        }
    }
}

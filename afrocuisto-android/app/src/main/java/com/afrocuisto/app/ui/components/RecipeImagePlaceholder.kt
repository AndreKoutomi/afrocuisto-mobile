package com.afrocuisto.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.compose.AsyncImagePainter
import com.afrocuisto.app.R
import com.afrocuisto.app.ui.theme.isAfroDarkTheme

@Composable
fun RecipeImageOrSkeleton(
    model: Any?,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
    iconSize: Dp = 30.dp
) {
    val isDark = isAfroDarkTheme()
    val hasValidModel = when (model) {
        null -> false
        is String -> model.isNotBlank()
        else -> true
    }
    var isError by remember(model) { mutableStateOf(false) }

    Box(modifier = modifier) {
        if (!hasValidModel || isError) {
            RecipeEmptyImageSkeleton(
                isDark = isDark,
                iconSize = iconSize,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            AsyncImage(
                model = model,
                contentDescription = contentDescription,
                contentScale = contentScale,
                onState = { state ->
                    isError = state is AsyncImagePainter.State.Error
                },
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}

@Composable
fun RecipeEmptyImageSkeleton(
    isDark: Boolean = isAfroDarkTheme(),
    iconSize: Dp = 30.dp,
    modifier: Modifier = Modifier
) {
    val baseColor = if (isDark) Color(0xFF22201D) else Color(0xFFF1EFEA)
    val iconTint = if (isDark) Color(0xFF6E6860) else Color(0xFFA8A298)

    Box(
        modifier = modifier.background(baseColor),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            painter = painterResource(id = R.drawable.ic_solar_gallery_linear),
            contentDescription = null,
            tint = iconTint,
            modifier = Modifier.size(iconSize)
        )
    }
}

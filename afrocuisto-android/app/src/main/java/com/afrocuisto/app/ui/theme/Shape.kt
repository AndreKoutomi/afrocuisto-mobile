package com.afrocuisto.app.ui.theme

import androidx.compose.foundation.shape.CornerBasedShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

/**
 * Material 3 Expressive Shape Definitions for AfroCuisto.
 * Features expressive rounded corners, asymmetric squircle variations, and pill shapes.
 */
val ExpressiveShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(28.dp),
    extraLarge = RoundedCornerShape(36.dp)
)

// Asymmetric & Custom Expressive Corner Shapes
val ExpressiveAsymmetricCardShape: CornerBasedShape = RoundedCornerShape(
    topStart = 28.dp,
    topEnd = 8.dp,
    bottomEnd = 28.dp,
    bottomStart = 28.dp
)

val ExpressiveBannerShape: CornerBasedShape = RoundedCornerShape(
    topStart = 32.dp,
    topEnd = 32.dp,
    bottomEnd = 16.dp,
    bottomStart = 16.dp
)

val ExpressiveChipShape: CornerBasedShape = RoundedCornerShape(16.dp)

val ExpressivePillShape: CornerBasedShape = RoundedCornerShape(50)

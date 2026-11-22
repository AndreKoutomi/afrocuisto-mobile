package com.afrocuisto.app.ui.theme

import androidx.compose.ui.graphics.Color

// ============================================================================
// AfroCuisto Editorial Gastronomic Palette (Brand Primary: #FB5607)
// ============================================================================

// Brand Primary Orange
val AfroOrange = Color(0xFFFB5607)
val AfroOrangeLight = Color(0xFFFF7A2A)
val AfroOrangeDark = Color(0xFFE04800)
val AfroOrangeContainer = Color(0xFFFFF3EC)
val OnAfroOrange = Color(0xFFFFFFFF)

// Neutral Editorial Surfaces (Light)
val SurfacePureWhite = Color(0xFFFFFFFF)
val BackgroundOffWhite = Color(0xFFFAFAF8)
val CardSurfaceLight = Color(0xFFFFFFFF)
val CardSurfaceVariant = Color(0xFFF4F1EA)

val TextPrimaryDark = Color(0xFF1A1918)
val TextSecondaryGray = Color(0xFF6E6A64)
val TextMutedLight = Color(0xFFA39E96)

val BorderSubtleLight = Color(0xFFEAE6DF)

// M3 Light Theme Tokens
val md_theme_light_primary = AfroOrange
val md_theme_light_onPrimary = OnAfroOrange
val md_theme_light_primaryContainer = AfroOrangeContainer
val md_theme_light_onPrimaryContainer = Color(0xFF5C1900)

val md_theme_light_secondary = Color(0xFF1A1918)
val md_theme_light_onSecondary = Color(0xFFFFFFFF)
val md_theme_light_secondaryContainer = Color(0xFFF4F1EA)
val md_theme_light_onSecondaryContainer = Color(0xFF2B2825)

val md_theme_light_tertiary = Color(0xFFD97706)
val md_theme_light_onTertiary = Color(0xFFFFFFFF)
val md_theme_light_tertiaryContainer = Color(0xFFFEF3C7)
val md_theme_light_onTertiaryContainer = Color(0xFF78350F)

val md_theme_light_error = Color(0xFFEF4444)
val md_theme_light_onError = Color(0xFFFFFFFF)

val md_theme_light_background = BackgroundOffWhite
val md_theme_light_onBackground = TextPrimaryDark

val md_theme_light_surface = SurfacePureWhite
val md_theme_light_onSurface = TextPrimaryDark
val md_theme_light_surfaceVariant = CardSurfaceVariant
val md_theme_light_onSurfaceVariant = TextSecondaryGray
val md_theme_light_outline = BorderSubtleLight
val md_theme_light_outlineVariant = Color(0xFFF2EFE9)

// M3 Surface Containers (Light)
val md_theme_light_surfaceContainerLowest = Color(0xFFFFFFFF)
val md_theme_light_surfaceContainerLow = Color(0xFFFAFAF8)
val md_theme_light_surfaceContainer = Color(0xFFF4F1EA)
val md_theme_light_surfaceContainerHigh = Color(0xFFEAE6DF)
val md_theme_light_surfaceContainerHighest = Color(0xFFDFDAD0)

// M3 Dark Theme Tokens (Rich Anthracite & Espresso)
val md_theme_dark_primary = AfroOrange
val md_theme_dark_onPrimary = OnAfroOrange
val md_theme_dark_primaryContainer = Color(0xFF4A1803)
val md_theme_dark_onPrimaryContainer = Color(0xFFFFD8C4)

val md_theme_dark_secondary = Color(0xFFF5F3EF)
val md_theme_dark_onSecondary = Color(0xFF1A1918)
val md_theme_dark_secondaryContainer = Color(0xFF282522)
val md_theme_dark_onSecondaryContainer = Color(0xFFF5F3EF)

val md_theme_dark_tertiary = AfroOrangeLight
val md_theme_dark_onTertiary = Color(0xFF1A1918)
val md_theme_dark_tertiaryContainer = Color(0xFF4A2506)
val md_theme_dark_onTertiaryContainer = Color(0xFFFEF3C7)

val md_theme_dark_error = Color(0xFFF87171)
val md_theme_dark_onError = Color(0xFF7F1D1D)

val md_theme_dark_background = Color(0xFF121110)
val md_theme_dark_onBackground = Color(0xFFF5F3EF)

val md_theme_dark_surface = Color(0xFF1A1816)
val md_theme_dark_onSurface = Color(0xFFF5F3EF)
val md_theme_dark_surfaceVariant = Color(0xFF23201D)
val md_theme_dark_onSurfaceVariant = Color(0xFFA8A29E)
val md_theme_dark_outline = Color(0xFF2E2C29)
val md_theme_dark_outlineVariant = Color(0xFF242220)

val md_theme_dark_surfaceContainerLowest = Color(0xFF0E0D0C)
val md_theme_dark_surfaceContainerLow = Color(0xFF1A1816)
val md_theme_dark_surfaceContainer = Color(0xFF1E1D1B)
val md_theme_dark_surfaceContainerHigh = Color(0xFF262421)
val md_theme_dark_surfaceContainerHighest = Color(0xFF2E2C29)

// Rating & Semantic Colors
val StarGold = Color(0xFFFBBF24)
val AccentGold = Color(0xFFF59E0B)
val AccentGreen = Color(0xFF22C55E)
val AccentEmerald = Color(0xFF10B981)
val LikeRed = Color(0xFFEF4444)

val DifficultyEasy = Color(0xFF10B981)
val DifficultyMedium = AfroOrange
val DifficultyHard = Color(0xFFEF4444)

// Backward-compatible aliases (migrated from SunYellow to AfroOrange #FB5607)
val SunYellow = AfroOrange
val SunYellowDark = AfroOrangeDark
val SunYellowLight = AfroOrangeLight
val SunYellowContainer = AfroOrangeContainer
val OnSunYellow = OnAfroOrange

val PrimaryOrange = AfroOrange
val PrimaryOrangeLight = AfroOrangeLight
val PrimaryOrangeDark = AfroOrangeDark

val PrimaryLight = AfroOrange
val PrimaryDark = AfroOrangeDark
val PrimaryContainer = AfroOrangeContainer
val OnPrimaryContainer = Color(0xFF5C1900)
val PrimarySoft = Color(0x14FB5607)
val PrimaryMuted = Color(0x1FFB5607)

val BackgroundLight = md_theme_light_background
val SurfaceLight = md_theme_light_surface
val CardLight = md_theme_light_surfaceContainerLowest
val BorderLight = md_theme_light_outline
val BorderSubtleLightAlt = md_theme_light_outlineVariant

val BackgroundDark = md_theme_dark_background
val SurfaceDark = md_theme_dark_surface
val CardDark = md_theme_dark_surfaceContainer
val CardElevatedDark = md_theme_dark_surfaceContainerHigh
val BorderDark = md_theme_dark_outline

val TextPrimaryLight = md_theme_light_onSurface
val TextSecondaryLight = md_theme_light_onSurfaceVariant

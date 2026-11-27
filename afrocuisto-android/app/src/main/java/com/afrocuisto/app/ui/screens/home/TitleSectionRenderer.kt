package com.afrocuisto.app.ui.screens.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.afrocuisto.app.data.repository.HomeSection
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.ExpressivePillShape
import com.afrocuisto.app.ui.theme.nexaTitleEmphasis
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.util.Locale

private const val TITLE_STYLE_PREFIX = "__title_style__:"

private val titleStyleJson = Json { ignoreUnknownKeys = true }

@Serializable
data class TitleStyleConfig(
    val subtitle: String = "",
    val fontSize: Float = 18f,
    val fontWeight: String = "800",
    val fontFamily: String = "default",
    val italic: Boolean = false,
    val underline: Boolean = false,
    val strikethrough: Boolean = false,
    val textTransform: String = "none",
    val letterSpacing: Float = 0f,
    val lineHeightMultiplier: Float = 1.25f,
    val textAlign: String = "left",
    val textColor: String = "",
    val backgroundColor: String = "",
    val borderRadius: Float = 14f,
    val paddingTop: Float = 4f,
    val paddingBottom: Float = 12f,
    val paddingHorizontal: Float = 20f,
    val accentStyle: String = "none",
    val accentColor: String = "#FB5607",
    val subtitleFontSize: Float = 13f,
    val subtitleFontWeight: String = "500",
    val subtitleFontFamily: String = "default",
    val subtitleItalic: Boolean = false,
    val subtitleUnderline: Boolean = false,
    val subtitleStrikethrough: Boolean = false,
    val subtitleTextTransform: String = "none",
    val subtitleLetterSpacing: Float = 0f,
    val subtitleLineHeightMultiplier: Float = 1.3f,
    val subtitleTextColor: String = "",
    val subtitleSpacingTop: Float = 4f
)

private fun parseTitleStyleConfig(itemIds: List<String>): TitleStyleConfig {
    val encoded = itemIds.firstOrNull { it.startsWith(TITLE_STYLE_PREFIX) } ?: return TitleStyleConfig()
    return runCatching {
        titleStyleJson.decodeFromString<TitleStyleConfig>(encoded.removePrefix(TITLE_STYLE_PREFIX))
    }.getOrDefault(TitleStyleConfig())
}

private fun parseHexColorOrNull(raw: String): Color? {
    val clean = raw.trim().removePrefix("#")
    if (clean.length != 6 && clean.length != 8) return null
    return runCatching {
        val value = clean.toLong(16)
        val argb = if (clean.length == 6) (0xFF000000L or value).toInt() else value.toInt()
        Color(argb)
    }.getOrNull()
}

private fun applyTextTransform(text: String, transform: String): String = when (transform) {
    "uppercase" -> text.uppercase(Locale.getDefault())
    "lowercase" -> text.lowercase(Locale.getDefault())
    "capitalize" -> text.split(" ").joinToString(" ") { word ->
        word.replaceFirstChar { ch ->
            if (ch.isLowerCase()) ch.titlecase(Locale.getDefault()) else ch.toString()
        }
    }
    else -> text
}

@Composable
fun HomeCmsTitleSection(
    section: HomeSection,
    defaultTitleColor: Color,
    defaultSubtitleColor: Color
) {
    if (section.title.isBlank()) return

    val config = remember(section.itemIds) { parseTitleStyleConfig(section.itemIds) }
    val resolvedTextColor = parseHexColorOrNull(config.textColor) ?: defaultTitleColor
    val resolvedBgColor = parseHexColorOrNull(config.backgroundColor)
    val resolvedAccentColor = parseHexColorOrNull(config.accentColor) ?: AfroOrange

    val fontSizeSp = config.fontSize.coerceIn(12f, 36f)
    val fontWeight = when (config.fontWeight) {
        "400" -> FontWeight.Normal
        "500" -> FontWeight.Medium
        "600" -> FontWeight.SemiBold
        "700" -> FontWeight.Bold
        "900" -> FontWeight.Black
        else -> FontWeight.ExtraBold
    }
    val fontFamily = when (config.fontFamily) {
        "serif" -> FontFamily.Serif
        "sans" -> FontFamily.SansSerif
        "mono" -> FontFamily.Monospace
        else -> FontFamily.Default
    }
    val fontStyle = if (config.italic) FontStyle.Italic else FontStyle.Normal
    val decorations = buildList {
        if (config.underline) add(TextDecoration.Underline)
        if (config.strikethrough) add(TextDecoration.LineThrough)
    }
    val textDecoration = if (decorations.isEmpty()) TextDecoration.None else TextDecoration.combine(decorations)
    val textAlign = when (config.textAlign) {
        "center" -> TextAlign.Center
        "right" -> TextAlign.End
        else -> TextAlign.Start
    }
    val horizontalAlignment = when (config.textAlign) {
        "center" -> Alignment.CenterHorizontally
        "right" -> Alignment.End
        else -> Alignment.Start
    }
    val rowArrangement = when (config.textAlign) {
        "center" -> Arrangement.Center
        "right" -> Arrangement.End
        else -> Arrangement.Start
    }

    val formattedTitle = applyTextTransform(section.title, config.textTransform)
    val containerShape = RoundedCornerShape(config.borderRadius.coerceIn(0f, 28f).dp)

    val containerModifier = Modifier
        .fillMaxWidth()
        .padding(
            start = config.paddingHorizontal.coerceIn(0f, 32f).dp,
            end = config.paddingHorizontal.coerceIn(0f, 32f).dp,
            top = config.paddingTop.coerceIn(0f, 32f).dp,
            bottom = config.paddingBottom.coerceIn(0f, 32f).dp
        )
        .let { mod ->
            if (resolvedBgColor != null) {
                mod
                    .clip(containerShape)
                    .background(resolvedBgColor)
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            } else {
                mod
            }
        }

    Column(
        modifier = containerModifier,
        horizontalAlignment = horizontalAlignment
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = rowArrangement,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (config.accentStyle == "left") {
                Box(
                    modifier = Modifier
                        .width(4.dp)
                        .height(fontSizeSp.coerceAtLeast(18f).dp)
                        .clip(ExpressivePillShape)
                        .background(resolvedAccentColor)
                )
                Spacer(modifier = Modifier.width(10.dp))
            }

            val titleContent: @Composable () -> Unit = {
                Text(
                    text = formattedTitle,
                    fontSize = fontSizeSp.sp,
                    fontWeight = fontWeight,
                    fontFamily = fontFamily,
                    fontStyle = fontStyle,
                    textDecoration = textDecoration,
                    letterSpacing = config.letterSpacing.coerceIn(-1f, 6f).sp,
                    lineHeight = (fontSizeSp * config.lineHeightMultiplier.coerceIn(1f, 2f)).sp,
                    textAlign = textAlign,
                    color = resolvedTextColor,
                    modifier = if (config.fontFamily == "default") Modifier.nexaTitleEmphasis() else Modifier
                )
            }

            if (config.accentStyle == "badge") {
                Surface(
                    shape = ExpressivePillShape,
                    color = resolvedAccentColor.copy(alpha = 0.12f),
                    border = BorderStroke(1.dp, resolvedAccentColor.copy(alpha = 0.35f))
                ) {
                    Box(modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)) {
                        titleContent()
                    }
                }
            } else {
                titleContent()
            }
        }

        if (config.accentStyle == "bottom") {
            Spacer(modifier = Modifier.height(6.dp))
            Box(
                modifier = Modifier
                    .width(48.dp)
                    .height(3.5.dp)
                    .clip(ExpressivePillShape)
                    .background(resolvedAccentColor)
            )
        }

        if (config.subtitle.isNotBlank()) {
            val subFontSizeSp = config.subtitleFontSize.coerceIn(10f, 24f)
            val subFontWeight = when (config.subtitleFontWeight) {
                "400" -> FontWeight.Normal
                "600" -> FontWeight.SemiBold
                "700" -> FontWeight.Bold
                "800" -> FontWeight.ExtraBold
                "900" -> FontWeight.Black
                else -> FontWeight.Medium
            }
            val subFontFamily = when (config.subtitleFontFamily) {
                "serif" -> FontFamily.Serif
                "sans" -> FontFamily.SansSerif
                "mono" -> FontFamily.Monospace
                else -> FontFamily.Default
            }
            val subDecorations = buildList {
                if (config.subtitleUnderline) add(TextDecoration.Underline)
                if (config.subtitleStrikethrough) add(TextDecoration.LineThrough)
            }
            val subTextDecoration = if (subDecorations.isEmpty()) TextDecoration.None else TextDecoration.combine(subDecorations)
            val resolvedSubtitleColor = parseHexColorOrNull(config.subtitleTextColor) ?: defaultSubtitleColor

            Spacer(modifier = Modifier.height(config.subtitleSpacingTop.coerceIn(0f, 20f).dp))
            Text(
                text = applyTextTransform(config.subtitle, config.subtitleTextTransform),
                fontSize = subFontSizeSp.sp,
                fontWeight = subFontWeight,
                fontFamily = subFontFamily,
                fontStyle = if (config.subtitleItalic) FontStyle.Italic else FontStyle.Normal,
                textDecoration = subTextDecoration,
                letterSpacing = config.subtitleLetterSpacing.coerceIn(-0.5f, 4f).sp,
                lineHeight = (subFontSizeSp * config.subtitleLineHeightMultiplier.coerceIn(1f, 2f)).sp,
                textAlign = textAlign,
                color = resolvedSubtitleColor,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

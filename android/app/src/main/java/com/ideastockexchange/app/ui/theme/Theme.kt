package com.ideastockexchange.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val ProGreen = Color(0xFF1F8B4C)
val ConRed = Color(0xFFC0392B)
val BrandBlue = Color(0xFF1F6FEB)

private val LightColors = lightColorScheme(
    primary = BrandBlue,
    secondary = Color(0xFF6A737D),
)
private val DarkColors = darkColorScheme(
    primary = BrandBlue,
    secondary = Color(0xFF8B949E),
)

@Composable
fun IseTheme(content: @Composable () -> Unit) {
    val colors = if (isSystemInDarkTheme()) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}

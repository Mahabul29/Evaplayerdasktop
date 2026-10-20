package evaplayer

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance

// Same palette as the Android app
val DarkBackground = Color(0xFF0F1117)
val DarkSurface = Color(0xFF161922)
val DarkSurfaceContainer = Color(0xFF1E222D)
val DarkSurfaceElevated = Color(0xFF282D3A)
val AmoledBackground = Color(0xFF000000)
val AmoledSurface = Color(0xFF121212)
val TextPrimary = Color(0xFFFFFFFF)
val TextSecondary = Color(0xFF9BA3B4)
val DividerDark = Color(0xFF2B3040)

val AccentOptions: List<Pair<String, Color>> = listOf(
    "White" to Color(0xFFFFFFFF),
    "Green" to Color(0xFF00E676),
    "Purple" to Color(0xFFB388FF),
    "Blue" to Color(0xFF2F80FF),
    "Red" to Color(0xFFFF5252),
    "Orange" to Color(0xFFFF9100),
    "Pink" to Color(0xFFFF4081),
)

fun accentColor(name: String): Color =
    AccentOptions.firstOrNull { it.first.equals(name, ignoreCase = true) }?.second ?: Color(0xFF2F80FF)

@Composable
fun EvaTheme(mode: String, accentName: String, content: @Composable () -> Unit) {
    val accent = accentColor(accentName)
    val onAccent = if (accent.luminance() > 0.5f) Color.Black else Color.White
    val scheme = when (mode) {
        "Light" -> lightColorScheme(
            primary = accent,
            onPrimary = onAccent,
        )
        "AMOLED" -> darkColorScheme(
            primary = accent,
            onPrimary = onAccent,
            background = AmoledBackground,
            surface = AmoledBackground,
            surfaceVariant = AmoledSurface,
            surfaceContainer = AmoledSurface,
            surfaceContainerHigh = DarkSurfaceContainer,
            onBackground = TextPrimary,
            onSurface = TextPrimary,
            onSurfaceVariant = TextSecondary,
            outline = DividerDark,
        )
        else -> darkColorScheme(
            primary = accent,
            onPrimary = onAccent,
            background = DarkBackground,
            surface = DarkSurface,
            surfaceVariant = DarkSurfaceContainer,
            surfaceContainer = DarkSurfaceContainer,
            surfaceContainerHigh = DarkSurfaceElevated,
            onBackground = TextPrimary,
            onSurface = TextPrimary,
            onSurfaceVariant = TextSecondary,
            outline = DividerDark,
        )
    }
    MaterialTheme(colorScheme = scheme, content = content)
}

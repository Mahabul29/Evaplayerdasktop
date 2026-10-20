package evaplayer

import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.loadImageBitmap
import androidx.compose.ui.res.useResource
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.WindowPlacement
import androidx.compose.ui.window.WindowPosition
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState

private fun loadIcon(): Painter? = try {
    BitmapPainter(useResource("eva_logo.png", ::loadImageBitmap))
} catch (_: Exception) {
    null
}

fun main(args: Array<String>) = application {
    val windowState = rememberWindowState(
        size = DpSize(1280.dp, 800.dp),
        position = WindowPosition.Aligned(Alignment.Center),
    )
    val app = remember { AppController(args.toList()) }
    val icon = remember { loadIcon() }

    LaunchedEffect(Unit) { app.start() }
    LaunchedEffect(app.fullscreen) {
        windowState.placement = if (app.fullscreen) WindowPlacement.Fullscreen else WindowPlacement.Floating
    }
    DisposableEffect(Unit) { onDispose { app.shutdown() } }

    Window(
        onCloseRequest = {
            app.shutdown()
            exitApplication()
        },
        state = windowState,
        title = "EvaPlayer",
        icon = icon,
        onPreviewKeyEvent = { app.onKey(it) { app.fullscreen = !app.fullscreen } },
    ) {
        EvaTheme(app.settings.theme, app.settings.accent) {
            App(app)
        }
    }
}

package evaplayer

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.background
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.VideoLibrary
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.type
import androidx.compose.ui.unit.dp
import java.awt.FileDialog
import java.awt.Frame
import java.io.File
import javax.swing.JFileChooser

enum class Tab(val label: String, val icon: ImageVector) {
    Videos("Videos", Icons.Filled.VideoLibrary),
    Folders("Folders", Icons.Filled.Folder),
    Music("Music", Icons.Filled.MusicNote),
    Favorites("Favorites", Icons.Filled.Favorite),
    Settings("Settings", Icons.Filled.Settings),
}

class AppController(private val startupArgs: List<String>) {
    val settings = AppSettings()
    val memory = MediaMemory()
    val library = LibraryState()
    val engine = Engine(settings, memory)

    var tab by mutableStateOf(Tab.Videos)
    var inPlayer by mutableStateOf(false)
    var fullscreen by mutableStateOf(false)
    var showUrlDialog by mutableStateOf(false)

    fun start() {
        engine.init()
        startupArgs.map { File(it) }.filter { it.isFile }.let { files ->
            if (files.isNotEmpty()) playFiles(files.map { MediaFile.fromFile(it) }, 0)
        }
    }

    fun shutdown() = engine.shutdown()

    suspend fun rescan() = library.scan(settings.folders.toList())

    fun play(list: List<MediaFile>, start: Int) {
        if (!engine.available) {
            // Settings page explains what is missing.
            tab = Tab.Settings
            return
        }
        playFiles(list, start)
    }

    private fun playFiles(list: List<MediaFile>, start: Int) {
        if (!engine.available) return
        engine.play(list, start)
        inPlayer = true
    }

    fun closePlayer() {
        engine.close()
        inPlayer = false
        fullscreen = false
    }

    fun openFileDialog() {
        val dialog = FileDialog(null as Frame?, "Open media", FileDialog.LOAD)
        dialog.isMultipleMode = true
        dialog.isVisible = true
        val files = dialog.files?.toList().orEmpty()
        if (files.isNotEmpty()) play(files.map { MediaFile.fromFile(it) }, 0)
    }

    fun pickSubtitle() {
        val dialog = FileDialog(null as Frame?, "Choose subtitle file", FileDialog.LOAD)
        dialog.isVisible = true
        val f = dialog.files?.firstOrNull() ?: return
        engine.loadSubtitleFile(f.absolutePath)
    }

    fun pickFolder(): String? {
        val chooser = JFileChooser()
        chooser.fileSelectionMode = JFileChooser.DIRECTORIES_ONLY
        chooser.dialogTitle = "Add a media folder"
        return if (chooser.showOpenDialog(null) == JFileChooser.APPROVE_OPTION) chooser.selectedFile.absolutePath else null
    }

    /** Returns true if the key was used by the player. */
    fun onKey(e: KeyEvent, toggleFullscreen: () -> Unit): Boolean {
        if (!inPlayer || e.type != KeyEventType.KeyDown) return false
        val skip = settings.skipSeconds * 1000L
        when (e.key) {
            Key.Spacebar, Key.K -> engine.togglePlay()
            Key.DirectionLeft -> engine.skip(-skip)
            Key.DirectionRight -> engine.skip(skip)
            Key.DirectionUp -> engine.setVolumePercent(engine.volume + 5)
            Key.DirectionDown -> engine.setVolumePercent(engine.volume - 5)
            Key.M -> engine.toggleMute()
            Key.N -> engine.next()
            Key.P -> engine.previous()
            Key.F, Key.F11 -> toggleFullscreen()
            Key.Escape -> if (fullscreen) toggleFullscreen() else closePlayer()
            else -> return false
        }
        return true
    }
}

@Composable
fun App(app: AppController) {
    LaunchedEffect(Unit) { app.rescan() }

    Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        if (app.inPlayer) {
            PlayerScreen(app)
        } else {
            Row(Modifier.fillMaxSize()) {
                NavigationRail(containerColor = MaterialTheme.colorScheme.surface) {
                    Tab.entries.forEach { t ->
                        NavigationRailItem(
                            selected = app.tab == t,
                            onClick = { app.tab = t },
                            icon = { Icon(t.icon, contentDescription = t.label) },
                            label = { Text(t.label) },
                            modifier = Modifier.padding(vertical = 4.dp),
                        )
                    }
                }
                Box(Modifier.weight(1f).fillMaxSize()) {
                    when (app.tab) {
                        Tab.Videos -> VideosTab(app)
                        Tab.Folders -> FoldersTab(app)
                        Tab.Music -> MusicTab(app)
                        Tab.Favorites -> FavoritesTab(app)
                        Tab.Settings -> SettingsTab(app)
                    }
                }
            }
        }

        if (app.showUrlDialog) UrlDialog(app)
    }
}

@Composable
private fun UrlDialog(app: AppController) {
    var url by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = { app.showUrlDialog = false },
        title = { Text("Play a network stream") },
        text = {
            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                singleLine = true,
                label = { Text("http(s)://, rtsp://, .m3u8 ...") },
            )
        },
        confirmButton = {
            TextButton(onClick = {
                val u = url.trim()
                if (u.isNotEmpty()) {
                    app.showUrlDialog = false
                    app.play(listOf(MediaFile.fromUrl(u)), 0)
                }
            }) { Text("Play") }
        },
        dismissButton = { TextButton(onClick = { app.showUrlDialog = false }) { Text("Cancel") } },
    )
}

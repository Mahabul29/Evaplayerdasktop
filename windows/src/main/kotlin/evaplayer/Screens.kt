package evaplayer

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items as gridItems
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.vector.ImageVector
import kotlinx.coroutines.launch

// ------------------------------------------------------------------ shared pieces

@Composable
private fun Header(
    title: String,
    app: AppController,
    onBack: (() -> Unit)? = null,
    showScan: Boolean = true,
) {
    val scope = rememberCoroutineScope()
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
        }
        Text(
            title,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        if (app.library.scanning) {
            CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.dp)
            Spacer(Modifier.width(12.dp))
        }
        OutlinedButton(onClick = { app.openFileDialog() }) {
            Icon(Icons.Filled.FolderOpen, null, Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Open file")
        }
        Spacer(Modifier.width(8.dp))
        OutlinedButton(onClick = { app.showUrlDialog = true }) {
            Icon(Icons.Filled.Link, null, Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Open URL")
        }
        if (showScan) {
            IconButton(onClick = { scope.launch { app.rescan() } }) {
                Icon(Icons.Filled.Refresh, contentDescription = "Rescan folders")
            }
        }
    }
}

@Composable
private fun EmptyState(icon: ImageVector, text: String) {
    Column(
        Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(icon, null, Modifier.size(56.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(12.dp))
        Text(text, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun VideoCard(app: AppController, item: MediaFile, onClick: () -> Unit) {
    val progress = app.memory.progress[item.path]
    val fav = app.memory.isFavorite(item.path)
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(14.dp),
    ) {
        Box(Modifier.fillMaxWidth().aspectRatio(16f / 9f)) {
            Box(
                Modifier.fillMaxSize().background(
                    Brush.linearGradient(
                        listOf(
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.35f),
                            MaterialTheme.colorScheme.surface,
                        )
                    )
                ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Filled.PlayArrow, null, Modifier.size(44.dp),
                    tint = Color.White.copy(alpha = 0.85f)
                )
            }
            Text(
                item.ext,
                color = Color.White,
                fontSize = 11.sp,
                modifier = Modifier.align(Alignment.TopStart).padding(8.dp)
                    .clip(RoundedCornerShape(6.dp)).background(Color(0x99000000))
                    .padding(horizontal = 6.dp, vertical = 2.dp),
            )
            if (progress != null && progress.lenMs > 0) {
                Text(
                    formatTime(progress.lenMs),
                    color = Color.White,
                    fontSize = 11.sp,
                    modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp)
                        .clip(RoundedCornerShape(6.dp)).background(Color(0x99000000))
                        .padding(horizontal = 6.dp, vertical = 2.dp),
                )
            }
            IconButton(
                onClick = { app.memory.toggleFavorite(item.path) },
                modifier = Modifier.align(Alignment.TopEnd),
            ) {
                Icon(
                    if (fav) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                    contentDescription = "Favorite",
                    tint = if (fav) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.8f),
                )
            }
            if (progress != null && progress.fraction > 0f) {
                LinearProgressIndicator(
                    progress = { progress.fraction },
                    modifier = Modifier.align(Alignment.BottomStart).fillMaxWidth().height(3.dp),
                )
            }
        }
        Column(Modifier.padding(12.dp)) {
            Text(item.title, maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(4.dp))
            Text(
                listOf(item.sizeText, item.dateText).filter { it.isNotBlank() }.joinToString("  •  "),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 12.sp,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun VideoGrid(app: AppController, list: List<MediaFile>) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(250.dp),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 24.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        modifier = Modifier.fillMaxSize(),
    ) {
        gridItems(list, key = { it.path }) { item ->
            VideoCard(app, item) { app.play(list, list.indexOf(item)) }
        }
    }
}

@Composable
private fun AudioRow(app: AppController, list: List<MediaFile>, item: MediaFile) {
    val fav = app.memory.isFavorite(item.path)
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
            .clickable { app.play(list, list.indexOf(item)) }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier.size(44.dp).clip(RoundedCornerShape(10.dp))
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center,
        ) { Icon(Icons.Filled.MusicNote, null, tint = MaterialTheme.colorScheme.primary) }
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(item.title, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Medium)
            Text(
                "${item.folderName}  •  ${item.sizeText}",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 12.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        IconButton(onClick = { app.memory.toggleFavorite(item.path) }) {
            Icon(
                if (fav) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                contentDescription = "Favorite",
                tint = if (fav) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun AudioList(app: AppController, list: List<MediaFile>) {
    LazyColumn(
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        modifier = Modifier.fillMaxSize(),
    ) {
        items(list, key = { it.path }) { AudioRow(app, list, it) }
    }
}

@Composable
private fun SearchBox(value: String, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        singleLine = true,
        placeholder = { Text("Search") },
        modifier = Modifier.width(320.dp),
        shape = RoundedCornerShape(24.dp),
    )
}

private val SORTS = listOf("Newest", "Name", "Size")

private fun sorted(list: List<MediaFile>, sort: String): List<MediaFile> = when (sort) {
    "Name" -> list.sortedBy { it.title.lowercase() }
    "Size" -> list.sortedByDescending { it.sizeBytes }
    else -> list.sortedByDescending { it.modified }
}

// ------------------------------------------------------------------ tabs

@Composable
fun VideosTab(app: AppController) {
    var query by remember { mutableStateOf("") }
    var sort by remember { mutableStateOf("Newest") }
    val all = app.library.videos
    val filtered = sorted(all.filter { it.title.contains(query, ignoreCase = true) }, sort)
    val continueList = all
        .filter { (app.memory.progress[it.path]?.posMs ?: 0L) > 5_000 }
        .sortedByDescending { app.memory.progress[it.path]?.lastPlayed ?: 0L }
        .take(10)

    Column(Modifier.fillMaxSize()) {
        Header("Videos", app)
        Row(
            Modifier.padding(horizontal = 24.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            SearchBox(query) { query = it }
            Spacer(Modifier.width(8.dp))
            SORTS.forEach { s -> FilterChip(selected = sort == s, onClick = { sort = s }, label = { Text(s) }) }
        }
        if (continueList.isNotEmpty() && query.isBlank()) {
            Text(
                "Continue watching",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(start = 24.dp, top = 12.dp, bottom = 8.dp),
            )
            LazyRow(
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                items(continueList, key = { it.path }) { item ->
                    Box(Modifier.width(250.dp)) {
                        VideoCard(app, item) { app.play(continueList, continueList.indexOf(item)) }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
        Spacer(Modifier.height(8.dp))
        if (filtered.isEmpty()) {
            EmptyState(
                Icons.Filled.Folder,
                if (all.isEmpty()) "No videos found. Add folders in Settings, or use Open file." else "Nothing matches your search."
            )
        } else {
            VideoGrid(app, filtered)
        }
    }
}

@Composable
fun FoldersTab(app: AppController) {
    var open by remember { mutableStateOf<String?>(null) }
    val byFolder = app.library.items.groupBy { it.folderPath }
        .map { (path, list) -> FolderEntry(path, java.io.File(path).name.ifBlank { path }, list) }
        .sortedBy { it.name.lowercase() }
    val selected = byFolder.firstOrNull { it.path == open }

    Column(Modifier.fillMaxSize()) {
        if (selected == null) {
            Header("Folders", app)
            if (byFolder.isEmpty()) {
                EmptyState(Icons.Filled.Folder, "No media folders yet. Add some in Settings.")
            } else {
                LazyColumn(
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    items(byFolder, key = { it.path }) { f ->
                        Row(
                            Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                                .clickable { open = f.path }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(
                                Icons.Filled.Folder, null, Modifier.size(40.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(Modifier.width(14.dp))
                            Column(Modifier.weight(1f)) {
                                Text(f.name, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(
                                    f.path,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 12.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                            Text(
                                "${f.items.size} items  •  ${formatSize(f.totalBytes)}",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 12.sp,
                            )
                        }
                    }
                }
            }
        } else {
            Header(selected.name, app, onBack = { open = null })
            val vids = sorted(selected.items.filter { !it.isAudio }, "Name")
            val auds = sorted(selected.items.filter { it.isAudio }, "Name")
            if (vids.isNotEmpty()) {
                Box(Modifier.weight(1f)) { VideoGrid(app, vids) }
            } else {
                Box(Modifier.weight(1f)) { AudioList(app, auds) }
            }
        }
    }
}

@Composable
fun MusicTab(app: AppController) {
    var query by remember { mutableStateOf("") }
    val list = app.library.music.filter { it.title.contains(query, ignoreCase = true) }
        .sortedBy { it.title.lowercase() }
    Column(Modifier.fillMaxSize()) {
        Header("Music", app)
        Row(Modifier.padding(horizontal = 24.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            SearchBox(query) { query = it }
            Spacer(Modifier.width(16.dp))
            if (list.isNotEmpty()) {
                Button(onClick = { app.play(list, 0) }) {
                    Icon(Icons.Filled.PlayArrow, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Play all")
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        if (list.isEmpty()) EmptyState(Icons.Filled.MusicNote, "No music found. Add folders in Settings.")
        else AudioList(app, list)
    }
}

@Composable
fun FavoritesTab(app: AppController) {
    val favs = app.library.items.filter { app.memory.isFavorite(it.path) }
    val vids = favs.filter { !it.isAudio }
    val auds = favs.filter { it.isAudio }
    Column(Modifier.fillMaxSize()) {
        Header("Favorites", app, showScan = false)
        if (favs.isEmpty()) {
            EmptyState(Icons.Filled.FavoriteBorder, "Tap the heart on a video or song to add it here.")
        } else {
            if (vids.isNotEmpty()) Box(Modifier.weight(if (auds.isNotEmpty()) 1f else 1f)) { VideoGrid(app, vids) }
            if (auds.isNotEmpty()) Box(Modifier.weight(1f)) { AudioList(app, auds) }
        }
    }
}

// ------------------------------------------------------------------ settings

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 12.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(10.dp))
        content()
    }
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, modifier = Modifier.weight(1f))
        Switch(checked = checked, onCheckedChange = onChange)
    }
}

@Composable
fun SettingsTab(app: AppController) {
    val s = app.settings
    val scope = rememberCoroutineScope()
    LazyColumn(Modifier.fillMaxSize()) {
        item {
            Text(
                "Settings",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(24.dp),
            )
        }
        item {
            val err = app.engine.error
            if (err != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    modifier = Modifier.padding(horizontal = 24.dp).fillMaxWidth(),
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text(err, color = MaterialTheme.colorScheme.onErrorContainer)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "Download: https://www.videolan.org/vlc/",
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
        item {
            Section("Appearance") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("Dark", "Light", "AMOLED").forEach { t ->
                        FilterChip(selected = s.theme == t, onClick = { s.changeTheme(t) }, label = { Text(t) })
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    AccentOptions.forEach { (name, color) ->
                        Box(
                            Modifier.size(34.dp).clip(CircleShape).background(color)
                                .clickable { s.changeAccent(name) },
                            contentAlignment = Alignment.Center,
                        ) {
                            if (s.accent == name) {
                                Box(
                                    Modifier.size(12.dp).clip(CircleShape)
                                        .background(if (color == Color.White) Color.Black else Color.White)
                                )
                            }
                        }
                    }
                }
            }
        }
        item {
            Section("Playback") {
                ToggleRow("Resume where you left off", s.resume) { s.changeResume(it) }
                ToggleRow("Play next item automatically", s.autoNext) { s.changeAutoNext(it) }
                Spacer(Modifier.height(8.dp))
                Text("Skip step (arrow keys / buttons)", color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(5, 10, 15, 30, 60).forEach { sec ->
                        FilterChip(selected = s.skipSeconds == sec, onClick = { s.setSkip(sec) }, label = { Text("${sec}s") })
                    }
                }
            }
        }
        item {
            Section("Library folders") {
                if (s.folders.isEmpty()) {
                    Text("No folders yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                s.folders.toList().forEach { path ->
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Folder, null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.width(10.dp))
                        Text(path, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        IconButton(onClick = {
                            s.removeFolder(path)
                            scope.launch { app.rescan() }
                        }) { Icon(Icons.Filled.Delete, contentDescription = "Remove") }
                    }
                }
                Spacer(Modifier.height(8.dp))
                Button(onClick = {
                    val p = app.pickFolder()
                    if (p != null) {
                        s.addFolder(p)
                        scope.launch { app.rescan() }
                    }
                }) {
                    Icon(Icons.Filled.Add, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Add folder")
                }
            }
        }
        item {
            Section("Keyboard shortcuts") {
                listOf(
                    "Space / K" to "Play / pause",
                    "← / →" to "Skip back / forward",
                    "↑ / ↓" to "Volume up / down",
                    "F or F11" to "Fullscreen",
                    "M" to "Mute",
                    "N / P" to "Next / previous",
                    "Esc" to "Exit fullscreen, then close the player",
                ).forEach { (k, d) ->
                    Row(Modifier.padding(vertical = 2.dp)) {
                        Text(k, modifier = Modifier.width(140.dp), fontWeight = FontWeight.Medium)
                        Text(d, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        item {
            Section("About") {
                Text("EvaPlayer for Windows 1.0")
                Text(
                    if (app.engine.available) "Playback engine: VLC (ready)" else "Playback engine: not available",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

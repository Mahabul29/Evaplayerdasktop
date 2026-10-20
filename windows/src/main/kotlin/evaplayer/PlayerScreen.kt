package evaplayer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Audiotrack
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.Fullscreen
import androidx.compose.material.icons.filled.FullscreenExit
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.Replay10
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Subtitles
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import java.util.Locale
import kotlin.math.min

private val SPEEDS = listOf(0.5f, 0.75f, 1.0f, 1.25f, 1.5f, 2.0f)

@Composable
fun PlayerScreen(app: AppController) {
    val e = app.engine
    val skipMs = app.settings.skipSeconds * 1000L
    var lastActivity by remember { mutableStateOf(0L) }
    var controlsVisible by remember { mutableStateOf(true) }
    val item = e.current
    val isAudio = item?.isAudio == true

    // Show the controls on any mouse movement and hide them after 3 s of playback without it.
    LaunchedEffect(lastActivity, e.isPlaying) {
        controlsVisible = true
        if (e.isPlaying && !isAudio) {
            delay(3000)
            controlsVisible = false
        }
    }

    Box(
        Modifier.fillMaxSize().background(Color.Black)
            .pointerInput(Unit) {
                awaitPointerEventScope {
                    while (true) {
                        val ev = awaitPointerEvent()
                        if (ev.type == PointerEventType.Move || ev.type == PointerEventType.Press) {
                            lastActivity = System.nanoTime()
                        }
                    }
                }
            }
            .pointerInput(Unit) {
                detectTapGestures(
                    onDoubleTap = { app.fullscreen = !app.fullscreen },
                    onTap = { e.togglePlay() },
                )
            }
    ) {
        // ---- video / audio visual
        if (isAudio) {
            Column(
                Modifier.fillMaxSize().padding(48.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier.size(160.dp).background(
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.2f),
                        androidx.compose.foundation.shape.RoundedCornerShape(32.dp)
                    ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Filled.MusicNote, null, Modifier.size(80.dp), tint = MaterialTheme.colorScheme.primary)
                }
                Spacer(Modifier.size(24.dp))
                Text(item?.title ?: "", color = Color.White, style = MaterialTheme.typography.headlineSmall, maxLines = 2)
                Text(item?.folderName ?: "", color = Color.White.copy(alpha = 0.6f))
            }
        } else {
            Canvas(Modifier.fillMaxSize()) {
                val f = e.frame ?: return@Canvas
                val scale = min(size.width / f.width, size.height / f.height)
                val dw = (f.width * scale).toInt()
                val dh = (f.height * scale).toInt()
                drawImage(
                    image = f,
                    srcOffset = IntOffset.Zero,
                    srcSize = IntSize(f.width, f.height),
                    dstOffset = IntOffset(((size.width - dw) / 2).toInt(), ((size.height - dh) / 2).toInt()),
                    dstSize = IntSize(dw, dh),
                    filterQuality = FilterQuality.Medium,
                )
            }
            if (e.frame == null && e.message == null) {
                CircularProgressIndicator(Modifier.align(Alignment.Center), color = Color.White)
            }
        }

        e.message?.let {
            Text(it, color = Color.White, modifier = Modifier.align(Alignment.Center))
        }

        // ---- overlay controls
        AnimatedVisibility(
            visible = controlsVisible,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.fillMaxSize(),
        ) {
            Box(Modifier.fillMaxSize()) {
                // top bar
                Row(
                    Modifier.fillMaxWidth().align(Alignment.TopCenter)
                        .background(Brush.verticalGradient(listOf(Color(0xCC000000), Color.Transparent)))
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    IconButton(onClick = { app.closePlayer() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color.White)
                    }
                    Text(
                        item?.title ?: "",
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f),
                    )
                    if (e.queue.size > 1) {
                        Text("${e.index + 1} / ${e.queue.size}", color = Color.White.copy(alpha = 0.7f))
                        Spacer(Modifier.width(12.dp))
                    }
                }

                // bottom bar
                Column(
                    Modifier.fillMaxWidth().align(Alignment.BottomCenter)
                        .background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xCC000000))))
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    SeekBar(e)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { e.previous() }) { Icon(Icons.Filled.SkipPrevious, "Previous", tint = Color.White) }
                        IconButton(onClick = { e.skip(-skipMs) }) { Icon(Icons.Filled.Replay10, "Back", tint = Color.White) }
                        IconButton(onClick = { e.togglePlay() }, modifier = Modifier.size(52.dp)) {
                            Icon(
                                when {
                                    e.ended -> Icons.Filled.Replay
                                    e.isPlaying -> Icons.Filled.Pause
                                    else -> Icons.Filled.PlayArrow
                                },
                                "Play/Pause", tint = Color.White, modifier = Modifier.size(34.dp),
                            )
                        }
                        IconButton(onClick = { e.skip(skipMs) }) { Icon(Icons.Filled.Forward10, "Forward", tint = Color.White) }
                        IconButton(onClick = { e.next() }, enabled = e.hasNext) {
                            Icon(Icons.Filled.SkipNext, "Next", tint = if (e.hasNext) Color.White else Color.Gray)
                        }

                        Spacer(Modifier.weight(1f))

                        IconButton(onClick = { e.toggleMute() }) {
                            Icon(
                                if (e.muted || e.volume == 0) Icons.Filled.VolumeOff else Icons.Filled.VolumeUp,
                                "Mute", tint = Color.White
                            )
                        }
                        Slider(
                            value = if (e.muted) 0f else e.volume.toFloat(),
                            onValueChange = { e.setVolumePercent(it.toInt()) },
                            valueRange = 0f..200f,
                            modifier = Modifier.width(110.dp),
                        )
                        Text("${e.volume}%", color = Color.White.copy(alpha = 0.8f), modifier = Modifier.width(48.dp))

                        SpeedMenu(e)
                        if (!isAudio) SubtitleMenu(app)
                        AudioMenu(e)
                        IconButton(onClick = { app.fullscreen = !app.fullscreen }) {
                            Icon(
                                if (app.fullscreen) Icons.Filled.FullscreenExit else Icons.Filled.Fullscreen,
                                "Fullscreen", tint = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SeekBar(e: Engine) {
    var dragging by remember { mutableStateOf(false) }
    var dragValue by remember { mutableStateOf(0f) }
    val max = if (e.lengthMs > 0) e.lengthMs.toFloat() else 1f
    val shown = if (dragging) dragValue else e.positionMs.toFloat().coerceIn(0f, max)
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(formatTime(shown.toLong()), color = Color.White, modifier = Modifier.width(64.dp))
        Slider(
            value = shown,
            onValueChange = { dragging = true; dragValue = it },
            onValueChangeFinished = {
                e.seekTo(dragValue.toLong())
                dragging = false
            },
            valueRange = 0f..max,
            enabled = e.lengthMs > 0,
            modifier = Modifier.weight(1f),
        )
        Text(
            formatTime(e.lengthMs),
            color = Color.White,
            modifier = Modifier.width(64.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.End,
        )
    }
}

@Composable
private fun SpeedMenu(e: Engine) {
    var open by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { open = true }) { Icon(Icons.Filled.Speed, "Speed", tint = Color.White) }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            SPEEDS.forEach { s ->
                DropdownMenuItem(
                    text = {
                        val label = String.format(Locale.US, "%.2fx", s)
                        Text(if (e.rate == s) "✓  $label" else label)
                    },
                    onClick = { e.changeRate(s); open = false },
                )
            }
        }
    }
}

@Composable
private fun AudioMenu(e: Engine) {
    var open by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { e.refreshTracks(); open = true }) { Icon(Icons.Filled.Audiotrack, "Audio track", tint = Color.White) }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            if (e.audioTracks.isEmpty()) {
                DropdownMenuItem(text = { Text("No audio tracks") }, onClick = { open = false })
            }
            e.audioTracks.forEach { t ->
                DropdownMenuItem(
                    text = { Text(if (t.id == e.audioTrack) "✓  ${t.name}" else t.name) },
                    onClick = { e.chooseAudio(t.id); open = false },
                )
            }
        }
    }
}

@Composable
private fun SubtitleMenu(app: AppController) {
    val e = app.engine
    var open by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { e.refreshTracks(); open = true }) { Icon(Icons.Filled.Subtitles, "Subtitles", tint = Color.White) }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            e.subTracks.forEach { t ->
                DropdownMenuItem(
                    text = { Text(if (t.id == e.subTrack) "✓  ${t.name}" else t.name) },
                    onClick = { e.chooseSubtitle(t.id); open = false },
                )
            }
            DropdownMenuItem(
                text = { Text("Load subtitle file…") },
                onClick = { open = false; app.pickSubtitle() },
            )
        }
    }
}

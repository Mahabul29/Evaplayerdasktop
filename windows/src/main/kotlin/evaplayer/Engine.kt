package evaplayer

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toComposeImageBitmap
import com.sun.jna.NativeLibrary
import org.jetbrains.skia.ColorAlphaType
import org.jetbrains.skia.ColorType
import org.jetbrains.skia.Image
import org.jetbrains.skia.ImageInfo
import uk.co.caprica.vlcj.factory.MediaPlayerFactory
import uk.co.caprica.vlcj.factory.discovery.NativeDiscovery
import uk.co.caprica.vlcj.player.base.MediaPlayer
import uk.co.caprica.vlcj.player.base.MediaPlayerEventAdapter
import uk.co.caprica.vlcj.player.embedded.EmbeddedMediaPlayer
import uk.co.caprica.vlcj.player.embedded.videosurface.CallbackVideoSurface
import uk.co.caprica.vlcj.player.embedded.videosurface.VideoSurfaceAdapters
import uk.co.caprica.vlcj.player.embedded.videosurface.callback.BufferFormat
import uk.co.caprica.vlcj.player.embedded.videosurface.callback.BufferFormatCallback
import uk.co.caprica.vlcj.player.embedded.videosurface.callback.RenderCallback
import uk.co.caprica.vlcj.player.embedded.videosurface.callback.format.RV32BufferFormat
import java.io.File
import java.lang.reflect.InvocationHandler
import java.lang.reflect.Proxy
import java.nio.ByteBuffer
import javax.swing.SwingUtilities
import kotlin.math.abs

data class Track(val id: Int, val name: String)

/**
 * Wraps libVLC (through vlcj). Video frames are copied into an ImageBitmap that the
 * Compose player screen draws, so the video is part of the normal UI (overlays, fullscreen, ...).
 */
class Engine(private val settings: AppSettings, private val memory: MediaMemory) {
    var available by mutableStateOf(false)
        private set
    var error by mutableStateOf<String?>(null)
        private set

    var frame by mutableStateOf<ImageBitmap?>(null)
        private set
    var isPlaying by mutableStateOf(false)
        private set
    var ended by mutableStateOf(false)
        private set
    var positionMs by mutableStateOf(0L)
        private set
    var lengthMs by mutableStateOf(0L)
        private set
    var volume by mutableStateOf(settings.volume)
        private set
    var muted by mutableStateOf(false)
        private set
    var rate by mutableStateOf(1f)
        private set
    var audioTracks by mutableStateOf<List<Track>>(emptyList())
        private set
    var subTracks by mutableStateOf<List<Track>>(emptyList())
        private set
    var audioTrack by mutableStateOf(-1)
        private set
    var subTrack by mutableStateOf(-1)
        private set
    var current by mutableStateOf<MediaFile?>(null)
        private set
    var queue by mutableStateOf<List<MediaFile>>(emptyList())
        private set
    var index by mutableStateOf(0)
        private set
    var message by mutableStateOf<String?>(null)
        private set

    private var factory: MediaPlayerFactory? = null
    private var player: EmbeddedMediaPlayer? = null
    private var lastSavedAt = 0L

    val hasNext: Boolean get() = index + 1 < queue.size
    val hasPrev: Boolean get() = index > 0

    // ---------------------------------------------------------------- start-up

    fun init() {
        if (available) return
        try {
            val args = mutableListOf("--no-video-title-show", "--no-snapshot-preview", "--quiet")

            val resDir = System.getProperty("compose.application.resources.dir")
            val bundled = if (resDir != null) File(resDir, "vlc") else null
            if (bundled != null && File(bundled, "libvlc.dll").isFile) {
                // VLC shipped inside the app: no install needed.
                System.setProperty("jna.library.path", bundled.absolutePath)
                NativeLibrary.addSearchPath("libvlccore", bundled.absolutePath)
                NativeLibrary.addSearchPath("libvlc", bundled.absolutePath)
                args += "--plugin-path=" + File(bundled, "plugins").absolutePath
            } else if (!NativeDiscovery().discover()) {
                error = "VLC was not found. Install VLC (64-bit) from videolan.org, then restart EvaPlayer."
                return
            }

            val f = MediaPlayerFactory(*args.toTypedArray())
            val p = f.mediaPlayers().newEmbeddedMediaPlayer()
            p.videoSurface().set(createSurface { frame = it })
            p.events().addMediaPlayerEventListener(listener)
            p.audio().setVolume(volume)
            factory = f
            player = p
            available = true
            error = null
        } catch (t: Throwable) {
            error = "Could not start the playback engine: ${t.message ?: t.javaClass.simpleName}"
        }
    }

    fun shutdown() {
        try {
            saveCurrentProgress()
            player?.controls()?.stop()
            player?.release()
            factory?.release()
        } catch (_: Throwable) {
        }
        player = null
        factory = null
        available = false
    }

    // ---------------------------------------------------------------- playback

    fun play(list: List<MediaFile>, start: Int) {
        if (list.isEmpty()) return
        queue = list
        index = start.coerceIn(0, list.lastIndex)
        load(list[index])
    }

    fun playOne(item: MediaFile) = play(listOf(item), 0)

    private fun load(item: MediaFile) {
        val p = player ?: return
        saveCurrentProgress()
        current = item
        frame = null
        positionMs = 0
        lengthMs = 0
        ended = false
        message = null
        audioTracks = emptyList()
        subTracks = emptyList()
        rate = 1f

        val resumeAt = if (settings.resume) memory.progress[item.path]?.posMs ?: 0L else 0L
        if (resumeAt > 5_000) {
            p.media().play(item.path, ":start-time=" + (resumeAt / 1000))
        } else {
            p.media().play(item.path)
        }
        memory.saveProgress(item.path, memory.progress[item.path]?.posMs ?: 0L, memory.progress[item.path]?.lenMs ?: 0L)
    }

    fun togglePlay() {
        val p = player ?: return
        if (ended) {
            current?.let { load(it) }
            return
        }
        p.controls().setPause(isPlaying)
    }

    fun seekTo(ms: Long) {
        val p = player ?: return
        val target = ms.coerceIn(0L, if (lengthMs > 0) lengthMs else Long.MAX_VALUE)
        p.controls().setTime(target)
        positionMs = target
    }

    fun skip(deltaMs: Long) = seekTo(positionMs + deltaMs)

    fun next() {
        if (hasNext) {
            index += 1
            load(queue[index])
        }
    }

    fun previous() {
        // Like most players: restart the item if we are a few seconds in, otherwise go back.
        if (positionMs > 3_000 || !hasPrev) {
            seekTo(0)
        } else {
            index -= 1
            load(queue[index])
        }
    }

    fun setVolumePercent(v: Int) {
        volume = v.coerceIn(0, 200)
        player?.audio()?.setVolume(volume)
        settings.setVolume(volume)
        if (muted && volume > 0) toggleMute()
    }

    fun toggleMute() {
        muted = !muted
        player?.audio()?.setMute(muted)
    }

    fun setRate(r: Float) {
        rate = r
        player?.controls()?.setRate(r)
    }

    fun refreshTracks() {
        val p = player ?: return
        try {
            audioTracks = p.audio().trackDescriptions().map { Track(it.id(), it.description()) }
            subTracks = p.subpictures().trackDescriptions().map { Track(it.id(), it.description()) }
            audioTrack = p.audio().track()
            subTrack = p.subpictures().track()
        } catch (_: Throwable) {
        }
    }

    fun chooseAudio(id: Int) {
        player?.audio()?.setTrack(id)
        audioTrack = id
    }

    fun chooseSubtitle(id: Int) {
        player?.subpictures()?.setTrack(id)
        subTrack = id
    }

    fun loadSubtitleFile(path: String) {
        player?.subpictures()?.setSubTitleFile(path)
        refreshTracks()
    }

    /** Stops playback and remembers where we were. */
    fun close() {
        saveCurrentProgress()
        try {
            player?.controls()?.stop()
        } catch (_: Throwable) {
        }
        isPlaying = false
        frame = null
        current = null
    }

    private fun saveCurrentProgress() {
        val c = current ?: return
        if (c.isStream || lengthMs <= 0) return
        memory.saveProgress(c.path, if (ended) 0L else positionMs, lengthMs)
    }

    // ---------------------------------------------------------------- events

    private val listener = object : MediaPlayerEventAdapter() {
        override fun playing(mediaPlayer: MediaPlayer) {
            isPlaying = true
            ended = false
            // Track lists are only known a moment after playback starts.
            Thread {
                for (i in 0 until 3) {
                    Thread.sleep(700)
                    SwingUtilities.invokeLater { refreshTracks() }
                }
            }.start()
        }

        override fun paused(mediaPlayer: MediaPlayer) {
            isPlaying = false
        }

        override fun stopped(mediaPlayer: MediaPlayer) {
            isPlaying = false
        }

        override fun finished(mediaPlayer: MediaPlayer) {
            isPlaying = false
            // Never call back into libVLC from its own event thread.
            SwingUtilities.invokeLater {
                val c = current
                if (c != null && !c.isStream && lengthMs > 0) memory.saveProgress(c.path, 0L, lengthMs)
                if (settings.autoNext && hasNext) {
                    next()
                } else {
                    ended = true
                }
            }
        }

        override fun timeChanged(mediaPlayer: MediaPlayer, newTime: Long) {
            positionMs = newTime
            val now = System.currentTimeMillis()
            if (abs(now - lastSavedAt) > 5_000) {
                lastSavedAt = now
                saveCurrentProgress()
            }
        }

        override fun lengthChanged(mediaPlayer: MediaPlayer, newLength: Long) {
            lengthMs = newLength
        }

        override fun error(mediaPlayer: MediaPlayer) {
            SwingUtilities.invokeLater {
                isPlaying = false
                message = "This file couldn't be played."
            }
        }
    }

    // ---------------------------------------------------------------- video surface

    /**
     * vlcj's callback interfaces differ slightly between minor versions (extra no-op methods),
     * so they are implemented through dynamic proxies that only care about the two calls we need.
     */
    @Suppress("UNCHECKED_CAST")
    private fun createSurface(onFrame: (ImageBitmap) -> Unit): CallbackVideoSurface {
        fun objectMethod(proxy: Any, name: String, args: Array<Any?>?): Any? = when (name) {
            "hashCode" -> System.identityHashCode(proxy)
            "equals" -> proxy === args?.get(0)
            "toString" -> "EvaPlayerProxy"
            else -> null
        }

        val formatHandler = InvocationHandler { proxy, method, args ->
            if (method.declaringClass == Any::class.java) {
                objectMethod(proxy, method.name, args)
            } else if (method.name == "getBufferFormat") {
                RV32BufferFormat(args[0] as Int, args[1] as Int)
            } else {
                null
            }
        }
        val formatCallback = Proxy.newProxyInstance(
            BufferFormatCallback::class.java.classLoader,
            arrayOf<Class<*>>(BufferFormatCallback::class.java),
            formatHandler
        ) as BufferFormatCallback

        var scratch = ByteArray(0)
        val renderHandler = InvocationHandler { proxy, method, args ->
            if (method.declaringClass == Any::class.java) {
                objectMethod(proxy, method.name, args)
            } else {
                if (method.name == "display") {
                    val buffers = args[1] as Array<ByteBuffer>
                    val format = args[2] as BufferFormat
                    val w = format.width
                    val h = format.height
                    val src = buffers[0]
                    val size = w * h * 4
                    if (scratch.size != size) scratch = ByteArray(size)
                    src.rewind()
                    src.get(scratch, 0, minOf(size, src.remaining()))
                    val info = ImageInfo(w, h, ColorType.BGRA_8888, ColorAlphaType.PREMUL)
                    onFrame(Image.makeRaster(info, scratch, w * 4).toComposeImageBitmap())
                }
                null
            }
        }
        val renderCallback = Proxy.newProxyInstance(
            RenderCallback::class.java.classLoader,
            arrayOf<Class<*>>(RenderCallback::class.java),
            renderHandler
        ) as RenderCallback

        return CallbackVideoSurface(
            formatCallback,
            renderCallback,
            true,
            VideoSurfaceAdapters.getVideoSurfaceAdapter()
        )
    }
}

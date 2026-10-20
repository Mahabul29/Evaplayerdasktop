package evaplayer

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import java.nio.file.FileVisitOption
import java.nio.file.FileVisitResult
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.SimpleFileVisitor
import java.nio.file.attribute.BasicFileAttributes
import java.text.DateFormat
import java.util.Date
import java.util.EnumSet
import java.util.Locale

val VIDEO_EXT = setOf(
    "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v", "mpg", "mpeg", "3gp", "ts", "m2ts", "mts", "vob", "ogv", "divx"
)
val AUDIO_EXT = setOf(
    "mp3", "flac", "wav", "aac", "m4a", "ogg", "oga", "opus", "wma", "aiff", "alac", "mka"
)

data class MediaFile(
    val path: String,
    val title: String,
    val sizeBytes: Long,
    val modified: Long,
    val isAudio: Boolean,
    val folderPath: String,
    val isStream: Boolean = false,
) {
    val folderName: String
        get() = File(folderPath).name.ifBlank { folderPath }
    val ext: String
        get() = path.substringAfterLast('.', "").uppercase(Locale.ROOT)
    val sizeText: String get() = formatSize(sizeBytes)
    val dateText: String
        get() = if (modified <= 0) "" else DateFormat.getDateInstance(DateFormat.MEDIUM).format(Date(modified))

    companion object {
        fun fromFile(f: File): MediaFile {
            val ext = f.extension.lowercase(Locale.ROOT)
            return MediaFile(
                path = f.absolutePath,
                title = f.nameWithoutExtension,
                sizeBytes = f.length(),
                modified = f.lastModified(),
                isAudio = ext in AUDIO_EXT,
                folderPath = f.parent ?: "",
            )
        }

        fun fromUrl(url: String): MediaFile {
            val name = url.substringBefore('?').substringAfterLast('/').ifBlank { url }
            return MediaFile(url, name, 0L, 0L, isAudio = false, folderPath = "", isStream = true)
        }
    }
}

data class FolderEntry(val path: String, val name: String, val items: List<MediaFile>) {
    val totalBytes: Long get() = items.sumOf { it.sizeBytes }
    val latest: Long get() = items.maxOfOrNull { it.modified } ?: 0L
}

fun formatSize(bytes: Long): String {
    val kb = bytes / 1024.0
    val mb = kb / 1024.0
    val gb = mb / 1024.0
    return when {
        gb >= 1.0 -> String.format(Locale.US, "%.2f GB", gb)
        mb >= 1.0 -> String.format(Locale.US, "%.1f MB", mb)
        else -> String.format(Locale.US, "%.0f KB", kb)
    }
}

fun formatTime(ms: Long): String {
    val total = (ms / 1000).coerceAtLeast(0)
    val h = total / 3600
    val m = (total % 3600) / 60
    val s = total % 60
    return if (h > 0) String.format(Locale.US, "%d:%02d:%02d", h, m, s)
    else String.format(Locale.US, "%02d:%02d", m, s)
}

class LibraryState {
    var items by mutableStateOf<List<MediaFile>>(emptyList())
        private set
    var scanning by mutableStateOf(false)
        private set

    val videos: List<MediaFile> get() = items.filter { !it.isAudio }
    val music: List<MediaFile> get() = items.filter { it.isAudio }

    suspend fun scan(roots: List<String>) {
        scanning = true
        try {
            val found = withContext(Dispatchers.IO) { scanRoots(roots) }
            items = found
        } finally {
            scanning = false
        }
    }

    private fun scanRoots(roots: List<String>): List<MediaFile> {
        val out = LinkedHashMap<String, MediaFile>()
        for (root in roots) {
            val start = File(root)
            if (!start.isDirectory) continue
            val visitor = object : SimpleFileVisitor<Path>() {
                override fun preVisitDirectory(dir: Path, attrs: BasicFileAttributes): FileVisitResult {
                    val n = dir.fileName?.toString() ?: return FileVisitResult.CONTINUE
                    if (n.startsWith("$") || n.equals("System Volume Information", true)) return FileVisitResult.SKIP_SUBTREE
                    return FileVisitResult.CONTINUE
                }

                override fun visitFile(file: Path, attrs: BasicFileAttributes): FileVisitResult {
                    val name = file.fileName.toString()
                    val ext = name.substringAfterLast('.', "").lowercase(Locale.ROOT)
                    if (ext in VIDEO_EXT || ext in AUDIO_EXT) {
                        val f = file.toFile()
                        out[f.absolutePath] = MediaFile(
                            path = f.absolutePath,
                            title = f.nameWithoutExtension,
                            sizeBytes = attrs.size(),
                            modified = attrs.lastModifiedTime().toMillis(),
                            isAudio = ext in AUDIO_EXT,
                            folderPath = f.parent ?: "",
                        )
                    }
                    return FileVisitResult.CONTINUE
                }

                override fun visitFileFailed(file: Path, exc: IOException): FileVisitResult = FileVisitResult.CONTINUE
            }
            try {
                Files.walkFileTree(start.toPath(), EnumSet.noneOf(FileVisitOption::class.java), 8, visitor)
            } catch (_: Exception) {
            }
        }
        return out.values.toList()
    }
}

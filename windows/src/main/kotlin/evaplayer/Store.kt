package evaplayer

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import java.io.File
import java.util.Properties

/** Tiny key/value file in %APPDATA%\EvaPlayer\settings.properties */
object Store {
    private val dir: File =
        File(System.getenv("APPDATA") ?: System.getProperty("user.home"), "EvaPlayer").also { it.mkdirs() }
    private val file = File(dir, "settings.properties")
    private val props = Properties()

    init {
        try {
            if (file.exists()) file.inputStream().use { props.load(it) }
        } catch (_: Exception) {
        }
    }

    @Synchronized
    fun get(key: String, def: String): String = props.getProperty(key, def)

    @Synchronized
    fun put(key: String, value: String?) {
        if (value == null) props.remove(key) else props.setProperty(key, value)
        try {
            file.outputStream().use { props.store(it, "EvaPlayer settings") }
        } catch (_: Exception) {
        }
    }

    @Synchronized
    fun keysWithPrefix(prefix: String): List<String> =
        props.stringPropertyNames().filter { it.startsWith(prefix) }
}

data class Progress(val posMs: Long, val lenMs: Long, val lastPlayed: Long) {
    val fraction: Float get() = if (lenMs <= 0) 0f else (posMs.toFloat() / lenMs).coerceIn(0f, 1f)
}

/** Everything the user can change, observable by Compose and saved to [Store]. */
class AppSettings {
    var theme by mutableStateOf(Store.get("theme", "Dark"))
        private set
    var accent by mutableStateOf(Store.get("accent", "Blue"))
        private set
    var skipSeconds by mutableStateOf(Store.get("skip", "10").toIntOrNull() ?: 10)
        private set
    var resume by mutableStateOf(Store.get("resume", "1") == "1")
        private set
    var autoNext by mutableStateOf(Store.get("autonext", "1") == "1")
        private set
    var volume by mutableStateOf(Store.get("volume", "100").toIntOrNull() ?: 100)
        private set

    val folders = mutableStateListOf<String>().also { list ->
        val saved = Store.get("folders", "")
        if (saved.isNotBlank()) {
            list.addAll(saved.split("|").filter { it.isNotBlank() })
        } else {
            val home = System.getProperty("user.home")
            listOf("Videos", "Music").map { File(home, it) }.filter { it.isDirectory }
                .forEach { list.add(it.absolutePath) }
        }
    }

    fun changeTheme(v: String) { theme = v; Store.put("theme", v) }
    fun changeAccent(v: String) { accent = v; Store.put("accent", v) }
    fun setSkip(v: Int) { skipSeconds = v; Store.put("skip", v.toString()) }
    fun changeResume(v: Boolean) { resume = v; Store.put("resume", if (v) "1" else "0") }
    fun changeAutoNext(v: Boolean) { autoNext = v; Store.put("autonext", if (v) "1" else "0") }
    fun changeVolume(v: Int) { volume = v; Store.put("volume", v.toString()) }

    fun addFolder(path: String) {
        if (folders.none { it.equals(path, ignoreCase = true) }) {
            folders.add(path)
            saveFolders()
        }
    }

    fun removeFolder(path: String) {
        folders.remove(path)
        saveFolders()
    }

    private fun saveFolders() = Store.put("folders", folders.joinToString("|"))
}

/** Favourites + watch progress, observable. */
class MediaMemory {
    val favorites = mutableStateListOf<String>().also { l ->
        Store.keysWithPrefix("fav.").forEach { l.add(it.removePrefix("fav.")) }
    }
    val progress = mutableStateMapOf<String, Progress>().also { m ->
        Store.keysWithPrefix("p.").forEach { key ->
            val parts = Store.get(key, "").split(",")
            if (parts.size == 3) {
                val pos = parts[0].toLongOrNull()
                val len = parts[1].toLongOrNull()
                val last = parts[2].toLongOrNull()
                if (pos != null && len != null && last != null) m[key.removePrefix("p.")] = Progress(pos, len, last)
            }
        }
    }

    fun isFavorite(path: String) = favorites.contains(path)

    fun toggleFavorite(path: String) {
        if (favorites.contains(path)) {
            favorites.remove(path)
            Store.put("fav.$path", null)
        } else {
            favorites.add(path)
            Store.put("fav.$path", "1")
        }
    }

    fun saveProgress(path: String, posMs: Long, lenMs: Long) {
        // Treat "almost finished" as finished so the video isn't resumed in the credits.
        val done = lenMs > 0 && posMs >= lenMs - 10_000
        val p = Progress(if (done) 0L else posMs, lenMs, System.currentTimeMillis())
        progress[path] = p
        Store.put("p.$path", "${p.posMs},${p.lenMs},${p.lastPlayed}")
    }
}

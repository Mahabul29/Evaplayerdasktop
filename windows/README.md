# EvaPlayer for Windows

Desktop version of EvaPlayer (Kotlin + Compose Desktop, playback through VLC's engine).

**Features:** video & music library from your folders, folders view, favorites, continue watching,
resume position, search/sort, network stream URLs, subtitles (auto-detected next to the video, embedded
tracks, or load a file), audio track switching, speed, volume up to 200%, fullscreen, keyboard shortcuts,
Dark / Light / AMOLED themes and accent colours.

Not ported from the Android app: Wi-Fi file transfer, PIN lock, hidden videos, in-app browser, ads, casting.

## Get it
Push to GitHub: the **Build Windows** workflow builds it and attaches two files to a release
(`windows-v<N>`):
- `EvaPlayer-Windows-setup.msi` – installer (Start-menu shortcut)
- `EvaPlayer-Windows-portable.zip` – unzip and run `EvaPlayer.exe`

VLC is bundled in both, so nothing else needs to be installed. If the VLC download step ever fails in CI,
the app falls back to a normal 64-bit VLC install on the PC.

## Build locally (on Windows)
Needs JDK 17 and Gradle 8.10+:
```
cd windows
gradle run                 # start it
gradle createDistributable # portable folder in build/compose/binaries/main/app
gradle packageMsi          # installer (needs WiX 3)
```

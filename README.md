# EvaPlayer

A video and music player. This repo has two parts:

- `windows/` – EvaPlayer for Windows (Kotlin + Compose Desktop, playback through VLC's engine)
- `src/` – web (React) version of the UI

## Download the Windows app

1. Open the [**Releases** page](https://github.com/Mahabul29/Evaplayerdasktop/releases) of this repo.
2. Open the newest release, named **EvaPlayer for Windows v<N>**.
3. Under **Assets**, download one of:
   - `EvaPlayer-Windows-portable.zip` – unzip it and run `EvaPlayer.exe`. No install needed.
   - `EvaPlayer-Windows-setup.msi` – installer with a Start-menu shortcut.

You can also open [**Actions**](https://github.com/Mahabul29/Evaplayerdasktop/actions) → **Build Windows → latest successful run → Artifacts → EvaPlayer-Windows**
(requires a GitHub sign-in).

VLC is bundled with the app. If the VLC download step failed during the build, the app falls back to a
64-bit VLC installed on your PC.

> The app runs on Windows only.

## How builds work

Every push to `main` that changes `windows/**` or `.github/workflows/build-windows.yml` runs the
**Build Windows** workflow. You can also start it by hand from the Actions tab (**Run workflow**).
It builds the app, zips it, builds the `.msi`, and publishes both as a new release (`windows-v<N>`).

## Build locally (Windows)

Needs JDK 17 and Gradle 8.10+:

```
cd windows
gradle run                  # start the app
gradle createDistributable  # portable folder in build/compose/binaries/main/app
gradle packageMsi           # installer (needs WiX 3)
```

See [`windows/README.md`](windows/README.md) for the feature list.

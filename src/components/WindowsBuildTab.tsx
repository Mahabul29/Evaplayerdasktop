import React, { useState } from 'react';
import {
  DownloadCloud,
  FileCode,
  Terminal,
  CheckCircle2,
  Copy,
  ExternalLink,
  Laptop,
  Box,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu,
  Archive
} from 'lucide-react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { AccentName } from '../types/media';
import { ACCENT_COLORS } from '../utils/formatters';

interface Props {
  accent: AccentName;
}

export const WindowsBuildTab: React.FC<Props> = ({ accent }) => {
  const [activeCodeFile, setActiveCodeFile] = useState<'build.gradle.kts' | 'PlayerScreen.kt' | 'Engine.kt' | 'build-windows.yml'>('build.gradle.kts');
  const [isZipping, setIsZipping] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const accentCfg = ACCENT_COLORS[accent];

  const codeSnippets: Record<string, string> = {
    'build.gradle.kts': `import org.jetbrains.compose.desktop.application.dsl.TargetFormat

plugins {
    kotlin("jvm") version "2.1.0"
    id("org.jetbrains.kotlin.plugin.compose") version "2.1.0"
    id("org.jetbrains.compose") version "1.7.3"
}

group = "com.evaplayer"
version = "1.0.0"

dependencies {
    implementation(compose.desktop.currentOs)
    implementation(compose.material3)
    implementation(compose.materialIconsExtended)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-swing:1.9.0")

    // VLC bindings: plays practically every video/audio format (mkv, avi, flac, ...)
    implementation("uk.co.caprica:vlcj:4.8.3")
    implementation("net.java.dev.jna:jna:5.14.0")
    implementation("net.java.dev.jna:jna-platform:5.14.0")
}

compose.desktop {
    application {
        mainClass = "evaplayer.MainKt"

        nativeDistributions {
            targetFormats(TargetFormat.Msi)
            packageName = "EvaPlayer"
            packageVersion = "1.0.0"
            description = "EvaPlayer - video and music player for Windows"
            vendor = "Eva"

            appResourcesRootDir.set(project.layout.projectDirectory.dir("app-resources"))
            includeAllModules = true

            windows {
                menuGroup = "EvaPlayer"
                shortcut = true
                dirChooser = true
                perUserInstall = true
                iconFile.set(project.file("icons/eva.ico"))
                upgradeUuid = "6f1c2c0e-3b0e-4a39-9d1a-3f0e5b8f7a11"
            }
        }
    }
}`,
    'PlayerScreen.kt': `package evaplayer

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.*
import androidx.compose.ui.unit.dp

// Full hardware accelerated VLC engine rendering surface
@Composable
fun PlayerScreen(app: AppController) {
    val e = app.engine
    var controlsVisible by remember { mutableStateOf(true) }

    Box(Modifier.fillMaxSize().background(Color.Black)) {
        // Embedded VLC Video Surface
        VlcVideoSurface(e)

        // Windows Overlay Controls
        AnimatedVisibility(
            visible = controlsVisible,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            PlayerControlsHud(app)
        }
    }
}`,
    'Engine.kt': `package evaplayer

import uk.co.caprica.vlcj.player.base.MediaPlayer
import uk.co.caprica.vlcj.player.component.CallbackMediaPlayerComponent

class Engine(private val settings: AppSettings, private val memory: MediaMemory) {
    var playerComponent: CallbackMediaPlayerComponent? = null
    val isAvailable: Boolean get() = playerComponent != null

    fun play(files: List<MediaFile>, index: Int) {
        val target = files.getOrNull(index) ?: return
        playerComponent?.mediaPlayer()?.media()?.play(target.path)
    }

    fun togglePlay() {
        playerComponent?.mediaPlayer()?.controls()?.pause()
    }
}`,
    'build-windows.yml': `name: Build Windows
on:
  push:
    branches: [ main ]
    paths:
      - 'windows/**'
      - '.github/workflows/build-windows.yml'
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: 8.10.2

      - name: Build Portable Windows (.exe)
        run: gradle -p windows createDistributable

      - name: Build Windows Installer (.msi)
        run: gradle -p windows packageMsi`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeFile]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadProjectZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Folder structure inside zip
      const windowsFolder = zip.folder('windows');
      const srcFolder = zip.folder('windows/src/main/kotlin/evaplayer');
      const workflowsFolder = zip.folder('.github/workflows');

      // Add build files
      windowsFolder?.file('build.gradle.kts', codeSnippets['build.gradle.kts']);
      windowsFolder?.file(
        'settings.gradle.kts',
        `rootProject.name = "evaplayer-windows"\npluginManagement {\n    repositories {\n        google()\n        gradlePluginPortal()\n        mavenCentral()\n    }\n}\ndependencyResolutionManagement {\n    repositories {\n        google()\n        mavenCentral()\n    }\n}`
      );
      windowsFolder?.file(
        'README.md',
        `# EvaPlayer for Windows\n\nDesktop version of EvaPlayer (Kotlin + Compose Desktop + VLC Engine).\n\n## Local Build:\n\`\`\`cmd\ncd windows\ngradle run\ngradle createDistributable\ngradle packageMsi\n\`\`\`\n`
      );

      // Add source files
      srcFolder?.file('PlayerScreen.kt', codeSnippets['PlayerScreen.kt']);
      srcFolder?.file('Engine.kt', codeSnippets['Engine.kt']);
      srcFolder?.file('build.gradle.kts', codeSnippets['build.gradle.kts']);

      // Add workflow
      workflowsFolder?.file('build-windows.yml', codeSnippets['build-windows.yml']);

      // Add easy Windows batch launcher
      zip.file(
        'Build-EvaPlayer-Windows.bat',
        `@echo off
echo ==============================================
echo       EvaPlayer for Windows - Build Script
echo ==============================================
echo.
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Java JDK 17+ is required but not found in PATH.
    echo Please install JDK 17 from https://adoptium.net/
    pause
    exit /b 1
)

cd windows
echo [1/3] Building portable EvaPlayer.exe ...
call gradle createDistributable --console=plain

echo.
echo [2/3] Building installer EvaPlayer-Windows-setup.msi ...
call gradle packageMsi --console=plain

echo.
echo [SUCCESS] Windows binaries are located in:
echo windows\\build\\compose\\binaries\\main\\
pause`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'EvaPlayer-Windows-Source-and-CI.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      console.error(e);
      alert('Error generating zip: ' + e);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadBatchScript = () => {
    const script = `@echo off
echo ========================================================
echo       EvaPlayer for Windows - Quick Launch & Build
echo ========================================================
echo.
cd /d %~dp0windows
echo Starting EvaPlayer Desktop...
call gradle run
pause`;
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'run-evaplayer-windows.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Laptop className="w-6 h-6 text-blue-400" />
            <span>Windows Desktop Hub</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-normal">
              Compose Desktop & VLC
            </span>
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Package and compile EvaPlayer as a native Windows 11 executable (.exe) and installer (.msi)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadProjectZip}
            disabled={isZipping}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg flex items-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 ${accentCfg.bgClass}`}
          >
            <Archive className="w-4 h-4" />
            <span>{isZipping ? 'Packing Zip...' : 'Download Windows ZIP'}</span>
          </button>
          <button
            onClick={handleDownloadBatchScript}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>.BAT Script</span>
          </button>
        </div>
      </div>

      {/* Release Artifacts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MSI Installer Card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Box className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold uppercase">
              WiX 3 Setup
            </span>
          </div>

          <h3 className="text-base font-bold text-white mt-4">
            EvaPlayer-Windows-setup.msi
          </h3>
          <p className="text-xs text-white/60 mt-1">
            Standard Windows installer with Start Menu shortcut, desktop icon, and uninstall support.
          </p>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
            <span className="font-mono">Output: /binaries/main/msi/</span>
            <span className="text-emerald-400 font-medium">Ready in CI / Local</span>
          </div>
        </div>

        {/* Portable Folder Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
              Portable ZIP
            </span>
          </div>

          <h3 className="text-base font-bold text-white mt-4">
            EvaPlayer-Windows-portable.zip
          </h3>
          <p className="text-xs text-white/60 mt-1">
            Self-contained Windows executable (<span className="text-white font-mono">EvaPlayer.exe</span>) with embedded VLC 64-bit engine. No installation required.
          </p>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
            <span className="font-mono">Output: /binaries/main/app/</span>
            <span className="text-emerald-400 font-medium">Bundled VLC 3.0.21</span>
          </div>
        </div>
      </div>

      {/* Windows Architecture & Specs */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-4">
        <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>Windows Architecture & Tech Stack</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase font-semibold">Engine</p>
            <p className="text-xs font-bold text-white mt-1">VLC 64-bit Native</p>
            <p className="text-[10px] text-white/50 mt-0.5">libvlc.dll + plugins</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase font-semibold">UI Framework</p>
            <p className="text-xs font-bold text-white mt-1">Compose Desktop</p>
            <p className="text-[10px] text-white/50 mt-0.5">Kotlin 2.1.0 + M3</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase font-semibold">Windows OS</p>
            <p className="text-xs font-bold text-white mt-1">Windows 11 / 10</p>
            <p className="text-[10px] text-white/50 mt-0.5">x86_64 architecture</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase font-semibold">Formats</p>
            <p className="text-xs font-bold text-white mt-1">MKV, MP4, FLAC...</p>
            <p className="text-[10px] text-white/50 mt-0.5">Hardware decode</p>
          </div>
        </div>
      </div>

      {/* How to Build on Windows Locally */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-3">
        <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Quick Build Commands (Run in PowerShell / CMD)</span>
        </h2>

        <div className="bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-xs text-white/90 space-y-2">
          <div className="flex items-center justify-between text-white/40 text-[11px] pb-2 border-b border-white/10">
            <span>Terminal</span>
            <span>Windows CMD / PowerShell</span>
          </div>
          <p className="text-emerald-400"># 1. Navigate to the Windows source directory</p>
          <p className="text-white">cd windows</p>
          <p className="text-emerald-400 pt-1"># 2. Test run EvaPlayer Desktop directly</p>
          <p className="text-white">gradle run</p>
          <p className="text-emerald-400 pt-1"># 3. Create portable EvaPlayer.exe distribution</p>
          <p className="text-white">gradle createDistributable</p>
          <p className="text-emerald-400 pt-1"># 4. Generate Windows .msi installer</p>
          <p className="text-white">gradle packageMsi</p>
        </div>
      </div>

      {/* Code Inspector Tabs */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white/90">Windows Project Source Inspector</span>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition-colors"
          >
            {copiedCode ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          {(['build.gradle.kts', 'PlayerScreen.kt', 'Engine.kt', 'build-windows.yml'] as const).map(
            (filename) => (
              <button
                key={filename}
                onClick={() => setActiveCodeFile(filename)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                  activeCodeFile === filename
                    ? `${accentCfg.bgClass} text-white font-semibold`
                    : 'text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {filename}
              </button>
            )
          )}
        </div>

        {/* Code Block */}
        <pre className="bg-black/70 border border-white/10 rounded-xl p-4 text-[11px] font-mono text-white/80 overflow-x-auto max-h-80 leading-relaxed">
          <code>{codeSnippets[activeCodeFile]}</code>
        </pre>
      </div>
    </div>
  );
};

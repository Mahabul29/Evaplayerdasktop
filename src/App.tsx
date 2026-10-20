import React, { useState, useEffect } from 'react';
import { MediaFile, AppSettings, ProgressRecord, Playlist, AccentName } from './types/media';
import { INITIAL_MEDIA_FILES } from './data/sampleMedia';
import { ACCENT_COLORS } from './utils/formatters';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { NavigationSidebar, MainTab } from './components/NavigationSidebar';
import { VideosTab } from './components/VideosTab';
import { FoldersTab } from './components/FoldersTab';
import { MusicTab } from './components/MusicTab';
import { FavoritesTab } from './components/FavoritesTab';
import { PlaylistsTab } from './components/PlaylistsTab';
import { NetworkStreamTab } from './components/NetworkStreamTab';
import { VaultTab } from './components/VaultTab';
import { WindowsBuildTab } from './components/WindowsBuildTab';
import { SettingsTab } from './components/SettingsTab';
import { PlayerScreen } from './components/PlayerScreen';
import { LocalFilePickerModal } from './components/LocalFilePickerModal';

export default function App() {
  // App Settings state (matching Store.kt)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('eva_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      theme: 'Dark',
      accent: 'Blue',
      skipSeconds: 10,
      resume: true,
      autoNext: true,
      volume: 100,
      aspectRatio: 'fit',
      subtitleSize: 'base',
      subtitleColor: '#ffffff',
      subtitleBgOpacity: 0.65,
      subtitleOffsetSec: 0,
      equalizerPreset: 'Flat',
      folders: [
        'C:\\Users\\User\\Videos\\Movies',
        'C:\\Users\\User\\Videos\\Sci-Fi',
        'C:\\Users\\User\\Videos\\Animation',
        'C:\\Users\\User\\Music\\Lofi & Beats',
        'C:\\Users\\User\\Music\\Synthwave',
      ],
      hydrationReminder: false,
      lastHydrationReminder: Date.now(),
    };
  });

  // Media Library state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(() => {
    try {
      const saved = localStorage.getItem('eva_library');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_MEDIA_FILES;
  });

  // Watch Progress memory (matching MediaMemory in Store.kt)
  const [progressMap, setProgressMap] = useState<Record<string, ProgressRecord>>(() => {
    try {
      const saved = localStorage.getItem('eva_progress');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      'vid-1': { posMs: 45000, lenMs: 596000, lastPlayed: Date.now() - 3600000 * 2 },
      'vid-2': { posMs: 120000, lenMs: 734000, lastPlayed: Date.now() - 3600000 * 5 },
    };
  });

  // Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('eva_playlists');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'pl-1',
        name: 'Cinematic Open Movies',
        description: 'Open source 4K CGI features',
        mediaIds: ['vid-1', 'vid-2', 'vid-3'],
        createdAt: Date.now(),
      },
      {
        id: 'pl-2',
        name: 'Chill & Study Session',
        description: 'Ambient & Lofi Beats',
        mediaIds: ['mus-1', 'mus-2', 'mus-3'],
        createdAt: Date.now(),
      },
    ];
  });

  // Navigation & Windows states
  const [activeTab, setActiveTab] = useState<MainTab>('videos');
  const [inPlayer, setInPlayer] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [isLocalPickerOpen, setIsLocalPickerOpen] = useState(false);

  // Sync settings to localStorage & CSS accent variable
  useEffect(() => {
    localStorage.setItem('eva_settings', JSON.stringify(settings));
    const accentCfg = ACCENT_COLORS[settings.accent];
    document.documentElement.style.setProperty('--accent-color', accentCfg.hex);
  }, [settings]);

  // Sync library to localStorage
  useEffect(() => {
    localStorage.setItem('eva_library', JSON.stringify(mediaFiles));
  }, [mediaFiles]);

  // Sync progressMap to localStorage
  useEffect(() => {
    localStorage.setItem('eva_progress', JSON.stringify(progressMap));
  }, [progressMap]);

  // Sync playlists
  useEffect(() => {
    localStorage.setItem('eva_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Play selected media
  const handlePlayMedia = (media: MediaFile) => {
    setCurrentMedia(media);
    setIsPlaying(true);
    setInPlayer(true);
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setMediaFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  // Save playback progress
  const handleSaveProgress = (mediaId: string, posMs: number, lenMs: number) => {
    setProgressMap((prev) => ({
      ...prev,
      [mediaId]: {
        posMs,
        lenMs,
        lastPlayed: Date.now(),
      },
    }));
  };

  // Next track
  const handleNextMedia = () => {
    if (!currentMedia) return;
    const currentList = currentMedia.isAudio
      ? mediaFiles.filter((m) => m.isAudio && !m.isVault)
      : mediaFiles.filter((m) => !m.isAudio && !m.isVault);
    const index = currentList.findIndex((m) => m.id === currentMedia.id);
    if (index !== -1 && index + 1 < currentList.length) {
      setCurrentMedia(currentList[index + 1]);
    } else if (currentList.length > 0) {
      setCurrentMedia(currentList[0]);
    }
  };

  // Previous track
  const handlePrevMedia = () => {
    if (!currentMedia) return;
    const currentList = currentMedia.isAudio
      ? mediaFiles.filter((m) => m.isAudio && !m.isVault)
      : mediaFiles.filter((m) => !m.isAudio && !m.isVault);
    const index = currentList.findIndex((m) => m.id === currentMedia.id);
    if (index > 0) {
      setCurrentMedia(currentList[index - 1]);
    } else if (currentList.length > 0) {
      setCurrentMedia(currentList[currentList.length - 1]);
    }
  };

  // Add imported files to library
  const handleAddFiles = (newFiles: MediaFile[]) => {
    setMediaFiles((prev) => [...newFiles, ...prev]);
    if (newFiles.length > 0) {
      handlePlayMedia(newFiles[0]);
    }
  };

  // Vault unhide
  const handleUnhideVideo = (id: string) => {
    setMediaFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isVault: false } : item))
    );
  };

  // Playlist management
  const handleCreatePlaylist = (name: string, description: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description,
      mediaIds: [],
      createdAt: Date.now(),
    };
    setPlaylists((prev) => [...prev, newPl]);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  // Filtered lists
  const videos = mediaFiles.filter((m) => !m.isAudio && !m.isVault);
  const music = mediaFiles.filter((m) => m.isAudio && !m.isVault);
  const favorites = mediaFiles.filter((m) => m.isFavorite && !m.isVault);
  const vaultVideos = mediaFiles.filter((m) => m.isVault);

  // Background Theme styles
  const getThemeBg = () => {
    switch (settings.theme) {
      case 'AMOLED':
        return 'bg-black text-white';
      case 'Light':
        return 'bg-[#f4f5f8] text-[#1a1d26]';
      case 'Dark':
      default:
        return 'bg-[#0f1117] text-white';
    }
  };

  return (
    <div className={`w-screen h-screen flex items-center justify-center p-0 ${isMaximized ? '' : 'p-2 md:p-6 bg-[#08090d]'}`}>
      {/* Windows 11 Desktop Application Container */}
      <div
        className={`w-full h-full flex flex-col overflow-hidden transition-all duration-300 ${
          isMaximized
            ? 'rounded-none'
            : 'rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] border border-white/15 ring-1 ring-white/10'
        } ${getThemeBg()}`}
      >
        {/* Windows 11 Title Bar */}
        <WindowsTitleBar
          currentMedia={currentMedia}
          isPlaying={isPlaying}
          accent={settings.accent}
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized(!isMaximized)}
          onMinimize={() => {
            alert('EvaPlayer minimized to Windows system tray.');
          }}
          onOpenFile={() => setIsLocalPickerOpen(true)}
          onOpenFolder={() => setIsLocalPickerOpen(true)}
          onOpenBuildHub={() => {
            setInPlayer(false);
            setActiveTab('windows-build');
          }}
          onCloseApp={() => {
            if (confirm('Close EvaPlayer for Windows?')) {
              setInPlayer(false);
              setIsPlaying(false);
            }
          }}
        />

        {/* Main Application Body */}
        <div className="flex-1 flex overflow-hidden relative">
          {inPlayer && currentMedia ? (
            /* Full Player Screen */
            <PlayerScreen
              currentMedia={currentMedia}
              playlist={mediaFiles}
              settings={settings}
              savedPositionMs={progressMap[currentMedia.id]?.posMs || 0}
              onClose={() => setInPlayer(false)}
              onNext={handleNextMedia}
              onPrev={handlePrevMedia}
              onSaveProgress={handleSaveProgress}
            />
          ) : (
            /* Desktop Library Navigation View */
            <div className="flex-1 flex w-full h-full overflow-hidden">
              {/* Windows Navigation Rail / Sidebar */}
              <NavigationSidebar
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                accent={settings.accent}
                videoCount={videos.length}
                musicCount={music.length}
                folderCount={settings.folders.length}
                favoriteCount={favorites.length}
                currentMedia={currentMedia}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onOpenPlayer={() => setInPlayer(true)}
                onOpenFile={() => setIsLocalPickerOpen(true)}
                onOpenFolder={() => setIsLocalPickerOpen(true)}
              />

              {/* Main Content Pane */}
              <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                {activeTab === 'videos' && (
                  <VideosTab
                    videos={videos}
                    progressMap={progressMap}
                    accent={settings.accent}
                    onPlayVideo={handlePlayMedia}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenFile={() => setIsLocalPickerOpen(true)}
                  />
                )}

                {activeTab === 'folders' && (
                  <FoldersTab
                    mediaFiles={mediaFiles}
                    accent={settings.accent}
                    onPlayMedia={handlePlayMedia}
                    onOpenFolderDialog={() => setIsLocalPickerOpen(true)}
                  />
                )}

                {activeTab === 'music' && (
                  <MusicTab
                    musicFiles={music}
                    currentMedia={currentMedia}
                    isPlaying={isPlaying}
                    accent={settings.accent}
                    onPlayMedia={handlePlayMedia}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    onNextTrack={handleNextMedia}
                    onPrevTrack={handlePrevMedia}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}

                {activeTab === 'favorites' && (
                  <FavoritesTab
                    favoriteFiles={favorites}
                    accent={settings.accent}
                    onPlayMedia={handlePlayMedia}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}

                {activeTab === 'playlists' && (
                  <PlaylistsTab
                    playlists={playlists}
                    allMedia={mediaFiles}
                    accent={settings.accent}
                    onPlayMedia={handlePlayMedia}
                    onCreatePlaylist={handleCreatePlaylist}
                    onDeletePlaylist={handleDeletePlaylist}
                  />
                )}

                {activeTab === 'stream' && (
                  <NetworkStreamTab
                    accent={settings.accent}
                    onPlayStream={handlePlayMedia}
                  />
                )}

                {activeTab === 'vault' && (
                  <VaultTab
                    vaultVideos={vaultVideos}
                    accent={settings.accent}
                    onPlayMedia={handlePlayMedia}
                    onUnhideVideo={handleUnhideVideo}
                  />
                )}

                {activeTab === 'windows-build' && (
                  <WindowsBuildTab accent={settings.accent} />
                )}

                {activeTab === 'settings' && (
                  <SettingsTab
                    settings={settings}
                    onUpdateSettings={(newSettings) =>
                      setSettings((prev) => ({ ...prev, ...newSettings }))
                    }
                    onOpenFolderDialog={() => setIsLocalPickerOpen(true)}
                  />
                )}
              </main>
            </div>
          )}
        </div>
      </div>

      {/* Local File & Folder Picker Dropzone Modal */}
      <LocalFilePickerModal
        isOpen={isLocalPickerOpen}
        accent={settings.accent}
        onClose={() => setIsLocalPickerOpen(false)}
        onFilesSelected={handleAddFiles}
      />
    </div>
  );
}

import React from 'react';
import {
  Film,
  Folder,
  Music2,
  Heart,
  ListMusic,
  Globe,
  Shield,
  DownloadCloud,
  Settings,
  Plus,
  Play,
  Pause,
  Maximize2
} from 'lucide-react';
import { MediaFile, AccentName } from '../types/media';
import { ACCENT_COLORS } from '../utils/formatters';

export type MainTab =
  | 'videos'
  | 'folders'
  | 'music'
  | 'favorites'
  | 'playlists'
  | 'stream'
  | 'vault'
  | 'windows-build'
  | 'settings';

interface Props {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  accent: AccentName;
  videoCount: number;
  musicCount: number;
  folderCount: number;
  favoriteCount: number;
  currentMedia: MediaFile | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenPlayer: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
}

export const NavigationSidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  accent,
  videoCount,
  musicCount,
  folderCount,
  favoriteCount,
  currentMedia,
  isPlaying,
  onTogglePlay,
  onOpenPlayer,
  onOpenFile,
  onOpenFolder,
}) => {
  const accentCfg = ACCENT_COLORS[accent];

  const navItems: { id: MainTab; label: string; icon: React.ReactNode; badge?: number | string; highlight?: boolean }[] = [
    {
      id: 'videos',
      label: 'Videos',
      icon: <Film className="w-4 h-4" />,
      badge: videoCount,
    },
    {
      id: 'folders',
      label: 'Folders',
      icon: <Folder className="w-4 h-4" />,
      badge: folderCount,
    },
    {
      id: 'music',
      label: 'Music',
      icon: <Music2 className="w-4 h-4" />,
      badge: musicCount,
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: <Heart className="w-4 h-4" />,
      badge: favoriteCount,
    },
    {
      id: 'playlists',
      label: 'Playlists',
      icon: <ListMusic className="w-4 h-4" />,
    },
    {
      id: 'stream',
      label: 'Stream URL',
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'vault',
      label: 'Private Vault',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'windows-build',
      label: 'Windows Hub',
      icon: <DownloadCloud className="w-4 h-4 text-emerald-400" />,
      badge: '.MSI / .EXE',
      highlight: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-[#141721]/90 border-r border-white/10 flex flex-col justify-between p-3 select-none backdrop-blur-xl shrink-0">
      {/* Top: Navigation List */}
      <div className="flex flex-col gap-1">
        {/* Quick Open actions */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={onOpenFile}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium text-white shadow-sm transition-all hover:brightness-110 active:scale-95 ${accentCfg.bgClass}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open File</span>
          </button>
          <button
            onClick={onOpenFolder}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-all active:scale-95"
            title="Scan or add Windows directory"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Folder</span>
          </button>
        </div>

        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-2 py-1">
          Library & Media
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? `${accentCfg.bgClass}/20 ${accentCfg.textClass} border border-${accentCfg.borderClass}/30 font-semibold shadow-sm`
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? accentCfg.textClass : 'text-white/60'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      item.highlight
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isActive
                        ? `${accentCfg.bgClass}/30 text-white`
                        : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Mini-Player Preview Card (if media playing while on library tabs) */}
      <div className="mt-4 pt-3 border-t border-white/10">
        {currentMedia ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 relative group hover:border-white/20 transition-all">
            <div className="flex items-center gap-2.5">
              <div
                onClick={onOpenPlayer}
                className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden relative cursor-pointer shrink-0 flex items-center justify-center border border-white/10 group-hover:ring-1 group-hover:ring-white/30"
              >
                {currentMedia.thumbnailUrl ? (
                  <img
                    src={currentMedia.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music2 className="w-5 h-5 text-white/60" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p
                  onClick={onOpenPlayer}
                  className="text-xs font-semibold text-white/90 truncate cursor-pointer hover:underline"
                >
                  {currentMedia.title}
                </p>
                <p className="text-[10px] text-white/50 truncate">
                  {currentMedia.isAudio
                    ? currentMedia.artist || 'Audio Track'
                    : currentMedia.folderName || 'Local Video'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white/10 rounded text-white/70">
                    {currentMedia.format}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono">
                    Windows Direct
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onTogglePlay}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-transform active:scale-90 ${accentCfg.bgClass}`}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-2 py-1 text-center">
            <p className="text-[11px] text-white/40">EvaPlayer v1.0 Desktop</p>
            <p className="text-[9px] text-white/20 font-mono">Windows 11 Fluent Edition</p>
          </div>
        )}
      </div>
    </aside>
  );
};

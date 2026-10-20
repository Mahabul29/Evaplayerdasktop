import React from 'react';
import { Minus, Square, X, FolderOpen, DownloadCloud, Sparkles, Radio } from 'lucide-react';
import { MediaFile, AccentName } from '../types/media';
import { ACCENT_COLORS } from '../utils/formatters';

interface Props {
  currentMedia: MediaFile | null;
  isPlaying: boolean;
  accent: AccentName;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onOpenBuildHub: () => void;
  onCloseApp: () => void;
}

export const WindowsTitleBar: React.FC<Props> = ({
  currentMedia,
  isPlaying,
  accent,
  isMaximized,
  onToggleMaximize,
  onMinimize,
  onOpenFile,
  onOpenFolder,
  onOpenBuildHub,
  onCloseApp,
}) => {
  const accentCfg = ACCENT_COLORS[accent];

  return (
    <header className="h-10 bg-[#12151e]/95 border-b border-white/10 flex items-center justify-between px-3 select-none z-50 text-xs backdrop-blur-md">
      {/* Left: Window Brand & Menu */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img
            src="/eva_logo.png"
            alt="EvaPlayer"
            className="w-5 h-5 rounded object-cover shadow-sm ring-1 ring-white/10"
            onError={(e) => {
              // fallback if logo missing
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-semibold text-white/90 tracking-wide flex items-center gap-1.5">
            EvaPlayer
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">
              Win64
            </span>
          </span>
        </div>

        {/* Quick Windows File Shortcuts */}
        <div className="hidden md:flex items-center gap-1 ml-3 border-l border-white/10 pl-3 text-white/70">
          <button
            onClick={onOpenFile}
            className="hover:bg-white/10 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1.5"
            title="Open local media file (Ctrl+O)"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open File</span>
          </button>
          <button
            onClick={onOpenFolder}
            className="hover:bg-white/10 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1.5"
            title="Open folder of videos or music"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Folder</span>
          </button>
          <button
            onClick={onOpenBuildHub}
            className="hover:bg-white/10 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1.5 text-blue-400 font-medium"
            title="Get Windows .exe installer and Compose Desktop source"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Windows Installer</span>
          </button>
        </div>
      </div>

      {/* Center: Current Playing Tracker */}
      <div className="flex items-center gap-2 max-w-[40%] truncate">
        {currentMedia ? (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-0.5 rounded-full text-white/80 animate-fade-in truncate">
            {isPlaying ? (
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${accentCfg.bgClass} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${accentCfg.bgClass}`}></span>
              </span>
            ) : (
              <Radio className="w-3 h-3 text-white/40" />
            )}
            <span className="truncate text-[11px] font-medium text-white/90">
              {currentMedia.title}
            </span>
            <span className="text-[10px] text-white/50 font-mono">
              {currentMedia.format}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-[11px]">
            <Sparkles className="w-3 h-3 text-white/30" />
            <span>Windows Desktop Media Hub</span>
          </div>
        )}
      </div>

      {/* Right: Windows 11 Titlebar Window Controls */}
      <div className="flex items-center -mr-3 h-full">
        <button
          onClick={onMinimize}
          className="h-full w-11 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onToggleMaximize}
          className="h-full w-11 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          title={isMaximized ? "Restore Window" : "Maximize Window"}
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={onCloseApp}
          className="h-full w-11 flex items-center justify-center text-white/70 hover:bg-red-600 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

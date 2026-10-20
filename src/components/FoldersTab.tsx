import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Play,
  Film,
  Music2,
  ChevronRight,
  ArrowLeft,
  HardDrive
} from 'lucide-react';
import { MediaFile, AccentName } from '../types/media';
import { ACCENT_COLORS, formatSize, formatTime } from '../utils/formatters';

interface Props {
  mediaFiles: MediaFile[];
  accent: AccentName;
  onPlayMedia: (file: MediaFile) => void;
  onOpenFolderDialog: () => void;
}

export const FoldersTab: React.FC<Props> = ({
  mediaFiles,
  accent,
  onPlayMedia,
  onOpenFolderDialog,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const accentCfg = ACCENT_COLORS[accent];

  // Group media by folder
  const folderMap = new Map<string, MediaFile[]>();
  mediaFiles.forEach((file) => {
    if (file.isVault) return;
    const folder = file.folderPath || 'C:\\Users\\User\\Videos';
    if (!folderMap.has(folder)) {
      folderMap.set(folder, []);
    }
    folderMap.get(folder)!.push(file);
  });

  const folderEntries = Array.from(folderMap.entries()).map(([path, items]) => {
    const name = path.split('\\').filter(Boolean).pop() || path;
    const totalBytes = items.reduce((acc, i) => acc + i.sizeBytes, 0);
    const videoCount = items.filter((i) => !i.isAudio).length;
    const musicCount = items.filter((i) => i.isAudio).length;
    return { path, name, items, totalBytes, videoCount, musicCount };
  });

  const currentFolderFiles = selectedFolder ? folderMap.get(selectedFolder) || [] : [];
  const currentFolderName = selectedFolder
    ? selectedFolder.split('\\').filter(Boolean).pop() || selectedFolder
    : '';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Folder Header */}
      <div className="flex items-center justify-between">
        <div>
          {selectedFolder ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedFolder(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Back to all folders"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-amber-400" />
                  <span>{currentFolderName}</span>
                </h1>
                <p className="text-xs text-white/40 font-mono">{selectedFolder}</p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Media Folders</h1>
              <p className="text-xs text-white/50 mt-0.5">
                Windows directory explorer for local media folders and drives
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onOpenFolderDialog}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95 ${accentCfg.bgClass}`}
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Add Folder</span>
        </button>
      </div>

      {/* If a folder is selected, show its contents */}
      {selectedFolder ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-white/50 border-b border-white/5 pb-2">
            <span>{currentFolderFiles.length} media items</span>
            <button
              onClick={() => {
                if (currentFolderFiles.length > 0) onPlayMedia(currentFolderFiles[0]);
              }}
              className="text-white hover:underline flex items-center gap-1"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentFolderFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => onPlayMedia(file)}
                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col"
              >
                <div className="relative aspect-video bg-black/50 overflow-hidden">
                  {file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt={file.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      {file.isAudio ? (
                        <Music2 className="w-8 h-8 text-white/40" />
                      ) : (
                        <Film className="w-8 h-8 text-white/40" />
                      )}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${accentCfg.bgClass}`}>
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  </div>

                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-black/80 font-mono text-white/90">
                    {formatTime(file.duration)}
                  </span>
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] bg-black/70 font-mono text-white/80 uppercase font-semibold">
                    {file.format}
                  </span>
                </div>

                <div className="p-3">
                  <h3 className="text-xs font-semibold text-white/90 truncate group-hover:text-white">
                    {file.title}
                  </h3>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">
                    {formatSize(file.sizeBytes)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Root folders list */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folderEntries.map((folder) => (
            <div
              key={folder.path}
              onClick={() => setSelectedFolder(folder.path)}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 cursor-pointer transition-all flex items-start justify-between"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Folder className="w-6 h-6 fill-amber-400/20" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white/90 group-hover:text-white truncate">
                    {folder.name}
                  </h3>
                  <p className="text-[11px] text-white/40 font-mono truncate mt-0.5" title={folder.path}>
                    {folder.path}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-white/60">
                    {folder.videoCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Film className="w-3 h-3 text-blue-400" />
                        {folder.videoCount} videos
                      </span>
                    )}
                    {folder.musicCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Music2 className="w-3 h-3 text-pink-400" />
                        {folder.musicCount} tracks
                      </span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-white/40" />
                      {formatSize(folder.totalBytes)}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

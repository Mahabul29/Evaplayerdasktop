import React, { useState } from 'react';
import {
  Search,
  Grid,
  List,
  Play,
  Heart,
  Clock,
  HardDrive,
  Film,
  Sparkles,
  ArrowUpDown,
  FolderOpen
} from 'lucide-react';
import { MediaFile, AccentName, ProgressRecord } from '../types/media';
import { ACCENT_COLORS, formatSize, formatTime } from '../utils/formatters';

interface Props {
  videos: MediaFile[];
  progressMap: Record<string, ProgressRecord>;
  accent: AccentName;
  onPlayVideo: (video: MediaFile) => void;
  onToggleFavorite: (id: string) => void;
  onOpenFile: () => void;
  onHideToVault?: (id: string) => void;
}

type SortOption = 'recent' | 'name' | 'size' | 'duration';

export const VideosTab: React.FC<Props> = ({
  videos,
  progressMap,
  accent,
  onPlayVideo,
  onToggleFavorite,
  onOpenFile,
}) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  const accentCfg = ACCENT_COLORS[accent];

  // Continue Watching items: videos with recorded progress
  const continueWatching = videos
    .filter((v) => {
      const p = progressMap[v.id];
      return p && p.posMs > 5000 && p.lenMs > 0 && p.posMs < p.lenMs - 10000;
    })
    .sort((a, b) => (progressMap[b.id]?.lastPlayed || 0) - (progressMap[a.id]?.lastPlayed || 0));

  // Filtered and sorted videos
  const filtered = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.folderName.toLowerCase().includes(search.toLowerCase()) ||
      v.format.toLowerCase().includes(search.toLowerCase());
    const matchesFormat =
      selectedFormat === 'all' || v.format.toUpperCase() === selectedFormat.toUpperCase();
    return matchesSearch && matchesFormat && !v.isVault;
  });

  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'size':
        return b.sizeBytes - a.sizeBytes;
      case 'duration':
        return b.duration - a.duration;
      case 'recent':
      default:
        return b.modified - a.modified;
    }
  });

  const formats = ['all', 'MP4', 'MKV', 'WEBM', 'AVI'];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Video Library</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono font-normal">
              {filtered.length} {filtered.length === 1 ? 'file' : 'files'}
            </span>
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Hardware-accelerated Windows video engine supporting 4K HDR, MKV, MP4 & WebM
          </p>
        </div>

        {/* Search, Sort & View Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos, folders..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 w-52 transition-all"
            />
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs text-white/70">
            <ArrowUpDown className="w-3 h-3 ml-2 text-white/40" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-white/80 py-1 px-2 focus:outline-none cursor-pointer text-xs"
            >
              <option value="recent" className="bg-[#1a1d26] text-white">Recent</option>
              <option value="name" className="bg-[#1a1d26] text-white">Title A-Z</option>
              <option value="duration" className="bg-[#1a1d26] text-white">Duration</option>
              <option value="size" className="bg-[#1a1d26] text-white">File Size</option>
            </select>
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Format Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {formats.map((fmt) => (
          <button
            key={fmt}
            onClick={() => setSelectedFormat(fmt)}
            className={`px-3 py-1 rounded-full font-medium uppercase text-[11px] transition-all ${
              selectedFormat.toUpperCase() === fmt.toUpperCase()
                ? `${accentCfg.bgClass} text-white shadow-sm`
                : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Continue Watching Section (if available) */}
      {continueWatching.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Continue Watching</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {continueWatching.map((vid) => {
              const prog = progressMap[vid.id];
              const pct = prog && prog.lenMs > 0 ? (prog.posMs / prog.lenMs) * 100 : 0;
              const remainingSec = prog ? Math.max(0, (prog.lenMs - prog.posMs) / 1000) : 0;

              return (
                <div
                  key={`continue-${vid.id}`}
                  onClick={() => onPlayVideo(vid)}
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col"
                >
                  <div className="relative aspect-video bg-black/50 overflow-hidden">
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${accentCfg.bgClass} scale-90 group-hover:scale-100 transition-transform`}>
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>
                    {/* Progress Bar overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                      <div
                        className={`h-full ${accentCfg.bgClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="absolute bottom-2.5 right-2 px-1.5 py-0.5 rounded text-[10px] bg-black/70 font-mono text-white/90">
                      {formatTime(remainingSec)} left
                    </span>
                  </div>

                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-white/90 truncate group-hover:text-white">
                      {vid.title}
                    </h3>
                    <p className="text-[10px] text-white/50 truncate mt-0.5">
                      {vid.folderName} • {vid.format}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Videos List / Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/2">
          <Film className="w-12 h-12 text-white/20 mb-3" />
          <p className="text-sm font-medium text-white/70">No videos found</p>
          <p className="text-xs text-white/40 max-w-sm mt-1">
            Open a video from your computer or check your search query.
          </p>
          <button
            onClick={onOpenFile}
            className={`mt-4 px-4 py-2 rounded-lg text-xs font-medium text-white shadow-sm flex items-center gap-2 ${accentCfg.bgClass}`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open Video File</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((video) => (
            <div
              key={video.id}
              onClick={() => onPlayVideo(video)}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col relative"
            >
              <div className="relative aspect-video bg-black/60 overflow-hidden">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Hover Play Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg ${accentCfg.bgClass} scale-90 group-hover:scale-100 transition-transform`}>
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-black/80 font-mono text-white/90 backdrop-blur-sm">
                  {formatTime(video.duration)}
                </span>

                {/* Resolution / Format Badges */}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] bg-black/70 font-mono text-white/80 uppercase font-semibold">
                  {video.format}
                </span>

                {video.resolution && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] bg-blue-500/80 text-white font-mono font-medium">
                    {video.resolution.includes('3840') ? '4K' : 'HD'}
                  </span>
                )}
              </div>

              {/* Video Info */}
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-white/90 truncate group-hover:text-white" title={video.title}>
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40">
                    <span className="truncate">{video.folderName}</span>
                    <span>•</span>
                    <span className="shrink-0">{formatSize(video.sizeBytes)}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(video.id);
                  }}
                  className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                  title={video.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    className={`w-4 h-4 ${video.isFavorite ? 'text-red-500 fill-red-500' : ''}`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
          {filtered.map((video) => (
            <div
              key={video.id}
              onClick={() => onPlayVideo(video)}
              className="flex items-center justify-between p-3 hover:bg-white/10 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-20 aspect-video rounded-lg bg-black/40 overflow-hidden shrink-0">
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/90 truncate group-hover:text-white">
                    {video.title}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">
                    {video.path}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-white/50 shrink-0 ml-3">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                  {video.format}
                </span>
                <span className="font-mono text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white/40" />
                  {formatTime(video.duration)}
                </span>
                <span className="font-mono text-[11px] flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-white/40" />
                  {formatSize(video.sizeBytes)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(video.id);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-red-400"
                >
                  <Heart
                    className={`w-4 h-4 ${video.isFavorite ? 'text-red-500 fill-red-500' : ''}`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

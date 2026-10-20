import React from 'react';
import { Heart, Play, Film, Music2, Clock } from 'lucide-react';
import { MediaFile, AccentName } from '../types/media';
import { ACCENT_COLORS, formatSize, formatTime } from '../utils/formatters';

interface Props {
  favoriteFiles: MediaFile[];
  accent: AccentName;
  onPlayMedia: (file: MediaFile) => void;
  onToggleFavorite: (id: string) => void;
}

export const FavoritesTab: React.FC<Props> = ({
  favoriteFiles,
  accent,
  onPlayMedia,
  onToggleFavorite,
}) => {
  const accentCfg = ACCENT_COLORS[accent];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <span>Favorites Collection</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono font-normal">
            {favoriteFiles.length} starred
          </span>
        </h1>
        <p className="text-xs text-white/50 mt-0.5">
          Quick access to your hand-picked videos, movies, and audio tracks
        </p>
      </div>

      {favoriteFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/2">
          <Heart className="w-12 h-12 text-white/20 mb-3" />
          <p className="text-sm font-medium text-white/70">No favorite items yet</p>
          <p className="text-xs text-white/40 max-w-sm mt-1">
            Click the heart icon on any video or music track to add it to your favorites.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favoriteFiles.map((item) => (
            <div
              key={item.id}
              onClick={() => onPlayMedia(item)}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col"
            >
              <div className="relative aspect-video bg-black/60 overflow-hidden">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    {item.isAudio ? (
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
                  {formatTime(item.duration)}
                </span>
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] bg-black/70 font-mono text-white/80 uppercase font-semibold">
                  {item.format}
                </span>
              </div>

              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-white/90 truncate group-hover:text-white">
                    {item.title}
                  </h3>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">
                    {item.folderName} • {formatSize(item.sizeBytes)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                  className="p-1 rounded-full text-red-500 hover:bg-white/10"
                  title="Remove from favorites"
                >
                  <Heart className="w-4 h-4 fill-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

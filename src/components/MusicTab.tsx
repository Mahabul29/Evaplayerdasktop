import React, { useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  Heart,
  Disc3,
  Volume2
} from 'lucide-react';
import { MediaFile, AccentName } from '../types/media';
import { ACCENT_COLORS, formatSize, formatTime } from '../utils/formatters';

interface Props {
  musicFiles: MediaFile[];
  currentMedia: MediaFile | null;
  isPlaying: boolean;
  accent: AccentName;
  onPlayMedia: (file: MediaFile) => void;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onToggleFavorite: (id: string) => void;
}

export const MusicTab: React.FC<Props> = ({
  musicFiles,
  currentMedia,
  isPlaying,
  accent,
  onPlayMedia,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onToggleFavorite,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const accentCfg = ACCENT_COLORS[accent];

  const activeTrack = currentMedia?.isAudio ? currentMedia : musicFiles[0] || null;
  const isCurrentActivePlaying = isPlaying && currentMedia?.isAudio;

  // Real-time animated audio visualizer canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 48;
      const barWidth = (width / barCount) - 3;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 3);
        let barHeight = 6;

        if (isCurrentActivePlaying) {
          // Dynamic frequency waves simulation
          const wave1 = Math.sin(i * 0.25 + phase * 4) * 0.5 + 0.5;
          const wave2 = Math.cos(i * 0.15 - phase * 3) * 0.5 + 0.5;
          const energy = (wave1 * 0.6 + wave2 * 0.4);
          barHeight = 8 + energy * (height - 16);
        }

        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, y, 0, height);
        grad.addColorStop(0, accentCfg.hex);
        grad.addColorStop(1, '#8B5CF6');

        ctx.fillStyle = isCurrentActivePlaying ? grad : 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();
      }

      phase += 0.04;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isCurrentActivePlaying, accentCfg.hex]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Music Library</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono font-normal">
            {musicFiles.length} tracks
          </span>
        </h1>
        <p className="text-xs text-white/50 mt-0.5">
          High-fidelity lossless FLAC, MP3, WAV player with animated spectrum visualizer
        </p>
      </div>

      {/* Featured Music Hero Player Card */}
      {activeTrack && (
        <div className="bg-gradient-to-r from-white/10 to-white/5 border border-white/15 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center gap-6 relative z-10">
            {/* Spinning Album Art */}
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0 group">
              <img
                src={activeTrack.thumbnailUrl}
                alt={activeTrack.title}
                className="w-full h-full object-cover"
              />
              <div
                className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                  isCurrentActivePlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <Disc3
                  className={`w-14 h-14 text-white/80 ${
                    isCurrentActivePlaying ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '6s' }}
                />
              </div>
            </div>

            {/* Track Info & Visualizer */}
            <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/15 text-white/80 uppercase font-semibold">
                    {activeTrack.format} Lossless
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1.5 truncate">
                    {activeTrack.title}
                  </h2>
                  <p className="text-xs text-white/60 truncate">
                    {activeTrack.artist || 'Unknown Artist'} • {activeTrack.album || 'Eva Collection'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleFavorite(activeTrack.id)}
                    className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-red-400 transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        activeTrack.isFavorite ? 'text-red-500 fill-red-500' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Spectrum Visualizer Canvas */}
              <div className="my-3 h-16 w-full bg-black/30 rounded-xl p-2 border border-white/5 flex items-center">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={56}
                  className="w-full h-full"
                />
              </div>

              {/* Player Controls Bar */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onPrevTrack}
                    className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    title="Previous"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      if (currentMedia?.id === activeTrack.id) {
                        onTogglePlay();
                      } else {
                        onPlayMedia(activeTrack);
                      }
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${accentCfg.bgClass}`}
                  >
                    {isCurrentActivePlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={onNextTrack}
                    className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    title="Next"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-xs text-white/50 font-mono flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-white/40" />
                  <span>Windows Audio 48kHz</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Music Tracks Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/80">All Audio Tracks</h3>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
          {musicFiles.map((track, idx) => {
            const isPlayingThis = isPlaying && currentMedia?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => onPlayMedia(track)}
                className={`flex items-center justify-between p-3.5 hover:bg-white/10 cursor-pointer transition-colors group ${
                  currentMedia?.id === track.id ? 'bg-white/10' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-7 text-center text-xs font-mono text-white/40 group-hover:hidden">
                    {(idx + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="w-7 hidden group-hover:flex items-center justify-center text-white">
                    <Play className="w-4 h-4 fill-current" />
                  </div>

                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 shrink-0 relative">
                    <img
                      src={track.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {isPlayingThis && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        currentMedia?.id === track.id ? accentCfg.textClass : 'text-white/90 group-hover:text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[11px] text-white/50 truncate">
                      {track.artist || 'Unknown'} • {track.album || 'Eva Audio'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-white/50 shrink-0 ml-3">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                    {track.format}
                  </span>
                  <span className="font-mono text-[11px]">
                    {formatTime(track.duration)}
                  </span>
                  <span className="font-mono text-[11px] hidden sm:inline">
                    {formatSize(track.sizeBytes)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(track.id);
                    }}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-red-400"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        track.isFavorite ? 'text-red-500 fill-red-500' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

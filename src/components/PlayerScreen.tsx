import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  ArrowLeft,
  Subtitles,
  Sliders,
  Settings as SettingsIcon,
  Camera,
  PictureInPicture2,
  Ratio,
  FastForward,
  Droplets,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { MediaFile, AppSettings, SubtitleCue, SubtitleTrack } from '../types/media';
import { ACCENT_COLORS, formatTime, parseSrt } from '../utils/formatters';

interface Props {
  currentMedia: MediaFile;
  playlist: MediaFile[];
  settings: AppSettings;
  savedPositionMs?: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSaveProgress: (mediaId: string, posMs: number, lenMs: number) => void;
}

export const PlayerScreen: React.FC<Props> = ({
  currentMedia,
  playlist,
  settings,
  savedPositionMs = 0,
  onClose,
  onNext,
  onPrev,
  onSaveProgress,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(settings.volume); // 0 to 200
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [aspectRatio, setAspectRatio] = useState<'fit' | 'cover' | '16:9' | '4:3'>('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // HUD and controls visibility
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPos, setHoverSeekPos] = useState<number>(0);

  // Modals & Panels
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showHydration, setShowHydration] = useState(false);

  // Subtitles
  const [activeSubtitleTrack, setActiveSubtitleTrack] = useState<SubtitleTrack | null>(() => {
    return currentMedia.subtitles?.find((s) => s.isDefault) || currentMedia.subtitles?.[0] || null;
  });
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');

  const accentCfg = ACCENT_COLORS[settings.accent];
  const hideTimerRef = useRef<number | null>(null);

  // Show HUD toast notification
  const showHud = (msg: string) => {
    setHudMessage(msg);
    setTimeout(() => {
      setHudMessage((prev) => (prev === msg ? null : prev));
    }, 1500);
  };

  // Reset controls hide timer
  const resetActivityTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    if (isPlaying && !currentMedia.isAudio) {
      hideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 3500);
    }
  }, [isPlaying, currentMedia.isAudio]);

  // Audio Context for Volume Boost up to 200%
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass && !audioCtxRef.current) {
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaElementSource(video);
        const gainNode = ctx.createGain();
        gainNodeRef.current = gainNode;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
      }
    } catch {
      // AudioContext already connected or blocked
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Update volume & gain
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = true;
    } else {
      video.muted = false;
      if (volume <= 100) {
        video.volume = volume / 100;
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = 1.0;
        }
      } else {
        // Boost up to 200% via GainNode
        video.volume = 1.0;
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = volume / 100;
        }
      }
    }
  }, [volume, isMuted]);

  // Apply playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Subtitle synchronization
  useEffect(() => {
    if (!activeSubtitleTrack || !activeSubtitleTrack.cues) {
      setCurrentSubtitleText('');
      return;
    }

    const currentCue = activeSubtitleTrack.cues.find(
      (cue) => currentTime >= cue.startTime && currentTime <= cue.endTime
    );
    setCurrentSubtitleText(currentCue ? currentCue.text : '');
  }, [currentTime, activeSubtitleTrack]);

  // Video progress reporting
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    // Buffer percentage calculation
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBufferedPercent((bufferedEnd / (video.duration || 1)) * 100);
    }

    // Save progress periodically
    if (video.duration > 0) {
      onSaveProgress(currentMedia.id, video.currentTime * 1000, video.duration * 1000);
    }
  };

  // On Metadata Loaded - restore resume position
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setIsLoading(false);

    if (settings.resume && savedPositionMs > 5000 && savedPositionMs < (video.duration * 1000) - 10000) {
      video.currentTime = savedPositionMs / 1000;
      showHud(`Resumed at ${formatTime(savedPositionMs / 1000)}`);
    }

    video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        showHud('Play');
      }).catch(console.error);
    } else {
      video.pause();
      setIsPlaying(false);
      showHud('Pause');
    }
    resetActivityTimer();
  };

  // Skip relative seconds
  const skip = (deltaSec: number) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.max(0, Math.min(video.duration, video.currentTime + deltaSec));
    video.currentTime = target;
    showHud(`${deltaSec > 0 ? '+' : ''}${deltaSec}s`);
    resetActivityTimer();
  };

  // Change volume by delta
  const changeVolume = (delta: number) => {
    const next = Math.max(0, Math.min(200, volume + delta));
    setVolume(next);
    setIsMuted(false);
    showHud(`Volume: ${next}%${next > 100 ? ' (Boosted)' : ''}`);
    resetActivityTimer();
  };

  // Toggle Mute
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      showHud(next ? 'Muted' : `Volume: ${volume}%`);
      return next;
    });
    resetActivityTimer();
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Capture Screenshot of current video frame
  const takeScreenshot = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `EvaPlayer_${currentMedia.title.replace(/\s+/g, '_')}_${Math.floor(currentTime)}s.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showHud('Screenshot Captured');
      }
    } catch {
      showHud('Screenshot failed');
    }
  };

  // Toggle Picture-in-Picture
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showHud('Exited PiP');
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        showHud('Picture-in-Picture');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load external subtitle file
  const handleLoadSubtitleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const cues = parseSrt(text);
        const customTrack: SubtitleTrack = {
          id: `custom-sub-${Date.now()}`,
          label: file.name,
          lang: 'custom',
          cues,
        };
        setActiveSubtitleTrack(customTrack);
        showHud(`Loaded Subtitles: ${file.name}`);
        setShowSubtitleMenu(false);
      }
    };
    reader.readAsText(file);
  };

  // Keyboard controls listener (Space, Arrows, F, M, N, P, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const skipStep = settings.skipSeconds;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-skipStep);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(skipStep);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(5);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-5);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyN':
          e.preventDefault();
          onNext();
          break;
        case 'KeyP':
          e.preventDefault();
          onPrev();
          break;
        case 'Escape':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.skipSeconds, volume, isPlaying, onClose, onNext, onPrev]);

  // Mouse move listener to show controls
  const handleMouseMove = () => {
    resetActivityTimer();
  };

  // Seekbar click / scrub
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const target = Math.max(0, Math.min(duration, pos * duration));
    video.currentTime = target;
  };

  // Seekbar hover preview tooltip
  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverSeekPos(e.clientX - rect.left);
    setHoverSeekTime(pos * duration);
  };

  // Aspect ratio class
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'cover':
        return 'object-cover';
      case '16:9':
        return 'aspect-video object-contain';
      case '4:3':
        return 'aspect-[4/3] object-contain';
      case 'fit':
      default:
        return 'object-contain';
    }
  };

  // Subtitle size styles
  const getSubtitleSizeClass = () => {
    switch (settings.subtitleSize) {
      case 'sm':
        return 'text-sm md:text-base';
      case 'lg':
        return 'text-xl md:text-2xl';
      case 'xl':
        return 'text-2xl md:text-4xl';
      case 'base':
      default:
        return 'text-base md:text-xl';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentMedia.videoUrl}
        className={`w-full h-full ${getAspectRatioClass()} transition-all`}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (settings.autoNext) {
            onNext();
          }
        }}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Toast HUD Notification */}
      {hudMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/80 border border-white/20 text-white font-semibold text-xs tracking-wide shadow-2xl backdrop-blur-md animate-fade-in z-40">
          {hudMessage}
        </div>
      )}

      {/* On-Screen Subtitle Display */}
      {currentSubtitleText && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center px-4 max-w-[85%] z-20 pointer-events-none transition-all"
        >
          <span
            className={`font-semibold tracking-wide rounded px-2.5 py-1 backdrop-blur-sm ${getSubtitleSizeClass()}`}
            style={{
              color: settings.subtitleColor || '#ffffff',
              backgroundColor: `rgba(0, 0, 0, ${settings.subtitleBgOpacity ?? 0.65})`,
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            {currentSubtitleText}
          </span>
        </div>
      )}

      {/* Top Controls Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between text-white transition-opacity duration-300 z-30 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Back & Media Info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
            title="Back to library (Esc)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-bold text-white truncate drop-shadow-md">
              {currentMedia.title}
            </h1>
            <p className="text-[11px] text-white/60 truncate drop-shadow">
              {currentMedia.folderName} • {currentMedia.format} {currentMedia.resolution ? `• ${currentMedia.resolution}` : ''}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Subtitle Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
              className={`p-2 rounded-full hover:bg-white/20 transition-colors ${
                activeSubtitleTrack ? 'text-emerald-400' : 'text-white/80'
              }`}
              title="Subtitles"
            >
              <Subtitles className="w-5 h-5" />
            </button>

            {showSubtitleMenu && (
              <div className="absolute right-0 top-10 w-56 bg-[#1a1d26] border border-white/15 rounded-xl shadow-2xl p-2 text-xs text-white z-50 space-y-1">
                <p className="text-[10px] uppercase font-semibold text-white/40 px-2 py-1">
                  Subtitle Tracks
                </p>
                <button
                  onClick={() => {
                    setActiveSubtitleTrack(null);
                    setShowSubtitleMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 ${
                    !activeSubtitleTrack ? 'text-emerald-400 font-semibold' : ''
                  }`}
                >
                  Off (None)
                </button>
                {currentMedia.subtitles?.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setActiveSubtitleTrack(track);
                      setShowSubtitleMenu(false);
                      showHud(`Subtitle: ${track.label}`);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 ${
                      activeSubtitleTrack?.id === track.id ? 'text-emerald-400 font-semibold' : ''
                    }`}
                  >
                    {track.label}
                  </button>
                ))}

                <div className="pt-2 border-t border-white/10">
                  <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-white/80">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Load .srt or .vtt File</span>
                    <input
                      type="file"
                      accept=".srt,.vtt"
                      onChange={handleLoadSubtitleFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Aspect Ratio Switcher */}
          <button
            onClick={() => {
              const ratios: ('fit' | 'cover' | '16:9' | '4:3')[] = ['fit', 'cover', '16:9', '4:3'];
              const next = ratios[(ratios.indexOf(aspectRatio) + 1) % ratios.length];
              setAspectRatio(next);
              showHud(`Aspect Ratio: ${next.toUpperCase()}`);
            }}
            className="p-2 rounded-full hover:bg-white/20 text-white/80 transition-colors"
            title={`Aspect Ratio: ${aspectRatio.toUpperCase()}`}
          >
            <Ratio className="w-5 h-5" />
          </button>

          {/* Screenshot capture */}
          <button
            onClick={takeScreenshot}
            className="p-2 rounded-full hover:bg-white/20 text-white/80 transition-colors"
            title="Take Screenshot"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Picture in Picture */}
          <button
            onClick={togglePiP}
            className="p-2 rounded-full hover:bg-white/20 text-white/80 transition-colors"
            title="Picture in Picture"
          >
            <PictureInPicture2 className="w-5 h-5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-white/20 text-white/80 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Center Big Play/Pause Button on screen */}
      <div
        className={`absolute inset-0 flex items-center justify-center gap-8 pointer-events-none transition-opacity duration-300 z-20 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={() => skip(-settings.skipSeconds)}
          className="p-4 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white pointer-events-auto transition-transform active:scale-90 backdrop-blur-md"
          title={`Rewind ${settings.skipSeconds}s (Left Arrow)`}
        >
          <RotateCcw className="w-7 h-7" />
        </button>

        <button
          onClick={togglePlay}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl pointer-events-auto transition-transform active:scale-95 ${accentCfg.bgClass}`}
          title="Play / Pause (Space)"
        >
          {isPlaying ? (
            <Pause className="w-9 h-9 fill-current" />
          ) : (
            <Play className="w-9 h-9 ml-1 fill-current" />
          )}
        </button>

        <button
          onClick={() => skip(settings.skipSeconds)}
          className="p-4 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white pointer-events-auto transition-transform active:scale-90 backdrop-blur-md"
          title={`Forward ${settings.skipSeconds}s (Right Arrow)`}
        >
          <RotateCw className="w-7 h-7" />
        </button>
      </div>

      {/* Bottom Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-3 text-white transition-opacity duration-300 z-30 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seekbar with buffered bar & hover time */}
        <div
          onClick={handleSeek}
          onMouseMove={handleSeekMouseMove}
          onMouseLeave={() => setHoverSeekTime(null)}
          className="relative w-full h-3 flex items-center cursor-pointer group"
        >
          {/* Background track */}
          <div className="w-full h-1 group-hover:h-2 bg-white/20 rounded-full overflow-hidden transition-all relative">
            {/* Buffered track */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/30"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Played track */}
            <div
              className={`absolute top-0 bottom-0 left-0 ${accentCfg.bgClass}`}
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Scrubber thumb */}
          <div
            className={`absolute w-3.5 h-3.5 rounded-full ${accentCfg.bgClass} shadow-md scale-0 group-hover:scale-100 transition-transform -translate-x-1/2`}
            style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />

          {/* Hover time tooltip */}
          {hoverSeekTime !== null && (
            <div
              className="absolute -top-7 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] font-mono text-white shadow-lg pointer-events-none -translate-x-1/2"
              style={{ left: `${hoverSeekPos}px` }}
            >
              {formatTime(hoverSeekTime)}
            </div>
          )}
        </div>

        {/* Lower Control Bar: Transport, Volume, Speed, Time */}
        <div className="flex items-center justify-between">
          {/* Left: Transport buttons & Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={onPrev}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Previous (P)"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
              title="Play / Pause (Space)"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-0.5 fill-current" />}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Next (N)"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Time Indicator */}
            <div className="text-xs font-mono text-white/80 ml-2">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/40 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume & Speed */}
          <div className="flex items-center gap-4">
            {/* Volume Control (Up to 200%) */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : volume > 100 ? (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                ) : volume > 50 ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <Volume1 className="w-5 h-5" />
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseInt(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-20 sm:w-28 h-1.5 bg-white/20 rounded-lg cursor-pointer"
                />
                <span
                  className={`text-[10px] font-mono w-9 text-right ${
                    volume > 100 ? 'text-emerald-400 font-bold' : 'text-white/60'
                  }`}
                >
                  {isMuted ? '0%' : `${volume}%`}
                </span>
              </div>
            </div>

            {/* Playback Speed selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono font-medium text-white/90 transition-colors"
                title="Playback Speed"
              >
                {playbackSpeed}x
              </button>

              {showSpeedMenu && (
                <div className="absolute right-0 bottom-10 w-28 bg-[#1a1d26] border border-white/15 rounded-xl shadow-2xl p-1 text-xs text-white z-50">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        setPlaybackSpeed(spd);
                        setShowSpeedMenu(false);
                        showHud(`Speed: ${spd}x`);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 font-mono ${
                        playbackSpeed === spd ? 'text-emerald-400 font-bold' : ''
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

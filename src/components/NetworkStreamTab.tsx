import React, { useState } from 'react';
import { Globe, Play, Link2, Radio, Check, Sparkles, ExternalLink } from 'lucide-react';
import { MediaFile, AccentName } from '../types/media';
import { ACCENT_COLORS } from '../utils/formatters';
import { PRESET_STREAM_URLS } from '../data/sampleMedia';

interface Props {
  accent: AccentName;
  onPlayStream: (streamFile: MediaFile) => void;
}

export const NetworkStreamTab: React.FC<Props> = ({ accent, onPlayStream }) => {
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamHistory, setStreamHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('eva_stream_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const accentCfg = ACCENT_COLORS[accent];

  const handlePlay = (url: string, title?: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    const detectedTitle =
      title ||
      cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1).split('?')[0] ||
      'Live Network Stream';

    const streamMedia: MediaFile = {
      id: `stream-${Date.now()}`,
      title: detectedTitle,
      path: cleanUrl,
      sizeBytes: 0,
      modified: Date.now(),
      duration: 0,
      isAudio: cleanUrl.endsWith('.mp3') || cleanUrl.endsWith('.aac'),
      folderPath: 'Network Streams',
      folderName: 'Streams',
      isStream: true,
      format: cleanUrl.includes('.m3u8') ? 'HLS' : 'STREAM',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      videoUrl: cleanUrl,
    };

    // Save to history
    const nextHistory = [cleanUrl, ...streamHistory.filter((u) => u !== cleanUrl)].slice(0, 10);
    setStreamHistory(nextHistory);
    try {
      localStorage.setItem('eva_stream_history', JSON.stringify(nextHistory));
    } catch {
      // ignore
    }

    onPlayStream(streamMedia);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Network Stream</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-normal">
            HLS • DASH • MP4 • RTSP
          </span>
        </h1>
        <p className="text-xs text-white/50 mt-0.5">
          Play online video streams, HTTP direct links, and IPTV broadcasts directly in Windows
        </p>
      </div>

      {/* Stream Input Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-blue-400" />
          <span>Enter Stream URL</span>
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-white/50 mb-1">Stream Address (URL)</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://example.com/live/stream.m3u8 or .mp4"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 font-mono transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-white/50 mb-1">Optional Title</label>
            <input
              type="text"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              placeholder="e.g. My Favorite Live Channel"
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handlePlay(streamUrl, streamTitle)}
              disabled={!streamUrl.trim()}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md flex items-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${accentCfg.bgClass}`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Network Stream</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Stream Presets */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Stream Presets & Open Feeds</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_STREAM_URLS.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => handlePlay(preset.url, preset.title)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                    {preset.format}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {preset.category}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-white/90 group-hover:text-white truncate mt-1">
                  {preset.title}
                </h3>
                <p className="text-[10px] text-white/40 font-mono truncate mt-0.5" title={preset.url}>
                  {preset.url}
                </p>
              </div>

              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform ${accentCfg.bgClass}`}
              >
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stream History */}
      {streamHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white/70">Recent Stream History</h3>
            <button
              onClick={() => {
                setStreamHistory([]);
                localStorage.removeItem('eva_stream_history');
              }}
              className="text-[11px] text-white/40 hover:text-white"
            >
              Clear History
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5 overflow-hidden">
            {streamHistory.map((url, i) => (
              <div
                key={i}
                onClick={() => handlePlay(url)}
                className="flex items-center justify-between p-3 hover:bg-white/10 cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  <Radio className="w-3.5 h-3.5 text-white/40 shrink-0" />
                  <span className="text-white/80 font-mono text-[11px] truncate">{url}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-white/30 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import {
  Palette,
  Sliders,
  Subtitles,
  Volume2,
  FolderOpen,
  Trash2,
  RotateCcw,
  Info,
  Laptop
} from 'lucide-react';
import { AppSettings, ThemeMode, AccentName } from '../types/media';
import { ACCENT_COLORS } from '../utils/formatters';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenFolderDialog: () => void;
}

export const SettingsTab: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onOpenFolderDialog,
}) => {
  const accentCfg = ACCENT_COLORS[settings.accent];

  const accentsList: AccentName[] = [
    'Blue',
    'Green',
    'Purple',
    'Red',
    'Orange',
    'Pink',
    'White',
  ];

  const themeModes: ThemeMode[] = ['Dark', 'Light', 'AMOLED'];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Settings</span>
        </h1>
        <p className="text-xs text-white/50 mt-0.5">
          Configure player engine, subtitle styling, hardware playback & appearance
        </p>
      </div>

      {/* Appearance Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-400" />
          <span>Appearance & Theme</span>
        </h2>

        {/* Theme Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-xs font-medium text-white/90">Theme Mode</p>
            <p className="text-[11px] text-white/40">Windows Fluent Dark, Light, or Pure AMOLED Black</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-1">
            {themeModes.map((mode) => (
              <button
                key={mode}
                onClick={() => onUpdateSettings({ theme: mode })}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  settings.theme === mode
                    ? `${accentCfg.bgClass} text-white shadow-sm`
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
          <div>
            <p className="text-xs font-medium text-white/90">Accent Color</p>
            <p className="text-[11px] text-white/40">Personalize buttons, progress bars and highlights</p>
          </div>
          <div className="flex items-center gap-2">
            {accentsList.map((acc) => {
              const cfg = ACCENT_COLORS[acc];
              return (
                <button
                  key={acc}
                  onClick={() => onUpdateSettings({ accent: acc })}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                    settings.accent === acc
                      ? 'border-white scale-110 shadow-md'
                      : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                  } ${cfg.bgClass}`}
                  title={acc}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Playback Settings */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>Playback Preferences</span>
        </h2>

        {/* Skip Duration */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-medium text-white/90">Seek Step (Arrow Keys)</p>
            <p className="text-[11px] text-white/40">Seconds to jump forward or backward</p>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 text-xs">
            {[5, 10, 15, 30].map((sec) => (
              <button
                key={sec}
                onClick={() => onUpdateSettings({ skipSeconds: sec })}
                className={`px-2.5 py-1 rounded transition-colors ${
                  settings.skipSeconds === sec
                    ? `${accentCfg.bgClass} text-white font-semibold`
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Resume Playback */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <p className="text-xs font-medium text-white/90">Resume Playback Position</p>
            <p className="text-[11px] text-white/40">Automatically resume videos where you left off</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.resume}
              onChange={(e) => onUpdateSettings({ resume: e.target.checked })}
              className="sr-only peer"
            />
            <div className={`w-9 h-5 bg-white/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${settings.resume ? accentCfg.bgClass : ''}`} />
          </label>
        </div>

        {/* Auto Next */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <p className="text-xs font-medium text-white/90">Auto-Play Next Episode</p>
            <p className="text-[11px] text-white/40">Play the following video in folder upon completion</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoNext}
              onChange={(e) => onUpdateSettings({ autoNext: e.target.checked })}
              className="sr-only peer"
            />
            <div className={`w-9 h-5 bg-white/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${settings.autoNext ? accentCfg.bgClass : ''}`} />
          </label>
        </div>

        {/* Volume Boost */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <p className="text-xs font-medium text-white/90 flex items-center gap-1.5">
              <span>Volume Limit & Boost</span>
              <span className="text-[10px] px-1.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                up to 200%
              </span>
            </p>
            <p className="text-[11px] text-white/40">EvaPlayer software pre-amp gain boost for quiet audio</p>
          </div>
          <span className="text-xs font-mono font-semibold text-white/90">
            {settings.volume}%
          </span>
        </div>
      </div>

      {/* Subtitle Customization */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <Subtitles className="w-4 h-4 text-emerald-400" />
          <span>Subtitle Rendering Engine</span>
        </h2>

        {/* Subtitle Size */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/90">Font Size</p>
            <p className="text-[11px] text-white/40">On-screen caption sizing</p>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 text-xs">
            {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
              <button
                key={sz}
                onClick={() => onUpdateSettings({ subtitleSize: sz })}
                className={`px-2.5 py-1 rounded capitalize ${
                  settings.subtitleSize === sz
                    ? `${accentCfg.bgClass} text-white font-semibold`
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Subtitle Color */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <p className="text-xs font-medium text-white/90">Font Color</p>
            <p className="text-[11px] text-white/40">Select caption primary color</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: 'White', color: '#ffffff' },
              { label: 'Yellow', color: '#facc15' },
              { label: 'Cyan', color: '#22d3ee' },
              { label: 'Green', color: '#4ade80' },
            ].map((c) => (
              <button
                key={c.color}
                onClick={() => onUpdateSettings({ subtitleColor: c.color })}
                className={`w-6 h-6 rounded-full border-2 ${
                  settings.subtitleColor === c.color ? 'border-white scale-110 shadow-md' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.color }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Audio Equalizer Presets */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span>Audio Equalizer Presets</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {['Flat', 'Bass Boost', 'Treble Boost', 'Vocal', 'Electronic', 'Cinema Movie'].map(
            (preset) => (
              <button
                key={preset}
                onClick={() => onUpdateSettings({ equalizerPreset: preset })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.equalizerPreset === preset
                    ? `${accentCfg.borderClass} ${accentCfg.bgClass}/20 text-white font-semibold shadow-sm`
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <p className="font-semibold">{preset}</p>
                <p className="text-[10px] text-white/40 mt-0.5">DSP hardware profile</p>
              </button>
            )
          )}
        </div>
      </div>

      {/* Scanned Directories */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Windows Library Folders</span>
          </h2>
          <button
            onClick={onOpenFolderDialog}
            className="text-xs text-blue-400 hover:underline"
          >
            + Add Folder
          </button>
        </div>

        <div className="space-y-2">
          {settings.folders.map((folder, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs text-white/80 font-mono"
            >
              <span className="truncate pr-2">{folder}</span>
              <button
                onClick={() => {
                  const updated = settings.folders.filter((_, i) => i !== idx);
                  onUpdateSettings({ folders: updated });
                }}
                className="text-white/40 hover:text-red-400 p-1 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* App Info Footer */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-white/50">
        <div className="flex items-center gap-2">
          <Laptop className="w-4 h-4 text-white/40" />
          <span>EvaPlayer Windows Desktop Edition v1.0.0</span>
        </div>
        <span className="font-mono text-[11px]">VLC & Kotlin Compose Desktop</span>
      </div>
    </div>
  );
};

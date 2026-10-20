export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  lang: string;
  url?: string;
  cues?: SubtitleCue[];
  isDefault?: boolean;
}

export interface MediaFile {
  id: string;
  path: string;
  title: string;
  sizeBytes: number;
  modified: number;
  duration: number; // in seconds
  isAudio: boolean;
  folderPath: string;
  folderName: string;
  isStream?: boolean;
  thumbnailUrl?: string;
  videoUrl: string;
  subtitles?: SubtitleTrack[];
  resolution?: string;
  format: string;
  artist?: string;
  album?: string;
  isFavorite?: boolean;
  isVault?: boolean;
}

export interface FolderEntry {
  path: string;
  name: string;
  items: MediaFile[];
  totalBytes: number;
  latest: number;
}

export interface ProgressRecord {
  posMs: number;
  lenMs: number;
  lastPlayed: number;
}

export type ThemeMode = 'Dark' | 'Light' | 'AMOLED';

export type AccentName = 'Blue' | 'Green' | 'Purple' | 'Red' | 'Orange' | 'Pink' | 'White';

export interface AppSettings {
  theme: ThemeMode;
  accent: AccentName;
  skipSeconds: number;
  resume: boolean;
  autoNext: boolean;
  volume: number; // 0 to 200
  aspectRatio: 'fit' | 'cover' | '16:9' | '4:3' | 'original';
  subtitleSize: 'sm' | 'base' | 'lg' | 'xl';
  subtitleColor: string;
  subtitleBgOpacity: number;
  subtitleOffsetSec: number;
  equalizerPreset: string;
  folders: string[];
  hydrationReminder: boolean;
  lastHydrationReminder: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  mediaIds: string[];
  createdAt: number;
}

import { AccentName, SubtitleCue } from '../types/media';

export function formatSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const kb = bytes / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;
  if (gb >= 1.0) return `${gb.toFixed(2)} GB`;
  if (mb >= 1.0) return `${mb.toFixed(1)} MB`;
  return `${Math.round(kb)} KB`;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const ACCENT_COLORS: Record<AccentName, { hex: string; bgClass: string; textClass: string; borderClass: string }> = {
  Blue: {
    hex: '#2F80FF',
    bgClass: 'bg-[#2F80FF]',
    textClass: 'text-[#2F80FF]',
    borderClass: 'border-[#2F80FF]',
  },
  Green: {
    hex: '#00E676',
    bgClass: 'bg-[#00E676]',
    textClass: 'text-[#00E676]',
    borderClass: 'border-[#00E676]',
  },
  Purple: {
    hex: '#B388FF',
    bgClass: 'bg-[#B388FF]',
    textClass: 'text-[#B388FF]',
    borderClass: 'border-[#B388FF]',
  },
  Red: {
    hex: '#FF5252',
    bgClass: 'bg-[#FF5252]',
    textClass: 'text-[#FF5252]',
    borderClass: 'border-[#FF5252]',
  },
  Orange: {
    hex: '#FF9100',
    bgClass: 'bg-[#FF9100]',
    textClass: 'text-[#FF9100]',
    borderClass: 'border-[#FF9100]',
  },
  Pink: {
    hex: '#FF4081',
    bgClass: 'bg-[#FF4081]',
    textClass: 'text-[#FF4081]',
    borderClass: 'border-[#FF4081]',
  },
  White: {
    hex: '#FFFFFF',
    bgClass: 'bg-white',
    textClass: 'text-white',
    borderClass: 'border-white',
  },
};

export function parseSrtTimestamp(timeStr: string): number {
  const parts = timeStr.trim().replace(',', '.').split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

export function parseSrt(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // Line 0 may be index, Line 1 is timing
    const timingLine = lines[0].includes('-->') ? lines[0] : lines[1];
    const textLines = lines[0].includes('-->') ? lines.slice(1) : lines.slice(2);

    if (timingLine && timingLine.includes('-->')) {
      const [startStr, endStr] = timingLine.split('-->');
      const startTime = parseSrtTimestamp(startStr);
      const endTime = parseSrtTimestamp(endStr);
      const cueText = textLines.join('\n').replace(/<[^>]+>/g, '').trim();
      if (cueText) {
        cues.push({ startTime, endTime, text: cueText });
      }
    }
  }
  return cues;
}

export function generateThumbnailFromVideo(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadeddata = () => {
      video.currentTime = Math.min(2, video.duration / 3);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbUrl = canvas.toDataURL('image/jpeg', 0.8);
          URL.revokeObjectURL(url);
          resolve(thumbUrl);
          return;
        }
      } catch {
        // Fallback
      }
      URL.revokeObjectURL(url);
      resolve('');
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
  });
}

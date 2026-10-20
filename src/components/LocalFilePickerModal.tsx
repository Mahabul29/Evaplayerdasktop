import React, { useRef, useState } from 'react';
import { UploadCloud, FileVideo, Music2, X, Play, FolderOpen } from 'lucide-react';
import { MediaFile, AccentName } from '../types/media';
import { ACCENT_COLORS, formatSize, generateThumbnailFromVideo } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  accent: AccentName;
  onClose: () => void;
  onFilesSelected: (files: MediaFile[]) => void;
}

export const LocalFilePickerModal: React.FC<Props> = ({
  isOpen,
  accent,
  onClose,
  onFilesSelected,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const accentCfg = ACCENT_COLORS[accent];

  if (!isOpen) return null;

  const processFileList = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const mediaList: MediaFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isVideo = ['mp4', 'mkv', 'webm', 'mov', 'avi', 'm4v', 'wmv'].includes(ext);
      const isAudio = ['mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg'].includes(ext);

      if (isVideo || isAudio) {
        const objectUrl = URL.createObjectURL(file);
        let thumbnail = '';

        if (isVideo) {
          try {
            thumbnail = await generateThumbnailFromVideo(file);
          } catch {
            // Ignore
          }
        }

        mediaList.push({
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          path: (file as { webkitRelativePath?: string }).webkitRelativePath || file.name,
          sizeBytes: file.size,
          modified: file.lastModified,
          duration: 0,
          isAudio,
          folderPath: 'Local PC Uploads',
          folderName: 'Local Files',
          format: ext.toUpperCase(),
          thumbnailUrl: thumbnail || undefined,
          videoUrl: objectUrl,
        });
      }
    }

    setIsProcessing(false);
    if (mediaList.length > 0) {
      onFilesSelected(mediaList);
      onClose();
    } else {
      alert('No supported video or audio files found.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#161922] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <span>Open Windows Media</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Select or drag and drop videos and audio files directly from your PC
          </p>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
            isDragging
              ? `${accentCfg.borderClass} bg-white/10 scale-[1.01]`
              : 'border-white/15 bg-white/2 hover:border-white/30'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 mb-3 shadow-inner">
            <FileVideo className="w-7 h-7 text-blue-400" />
          </div>

          <p className="text-sm font-semibold text-white">
            Drag & drop media files here
          </p>
          <p className="text-xs text-white/40 mt-1 max-w-xs">
            Supports MP4, MKV, WebM, AVI, MP3, FLAC, and WAV with zero transcoding
          </p>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all hover:brightness-110 active:scale-95 ${accentCfg.bgClass}`}
            >
              Choose Files
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/90 bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Choose Folder</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,audio/*,.mkv,.avi,.webm,.flac,.m4a"
            onChange={handleFileChange}
            className="hidden"
          />

          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error webkitdirectory attribute
            webkitdirectory="true"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 text-xs text-white/70 py-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Analyzing local media and generating previews...</span>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ListMusic, Plus, Play, Trash2, Film, Music2, FolderPlus } from 'lucide-react';
import { MediaFile, Playlist, AccentName } from '../types/media';
import { ACCENT_COLORS, formatTime } from '../utils/formatters';

interface Props {
  playlists: Playlist[];
  allMedia: MediaFile[];
  accent: AccentName;
  onPlayMedia: (file: MediaFile) => void;
  onCreatePlaylist: (name: string, description: string) => void;
  onDeletePlaylist: (id: string) => void;
}

export const PlaylistsTab: React.FC<Props> = ({
  playlists,
  allMedia,
  accent,
  onPlayMedia,
  onCreatePlaylist,
  onDeletePlaylist,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const accentCfg = ACCENT_COLORS[accent];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreatePlaylist(name.trim(), desc.trim());
    setName('');
    setDesc('');
    setShowCreateModal(false);
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const playlistItems = selectedPlaylist
    ? allMedia.filter((m) => selectedPlaylist.mediaIds.includes(m.id))
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-purple-400" />
            <span>Playlists</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-normal">
              {playlists.length} playlists
            </span>
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Organize customized queues for cinema nights and music sessions
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95 ${accentCfg.bgClass}`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181b24] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white">Create New Playlist</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] text-white/50 mb-1">Playlist Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cyberpunk Nights"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g. Best 4K animation shorts"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white ${accentCfg.bgClass}`}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((playlist) => {
          const count = playlist.mediaIds.length;
          return (
            <div
              key={playlist.id}
              onClick={() => setSelectedPlaylistId(playlist.id)}
              className={`bg-white/5 hover:bg-white/10 border rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between group ${
                selectedPlaylistId === playlist.id
                  ? `${accentCfg.borderClass} bg-white/10`
                  : 'border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <ListMusic className="w-5 h-5" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlaylist(playlist.id);
                    }}
                    className="p-1 rounded text-white/30 hover:text-red-400 transition-colors"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-white truncate">
                  {playlist.name}
                </h3>
                <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                  {playlist.description || 'Custom Media Collection'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                <span>{count} {count === 1 ? 'item' : 'items'}</span>
                <span className="text-white/80 group-hover:underline flex items-center gap-1">
                  <Play className="w-3 h-3 fill-current" />
                  <span>View & Play</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Playlist Items Viewer if selected */}
      {selectedPlaylist && (
        <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{selectedPlaylist.name} Items</span>
            </h2>
            {playlistItems.length > 0 && (
              <button
                onClick={() => onPlayMedia(playlistItems[0])}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 ${accentCfg.bgClass}`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play from beginning</span>
              </button>
            )}
          </div>

          {playlistItems.length === 0 ? (
            <p className="text-xs text-white/40">
              This playlist is currently empty. Add media by clicking on items in the library.
            </p>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5 overflow-hidden">
              {playlistItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => onPlayMedia(item)}
                  className="flex items-center justify-between p-3 hover:bg-white/10 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-white/40 w-5 text-center">
                      {idx + 1}
                    </span>
                    <div className="w-12 aspect-video bg-black/40 rounded overflow-hidden shrink-0">
                      {item.thumbnailUrl && (
                        <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-white/90 truncate group-hover:text-white">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-white/40 font-mono">
                    <span>{item.format}</span>
                    <span>{formatTime(item.duration)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

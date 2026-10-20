import React, { useState } from 'react';
import { Shield, Lock, Unlock, KeyRound, Play, Eye, EyeOff, Film, AlertCircle } from 'lucide-react';
import { MediaFile, AccentName } from '../types/media';
import { ACCENT_COLORS, formatSize, formatTime } from '../utils/formatters';

interface Props {
  vaultVideos: MediaFile[];
  accent: AccentName;
  onPlayMedia: (file: MediaFile) => void;
  onUnhideVideo: (id: string) => void;
}

export const VaultTab: React.FC<Props> = ({
  vaultVideos,
  accent,
  onPlayMedia,
  onUnhideVideo,
}) => {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedPin, setSavedPin] = useState(() => {
    return localStorage.getItem('eva_vault_pin') || '1234';
  });
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  const accentCfg = ACCENT_COLORS[accent];

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        if (nextPin === savedPin) {
          setIsUnlocked(true);
          setPin('');
        } else {
          setErrorMsg('Incorrect PIN. Default is 1234');
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleSaveNewPin = () => {
    if (newPin.length === 4 && /^\d{4}$/.test(newPin)) {
      setSavedPin(newPin);
      localStorage.setItem('eva_vault_pin', newPin);
      setIsChangingPin(false);
      setNewPin('');
      alert('Security PIN updated successfully!');
    } else {
      alert('PIN must be exactly 4 digits');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span>Private Media Vault</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-normal">
            Encrypted & Hidden
          </span>
        </h1>
        <p className="text-xs text-white/50 mt-0.5">
          Secret PIN-protected storage for confidential videos and personal media files
        </p>
      </div>

      {!isUnlocked ? (
        /* PIN Lock Screen */
        <div className="max-w-sm mx-auto my-12 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white mb-4 shadow-inner">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-base font-bold text-white mb-1">Enter Security PIN</h2>
          <p className="text-xs text-white/50 mb-6">
            Unlock your private encrypted vault (Default PIN: <span className="font-mono text-emerald-400 font-semibold">1234</span>)
          </p>

          {/* 4 Pin Dots */}
          <div className="flex items-center gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  pin.length > i
                    ? `${accentCfg.bgClass} scale-125 shadow-lg`
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 mb-4 animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                className="h-12 rounded-xl bg-white/5 hover:bg-white/15 text-white font-semibold text-base transition-all active:scale-90 border border-white/5"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={() => setPin('')}
              className="h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-xs font-medium transition-all"
            >
              Clear
            </button>
            <button
              key="0"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-white/5 hover:bg-white/15 text-white font-semibold text-base transition-all active:scale-90 border border-white/5"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-all"
            >
              ⌫
            </button>
          </div>
        </div>
      ) : (
        /* Vault Content */
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-3">
              <Unlock className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-400">Vault is currently unlocked</p>
                <p className="text-white/50 text-[11px]">
                  Files in this section are isolated and hidden from your main video library
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsChangingPin(!isChangingPin)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change PIN</span>
              </button>
              <button
                onClick={() => setIsUnlocked(false)}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 flex items-center gap-1.5 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault</span>
              </button>
            </div>
          </div>

          {/* Change PIN Box */}
          {isChangingPin && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="New 4-digit PIN"
                className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs text-white font-mono focus:outline-none"
              />
              <button
                onClick={handleSaveNewPin}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${accentCfg.bgClass}`}
              >
                Save PIN
              </button>
            </div>
          )}

          {/* Vault Videos List */}
          {vaultVideos.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
              <Film className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/60">No hidden videos in your vault</p>
              <p className="text-[11px] text-white/40 mt-1">
                You can move videos into the vault to hide them from the public library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {vaultVideos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => onPlayMedia(vid)}
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col"
                >
                  <div className="relative aspect-video bg-black/60 overflow-hidden">
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-black/80 font-mono text-white">
                      {formatTime(vid.duration)}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-white truncate">{vid.title}</h3>
                      <p className="text-[10px] text-white/40">{formatSize(vid.sizeBytes)}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnhideVideo(vid.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                      title="Unhide back to main library"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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

import React, { useState } from 'react';
import { Download, X, Smartphone, Check, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface WallpaperExporterProps {
  isOpen: boolean;
  onClose: () => void;
  getSnapshotUrl: () => string;
}

export const WallpaperExporter: React.FC<WallpaperExporterProps> = ({
  isOpen,
  onClose,
  getSnapshotUrl,
}) => {
  const [snapshotData, setSnapshotData] = useState<string>('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      try {
        const url = getSnapshotUrl();
        setSnapshotData(url);
      } catch {}
    }
  }, [isOpen, getSnapshotUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    soundEngine.playUiClick();
    const link = document.createElement('a');
    link.download = `Galaxy-S26-Cosmic-Wallpaper-${Date.now()}.png`;
    link.href = snapshotData || getSnapshotUrl();
    link.click();
  };

  const handleCopyLink = () => {
    soundEngine.playUiClick();
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 pointer-events-auto select-none">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-mono">Export Galaxy S26 Wallpaper</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot Preview */}
        <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
          {snapshotData ? (
            <img src={snapshotData} alt="Wallpaper Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-xs text-slate-500 font-mono">Rendering snapshot...</div>
          )}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-cyan-300">
            1440 x 3120 Ultra
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-start gap-2">
            <Smartphone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Android / Galaxy S26:</strong> Tap Download, open Gallery, select options (three dots) &rarr; <em>Set as wallpaper</em> &rarr; <em>Lock and Home screens</em>.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleDownload}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm tracking-wide uppercase transition shadow-lg flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Ultra Wallpaper (.PNG)</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : null}
            <span>{copied ? 'Wallpaper Link Copied!' : 'Copy Live Interactive Wallpaper URL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

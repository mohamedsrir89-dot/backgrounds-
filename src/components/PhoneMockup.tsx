import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Battery, 
  Signal, 
  Camera, 
  Flashlight, 
  Fingerprint, 
  Search, 
  MessageSquare, 
  Phone, 
  Settings, 
  Grid, 
  Sparkles,
  CloudSun
} from 'lucide-react';
import { WallpaperConfig } from '../types/galaxy';

interface PhoneMockupProps {
  config: WallpaperConfig;
  onTapScreen?: () => void;
  children: React.ReactNode;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ config, onTapScreen, children }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full h-full p-4 pointer-events-none select-none">
      {/* Galaxy S26 Ultra Titanium Outer Chassis */}
      <div 
        className="relative pointer-events-auto rounded-[46px] p-[10px] shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(124,58,237,0.15)] transition-all duration-500 ease-out flex flex-col items-center justify-center"
        style={{
          width: 'min(420px, 94vw)',
          height: 'min(860px, 92vh)',
          aspectRatio: '9 / 19.5',
          background: 'linear-gradient(145deg, #334155 0%, #0f172a 40%, #1e293b 80%, #475569 100%)',
          boxShadow: 'inset 0 0 4px rgba(255,255,255,0.3), 0 20px 60px rgba(0,0,0,0.9)',
        }}
      >
        {/* Subtle Titanium Bevel Highlight */}
        <div className="absolute inset-[2px] rounded-[44px] border border-slate-600/40 pointer-events-none" />

        {/* Physical Button Accents */}
        <div className="absolute -left-[13px] top-[140px] w-[3px] h-[48px] bg-slate-600 rounded-l-sm" /> {/* Volume Up */}
        <div className="absolute -left-[13px] top-[198px] w-[3px] h-[48px] bg-slate-600 rounded-l-sm" /> {/* Volume Down */}
        <div className="absolute -right-[13px] top-[160px] w-[3px] h-[64px] bg-slate-600 rounded-r-sm" /> {/* Power Button */}

        {/* Screen Display Container (19.5:9 Samsung Dynamic AMOLED 2X) */}
        <div 
          onClick={onTapScreen}
          className="relative w-full h-full rounded-[38px] overflow-hidden bg-black flex flex-col justify-between cursor-crosshair"
          style={{
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          {/* Active Live Wallpaper 3D Viewport mounted in background */}
          <div className="absolute inset-0 z-0">
            {children}
          </div>

          {/* One UI 8 Status Bar (Top) */}
          <div className="relative z-20 w-full px-6 pt-3 pb-1 flex items-center justify-between text-white/90 text-xs font-medium tracking-tight">
            <span>{currentTime || '12:45'}</span>
            
            {/* S26 Ultra Punch-hole Front Camera */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-4 h-4 rounded-full bg-black border border-neutral-800 flex items-center justify-center shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/80 ring-1 ring-neutral-700/50" />
            </div>

            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5 text-white/80" />
              <Wifi className="w-3.5 h-3.5 text-white/80" />
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span>{config.batteryLevel}%</span>
                <Battery className="w-4 h-4 text-white/90 fill-white/80" />
              </div>
            </div>
          </div>

          {/* S26 Edge Panel subtle pull tab */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-white/20 rounded-l-full z-20 pointer-events-none" />

          {/* ============ LOCKSCREEN MODE ============ */}
          {config.phonePreviewMode === 'lockscreen' && (
            <div className="relative z-10 flex-1 flex flex-col justify-between p-6 pointer-events-none">
              {/* Samsung Signature Lockscreen Clock */}
              <div className="mt-8 text-center flex flex-col items-center">
                <h1 className="text-6xl font-light tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] font-mono">
                  {currentTime || '08:30'}
                </h1>
                <p className="mt-2 text-sm text-neutral-200/90 font-medium tracking-wide drop-shadow-md">
                  {currentDate || 'Thursday, Oct 22'}
                </p>

                {/* Live Weather Widget */}
                <div className="mt-4 px-3.5 py-1.5 rounded-full bg-black/30 border border-white/10 flex items-center gap-2 text-xs text-white/90 shadow-lg">
                  <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                  <span>21°C · Stellar Night</span>
                </div>
              </div>

              {/* Bottom Lockscreen elements: Fingerprint & Shortcuts */}
              <div className="mb-4 flex flex-col items-center gap-6">
                {/* Samsung Ultrasonic Fingerprint Scanner Area */}
                <div className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full border border-cyan-400/40 bg-cyan-500/10 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <Fingerprint className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] text-neutral-300/80 uppercase tracking-widest">
                    Swipe or Touch to interact
                  </span>
                </div>

                {/* Bottom Quick Action shortcuts */}
                <div className="w-full flex items-center justify-between px-2">
                  <button className="w-10 h-10 rounded-full bg-black/40 border border-white/15 flex items-center justify-center text-white/90 hover:bg-black/60 transition">
                    <Flashlight className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-black/40 border border-white/15 flex items-center justify-center text-white/90 hover:bg-black/60 transition">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============ HOMESCREEN MODE ============ */}
          {config.phonePreviewMode === 'homescreen' && (
            <div className="relative z-10 flex-1 flex flex-col justify-between p-6 pointer-events-none">
              {/* Top Google / Samsung AI Search Bar */}
              <div className="mt-4 w-full">
                <div className="w-full h-11 rounded-2xl bg-black/35 border border-white/15 px-4 flex items-center justify-between text-neutral-300 text-xs shadow-lg">
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Search apps, web, galaxy...</span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
              </div>

              {/* Center space left open for wallpaper viewing */}
              <div className="flex-1 flex items-center justify-center">
                <div className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-[11px] text-neutral-300">
                  Galaxy S26 Live Wallpaper Active
                </div>
              </div>

              {/* Bottom App Dock */}
              <div className="mb-2">
                <div className="grid grid-cols-4 gap-3 bg-black/40 border border-white/10 p-3 rounded-3xl shadow-xl">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600/90 flex items-center justify-center text-white shadow-md">
                      <Phone className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-2xl bg-blue-600/90 flex items-center justify-center text-white shadow-md">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-2xl bg-amber-600/90 flex items-center justify-center text-white shadow-md">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-2xl bg-slate-700/90 flex items-center justify-center text-white shadow-md">
                      <Settings className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Navigation Home Bar */}
                <div className="mt-4 flex justify-center">
                  <div className="w-32 h-1 bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          )}

          {/* ============ CLEAN MODE ============ */}
          {config.phonePreviewMode === 'clean' && (
            <div className="relative z-10 flex-1 flex flex-col justify-end p-6 pointer-events-none">
              <div className="mb-2 flex justify-center">
                <div className="w-32 h-1 bg-white/30 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  WallpaperConfig, 
  ColorThemeId, 
  AppMode 
} from '../types/galaxy';
import { GALAXY_THEMES } from '../graphics/themes';
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Palette, 
  Sliders, 
  Smartphone, 
  Download, 
  Gamepad2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Zap,
  Wind
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface WallpaperControlsProps {
  config: WallpaperConfig;
  onChangeConfig: (newConfig: Partial<WallpaperConfig>) => void;
  appMode: AppMode;
  onSetAppMode: (mode: AppMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTriggerMeteor: () => void;
  onExportSnapshot: () => void;
  onStartGameMode: () => void;
}

type TabType = 'stars' | 'nebula' | 'theme' | 'phone' | 'export';

export const WallpaperControls: React.FC<WallpaperControlsProps> = ({
  config,
  onChangeConfig,
  appMode,
  onSetAppMode,
  isMuted,
  onToggleMute,
  onTriggerMeteor,
  onExportSnapshot,
  onStartGameMode,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('stars');

  const themesList = Object.values(GALAXY_THEMES);

  return (
    <div 
      className="fixed z-40 transition-transform duration-300 ease-out flex flex-col items-center pointer-events-none"
      style={{
        bottom: '16px',
        left: '50%',
        transform: `translateX(-50%) translateY(${isCollapsed ? 'calc(100% - 36px)' : '0px'})`,
        width: 'min(920px, 95vw)',
      }}
    >
      {/* Collapse / Expand Toggle Button on Top Center of Dock */}
      <button
        onClick={() => {
          soundEngine.playUiClick();
          setIsCollapsed(!isCollapsed);
        }}
        className="pointer-events-auto px-4 py-1.5 rounded-t-xl bg-slate-900 border-t border-x border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-lg cursor-pointer"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Show S26 Wallpaper Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Hide Controls (Zen View)</span>
          </>
        )}
      </button>

      {/* Main Unified Bottom Dock Card (No backdrop-blur over active WebGL, solid rgba) */}
      <div 
        className="pointer-events-auto w-full rounded-2xl bg-slate-900/95 border border-slate-700/80 p-4 shadow-2xl flex flex-col gap-3"
      >
        {/* Top Dock Navigation Row */}
        <div className="w-full flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <button
              onClick={() => { soundEngine.playUiClick(); setActiveTab('stars'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                activeTab === 'stars' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Star Density</span>
            </button>

            <button
              onClick={() => { soundEngine.playUiClick(); setActiveTab('nebula'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                activeTab === 'nebula' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Interactive Nebula</span>
            </button>

            <button
              onClick={() => { soundEngine.playUiClick(); setActiveTab('theme'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                activeTab === 'theme' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>S26 Themes</span>
            </button>

            <button
              onClick={() => { soundEngine.playUiClick(); setActiveTab('phone'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                activeTab === 'phone' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone Frame</span>
            </button>
          </div>

          {/* Quick Actions (Audio, Game mode, Fullscreen toggle) */}
          <div className="flex items-center gap-2">
            {/* Launch Game Mode */}
            <button
              onClick={onStartGameMode}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
              title="Play Galaxy Odyssey S26 Cosmic Runner"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Cosmic Game</span>
            </button>

            {/* Snapshot */}
            <button
              onClick={onExportSnapshot}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
              title="Save 4K Wallpaper Snapshot"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Wallpaper</span>
            </button>

            {/* Mute */}
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Toggle Celestial Sound"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Fullscreen mode toggle */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onSetAppMode(appMode === 'fullscreen-wallpaper' ? 'wallpaper-studio' : 'fullscreen-wallpaper');
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title={appMode === 'fullscreen-wallpaper' ? 'Exit Fullscreen' : 'Live Wallpaper Fullscreen'}
            >
              {appMode === 'fullscreen-wallpaper' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="w-full">
          {/* ============ TAB: STAR DENSITY ============ */}
          {activeTab === 'stars' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Star Density Range */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Cosmic Star Density</span>
                  <span className="text-cyan-400 font-mono font-bold tabular-nums">
                    {config.starDensity.toLocaleString()} stars
                  </span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="70000"
                  step="1000"
                  value={config.starDensity}
                  onChange={(e) => onChangeConfig({ starDensity: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Sparse (2k)</span>
                  <span>Galaxy S26 Ultra (70k)</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-300 font-medium">Starfield Presets</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Subtle', val: 5000 },
                    { label: 'Standard', val: 18000 },
                    { label: 'Dense', val: 38000 },
                    { label: 'Ultra S26', val: 65000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        soundEngine.playUiClick();
                        onChangeConfig({ starDensity: preset.val });
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                        config.starDensity === preset.val
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Twinkle & Meteor trigger */}
              <div className="flex items-center justify-between gap-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-300 font-medium">Shooting Stars</span>
                  <span className="text-[10px] text-slate-400">Periodic meteor streaks</span>
                </div>
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    onTriggerMeteor();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/70 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Spark Meteor</span>
                </button>
              </div>
            </div>
          )}

          {/* ============ TAB: INTERACTIVE NEBULA ============ */}
          {activeTab === 'nebula' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Turbulence */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Nebula Turbulence</span>
                  <span className="text-cyan-400 font-mono font-bold">{config.nebulaTurbulence.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={config.nebulaTurbulence}
                  onChange={(e) => onChangeConfig({ nebulaTurbulence: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>

              {/* Interactive Swirl Ripple Force */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Touch Swirl Distortion</span>
                  <span className="text-cyan-400 font-mono font-bold">{config.interactiveRippleForce.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={config.interactiveRippleForce}
                  onChange={(e) => onChangeConfig({ interactiveRippleForce: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <span className="text-[10px] text-slate-400">Drag or touch screen to swirl nebulae</span>
              </div>

              {/* Nebula Speed & Parallax */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Evolution Speed</span>
                  <span className="text-cyan-400 font-mono font-bold">{config.nebulaSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.2"
                  step="0.1"
                  value={config.nebulaSpeed}
                  onChange={(e) => onChangeConfig({ nebulaSpeed: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* ============ TAB: S26 COLOR THEMES ============ */}
          {activeTab === 'theme' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {themesList.map((theme) => {
                const isSelected = config.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      soundEngine.playUiClick();
                      onChangeConfig({ theme: theme.id as ColorThemeId });
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    {/* Swatch color dots */}
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondaryColor }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">{theme.name}</span>
                    <span className="text-[9px] text-slate-400 leading-tight">{theme.tag}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ============ TAB: PHONE FRAME & ONE UI ============ */}
          {activeTab === 'phone' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              {/* Phone Frame Toggle */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-300 font-medium">Display Frame</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      soundEngine.playUiClick();
                      onChangeConfig({ showPhoneFrame: true });
                    }}
                    className={`py-1.5 rounded text-xs font-medium transition ${
                      config.showPhoneFrame
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    S26 Chassis
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playUiClick();
                      onChangeConfig({ showPhoneFrame: false });
                    }}
                    className={`py-1.5 rounded text-xs font-medium transition ${
                      !config.showPhoneFrame
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Pure Viewport
                  </button>
                </div>
              </div>

              {/* One UI 8 Preview Mode */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-300 font-medium">One UI 8 Overlay</span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'lockscreen', label: 'Lockscreen' },
                    { id: 'homescreen', label: 'Homescreen' },
                    { id: 'clean', label: 'Clean' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        soundEngine.playUiClick();
                        onChangeConfig({ phonePreviewMode: m.id as 'lockscreen' | 'homescreen' | 'clean' });
                      }}
                      className={`py-1.5 rounded text-[11px] font-medium transition ${
                        config.phonePreviewMode === m.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Gyro Parallax Strength */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">3D Tilt Parallax</span>
                  <span className="text-cyan-400 font-mono font-bold">{Math.round(config.parallaxStrength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={config.parallaxStrength}
                  onChange={(e) => onChangeConfig({ parallaxStrength: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

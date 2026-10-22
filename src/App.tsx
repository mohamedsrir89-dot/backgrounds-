/**
 * Galaxy S26 Live Wallpaper Studio & Cosmic Odyssey
 * Ultra-flagship live wallpaper engine with interactive volumetric nebulae,
 * customizable star density, and procedural 3D cosmic runner game.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WallpaperConfig, AppMode, GameState, GameMetrics } from './types/galaxy';
import { GalaxyEngine } from './graphics/GalaxyScene';
import { PhoneMockup } from './components/PhoneMockup';
import { WallpaperControls } from './components/WallpaperControls';
import { GameHUD } from './components/GameHUD';
import { WallpaperExporter } from './components/WallpaperExporter';
import { soundEngine } from './audio/soundEngine';
import { Sparkles, Maximize2, Smartphone } from 'lucide-react';

const DEFAULT_CONFIG: WallpaperConfig = {
  theme: 'titanium-violet',
  starDensity: 28000,
  starTwinkleSpeed: 1.0,
  starSize: 1.2,
  nebulaTurbulence: 1.2,
  nebulaSpeed: 0.9,
  nebulaBrightness: 1.1,
  nebulaScale: 1.0,
  interactiveRippleForce: 1.0,
  shootingStarRate: 0.5,
  bloomIntensity: 1.0,
  parallaxStrength: 0.6,
  showPhoneFrame: true,
  phonePreviewMode: 'lockscreen',
  clockFont: 'samsung',
  batteryLevel: 94,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GalaxyEngine | null>(null);

  const [config, setConfig] = useState<WallpaperConfig>(DEFAULT_CONFIG);
  const [appMode, setAppMode] = useState<AppMode>('wallpaper-studio');
  const [gameState, setGameState] = useState<GameState>('title');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const [gameMetrics, setGameMetrics] = useState<GameMetrics>({
    score: 0,
    multiplier: 1,
    energy: 100,
    distanceLightYears: 0,
    crystalsCollected: 0,
    shields: 3,
    speed: 35,
    highScore: 14850,
  });

  // Keep latest config in ref for callbacks
  const configRef = useRef(config);
  configRef.current = config;

  // Initialize Three.js Galaxy Engine
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GalaxyEngine(canvasMountRef.current, configRef.current);
    engineRef.current = engine;

    engine.setCallbacks(
      (metrics) => {
        setGameMetrics(metrics);
      },
      () => {
        setGameState('gameover');
      }
    );

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update engine when config changes
  const handleConfigChange = useCallback((newConfig: Partial<WallpaperConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      if (engineRef.current) {
        engineRef.current.updateConfig(updated);
      }
      return updated;
    });
  }, []);

  // Mode switching
  const handleSetAppMode = useCallback((mode: AppMode) => {
    setAppMode(mode);
    if (engineRef.current) {
      engineRef.current.setMode(mode);
    }
  }, []);

  // Game control handlers
  const handleStartGame = useCallback(() => {
    handleSetAppMode('game');
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, [handleSetAppMode]);

  const handleResumeGame = useCallback(() => {
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  }, []);

  const handleRestartGame = useCallback(() => {
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handleExitGame = useCallback(() => {
    handleSetAppMode('wallpaper-studio');
    setGameState('title');
  }, [handleSetAppMode]);

  const handleToggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleTriggerMeteor = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerShootingStar();
    }
  }, []);

  const getSnapshotUrl = useCallback(() => {
    if (engineRef.current) {
      return engineRef.current.captureSnapshot();
    }
    return '';
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Isolated WebGL Three.js Canvas Container (No React state re-renders affect WebGL loop) */}
      <div 
        ref={canvasMountRef} 
        className="absolute inset-0 z-0 w-full h-full cursor-crosshair"
      />

      {/* 2. Top Minimal Title Spec Badge (Zero Viewport Occlusion as per Three.js guidelines) */}
      {appMode !== 'game' && (
        <div className="fixed top-4 left-4 z-30 pointer-events-none flex items-center gap-3">
          <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 shadow-lg">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-wide font-mono">
                Galaxy S26 Live Wallpaper
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40">
              {config.starDensity.toLocaleString()} Stars
            </span>
          </div>

          {/* Quick mode indicators */}
          {appMode === 'wallpaper-studio' && config.showPhoneFrame && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-[11px] text-slate-300 pointer-events-auto">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>S26 Ultra Chassis Preview</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Samsung Galaxy S26 Ultra Chassis Overlay (Active in Wallpaper Studio mode when showPhoneFrame is enabled) */}
      {appMode === 'wallpaper-studio' && config.showPhoneFrame && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <PhoneMockup 
            config={config} 
            onTapScreen={handleTriggerMeteor}
          >
            {/* Transparent viewport inside phone frame - WebGL canvas underneath shines through */}
            <div className="w-full h-full" />
          </PhoneMockup>
        </div>
      )}

      {/* 4. Fullscreen Live Wallpaper Mode Hint */}
      {appMode === 'fullscreen-wallpaper' && (
        <div className="fixed top-4 right-4 z-30 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-black/60 border border-white/10 text-xs text-slate-300 font-mono shadow-md">
            Live Wallpaper Mode · Tap anywhere to swirl nebulae
          </div>
        </div>
      )}

      {/* 5. Collapsible Bottom Control Dock (Consolidated, zero side cards, follows Three.js specs) */}
      {appMode !== 'game' && (
        <WallpaperControls
          config={config}
          onChangeConfig={handleConfigChange}
          appMode={appMode}
          onSetAppMode={handleSetAppMode}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onTriggerMeteor={handleTriggerMeteor}
          onExportSnapshot={() => setIsExportOpen(true)}
          onStartGameMode={handleStartGame}
        />
      )}

      {/* 6. Game Shell HUD & Modals (Active in game mode) */}
      {appMode === 'game' && (
        <GameHUD
          gameState={gameState}
          metrics={gameMetrics}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onStartGame={handleStartGame}
          onResumeGame={handleResumeGame}
          onRestartGame={handleRestartGame}
          onExitGame={handleExitGame}
        />
      )}

      {/* 7. Wallpaper Exporter Modal */}
      <WallpaperExporter
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        getSnapshotUrl={getSnapshotUrl}
      />
    </div>
  );
}

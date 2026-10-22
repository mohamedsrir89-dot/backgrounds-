import React from 'react';
import { GameState, GameMetrics } from '../types/galaxy';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Zap, Sparkles, Orbit } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface GameHUDProps {
  gameState: GameState;
  metrics: GameMetrics;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onExitGame: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  metrics,
  isMuted,
  onToggleMute,
  onStartGame,
  onResumeGame,
  onRestartGame,
  onExitGame,
}) => {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none overflow-hidden">
      {/* ================= TITLE SCREEN ================= */}
      {gameState === 'title' && (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-8 text-center pointer-events-auto bg-gradient-to-b from-black/50 via-transparent to-black/80">
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between max-w-4xl pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-indigo-300">
              <Orbit className="w-4 h-4 text-cyan-400" />
              <span>GALAXY S26 COSMIC ENGINE</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onToggleMute}
                className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onExitGame}
                className="px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Back to Wallpaper
              </button>
            </div>
          </div>

          {/* Bespoke Inline SVG Title Lockup with 30-40% negative space */}
          <div className="flex flex-col items-center my-auto">
            <div className="relative mb-6">
              <svg className="w-72 sm:w-96 h-28" viewBox="0 0 400 120" fill="none">
                <defs>
                  <linearGradient id="s26TitleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                  <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                {/* Orbit ring decorative geometry */}
                <ellipse cx="200" cy="60" rx="180" ry="40" stroke="url(#s26TitleGrad)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.45" />
                <circle cx="50" cy="50" r="4" fill="#38bdf8" opacity="0.8" />
                <circle cx="340" cy="70" r="3" fill="#c084fc" opacity="0.8" />

                {/* Bespoke Typographic vector lockup */}
                <text
                  x="200"
                  y="52"
                  textAnchor="middle"
                  fill="url(#s26TitleGrad)"
                  filter="url(#glowFilter)"
                  className="font-extrabold tracking-[0.25em] text-3xl"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  GALAXY ODYSSEY
                </text>
                <text
                  x="200"
                  y="85"
                  textAnchor="middle"
                  fill="#94a3b8"
                  className="font-mono text-xs tracking-[0.45em] uppercase font-medium"
                >
                  S26 NEBULA RUNNER
                </text>
              </svg>
            </div>

            <p className="max-w-md text-sm text-slate-300/90 leading-relaxed mb-8 px-4">
              Pilot the S26 Quantum Probe through reactive volumetric nebulae. Harvest Stardust Crystals, dodge gravitational singularities, and engage Hyperspace Boost.
            </p>

            {/* Primary Start CTA */}
            <button
              onClick={onStartGame}
              className="group relative px-9 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white font-bold text-base tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(99,102,241,0.5)] flex items-center gap-3 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Launch Mission</span>
            </button>

            {/* Single Flat Control-Hint Line */}
            <div className="mt-8 text-xs font-mono text-slate-400 tracking-widest uppercase">
              WASD / Arrows Move · Space Boost · Esc Pause
            </div>
          </div>

          {/* Footer telemetry */}
          <div className="w-full flex items-center justify-center gap-6 text-xs text-slate-500 font-mono pb-2">
            <span>HIGH SCORE: <strong className="text-cyan-400 font-bold tabular-nums">{metrics.highScore}</strong></span>
            <span>·</span>
            <span>QUANTUM DRIVE: ONLINE</span>
          </div>
        </div>
      )}

      {/* ================= IN-GAME PLAYING HUD (Low Occlusion < 15%) ================= */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
          {/* Top Perimeter Status Clusters */}
          <div className="w-full flex items-start justify-between">
            {/* Left Cluster: Score & Multiplier */}
            <div className="flex flex-col gap-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 shadow-lg pointer-events-auto">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Cosmic Harvest</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white tabular-nums">
                  {metrics.score.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/50 px-2 py-0.5 rounded-full">
                  x{metrics.multiplier.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-300/90 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono tabular-nums">{metrics.crystalsCollected} Crystals</span>
              </div>
            </div>

            {/* Right Cluster: Shields & Mute / Pause */}
            <div className="flex items-center gap-3 pointer-events-auto">
              {/* Shields indicator */}
              <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl px-3.5 py-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <div className="flex gap-1">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`w-2.5 h-5 rounded-sm transition-all ${
                        s <= metrics.shields ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={onToggleMute}
                className="w-10 h-10 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Bottom Perimeter Status Clusters */}
          <div className="w-full flex items-end justify-between">
            {/* Left: Distance Light Years */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl px-4 py-2.5 shadow-lg">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Deep Space Distance</span>
              <div className="text-lg font-bold font-mono text-cyan-300 tabular-nums">
                {metrics.distanceLightYears.toFixed(2)} <span className="text-xs font-normal text-slate-400">LY</span>
              </div>
            </div>

            {/* Right: Warp Energy Boost Bar */}
            <div className="flex flex-col items-end gap-1.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 shadow-lg pointer-events-auto">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold font-mono text-slate-300 tracking-wider uppercase">Warp Drive</span>
                <span className="text-xs font-mono text-amber-400 tabular-nums font-bold">{Math.round(metrics.energy)}%</span>
              </div>
              <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-75"
                  style={{ width: `${metrics.energy}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">Hold Space or Touch to Boost</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAUSE MODAL ================= */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/75 pointer-events-auto">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 text-center shadow-2xl flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white tracking-wider font-mono">MISSION SUSPENDED</h2>
            <p className="text-xs text-slate-400 mt-2 mb-6">Probe positioned in orbital stasis.</p>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={onResumeGame}
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Flight</span>
              </button>
              <button
                onClick={onRestartGame}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Mission</span>
              </button>
              <button
                onClick={onExitGame}
                className="w-full py-3 rounded-xl bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs tracking-wider uppercase transition"
              >
                Return to Wallpaper Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= GAME OVER MODAL ================= */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/85 pointer-events-auto">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-rose-500/30 p-6 text-center shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-3">
              <Shield className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-bold text-rose-400 font-mono tracking-wider">HULL COMPROMISED</h2>
            <p className="text-xs text-slate-400 mt-1 mb-5">Quantum probe shields depleted in asteroid field.</p>

            {/* Score Summary */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Final Score:</span>
                <span className="text-lg font-bold font-mono text-cyan-400 tabular-nums">{metrics.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Distance Traveled:</span>
                <span className="font-mono text-slate-200 tabular-nums">{metrics.distanceLightYears.toFixed(2)} LY</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Crystals Harvested:</span>
                <span className="font-mono text-amber-300 tabular-nums">{metrics.crystalsCollected}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">High Score:</span>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">{metrics.highScore.toLocaleString()}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={onRestartGame}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Launch Again</span>
              </button>
              <button
                onClick={onExitGame}
                className="w-full py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs tracking-wider uppercase transition"
              >
                Return to Wallpaper Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

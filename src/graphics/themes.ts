import { ColorTheme, ColorThemeId } from '../types/galaxy';

export const GALAXY_THEMES: Record<ColorThemeId, ColorTheme> = {
  'titanium-violet': {
    id: 'titanium-violet',
    name: 'Titanium Violet',
    tag: 'Galaxy S26 Signature',
    primaryColor: '#7c3aed', // Rich violet
    secondaryColor: '#38bdf8', // Stellar cyan
    accentColor: '#f43f5e', // Hot pink/rose
    dustColor: '#1e1b4b', // Deep indigo void
    bgRgb: [0.02, 0.02, 0.06],
    presetIcon: 'Sparkles',
  },
  'cosmic-amber': {
    id: 'cosmic-amber',
    name: 'Cosmic Amber',
    tag: 'Solar Flare Nova',
    primaryColor: '#f59e0b', // Solar amber
    secondaryColor: '#ef4444', // Flare crimson
    accentColor: '#fde047', // Corona gold
    dustColor: '#451a03', // Warm dark space
    bgRgb: [0.06, 0.03, 0.01],
    presetIcon: 'Sun',
  },
  'aurora-emerald': {
    id: 'aurora-emerald',
    name: 'Aurora Emerald',
    tag: 'Polar Magnetosphere',
    primaryColor: '#10b981', // Emerald
    secondaryColor: '#06b6d4', // Cyan aqua
    accentColor: '#a7f3d0', // Pale mint
    dustColor: '#022c22', // Deep forest void
    bgRgb: [0.01, 0.05, 0.04],
    presetIcon: 'Compass',
  },
  'andromeda-blue': {
    id: 'andromeda-blue',
    name: 'Andromeda Blue',
    tag: 'Deep Celestial Abyss',
    primaryColor: '#2563eb', // Royal blue
    secondaryColor: '#818cf8', // Periwinkle
    accentColor: '#67e8f9', // Cyan crystal
    dustColor: '#030712', // Pure deep space
    bgRgb: [0.01, 0.02, 0.08],
    presetIcon: 'MilkyWay',
  },
  'supernova-ruby': {
    id: 'supernova-ruby',
    name: 'Supernova Ruby',
    tag: 'Stellar Explosion',
    primaryColor: '#e11d48', // Ruby red
    secondaryColor: '#9333ea', // Dark magenta
    accentColor: '#fb7185', // Rose pink
    dustColor: '#3b0764', // Deep purple void
    bgRgb: [0.05, 0.01, 0.03],
    presetIcon: 'Flame',
  },
  'quantum-monochrome': {
    id: 'quantum-monochrome',
    name: 'Quantum Obsidian',
    tag: 'Ultra Flagship Stealth',
    primaryColor: '#94a3b8', // Titanium silver
    secondaryColor: '#e2e8f0', // Pure platinum
    accentColor: '#38bdf8', // Subtle cyan spark
    dustColor: '#0f172a', // Slate void
    bgRgb: [0.01, 0.01, 0.02],
    presetIcon: 'Shield',
  },
};

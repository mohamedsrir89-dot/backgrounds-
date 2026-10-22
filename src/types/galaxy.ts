export type ColorThemeId = 'titanium-violet' | 'cosmic-amber' | 'aurora-emerald' | 'andromeda-blue' | 'supernova-ruby' | 'quantum-monochrome';

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  tag: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  dustColor: string;
  bgRgb: [number, number, number];
  presetIcon: string;
}

export interface WallpaperConfig {
  theme: ColorThemeId;
  starDensity: number; // 2000 to 80000
  starTwinkleSpeed: number; // 0.2 to 2.5
  starSize: number; // 0.5 to 3.0
  nebulaTurbulence: number; // 0.1 to 2.5
  nebulaSpeed: number; // 0.1 to 3.0
  nebulaBrightness: number; // 0.4 to 2.0
  nebulaScale: number; // 0.5 to 2.5
  interactiveRippleForce: number; // 0 to 2.0
  shootingStarRate: number; // 0 (off) to 1.0 (frequent)
  bloomIntensity: number; // 0.2 to 2.0
  parallaxStrength: number; // 0 to 1.0
  showPhoneFrame: boolean;
  phonePreviewMode: 'lockscreen' | 'homescreen' | 'clean';
  clockFont: 'samsung' | 'modern' | 'minimal';
  batteryLevel: number;
}

export type AppMode = 'wallpaper-studio' | 'fullscreen-wallpaper' | 'game';

export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface GameMetrics {
  score: number;
  multiplier: number;
  energy: number; // 0 - 100
  distanceLightYears: number;
  crystalsCollected: number;
  shields: number;
  speed: number;
  highScore: number;
}

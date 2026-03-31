export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 640;

export const COLS = 8;
export const ROWS = 10;
export const CELL_SIZE = 48;

export const GRID_OFFSET_X = (GAME_WIDTH - COLS * CELL_SIZE) / 2;
export const GRID_OFFSET_Y = 120;

export const COLORS = [
  0xe74c3c,
  0x3498db,
  0x2ecc71,
  0xf1c40f,
  0x9b59b6,
  0xe67e22,
];

export const COLOR_NAMES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export const COLOR_DARK = [
  0x922b21,
  0x1a5276,
  0x1e8449,
  0x9a7d0a,
  0x6c3483,
  0x935116,
];

export const COLOR_LIGHT = [
  0xf1948a,
  0x85c1e9,
  0x82e0aa,
  0xf9e79f,
  0xd2b4de,
  0xf0b27a,
];

export const MIN_MATCH = 3;

export const SCENES = {
  BOOT:       'BootScene',
  PRELOAD:    'PreloadScene',
  MENU:       'MenuScene',
  ONBOARDING: 'UIScene',
  GAME:       'GameScene',
  GAME_OVER:  'GameOverScene',
};

export const STORAGE_KEY = 'pixel_cascade_save';

export const LEVELS = [
  { moves: 20, target: 600,   colors: 3 },
  { moves: 20, target: 1200,  colors: 3 },
  { moves: 20, target: 2000,  colors: 4 },
  { moves: 18, target: 3000,  colors: 4 },
  { moves: 18, target: 4400,  colors: 4 },
  { moves: 16, target: 6000,  colors: 5 },
  { moves: 16, target: 8000,  colors: 5 },
  { moves: 15, target: 10500, colors: 5 },
  { moves: 15, target: 13500, colors: 6 },
  { moves: 14, target: 17000, colors: 6 },
];

// Returns config for any level index, generating infinite levels beyond the preset 10.
// After level 10 (index >= 10) each level also requires a minimum number of Tetris Blasts.
export function getLevelConfig(levelIndex) {
  if (levelIndex < LEVELS.length) return LEVELS[levelIndex];

  // How many levels past the last preset (index 9)
  const excess = levelIndex - (LEVELS.length - 1);
  const base   = LEVELS[LEVELS.length - 1]; // { moves: 14, target: 17000, colors: 6 }

  return {
    moves:              Math.max(10, base.moves - Math.floor(excess / 4)),
    target:             Math.round(base.target * Math.pow(1.3, excess)),
    colors:             6,
    // Tetromino-blast requirement grows slowly: 1 at level 11, +1 every 3 levels, cap 10
    tetrominosRequired: Math.min(10, 1 + Math.floor((excess - 1) / 3)),
  };
}
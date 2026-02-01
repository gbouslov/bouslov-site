// Category slug to Lucide icon mapping
export const CATEGORY_ICONS: Record<string, string> = {
  chess_bullet: 'Crosshair',
  chess_blitz: 'Zap',
  chess_rapid: 'Clock',
  chess_daily: 'Calendar',
  chess_puzzle_rush: 'Puzzle',
  typing_speed: 'Keyboard',
  typing_accuracy: 'Target',
  reaction_time: 'Zap',
  memory: 'Brain',
  aim_trainer: 'Crosshair',
  countries_visited: 'Globe',
  us_states: 'Map',
}

// Rank position labels
export const RANK_LABELS = ['1st', '2nd', '3rd', '4th', '5th']

// Rank accent colors (for subtle highlights)
export const RANK_COLORS: Record<number, string> = {
  0: 'text-amber-400',
  1: 'text-zinc-400',
  2: 'text-orange-600',
  3: 'text-zinc-500',
  4: 'text-zinc-600',
}

// Badge background colors
export const RANK_BG: Record<number, string> = {
  0: 'bg-amber-400/10 border-amber-400/20',
  1: 'bg-zinc-400/10 border-zinc-400/20',
  2: 'bg-orange-600/10 border-orange-600/20',
  3: 'bg-zinc-500/10 border-zinc-500/20',
  4: 'bg-zinc-600/10 border-zinc-600/20',
}

// Chess.com API username mapping
export const CHESS_USERNAMES: Record<string, string> = {
  'gbouslov@gmail.com': 'gbouslov',
  'dbouslov@gmail.com': 'dbouslov',
  'jbouslov@gmail.com': 'jbouslov',
  'bouslovd@gmail.com': 'bouslovd',
  'bouslovb@gmail.com': 'bouslovb',
}

// Score validation ranges
export const SCORE_LIMITS: Record<string, { min: number; max: number }> = {
  typing_speed: { min: 0, max: 300 },
  typing_accuracy: { min: 0, max: 100 },
  reaction_time: { min: 100, max: 2000 },
  memory: { min: 1, max: 100 },
  aim_trainer: { min: 100, max: 2000 },
  chess_bullet: { min: 0, max: 3500 },
  chess_blitz: { min: 0, max: 3500 },
  chess_rapid: { min: 0, max: 3500 },
  chess_daily: { min: 0, max: 3500 },
  chess_puzzle_rush: { min: 0, max: 100 },
  countries_visited: { min: 0, max: 195 },
  us_states: { min: 0, max: 50 },
}

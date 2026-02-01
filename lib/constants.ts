// Category group color definitions
export const CATEGORY_GROUPS = {
  chess: {
    name: 'Chess Ratings',
    color: 'amber',
    accent: 'amber-500',
    accentLight: 'amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    hover: 'hover:border-amber-500/50',
  },
  cognitive: {
    name: 'Cognitive Tests',
    color: 'blue',
    accent: 'blue-500',
    accentLight: 'blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    hover: 'hover:border-blue-500/50',
  },
  travel: {
    name: 'Travel',
    color: 'emerald',
    accent: 'emerald-500',
    accentLight: 'emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    hover: 'hover:border-emerald-500/50',
  },
  typing: {
    name: 'Typing',
    color: 'violet',
    accent: 'violet-500',
    accentLight: 'violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    hover: 'hover:border-violet-500/50',
  },
} as const

// Map category slugs to their groups
export const CATEGORY_TO_GROUP: Record<string, keyof typeof CATEGORY_GROUPS> = {
  chess_bullet: 'chess',
  chess_blitz: 'chess',
  chess_rapid: 'chess',
  chess_daily: 'chess',
  chess_puzzle_rush: 'chess',
  typing_speed: 'typing',
  typing_accuracy: 'typing',
  reaction_time: 'cognitive',
  memory: 'cognitive',
  aim_trainer: 'cognitive',
  countries_visited: 'travel',
  us_states: 'travel',
}

// Helper function to get category group
export function getCategoryGroup(slug: string) {
  const groupKey = CATEGORY_TO_GROUP[slug]
  return groupKey ? CATEGORY_GROUPS[groupKey] : null
}

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

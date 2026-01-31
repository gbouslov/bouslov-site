// Challenge categories with external links
export const CATEGORIES = [
  {
    slug: 'wpm',
    name: 'Typing Speed',
    external_url: 'https://monkeytype.com',
    score_type: 'higher_better' as const,
    unit: 'WPM',
    description: 'Words per minute',
  },
  {
    slug: 'chess',
    name: 'Chess Rating',
    external_url: 'https://chess.com',
    score_type: 'higher_better' as const,
    unit: 'ELO',
    description: 'Chess.com rapid',
  },
  {
    slug: 'reaction',
    name: 'Reaction Time',
    external_url: 'https://humanbenchmark.com/tests/reactiontime',
    score_type: 'lower_better' as const,
    unit: 'ms',
    description: 'Visual reaction',
  },
  {
    slug: 'memory',
    name: 'Memory',
    external_url: 'https://humanbenchmark.com/tests/memory',
    score_type: 'higher_better' as const,
    unit: 'level',
    description: 'Sequence memory',
  },
  {
    slug: 'accuracy',
    name: 'Typing Accuracy',
    external_url: 'https://keybr.com',
    score_type: 'higher_better' as const,
    unit: '%',
    description: 'Typing precision',
  },
  {
    slug: 'aim',
    name: 'Aim Trainer',
    external_url: 'https://humanbenchmark.com/tests/aim',
    score_type: 'lower_better' as const,
    unit: 'ms',
    description: 'Click accuracy',
  },
]

// Rank position labels
export const RANK_LABELS = ['1st', '2nd', '3rd', '4th']

// Rank accent colors (for subtle highlights)
export const RANK_COLORS = {
  0: 'text-amber-400',
  1: 'text-zinc-400', 
  2: 'text-orange-600',
  3: 'text-zinc-500',
}

// Badge background colors
export const RANK_BG = {
  0: 'bg-amber-400/10 border-amber-400/20',
  1: 'bg-zinc-400/10 border-zinc-400/20',
  2: 'bg-orange-600/10 border-orange-600/20',
  3: 'bg-zinc-500/10 border-zinc-500/20',
}

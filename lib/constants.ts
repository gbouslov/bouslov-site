// Challenge categories with external links
export const CATEGORIES = [
  {
    slug: 'wpm',
    name: 'Typing Speed',
    external_url: 'https://monkeytype.com',
    score_type: 'higher_better' as const,
    unit: 'WPM',
    icon: '⌨️',
    description: 'Words per minute typing test',
  },
  {
    slug: 'chess',
    name: 'Chess Rating',
    external_url: 'https://chess.com',
    score_type: 'higher_better' as const,
    unit: 'ELO',
    icon: '♟️',
    description: 'Chess.com rapid rating',
  },
  {
    slug: 'reaction',
    name: 'Reaction Time',
    external_url: 'https://humanbenchmark.com/tests/reactiontime',
    score_type: 'lower_better' as const,
    unit: 'ms',
    icon: '⚡',
    description: 'Visual reaction time test',
  },
  {
    slug: 'memory',
    name: 'Memory',
    external_url: 'https://humanbenchmark.com/tests/memory',
    score_type: 'higher_better' as const,
    unit: 'level',
    icon: '🧠',
    description: 'Visual memory sequence test',
  },
  {
    slug: 'accuracy',
    name: 'Typing Accuracy',
    external_url: 'https://keybr.com',
    score_type: 'higher_better' as const,
    unit: '%',
    icon: '🎯',
    description: 'Typing accuracy percentage',
  },
  {
    slug: 'aim',
    name: 'Aim Trainer',
    external_url: 'https://humanbenchmark.com/tests/aim',
    score_type: 'lower_better' as const,
    unit: 'ms',
    icon: '🎯',
    description: 'Click accuracy and speed',
  },
]

// Medal colors for rankings
export const MEDALS = ['🥇', '🥈', '🥉', '4️⃣']

// Fun titles based on total ranking
export const RANK_TITLES = [
  'Supreme Champion 👑',
  'Worthy Challenger 🏆',
  'Rising Star ⭐',
  'Eager Competitor 💪',
]

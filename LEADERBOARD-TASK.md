# TASK: Leaderboard UX Overhaul

## Problem
The current leaderboard is a mess:
- Categories are just tags with no structure
- "No scores yet" when clicking categories - data not connected properly
- No score history or progress tracking
- No auto-sync from APIs (Chess.com, etc.)
- Confusing navigation
- "Stats" and "Settings" pages not implemented

## Goals
1. **Proper data persistence** - All scores stored in Supabase with history
2. **Clear UX hierarchy** - Overall → Category → Individual scores
3. **Auto-sync from APIs** - Chess.com ratings pull automatically
4. **Progress tracking** - Score history over time with graphs
5. **Easy score submission** - Manual entry for things without APIs

## Database Schema (Supabase)

### Current tables to review/fix:
Check existing schema and ensure proper structure.

### Required schema:
```sql
-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'chess_bullet', 'typing_speed', etc.
  name TEXT NOT NULL, -- 'Chess (Bullet)', 'Typing Speed', etc.
  description TEXT,
  icon TEXT, -- Lucide icon name
  unit TEXT NOT NULL, -- 'ELO', 'WPM', 'ms', '%'
  higher_is_better BOOLEAN DEFAULT true, -- false for reaction time
  api_source TEXT, -- 'chess.com', 'lichess', null for manual
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores table (with history)
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  value DECIMAL NOT NULL, -- The actual score
  proof_url TEXT, -- Screenshot or link to source
  source TEXT, -- 'api', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_scores_category ON scores(category_id);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_email);
CREATE INDEX IF NOT EXISTS idx_scores_created ON scores(created_at DESC);

-- View for current best scores per user per category
CREATE OR REPLACE VIEW current_rankings AS
SELECT DISTINCT ON (s.category_id, s.user_email)
  s.id,
  s.user_email,
  s.user_name,
  s.category_id,
  c.name as category_name,
  c.slug as category_slug,
  c.unit,
  c.higher_is_better,
  s.value,
  s.created_at
FROM scores s
JOIN categories c ON s.category_id = c.id
ORDER BY s.category_id, s.user_email, 
  CASE WHEN c.higher_is_better THEN s.value END DESC,
  CASE WHEN NOT c.higher_is_better THEN s.value END ASC,
  s.created_at DESC;

-- RLS policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by all" ON categories FOR SELECT USING (true);
CREATE POLICY "Scores are viewable by all" ON scores FOR SELECT USING (true);
CREATE POLICY "Users can insert their own scores" ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own scores" ON scores FOR DELETE USING (auth.jwt() ->> 'email' = user_email);
```

### Seed data for categories:
```sql
INSERT INTO categories (slug, name, icon, unit, higher_is_better, api_source) VALUES
  ('chess_bullet', 'Chess (Bullet)', 'Crosshair', 'ELO', true, 'chess.com'),
  ('chess_blitz', 'Chess (Blitz)', 'Zap', 'ELO', true, 'chess.com'),
  ('chess_rapid', 'Chess (Rapid)', 'Clock', 'ELO', true, 'chess.com'),
  ('chess_daily', 'Chess (Daily)', 'Calendar', 'ELO', true, 'chess.com'),
  ('chess_puzzle_rush', 'Puzzle Rush', 'Puzzle', 'score', true, 'chess.com'),
  ('typing_speed', 'Typing Speed', 'Keyboard', 'WPM', true, null),
  ('typing_accuracy', 'Typing Accuracy', 'Target', '%', true, null),
  ('reaction_time', 'Reaction Time', 'Zap', 'ms', false, null),
  ('memory', 'Memory', 'Brain', 'score', true, null),
  ('aim_trainer', 'Aim Trainer', 'Crosshair', 'ms', false, null),
  ('countries_visited', 'Countries Visited', 'Globe', 'count', true, null),
  ('us_states', 'US States Visited', 'Map', 'count', true, null)
ON CONFLICT (slug) DO NOTHING;
```

## API Routes

### GET /api/categories
Returns all categories with current leader for each.

### GET /api/scores?category=chess_bullet
Returns all scores for a category, ordered by rank.

### GET /api/scores/history?category=chess_bullet&user=gbouslov@gmail.com
Returns score history for graphing.

### POST /api/scores
Submit a new score manually.
```json
{
  "category_slug": "typing_speed",
  "value": 142,
  "proof_url": "https://monkeytype.com/..."
}
```

### POST /api/sync/chess
Sync Chess.com ratings for all users.
```typescript
// Chess.com usernames mapping
const CHESS_USERNAMES = {
  'gbouslov@gmail.com': 'gbouslov',
  'dbouslov@gmail.com': 'bouslovd', // David
  'jbouslov@gmail.com': 'jbouslov', // Jonathan
  'bouslovd@gmail.com': 'bouslovd', // Daniel (the twin)
};
```

## UI Components

### 1. Main Leaderboard Page (`/leaderboard`)
```
┌─────────────────────────────────────────────────────────┐
│  BOUSLOV LEADERBOARD                    [Sync All] ↻   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  OVERALL STANDINGS                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. Daniel    156 pts  ████████████████████      │   │
│  │ 2. Gabe      142 pts  █████████████████         │   │
│  │ 3. David     128 pts  ███████████████           │   │
│  │ 4. Jonathan  115 pts  █████████████             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Points = Sum of category placements (1st=4pts, etc.)  │
│                                                         │
│  CATEGORIES                                             │
│  [Grid of category cards - click to expand]            │
│                                                         │
│  RECENT ACTIVITY                                        │
│  [Feed of recent score updates]                        │
└─────────────────────────────────────────────────────────┘
```

### 2. Category Card Component
Shows: Icon, Name, Current Leader, Their Score, Click to expand

### 3. Category Detail Modal/Page
When clicking a category:
- Full leaderboard for that category
- Score history graph (recharts)
- "Log Score" button
- Link to take test (for manual categories)

### 4. Log Score Modal
- Category dropdown
- Value input
- Proof URL (optional)
- Submit button

### 5. Profile Page (`/profile/[email]`)
- User's scores across all categories
- Rank in each category
- Progress graphs
- Achievement badges

## Tech Stack
- Next.js 15 (already using)
- Supabase (already using)
- shadcn/ui (already using)
- recharts for graphs
- Lucide icons (NO EMOJIS)

## Implementation Order
1. Fix database schema - create proper tables
2. Seed categories
3. Build API routes
4. Rebuild leaderboard page with proper data fetching
5. Build category detail view
6. Build log score modal
7. Add Chess.com API sync
8. Add score history graphs
9. Build profile pages
10. Polish animations

## Design Requirements
- Dark theme (#09090b background)
- NO EMOJIS - use Lucide icons only
- Sleek, modern aesthetic (Linear/Vercel vibes)
- Smooth animations
- Mobile responsive

## Family Members
```typescript
const FAMILY = [
  { email: 'gbouslov@gmail.com', name: 'Gabe', chessUsername: 'gbouslov' },
  { email: 'dbouslov@gmail.com', name: 'David', chessUsername: null },
  { email: 'jbouslov@gmail.com', name: 'Jonathan', chessUsername: 'jbouslov' },
  { email: 'bouslovd@gmail.com', name: 'Daniel', chessUsername: 'bouslovd' },
  { email: 'bouslovb@gmail.com', name: 'Dad', chessUsername: null },
];
```

## Success Criteria
- [ ] All scores persist in Supabase properly
- [ ] Categories show actual data, not "No scores yet"
- [ ] Can manually log a score and see it appear
- [ ] Chess.com ratings sync automatically
- [ ] Score history is tracked (not just latest)
- [ ] Overall rankings calculate correctly
- [ ] Mobile responsive
- [ ] Clean, professional UI

## DO NOT TOUCH
- components/globe.tsx
- components/travel-globe.tsx
- Any globe-related files

## Deploy
When complete: `vercel --prod --yes`

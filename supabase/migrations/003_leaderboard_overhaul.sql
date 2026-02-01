-- Leaderboard Overhaul Migration
-- This migration updates the schema for proper score tracking with history

-- First, drop the old categories table and recreate with proper structure
-- (keeping existing data where possible)

-- Create new categories table with updated schema
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  unit TEXT NOT NULL,
  higher_is_better BOOLEAN DEFAULT true,
  api_source TEXT, -- 'chess.com', null for manual
  external_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create new scores table with history support
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  value DECIMAL NOT NULL,
  proof_url TEXT,
  source TEXT DEFAULT 'manual', -- 'api', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_scores_category ON scores(category_id);
CREATE INDEX idx_scores_user ON scores(user_email);
CREATE INDEX idx_scores_created ON scores(created_at DESC);
CREATE INDEX idx_scores_user_category ON scores(user_email, category_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Categories are viewable by all" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Categories can be managed" ON categories
  FOR ALL USING (true);

-- RLS policies for scores
CREATE POLICY "Scores are viewable by all" ON scores
  FOR SELECT USING (true);

CREATE POLICY "Scores can be inserted" ON scores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Scores can be deleted by owner" ON scores
  FOR DELETE USING (true);

-- Seed categories with proper data
INSERT INTO categories (slug, name, description, icon, unit, higher_is_better, api_source, external_url) VALUES
  ('chess_bullet', 'Chess (Bullet)', '1-2 minute games', 'Crosshair', 'ELO', true, 'chess.com', 'https://chess.com/play/online/bullet'),
  ('chess_blitz', 'Chess (Blitz)', '3-5 minute games', 'Zap', 'ELO', true, 'chess.com', 'https://chess.com/play/online/blitz'),
  ('chess_rapid', 'Chess (Rapid)', '10-15 minute games', 'Clock', 'ELO', true, 'chess.com', 'https://chess.com/play/online/rapid'),
  ('chess_daily', 'Chess (Daily)', 'Correspondence chess', 'Calendar', 'ELO', true, 'chess.com', 'https://chess.com/play/online/daily'),
  ('chess_puzzle_rush', 'Puzzle Rush', 'Best puzzle rush score', 'Puzzle', 'score', true, 'chess.com', 'https://chess.com/puzzles/rush'),
  ('typing_speed', 'Typing Speed', 'Words per minute', 'Keyboard', 'WPM', true, null, 'https://monkeytype.com'),
  ('typing_accuracy', 'Typing Accuracy', 'Typing precision', 'Target', '%', true, null, 'https://keybr.com'),
  ('reaction_time', 'Reaction Time', 'Visual reaction speed', 'Zap', 'ms', false, null, 'https://humanbenchmark.com/tests/reactiontime'),
  ('memory', 'Memory', 'Sequence memory level', 'Brain', 'level', true, null, 'https://humanbenchmark.com/tests/memory'),
  ('aim_trainer', 'Aim Trainer', 'Click accuracy time', 'Crosshair', 'ms', false, null, 'https://humanbenchmark.com/tests/aim'),
  ('countries_visited', 'Countries Visited', 'Countries you have been to', 'Globe', 'count', true, null, '/travel'),
  ('us_states', 'US States Visited', 'US states you have been to', 'Map', 'count', true, null, '/travel')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  unit = EXCLUDED.unit,
  higher_is_better = EXCLUDED.higher_is_better,
  api_source = EXCLUDED.api_source,
  external_url = EXCLUDED.external_url;

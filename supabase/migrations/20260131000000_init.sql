-- Bouslov Bros Leaderboard Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension

-- Users table (synced from NextAuth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  external_url TEXT NOT NULL,
  score_type TEXT NOT NULL CHECK (score_type IN ('higher_better', 'lower_better')),
  unit TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  score DECIMAL NOT NULL,
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_category_id ON scores(category_id);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Everyone can read users (for leaderboard display)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Only allow insert/update from server (via service role key)
CREATE POLICY "Users can be created by service" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can be updated by service" ON users
  FOR UPDATE USING (true);

-- RLS Policies for categories table
-- Everyone can read categories
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- RLS Policies for scores table
-- Everyone can read scores (for leaderboard)
CREATE POLICY "Scores are viewable by everyone" ON scores
  FOR SELECT USING (true);

-- Scores can be inserted by service
CREATE POLICY "Scores can be created by service" ON scores
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- SEED DATA - Run after creating tables
-- =====================================================

-- Insert categories
INSERT INTO categories (slug, name, external_url, score_type, unit, icon) VALUES
  ('wpm', 'Typing Speed', 'https://monkeytype.com', 'higher_better', 'WPM', '⌨️'),
  ('chess', 'Chess Rating', 'https://chess.com', 'higher_better', 'ELO', '♟️'),
  ('reaction', 'Reaction Time', 'https://humanbenchmark.com/tests/reactiontime', 'lower_better', 'ms', '⚡'),
  ('memory', 'Memory', 'https://humanbenchmark.com/tests/memory', 'higher_better', 'level', '🧠'),
  ('accuracy', 'Typing Accuracy', 'https://keybr.com', 'higher_better', '%', '🎯'),
  ('aim', 'Aim Trainer', 'https://humanbenchmark.com/tests/aim', 'lower_better', 'ms', '🎯')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  external_url = EXCLUDED.external_url,
  score_type = EXCLUDED.score_type,
  unit = EXCLUDED.unit,
  icon = EXCLUDED.icon;

-- Pre-create users for the allowlist (they'll be updated when they first log in)
INSERT INTO users (email, name) VALUES
  ('gbouslov@gmail.com', 'Gabe'),
  ('dbouslov@gmail.com', 'Daniel'),
  ('jbouslov@gmail.com', 'Jake'),
  ('bouslovd@gmail.com', 'Dad')
ON CONFLICT (email) DO NOTHING;

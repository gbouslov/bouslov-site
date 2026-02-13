-- Polls table for family decisions
-- Created: 2026-02-13

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polls_user_email ON polls(user_email);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);

-- RLS policies
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Users can view all polls" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own polls" ON polls
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own polls" ON polls
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own polls" ON polls
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Poll votes policies
CREATE POLICY "Users can view all votes" ON poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own votes" ON poll_votes
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own votes" ON poll_votes
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

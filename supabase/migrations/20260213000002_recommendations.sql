-- Recommendations table for shared reviews
-- Created: 2026-02-13

-- Create recommendation category enum
CREATE TYPE recommendation_category AS ENUM (
  'restaurant', 'show', 'movie', 'music', 'book', 'game', 'podcast', 'other'
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  category recommendation_category NOT NULL DEFAULT 'other',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recommendation_comments table
CREATE TABLE IF NOT EXISTS recommendation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_email ON recommendations(user_email);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_comments_rec_id ON recommendation_comments(recommendation_id);

-- RLS policies
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_comments ENABLE ROW LEVEL SECURITY;

-- Recommendations policies
CREATE POLICY "Users can view all recommendations" ON recommendations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own recommendations" ON recommendations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own recommendations" ON recommendations
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own recommendations" ON recommendations
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Comment policies
CREATE POLICY "Users can view all recommendation comments" ON recommendation_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own recommendation comments" ON recommendation_comments
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own recommendation comments" ON recommendation_comments
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_recommendations_updated_at();

-- Wishlists table for family gift coordination
-- Created: 2026-02-13

-- Create occasion enum
CREATE TYPE wishlist_occasion AS ENUM ('birthday', 'holiday', 'general');

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  price TEXT,
  notes TEXT,
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  occasion wishlist_occasion NOT NULL DEFAULT 'general',
  claimed_by TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_email ON wishlist_items(user_email);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_occasion ON wishlist_items(occasion);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_created_at ON wishlist_items(created_at DESC);

-- RLS policies
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all wishlist items" ON wishlist_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own wishlist items" ON wishlist_items
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own wishlist items" ON wishlist_items
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own wishlist items" ON wishlist_items
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_wishlist_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wishlist_items_updated_at
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_items_updated_at();

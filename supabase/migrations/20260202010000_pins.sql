-- Pins table for family travel map
-- Created: 2026-02-02

-- Create pin_type enum
CREATE TYPE pin_type AS ENUM ('bucket_list', 'trip_planned', 'been_there', 'home_base');

-- Create pins table
CREATE TABLE IF NOT EXISTS pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location_name TEXT,
  pin_type pin_type NOT NULL DEFAULT 'been_there',
  title TEXT NOT NULL,
  description TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  trip_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pin_comments table
CREATE TABLE IF NOT EXISTS pin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pins_user_email ON pins(user_email);
CREATE INDEX IF NOT EXISTS idx_pins_pin_type ON pins(pin_type);
CREATE INDEX IF NOT EXISTS idx_pins_created_at ON pins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pin_comments_pin_id ON pin_comments(pin_id);

-- RLS policies
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_comments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all pins (family site)
CREATE POLICY "Users can view all pins" ON pins
  FOR SELECT USING (true);

-- Allow users to insert their own pins
CREATE POLICY "Users can insert own pins" ON pins
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Allow users to update their own pins
CREATE POLICY "Users can update own pins" ON pins
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- Allow users to delete their own pins
CREATE POLICY "Users can delete own pins" ON pins
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Comments policies
CREATE POLICY "Users can view all comments" ON pin_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON pin_comments
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own comments" ON pin_comments
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_pins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pins_updated_at
  BEFORE UPDATE ON pins
  FOR EACH ROW
  EXECUTE FUNCTION update_pins_updated_at();

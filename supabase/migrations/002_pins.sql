-- =====================================================
-- Globe Pins Tables Setup
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create pins table
CREATE TABLE IF NOT EXISTS pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  
  -- Location
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  location_name TEXT,
  
  -- Content
  pin_type TEXT NOT NULL CHECK (pin_type IN ('bucket_list', 'trip_planned', 'been_there', 'home_base')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Rich content (JSONB)
  links JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  
  -- Optional date for trips
  trip_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pin_comments table
CREATE TABLE IF NOT EXISTS pin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pins_user_email ON pins(user_email);
CREATE INDEX IF NOT EXISTS idx_pins_pin_type ON pins(pin_type);
CREATE INDEX IF NOT EXISTS idx_pins_location ON pins(lat, lng);
CREATE INDEX IF NOT EXISTS idx_pin_comments_pin_id ON pin_comments(pin_id);

-- Enable RLS
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pins
DROP POLICY IF EXISTS "Allow read all pins" ON pins;
DROP POLICY IF EXISTS "Allow insert pins" ON pins;
DROP POLICY IF EXISTS "Allow update own pins" ON pins;
DROP POLICY IF EXISTS "Allow delete own pins" ON pins;

CREATE POLICY "Allow read all pins" ON pins
  FOR SELECT USING (true);

CREATE POLICY "Allow insert pins" ON pins
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own pins" ON pins
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete own pins" ON pins
  FOR DELETE USING (true);

-- RLS Policies for pin_comments
DROP POLICY IF EXISTS "Allow read all comments" ON pin_comments;
DROP POLICY IF EXISTS "Allow insert comments" ON pin_comments;
DROP POLICY IF EXISTS "Allow delete own comments" ON pin_comments;

CREATE POLICY "Allow read all comments" ON pin_comments
  FOR SELECT USING (true);

CREATE POLICY "Allow insert comments" ON pin_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete own comments" ON pin_comments
  FOR DELETE USING (true);

-- Create storage bucket for pin images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pin-images', 'pin-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pin-images bucket
DROP POLICY IF EXISTS "Allow public read access on pin-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to pin-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete own images on pin-images" ON storage.objects;

CREATE POLICY "Allow public read access on pin-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pin-images');

CREATE POLICY "Allow authenticated upload to pin-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pin-images');

CREATE POLICY "Allow delete on pin-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'pin-images');

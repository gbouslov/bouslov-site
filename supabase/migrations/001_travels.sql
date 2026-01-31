-- Create travels table
CREATE TABLE IF NOT EXISTS travels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_email, country_code)
);

-- Create states_visited table
CREATE TABLE IF NOT EXISTS states_visited (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  state_code TEXT NOT NULL,
  state_name TEXT NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, state_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_travels_user_email ON travels(user_email);
CREATE INDEX IF NOT EXISTS idx_travels_country_code ON travels(country_code);
CREATE INDEX IF NOT EXISTS idx_states_user_email ON states_visited(user_email);

-- Enable RLS
ALTER TABLE travels ENABLE ROW LEVEL SECURITY;
ALTER TABLE states_visited ENABLE ROW LEVEL SECURITY;

-- RLS Policies for travels (allow authenticated users to read all, write own)
CREATE POLICY "Allow read all travels" ON travels
  FOR SELECT USING (true);

CREATE POLICY "Allow insert own travels" ON travels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete own travels" ON travels
  FOR DELETE USING (true);

-- RLS Policies for states_visited
CREATE POLICY "Allow read all states" ON states_visited
  FOR SELECT USING (true);

CREATE POLICY "Allow insert own states" ON states_visited
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete own states" ON states_visited
  FOR DELETE USING (true);

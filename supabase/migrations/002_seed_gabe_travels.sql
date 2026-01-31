-- Seed Gabe's travel data (54 destinations)
-- gbouslov@gmail.com

-- Europe (28 countries + Monaco + Vatican)
INSERT INTO travels (user_email, country_code, country_name) VALUES
  ('gbouslov@gmail.com', 'IS', 'Iceland'),
  ('gbouslov@gmail.com', 'PT', 'Portugal'),
  ('gbouslov@gmail.com', 'ES', 'Spain'),
  ('gbouslov@gmail.com', 'FR', 'France'),
  ('gbouslov@gmail.com', 'BE', 'Belgium'),
  ('gbouslov@gmail.com', 'NL', 'Netherlands'),
  ('gbouslov@gmail.com', 'LU', 'Luxembourg'),
  ('gbouslov@gmail.com', 'GB', 'United Kingdom'),
  ('gbouslov@gmail.com', 'DE', 'Germany'),
  ('gbouslov@gmail.com', 'AT', 'Austria'),
  ('gbouslov@gmail.com', 'CZ', 'Czech Republic'),
  ('gbouslov@gmail.com', 'PL', 'Poland'),
  ('gbouslov@gmail.com', 'HU', 'Hungary'),
  ('gbouslov@gmail.com', 'IT', 'Italy'),
  ('gbouslov@gmail.com', 'MC', 'Monaco'),
  ('gbouslov@gmail.com', 'MT', 'Malta'),
  ('gbouslov@gmail.com', 'GR', 'Greece'),
  ('gbouslov@gmail.com', 'VA', 'Vatican City'),
  ('gbouslov@gmail.com', 'SI', 'Slovenia'),
  ('gbouslov@gmail.com', 'HR', 'Croatia'),
  ('gbouslov@gmail.com', 'BA', 'Bosnia and Herzegovina'),
  ('gbouslov@gmail.com', 'ME', 'Montenegro'),
  ('gbouslov@gmail.com', 'RS', 'Serbia'),
  ('gbouslov@gmail.com', 'XK', 'Kosovo'),
  ('gbouslov@gmail.com', 'MK', 'North Macedonia'),
  ('gbouslov@gmail.com', 'AL', 'Albania'),
  ('gbouslov@gmail.com', 'BG', 'Bulgaria'),
  ('gbouslov@gmail.com', 'RU', 'Russia')
ON CONFLICT (user_email, country_code) DO NOTHING;

-- North America & Caribbean (6)
INSERT INTO travels (user_email, country_code, country_name) VALUES
  ('gbouslov@gmail.com', 'US', 'United States'),
  ('gbouslov@gmail.com', 'CA', 'Canada'),
  ('gbouslov@gmail.com', 'MX', 'Mexico'),
  ('gbouslov@gmail.com', 'BZ', 'Belize'),
  ('gbouslov@gmail.com', 'BS', 'Bahamas'),
  ('gbouslov@gmail.com', 'DO', 'Dominican Republic')
ON CONFLICT (user_email, country_code) DO NOTHING;

-- Central America (6)
INSERT INTO travels (user_email, country_code, country_name) VALUES
  ('gbouslov@gmail.com', 'GT', 'Guatemala'),
  ('gbouslov@gmail.com', 'HN', 'Honduras'),
  ('gbouslov@gmail.com', 'SV', 'El Salvador'),
  ('gbouslov@gmail.com', 'NI', 'Nicaragua'),
  ('gbouslov@gmail.com', 'CR', 'Costa Rica'),
  ('gbouslov@gmail.com', 'PA', 'Panama')
ON CONFLICT (user_email, country_code) DO NOTHING;

-- South America (3)
INSERT INTO travels (user_email, country_code, country_name) VALUES
  ('gbouslov@gmail.com', 'CO', 'Colombia'),
  ('gbouslov@gmail.com', 'EC', 'Ecuador'),
  ('gbouslov@gmail.com', 'PE', 'Peru')
ON CONFLICT (user_email, country_code) DO NOTHING;

-- Africa (3)
INSERT INTO travels (user_email, country_code, country_name) VALUES
  ('gbouslov@gmail.com', 'BW', 'Botswana'),
  ('gbouslov@gmail.com', 'ZA', 'South Africa'),
  ('gbouslov@gmail.com', 'ZW', 'Zimbabwe')
ON CONFLICT (user_email, country_code) DO NOTHING;

-- Asia/Middle East (5)
INSERT INTO travels (user_email, country_code, country_name) VALUES
  ('gbouslov@gmail.com', 'IL', 'Israel'),
  ('gbouslov@gmail.com', 'TR', 'Turkey'),
  ('gbouslov@gmail.com', 'QA', 'Qatar'),
  ('gbouslov@gmail.com', 'TH', 'Thailand'),
  ('gbouslov@gmail.com', 'VN', 'Vietnam')
ON CONFLICT (user_email, country_code) DO NOTHING;

-- Special territories (1)
INSERT INTO travels (user_email, country_code, country_name) VALUES
  ('gbouslov@gmail.com', 'HK', 'Hong Kong')
ON CONFLICT (user_email, country_code) DO NOTHING;

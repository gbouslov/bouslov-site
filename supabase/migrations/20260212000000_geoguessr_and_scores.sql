-- Add GeoGuessr category
INSERT INTO categories (slug, name, description, icon, unit, higher_is_better, api_source, external_url) VALUES
  ('geoguessr', 'GeoGuessr', 'GeoGuessr competitive ELO rating', 'Compass', 'ELO', true, null, 'https://www.geoguessr.com')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  unit = EXCLUDED.unit,
  higher_is_better = EXCLUDED.higher_is_better,
  external_url = EXCLUDED.external_url;

-- Insert ACT scores
INSERT INTO scores (user_email, user_name, category_id, value, source)
SELECT 'gbouslov@gmail.com', 'Gabe', id, 35, 'manual' FROM categories WHERE slug = 'act_score';

INSERT INTO scores (user_email, user_name, category_id, value, source)
SELECT 'dbouslov@gmail.com', 'David', id, 34, 'manual' FROM categories WHERE slug = 'act_score';

INSERT INTO scores (user_email, user_name, category_id, value, source)
SELECT 'bouslovd@gmail.com', 'Daniel', id, 31, 'manual' FROM categories WHERE slug = 'act_score';

INSERT INTO scores (user_email, user_name, category_id, value, source)
SELECT 'jbouslov@gmail.com', 'Jonathan', id, 28, 'manual' FROM categories WHERE slug = 'act_score';

-- Insert GeoGuessr score for Gabe
INSERT INTO scores (user_email, user_name, category_id, value, source)
SELECT 'gbouslov@gmail.com', 'Gabe', id, 1007, 'manual' FROM categories WHERE slug = 'geoguessr';

-- Add ACT and SAT score categories
INSERT INTO categories (slug, name, description, icon, unit, higher_is_better, api_source, external_url) VALUES
  ('act_score', 'ACT Score', 'ACT standardized test composite score', 'GraduationCap', 'points', true, null, null),
  ('sat_score', 'SAT Score', 'SAT standardized test score', 'GraduationCap', 'points', true, null, null)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  unit = EXCLUDED.unit,
  higher_is_better = EXCLUDED.higher_is_better;

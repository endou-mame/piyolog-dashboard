-- Seed data for development and testing
-- Sample Piyolog records

INSERT INTO piyolog_records (timestamp, activity_type, duration_minutes, quantity_ml, notes, imported_at, imported_filename) VALUES
  ('2025-01-15T08:00:00Z', 'feeding', NULL, 120, 'Morning feeding', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-15T09:30:00Z', 'sleeping', 90, NULL, 'Morning nap', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-15T12:00:00Z', 'feeding', NULL, 100, NULL, '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-15T13:00:00Z', 'diaper', NULL, NULL, 'Wet diaper', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-15T14:30:00Z', 'sleeping', 120, NULL, 'Afternoon nap', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-15T17:00:00Z', 'feeding', NULL, 110, NULL, '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-15T19:30:00Z', 'bath', 15, NULL, 'Evening bath', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-15T20:00:00Z', 'feeding', NULL, 130, 'Before bed', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-15T20:30:00Z', 'sleeping', 600, NULL, 'Night sleep', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),

  ('2025-01-16T06:00:00Z', 'feeding', NULL, 140, 'Early morning', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-16T07:30:00Z', 'diaper', NULL, NULL, 'Morning change', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-16T09:00:00Z', 'feeding', NULL, 120, NULL, '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-16T10:00:00Z', 'sleeping', 75, NULL, 'Short nap', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-16T12:30:00Z', 'feeding', NULL, 110, NULL, '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-16T14:00:00Z', 'walk', 30, NULL, 'Afternoon walk', '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv'),
  ('2025-01-16T15:30:00Z', 'sleeping', 90, NULL, NULL, '2025-01-16T10:00:00Z', 'piyolog_export_2025_01.csv');
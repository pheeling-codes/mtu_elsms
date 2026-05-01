-- Seed data for seats and zones
-- Run this in your Supabase SQL Editor after creating the admin dashboard

-- Insert zones (if not exists)
INSERT INTO public.zones (id, name, description, color) VALUES
  ('quiet', 'Quiet Zone', 'Silent study area for focused work', '#10b981'),
  ('group', 'Group Study', 'Collaborative spaces for team work', '#3b82f6'),
  ('charging', 'Charging Hub', 'Seats with power outlets', '#f59e0b')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color;

-- Insert sample seats (if not exists)
-- Quiet Zone seats
INSERT INTO public.seats (id, name, zone_id, status, features, x, y) VALUES
  ('a1', 'A1', 'quiet', 'AVAILABLE', ARRAY['Power Outlet', 'Window View'], 100, 100),
  ('a2', 'A2', 'quiet', 'AVAILABLE', ARRAY['Power Outlet'], 160, 100),
  ('a3', 'A3', 'quiet', 'OCCUPIED', ARRAY['Window View'], 220, 100),
  ('a4', 'A4', 'quiet', 'AVAILABLE', ARRAY['Ergonomic Chair'], 280, 100),
  ('b1', 'B1', 'quiet', 'RESERVED', ARRAY['Power Outlet', 'Ergonomic Chair'], 100, 160),
  ('b2', 'B2', 'quiet', 'AVAILABLE', ARRAY['Power Outlet'], 160, 160)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  zone_id = EXCLUDED.zone_id,
  status = EXCLUDED.status,
  features = EXCLUDED.features,
  x = EXCLUDED.x,
  y = EXCLUDED.y;

-- Group Study seats
INSERT INTO public.seats (id, name, zone_id, status, features, x, y) VALUES
  ('g1', 'G1', 'group', 'AVAILABLE', ARRAY['Power Outlet', 'Window View', 'Dual Monitors'], 400, 100),
  ('g2', 'G2', 'group', 'AVAILABLE', ARRAY['Power Outlet', 'Dual Monitors'], 460, 100),
  ('g3', 'G3', 'group', 'OCCUPIED', ARRAY['Window View', 'Whiteboard'], 400, 160),
  ('g4', 'G4', 'group', 'AVAILABLE', ARRAY['Power Outlet', 'Whiteboard'], 460, 160)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  zone_id = EXCLUDED.zone_id,
  status = EXCLUDED.status,
  features = EXCLUDED.features,
  x = EXCLUDED.x,
  y = EXCLUDED.y;

-- Verify data
SELECT 'Zones:' as info;
SELECT * FROM public.zones;

SELECT 'Seats:' as info;
SELECT * FROM public.seats ORDER BY name;

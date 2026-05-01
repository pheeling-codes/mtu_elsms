-- Update existing seats with coordinates and features
-- Run this in your Supabase SQL Editor

-- Add columns if not exist
ALTER TABLE public.seats
ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}'::TEXT[];

-- First, clear existing seats to avoid conflicts
DELETE FROM public.seats WHERE id IN ('a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'g1', 'g2', 'g3', 'g4');

-- Insert seats with proper coordinates
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  -- Quiet Zone (top left area: x=100-280, y=100-160)
  ('a1', 'quiet', 101, 'AVAILABLE', 100, 100, ARRAY['Power Outlet'], now(), now()),
  ('a2', 'quiet', 102, 'AVAILABLE', 160, 100, ARRAY['Window View'], now(), now()),
  ('a3', 'quiet', 103, 'OCCUPIED', 220, 100, ARRAY['Ergonomic Chair'], now(), now()),
  ('a4', 'quiet', 104, 'AVAILABLE', 280, 100, ARRAY['Power Outlet'], now(), now()),
  ('b1', 'quiet', 105, 'RESERVED', 100, 160, ARRAY['Window View', 'Ergonomic Chair'], now(), now()),
  ('b2', 'quiet', 106, 'AVAILABLE', 160, 160, ARRAY['Power Outlet'], now(), now()),
  -- Group Zone (middle right area: x=400-500, y=100-200)
  ('g1', 'group', 201, 'AVAILABLE', 400, 100, ARRAY['Whiteboard'], now(), now()),
  ('g2', 'group', 202, 'AVAILABLE', 460, 100, ARRAY['Dual Monitors'], now(), now()),
  ('g3', 'group', 203, 'OCCUPIED', 400, 160, ARRAY['Whiteboard', 'Window View'], now(), now()),
  ('g4', 'group', 204, 'AVAILABLE', 460, 160, ARRAY['Power Outlet'], now(), now());

-- Verify
SELECT s.id, s."seatNumber", z.name as zone, s.status, s.x, s.y, s.features 
FROM public.seats s
JOIN public.zones z ON s."zoneId" = z.id
ORDER BY z.name, s."seatNumber";

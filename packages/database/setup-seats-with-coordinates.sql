-- Complete setup: Zones and Seats with proper coordinates
-- Run this in your Supabase SQL Editor

-- ==========================================
-- Step 1: Create/Update Zones
-- ==========================================
INSERT INTO public.zones (id, name, type, "createdAt", "updatedAt") VALUES
  ('quiet', 'Quiet Zone', 'QUIET', now(), now()),
  ('group', 'Group Study', 'GROUP', now(), now()),
  ('charging', 'Charging Hub', 'CHARGING', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  "updatedAt" = now();

-- ==========================================
-- Step 2: Add coordinate columns if missing
-- ==========================================
ALTER TABLE public.seats
ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}'::TEXT[];

-- ==========================================
-- Step 3: Insert/Update Seats with Coordinates
-- ==========================================
-- Quiet Zone seats (top left area: x=100-280, y=100-160)
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('a1', 'quiet', 1, 'AVAILABLE', 100, 100, ARRAY['Power Outlet'], now(), now()),
  ('a2', 'quiet', 2, 'AVAILABLE', 160, 100, ARRAY['Window View'], now(), now()),
  ('a3', 'quiet', 3, 'OCCUPIED', 220, 100, ARRAY['Ergonomic Chair'], now(), now()),
  ('a4', 'quiet', 4, 'AVAILABLE', 280, 100, ARRAY['Power Outlet'], now(), now()),
  ('b1', 'quiet', 5, 'RESERVED', 100, 160, ARRAY['Window View', 'Ergonomic Chair'], now(), now()),
  ('b2', 'quiet', 6, 'AVAILABLE', 160, 160, ARRAY['Power Outlet'], now(), now())
ON CONFLICT (id) DO UPDATE SET
  "zoneId" = EXCLUDED."zoneId",
  "seatNumber" = EXCLUDED."seatNumber",
  status = EXCLUDED.status,
  x = EXCLUDED.x,
  y = EXCLUDED.y,
  features = EXCLUDED.features,
  "updatedAt" = now();

-- Group Zone seats (middle right area: x=400-500, y=100-200)
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('g1', 'group', 1, 'AVAILABLE', 400, 100, ARRAY['Whiteboard', 'Power Outlet'], now(), now()),
  ('g2', 'group', 2, 'AVAILABLE', 460, 100, ARRAY['Dual Monitors'], now(), now()),
  ('g3', 'group', 3, 'OCCUPIED', 400, 160, ARRAY['Whiteboard', 'Window View'], now(), now()),
  ('g4', 'group', 4, 'AVAILABLE', 460, 160, ARRAY['Power Outlet', 'Dual Monitors'], now(), now())
ON CONFLICT (id) DO UPDATE SET
  "zoneId" = EXCLUDED."zoneId",
  "seatNumber" = EXCLUDED."seatNumber",
  status = EXCLUDED.status,
  x = EXCLUDED.x,
  y = EXCLUDED.y,
  features = EXCLUDED.features,
  "updatedAt" = now();

-- Charging Zone seats (bottom area: x=100-600, y=350-500)
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('c1', 'charging', 1, 'AVAILABLE', 100, 350, ARRAY['Power Outlet', 'USB Ports'], now(), now()),
  ('c2', 'charging', 2, 'AVAILABLE', 200, 350, ARRAY['Power Outlet', 'Ergonomic Chair'], now(), now()),
  ('c3', 'charging', 3, 'RESERVED', 300, 350, ARRAY['Power Outlet', 'Window View'], now(), now()),
  ('c4', 'charging', 4, 'AVAILABLE', 400, 350, ARRAY['Power Outlet', 'Dual Monitors'], now(), now()),
  ('c5', 'charging', 5, 'OCCUPIED', 500, 350, ARRAY['Power Outlet'], now(), now()),
  ('c6', 'charging', 6, 'AVAILABLE', 150, 450, ARRAY['Power Outlet', 'USB Ports'], now(), now()),
  ('c7', 'charging', 7, 'AVAILABLE', 350, 450, ARRAY['Power Outlet'], now(), now())
ON CONFLICT (id) DO UPDATE SET
  "zoneId" = EXCLUDED."zoneId",
  "seatNumber" = EXCLUDED."seatNumber",
  status = EXCLUDED.status,
  x = EXCLUDED.x,
  y = EXCLUDED.y,
  features = EXCLUDED.features,
  "updatedAt" = now();

-- ==========================================
-- Step 4: Verify Setup
-- ==========================================
SELECT 'ZONES:' as info;
SELECT id, name, type FROM public.zones ORDER BY name;

SELECT 'SEATS BY ZONE:' as info;
SELECT s.id, s."seatNumber", z.name as zone, s.status, s.x, s.y, s.features 
FROM public.seats s
JOIN public.zones z ON s."zoneId" = z.id
ORDER BY z.name, s."seatNumber";

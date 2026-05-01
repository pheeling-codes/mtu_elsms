-- ==========================================
-- COMPLETE FIX: Zones, Seats, RLS, and Enum
-- Run this entire script in Supabase SQL Editor
-- ==========================================

-- Step 1: Add CHARGING to ZoneType enum (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CHARGING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ZoneType')
    ) THEN
        ALTER TYPE "ZoneType" ADD VALUE 'CHARGING';
    END IF;
END $$;

-- Step 2: Insert all zones
INSERT INTO public.zones (id, name, type, "createdAt", "updatedAt") VALUES
  ('quiet', 'Quiet Zone', 'QUIET', now(), now()),
  ('group', 'Group Study', 'GROUP', now(), now()),
  ('charging', 'Charging Hub', 'CHARGING', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  "updatedAt" = now();

-- Step 3: Add coordinate columns to seats
ALTER TABLE public.seats
ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}'::TEXT[];

-- Step 4: Delete old demo seats
DELETE FROM public.seats WHERE id IN ('seat-001', 'seat-002', 'seat-003', 'seat-004', 'seat-101', 'seat-102');

-- Step 5: Insert seats with proper zone coordinates

-- Quiet Zone (top left: x=50-300, y=50-200)
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('q1', 'quiet', 1, 'AVAILABLE', 80, 80, ARRAY['Power Outlet'], now(), now()),
  ('q2', 'quiet', 2, 'AVAILABLE', 140, 80, ARRAY['Window View'], now(), now()),
  ('q3', 'quiet', 3, 'OCCUPIED', 200, 80, ARRAY['Ergonomic Chair'], now(), now()),
  ('q4', 'quiet', 4, 'AVAILABLE', 260, 80, ARRAY['Power Outlet'], now(), now()),
  ('q5', 'quiet', 5, 'RESERVED', 80, 140, ARRAY['Window View'], now(), now()),
  ('q6', 'quiet', 6, 'AVAILABLE', 140, 140, ARRAY['Power Outlet'], now(), now())
ON CONFLICT (id) DO UPDATE SET
  "zoneId" = EXCLUDED."zoneId",
  "seatNumber" = EXCLUDED."seatNumber",
  status = EXCLUDED.status,
  x = EXCLUDED.x,
  y = EXCLUDED.y,
  features = EXCLUDED.features,
  "updatedAt" = now();

-- Group Zone (middle right: x=400-600, y=50-200)
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('grp1', 'group', 1, 'AVAILABLE', 430, 80, ARRAY['Whiteboard'], now(), now()),
  ('grp2', 'group', 2, 'AVAILABLE', 490, 80, ARRAY['Dual Monitors'], now(), now()),
  ('grp3', 'group', 3, 'OCCUPIED', 550, 80, ARRAY['Whiteboard', 'Window View'], now(), now()),
  ('grp4', 'group', 4, 'AVAILABLE', 430, 140, ARRAY['Power Outlet'], now(), now()),
  ('grp5', 'group', 5, 'AVAILABLE', 490, 140, ARRAY['Dual Monitors'], now(), now())
ON CONFLICT (id) DO UPDATE SET
  "zoneId" = EXCLUDED."zoneId",
  "seatNumber" = EXCLUDED."seatNumber",
  status = EXCLUDED.status,
  x = EXCLUDED.x,
  y = EXCLUDED.y,
  features = EXCLUDED.features,
  "updatedAt" = now();

-- Charging Zone (bottom: x=50-600, y=300-500)
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('ch1', 'charging', 1, 'AVAILABLE', 80, 350, ARRAY['Power Outlet', 'USB Ports'], now(), now()),
  ('ch2', 'charging', 2, 'AVAILABLE', 160, 350, ARRAY['Power Outlet'], now(), now()),
  ('ch3', 'charging', 3, 'RESERVED', 240, 350, ARRAY['Power Outlet', 'Window View'], now(), now()),
  ('ch4', 'charging', 4, 'AVAILABLE', 320, 350, ARRAY['Power Outlet', 'Dual Monitors'], now(), now()),
  ('ch5', 'charging', 5, 'OCCUPIED', 400, 350, ARRAY['Power Outlet'], now(), now()),
  ('ch6', 'charging', 6, 'AVAILABLE', 120, 420, ARRAY['Power Outlet', 'USB Ports'], now(), now()),
  ('ch7', 'charging', 7, 'AVAILABLE', 280, 420, ARRAY['Power Outlet'], now(), now())
ON CONFLICT (id) DO UPDATE SET
  "zoneId" = EXCLUDED."zoneId",
  "seatNumber" = EXCLUDED."seatNumber",
  status = EXCLUDED.status,
  x = EXCLUDED.x,
  y = EXCLUDED.y,
  features = EXCLUDED.features,
  "updatedAt" = now();

-- Step 6: Fix RLS for seats and zones
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read seats" ON public.seats;
CREATE POLICY "Allow public read seats"
  ON public.seats FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS "Allow public read zones" ON public.zones;
CREATE POLICY "Allow public read zones"
  ON public.zones FOR SELECT TO PUBLIC USING (true);

GRANT SELECT ON public.seats TO anon, authenticated;
GRANT SELECT ON public.zones TO anon, authenticated;

-- Step 7: Verify
SELECT z.name as zone, COUNT(s.id) as seat_count 
FROM public.zones z
LEFT JOIN public.seats s ON s."zoneId" = z.id
GROUP BY z.name
ORDER BY z.name;

-- STEP 2: Run this AFTER step1 completes successfully
-- Insert zones and seats with coordinates

-- Insert all zones
INSERT INTO public.zones (id, name, type, "createdAt", "updatedAt") VALUES
  ('quiet', 'Quiet Zone', 'QUIET', now(), now()),
  ('group', 'Group Study', 'GROUP', now(), now()),
  ('charging', 'Charging Hub', 'CHARGING', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  "updatedAt" = now();

-- Add coordinate columns
ALTER TABLE public.seats
ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}'::TEXT[];

-- Delete old demo seats
DELETE FROM public.seats WHERE id IN ('seat-001', 'seat-002', 'seat-003', 'seat-004', 'seat-101', 'seat-102', 'a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'g1', 'g2', 'g3', 'g4', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7');

-- Quiet Zone (top left: x=50-300, y=50-200)
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('q1', 'quiet', 101, 'AVAILABLE', 80, 80, ARRAY['Power Outlet'], now(), now()),
  ('q2', 'quiet', 102, 'AVAILABLE', 140, 80, ARRAY['Window View'], now(), now()),
  ('q3', 'quiet', 103, 'OCCUPIED', 200, 80, ARRAY['Ergonomic Chair'], now(), now()),
  ('q4', 'quiet', 104, 'AVAILABLE', 260, 80, ARRAY['Power Outlet'], now(), now()),
  ('q5', 'quiet', 105, 'RESERVED', 80, 140, ARRAY['Window View'], now(), now()),
  ('q6', 'quiet', 106, 'AVAILABLE', 140, 140, ARRAY['Power Outlet'], now(), now());

-- Group Zone (middle right: x=400-600, y=50-200)
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('grp1', 'group', 201, 'AVAILABLE', 430, 80, ARRAY['Whiteboard'], now(), now()),
  ('grp2', 'group', 202, 'AVAILABLE', 490, 80, ARRAY['Dual Monitors'], now(), now()),
  ('grp3', 'group', 203, 'OCCUPIED', 550, 80, ARRAY['Whiteboard'], now(), now()),
  ('grp4', 'group', 204, 'AVAILABLE', 430, 140, ARRAY['Power Outlet'], now(), now()),
  ('grp5', 'group', 205, 'AVAILABLE', 490, 140, ARRAY['Dual Monitors'], now(), now());

-- Charging Zone (bottom: x=50-600, y=300-500)
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('ch1', 'charging', 301, 'AVAILABLE', 80, 350, ARRAY['Power Outlet', 'USB Ports'], now(), now()),
  ('ch2', 'charging', 302, 'AVAILABLE', 160, 350, ARRAY['Power Outlet'], now(), now()),
  ('ch3', 'charging', 303, 'RESERVED', 240, 350, ARRAY['Power Outlet'], now(), now()),
  ('ch4', 'charging', 304, 'AVAILABLE', 320, 350, ARRAY['Power Outlet'], now(), now()),
  ('ch5', 'charging', 305, 'OCCUPIED', 400, 350, ARRAY['Power Outlet'], now(), now()),
  ('ch6', 'charging', 306, 'AVAILABLE', 120, 420, ARRAY['Power Outlet'], now(), now()),
  ('ch7', 'charging', 307, 'AVAILABLE', 280, 420, ARRAY['Power Outlet'], now(), now());

-- Fix RLS
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read seats" ON public.seats;
CREATE POLICY "Allow public read seats" ON public.seats FOR SELECT TO PUBLIC USING (true);
DROP POLICY IF EXISTS "Allow public read zones" ON public.zones;
CREATE POLICY "Allow public read zones" ON public.zones FOR SELECT TO PUBLIC USING (true);
GRANT SELECT ON public.seats TO anon, authenticated;
GRANT SELECT ON public.zones TO anon, authenticated;

-- Verify
SELECT z.name as zone, COUNT(s.id) as seat_count 
FROM public.zones z
LEFT JOIN public.seats s ON s."zoneId" = z.id
GROUP BY z.name
ORDER BY z.name;

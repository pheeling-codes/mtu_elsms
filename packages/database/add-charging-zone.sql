-- Add CHARGING zone type and populate charging zone
-- Run this in your Supabase SQL Editor

-- Step 1: Add CHARGING to ZoneType enum
ALTER TYPE "ZoneType" ADD VALUE 'CHARGING';

-- Step 2: Insert Charging Zone
INSERT INTO public.zones (id, name, type, "createdAt", "updatedAt") VALUES
  ('charging', 'Charging Hub', 'CHARGING', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  "updatedAt" = now();

-- Step 3: Add Charging Zone seats (bottom area)
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('c1', 'charging', 301, 'AVAILABLE', 100, 350, ARRAY['Power Outlet', 'USB Ports'], now(), now()),
  ('c2', 'charging', 302, 'AVAILABLE', 200, 350, ARRAY['Power Outlet', 'Ergonomic Chair'], now(), now()),
  ('c3', 'charging', 303, 'RESERVED', 300, 350, ARRAY['Power Outlet', 'Window View'], now(), now()),
  ('c4', 'charging', 304, 'AVAILABLE', 400, 350, ARRAY['Power Outlet', 'Dual Monitors'], now(), now()),
  ('c5', 'charging', 305, 'OCCUPIED', 500, 350, ARRAY['Power Outlet'], now(), now()),
  ('c6', 'charging', 306, 'AVAILABLE', 150, 450, ARRAY['Power Outlet', 'USB Ports'], now(), now()),
  ('c7', 'charging', 307, 'AVAILABLE', 350, 450, ARRAY['Power Outlet'], now(), now())
ON CONFLICT (id) DO UPDATE SET
  "zoneId" = EXCLUDED."zoneId",
  "seatNumber" = EXCLUDED."seatNumber",
  status = EXCLUDED.status,
  x = EXCLUDED.x,
  y = EXCLUDED.y,
  features = EXCLUDED.features,
  "updatedAt" = now();

-- Verify
SELECT z.name as zone, COUNT(s.id) as seat_count 
FROM public.zones z
LEFT JOIN public.seats s ON s."zoneId" = z.id
GROUP BY z.name;

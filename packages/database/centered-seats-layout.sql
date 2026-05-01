-- Update seats with centered coordinates within each zone canvas
-- Zone canvases: Quiet (left), Group (middle), Charging (right) - each ~300px wide

-- First, clear and reset seats with proper centered layout
DELETE FROM public.seats WHERE id IN ('q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'grp1', 'grp2', 'grp3', 'grp4', 'grp5', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7');

-- QUIET ZONE - Left canvas (x: 50-350), centered arrangement
-- 2 rows, 3 seats each, centered in zone
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('q1', 'quiet', 101, 'AVAILABLE', 120, 100, ARRAY['Power Outlet'], now(), now()),
  ('q2', 'quiet', 102, 'AVAILABLE', 200, 100, ARRAY['Window View'], now(), now()),
  ('q3', 'quiet', 103, 'OCCUPIED', 280, 100, ARRAY['Ergonomic Chair'], now(), now()),
  ('q4', 'quiet', 104, 'AVAILABLE', 120, 180, ARRAY['Power Outlet'], now(), now()),
  ('q5', 'quiet', 105, 'RESERVED', 200, 180, ARRAY['Window View'], now(), now()),
  ('q6', 'quiet', 106, 'AVAILABLE', 280, 180, ARRAY['Ergonomic Chair'], now(), now());

-- GROUP ZONE - Middle canvas (x: 400-700), centered arrangement
-- 2 rows, 3 seats each, centered in zone
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('grp1', 'group', 201, 'AVAILABLE', 470, 100, ARRAY['Whiteboard'], now(), now()),
  ('grp2', 'group', 202, 'AVAILABLE', 550, 100, ARRAY['Dual Monitors'], now(), now()),
  ('grp3', 'group', 203, 'OCCUPIED', 630, 100, ARRAY['Whiteboard', 'Window View'], now(), now()),
  ('grp4', 'group', 204, 'AVAILABLE', 470, 180, ARRAY['Power Outlet'], now(), now()),
  ('grp5', 'group', 205, 'AVAILABLE', 550, 180, ARRAY['Dual Monitors'], now(), now()),
  ('grp6', 'group', 206, 'RESERVED', 630, 180, ARRAY['Whiteboard'], now(), now());

-- CHARGING ZONE - Right canvas (x: 750-1050), centered arrangement
-- 3 rows, 3 seats each, centered in zone
INSERT INTO public.seats (id, "zoneId", "seatNumber", status, x, y, features, "createdAt", "updatedAt") VALUES
  ('ch1', 'charging', 301, 'AVAILABLE', 820, 80, ARRAY['Power Outlet', 'USB Ports'], now(), now()),
  ('ch2', 'charging', 302, 'AVAILABLE', 900, 80, ARRAY['Power Outlet'], now(), now()),
  ('ch3', 'charging', 303, 'RESERVED', 980, 80, ARRAY['Power Outlet', 'Window View'], now(), now()),
  ('ch4', 'charging', 304, 'AVAILABLE', 820, 160, ARRAY['Power Outlet'], now(), now()),
  ('ch5', 'charging', 305, 'OCCUPIED', 900, 160, ARRAY['Power Outlet', 'USB Ports'], now(), now()),
  ('ch6', 'charging', 306, 'AVAILABLE', 980, 160, ARRAY['Power Outlet'], now(), now()),
  ('ch7', 'charging', 307, 'AVAILABLE', 820, 240, ARRAY['Power Outlet'], now(), now()),
  ('ch8', 'charging', 308, 'AVAILABLE', 900, 240, ARRAY['Power Outlet'], now(), now()),
  ('ch9', 'charging', 309, 'AVAILABLE', 980, 240, ARRAY['Power Outlet', 'USB Ports'], now(), now());

-- Verify layout
SELECT "zoneId", COUNT(*) as seat_count, 
       MIN(x) as min_x, MAX(x) as max_x,
       MIN(y) as min_y, MAX(y) as max_y
FROM public.seats 
WHERE id IN ('q1','q2','q3','q4','q5','q6','grp1','grp2','grp3','grp4','grp5','grp6','ch1','ch2','ch3','ch4','ch5','ch6','ch7','ch8','ch9')
GROUP BY "zoneId"
ORDER BY "zoneId";

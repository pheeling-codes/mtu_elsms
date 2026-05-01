-- Fix RLS for seats table so students can view seats
-- Run this in your Supabase SQL Editor

-- Enable RLS on seats table
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON public.seats;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.seats;

-- Policy: Allow anyone to view seats (public read)
CREATE POLICY "Allow public read access"
  ON public.seats FOR SELECT
  TO PUBLIC
  USING (true);

-- Policy: Allow admin full access (for future admin dashboard)
DROP POLICY IF EXISTS "Allow admin full access" ON public.seats;
CREATE POLICY "Allow admin full access"
  ON public.seats FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.seats TO anon;
GRANT SELECT ON public.seats TO authenticated;
GRANT ALL ON public.seats TO service_role;

-- Also fix zones RLS
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read zones" ON public.zones;
CREATE POLICY "Allow public read zones"
  ON public.zones FOR SELECT
  TO PUBLIC
  USING (true);

GRANT SELECT ON public.zones TO anon;
GRANT SELECT ON public.zones TO authenticated;

-- Verify
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('seats', 'zones');

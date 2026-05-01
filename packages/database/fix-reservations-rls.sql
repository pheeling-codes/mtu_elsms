-- Fix RLS policies for reservations table
-- Run this in your Supabase SQL Editor

-- Enable RLS on reservations table
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow service role full access" ON public.reservations;

-- Policy 1: Users can insert their own reservations
CREATE POLICY "Users can insert own reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- Policy 2: Users can view their own reservations
CREATE POLICY "Users can view own reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid()::text = "userId");

-- Policy 3: Users can update their own reservations (for cancel/check-in)
CREATE POLICY "Users can update own reservations"
  ON public.reservations FOR UPDATE
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- Policy 4: Service role can do anything
CREATE POLICY "Allow service role full access"
  ON public.reservations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.reservations TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.reservations TO authenticated;

-- Verify policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'reservations';

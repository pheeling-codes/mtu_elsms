-- Force PostgREST schema cache refresh by temporarily disabling and re-enabling RLS
-- This is a more significant schema change that will trigger PostgREST to rebuild its cache

-- Temporarily disable RLS on reservations table
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- Immediately re-enable RLS on reservations table
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename = 'reservations';

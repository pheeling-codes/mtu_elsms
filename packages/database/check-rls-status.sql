-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('reservations', 'users', 'seats', 'zones')
ORDER BY tablename, policyname;

-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('reservations', 'users', 'seats', 'zones');

-- Check current reservations data
SELECT id, userid, seatid, zoneid, starttime, endtime, status 
FROM reservations 
ORDER BY createdat DESC 
LIMIT 5;

-- Check if there are any reservations
SELECT COUNT(*) as total_reservations FROM reservations;

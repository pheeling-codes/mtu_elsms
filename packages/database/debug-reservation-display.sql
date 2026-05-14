-- Debug reservation display issues

-- Check if RLS policies are actually applied
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'reservations';

-- Check current reservations with all columns
SELECT * FROM reservations ORDER BY createdat DESC LIMIT 5;

-- Check if there are any reservations at all
SELECT COUNT(*) as total_reservations FROM reservations;

-- Check the actual column names in reservations table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'reservations'
ORDER BY ordinal_position;

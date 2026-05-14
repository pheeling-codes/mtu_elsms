-- Check if the current user has ADMIN role
SELECT id, email, role, matricNumber 
FROM users 
WHERE id::text = auth.uid()::text;

-- Check all users and their roles
SELECT id, email, role, matricNumber 
FROM users 
ORDER BY createdat DESC;

-- Check if there are any reservations
SELECT COUNT(*) as total_reservations FROM reservations;

-- Check current RLS policies on reservations
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

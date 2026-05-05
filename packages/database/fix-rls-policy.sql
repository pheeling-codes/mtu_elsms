-- Fix RLS Policy for seats table to allow admin operations
-- Option 1: Disable RLS on seats table (simplest, but less secure)
ALTER TABLE seats DISABLE ROW LEVEL SECURITY;

-- Option 2: Create policy to allow all operations for authenticated users
-- (Use this if you want to keep RLS enabled but allow admin access)
-- CREATE POLICY "Allow all operations for authenticated users" ON seats
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- Option 3: Create specific admin policy (requires admin role check)
-- CREATE POLICY "Allow admin full access" ON seats
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.id = auth.uid() 
--       AND users.role = 'ADMIN'
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.id = auth.uid() 
--       AND users.role = 'ADMIN'
--     )
--   );

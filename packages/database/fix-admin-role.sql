-- Check current user's role
SELECT id, email, role, matricNumber 
FROM users 
WHERE id::text = auth.uid()::text;

-- If the admin user doesn't have ADMIN role, update it
-- Replace 'admin-email@example.com' with the actual admin email
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com';

-- If you don't know the email, you can update by ID
-- Replace 'your-user-id-here' with the actual user ID
-- UPDATE users 
-- SET role = 'ADMIN' 
-- WHERE id = 'your-user-id-here';

-- Verify the update
SELECT id, email, role, matricNumber 
FROM users 
WHERE role = 'ADMIN';

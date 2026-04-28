-- ==========================================
-- COMPLETE SUPABASE FIX FOR SIGNUP SYNC
-- ==========================================

-- Task 3: Drop and recreate trigger with proper error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_matric TEXT;
  v_role TEXT;
BEGIN
  -- Extract metadata with defaults
  v_matric := COALESCE(NEW.raw_user_meta_data->>'matricNumber', 'TEMP-' || substr(NEW.id::text, 1, 8));
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT');
  
  -- Insert with error handling
  BEGIN
    INSERT INTO public.users (id, "matricNumber", role, "createdAt", "updatedAt")
    VALUES (NEW.id, v_matric, v_role, NOW(), NOW());
    
    RAISE NOTICE 'User synced: %, matric: %, role: %', NEW.id, v_matric, v_role;
    
  EXCEPTION WHEN unique_violation THEN
    -- Matric number already exists - update instead
    UPDATE public.users 
    SET "matricNumber" = v_matric || '-' || substr(NEW.id::text, 1, 4),
        role = v_role,
        "updatedAt" = NOW()
    WHERE id = NEW.id;
    
    RAISE NOTICE 'User updated (duplicate matric handled): %', NEW.id;
    
  WHEN OTHERS THEN
    RAISE WARNING 'Sync error for %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger AFTER INSERT (not AFTER INSERT OR UPDATE)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- Task 4: RLS POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Allow trigger to insert" ON public.users;
DROP POLICY IF EXISTS "Allow service role full access" ON public.users;

-- Policy 1: Users can read their own data
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Service role can do anything (for backend operations)
CREATE POLICY "Allow service role full access"
  ON public.users FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- Task 5: GRANT PERMISSIONS
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO service_role;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 
  'Trigger Status' as check_item,
  COUNT(*)::text as result
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
UNION ALL
SELECT 
  'RLS Enabled',
  CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END
FROM pg_class
WHERE relname = 'users';

-- Test: Create a test user to verify trigger works
-- (Run this separately after confirming the above works)
/*
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Simulate what Supabase Auth does
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (test_id, 'test@example.com', '{"role": "STUDENT", "matricNumber": "TEST/001"}'::jsonb);
  
  -- Check if user was created in public.users
  RAISE NOTICE 'Test user created. Check public.users for id: %', test_id;
END $$;
*/

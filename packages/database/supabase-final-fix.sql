-- ==========================================
-- BULLETPROOF SUPABASE SETUP - RUN THIS ENTIRE FILE
-- ==========================================

-- Step 1: Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    "matricNumber" TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create updated_at trigger for users table
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Step 3: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 4: Create bulletproof trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_matric TEXT;
    v_role TEXT;
    v_temp_matric TEXT;
BEGIN
    -- Extract metadata with safe defaults
    v_matric := NEW.raw_user_meta_data->>'matricNumber';
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT');
    
    -- Generate temp matric if none provided
    IF v_matric IS NULL OR v_matric = '' THEN
        v_temp_matric := 'TEMP-' || substr(NEW.id::text, 1, 8);
    ELSE
        v_temp_matric := v_matric;
    END IF;
    
    -- Attempt insert with duplicate handling
    BEGIN
        INSERT INTO public.users (id, "matricNumber", role, "createdAt", "updatedAt")
        VALUES (NEW.id, v_temp_matric, v_role, NOW(), NOW());
        
        RAISE NOTICE '✓ User synced: % (matric: %, role: %)', NEW.id, v_temp_matric, v_role;
        
    EXCEPTION WHEN unique_violation THEN
        -- Handle duplicate matric number
        v_temp_matric := v_temp_matric || '-' || substr(NEW.id::text, 9, 4);
        
        INSERT INTO public.users (id, "matricNumber", role, "createdAt", "updatedAt")
        VALUES (NEW.id, v_temp_matric, v_role, NOW(), NOW());
        
        RAISE NOTICE '⚠ User synced with modified matric: % (matric: %)', NEW.id, v_temp_matric;
        
    WHEN OTHERS THEN
        RAISE WARNING '✗ Sync failed for %: %', NEW.id, SQLERRM;
        -- Still return NEW so auth user is created
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 6: RLS SETUP - Allow trigger to work but protect from direct access

-- First disable RLS to clean up
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Allow service role full access" ON public.users;
DROP POLICY IF EXISTS "Allow trigger function" ON public.users;
DROP POLICY IF EXISTS "Enable read for authenticated" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.users;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy 1: Users can read their own data
CREATE POLICY "Users can read own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own data (limited)
CREATE POLICY "Users can update own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 7: GRANTS - Critical for trigger to work
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Step 8: Fix auth schema permissions (needed for trigger)
GRANT USAGE ON SCHEMA auth TO postgres;

-- Step 9: Verify setup
SELECT '=== SETUP COMPLETE ===' as status;

SELECT 
    'Table exists: ' || COUNT(*)::text as check_users_table
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

SELECT 
    'Trigger exists: ' || COUNT(*)::text as check_trigger
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 
    'RLS enabled: ' || CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END as check_rls
FROM pg_class 
WHERE relname = 'users';

SELECT 
    'Policy count: ' || COUNT(*)::text as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- Step 10: Test the trigger (optional - uncomment to test)
/*
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
BEGIN
    -- Insert test user into auth.users
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (test_id, 'test_trigger@example.com', '{"role": "STUDENT", "matricNumber": "TEST/MATRIC/001"}'::jsonb);
    
    -- Check if user was created in public.users
    PERFORM * FROM public.users WHERE id = test_id;
    IF FOUND THEN
        RAISE NOTICE '✓ TRIGGER TEST PASSED: User % created successfully', test_id;
        -- Cleanup
        DELETE FROM public.users WHERE id = test_id;
        DELETE FROM auth.users WHERE id = test_id;
    ELSE
        RAISE NOTICE '✗ TRIGGER TEST FAILED: User % not found in public.users', test_id;
    END IF;
END $$;
*/

SELECT 'Run the test block (uncomment Step 10) to verify trigger works' as next_step;

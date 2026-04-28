-- Robust trigger with error handling and debugging

-- 1. First, ensure the users table exists with correct structure
-- (Run this only if you need to verify/recreate)
/*
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  matricNumber TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- 2. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Create improved trigger function with exception handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_matric TEXT;
  v_role TEXT;
BEGIN
  -- Debug: Log the incoming data
  RAISE NOTICE 'Trigger called for user: %, metadata: %', NEW.id, NEW.raw_user_meta_data;
  
  -- Extract values with proper defaults
  v_matric := COALESCE(NEW.raw_user_meta_data->>'matricNumber', 'TEMP-' || substr(NEW.id::text, 1, 8));
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT');
  
  RAISE NOTICE 'Extracted matric: %, role: %', v_matric, v_role;
  
  -- Insert with exception handling
  BEGIN
    INSERT INTO public.users (id, matricNumber, role, createdAt, updatedAt)
    VALUES (
      NEW.id,
      v_matric,
      v_role,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      matricNumber = EXCLUDED.matricNumber,
      role = EXCLUDED.role,
      updatedAt = NOW();
      
    RAISE NOTICE 'User sync successful for: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't prevent auth user creation
    RAISE WARNING 'Error syncing user %: %', NEW.id, SQLERRM;
    -- Return NEW anyway so auth.user is still created
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- 6. Disable RLS temporarily to test (re-enable after)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 7. Verify trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 8. Test function manually (optional - run separately)
/*
-- Test with a mock insert
SELECT public.handle_new_user();
*/

SELECT 'Trigger v2 installed - RLS disabled for testing' as status;

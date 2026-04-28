-- Fix: Properly cast types to avoid uuid = text mismatch

-- 1. Create the trigger function with explicit type handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, matricNumber, role, createdAt, updatedAt)
  VALUES (
    NEW.id::uuid,  -- Explicit cast to UUID
    COALESCE(NEW.raw_user_meta_data->>'matricNumber', 'TEMP-' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    matricNumber = EXCLUDED.matricNumber,
    role = EXCLUDED.role,
    updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

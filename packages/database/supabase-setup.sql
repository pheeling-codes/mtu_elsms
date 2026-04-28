-- ==========================================
-- ELSMS Supabase Database Setup
-- ==========================================

-- ==========================================
-- 1. Create Trigger Function for User Sync
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, matricNumber, role, createdAt, updatedAt)
  VALUES (
    NEW.id,
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

-- ==========================================
-- 2. Create Trigger on auth.users
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 3. Enable RLS on public.users
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. Create RLS Policies
-- ==========================================

-- Users can read their own data
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data (limited fields)
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all users
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ==========================================
-- 5. Sample Data (Optional - for testing)
-- ==========================================

-- Insert sample zones
INSERT INTO public.zones (id, name, type, createdAt, updatedAt)
VALUES
  (gen_random_uuid(), 'Quiet Study Area', 'QUIET', NOW(), NOW()),
  (gen_random_uuid(), 'Group Discussion Room', 'GROUP', NOW(), NOW()),
  (gen_random_uuid(), 'Computer Lab', 'QUIET', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample seats for each zone
DO $$
DECLARE
  zone_record RECORD;
  seat_number INT;
BEGIN
  FOR zone_record IN SELECT id FROM public.zones LOOP
    FOR seat_number IN 1..16 LOOP
      INSERT INTO public.seats (id, zoneId, seatNumber, status, createdAt, updatedAt)
      VALUES (gen_random_uuid(), zone_record.id, seat_number, 'AVAILABLE', NOW(), NOW())
      ON CONFLICT (zoneId, seatNumber) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ==========================================
-- 6. Verify Setup
-- ==========================================
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as total_zones FROM public.zones;
SELECT COUNT(*) as total_seats FROM public.seats;

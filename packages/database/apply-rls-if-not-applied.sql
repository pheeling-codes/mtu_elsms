-- Apply RLS policies if they haven't been applied yet
-- This script will force enable RLS and recreate policies

-- Force enable RLS on all tables
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on reservations table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Students can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Students can insert own reservations" ON reservations;
DROP POLICY IF EXISTS "Students can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Students can delete own reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can delete all reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can view seats" ON seats;
DROP POLICY IF EXISTS "Authenticated users can update seats" ON seats;
DROP POLICY IF EXISTS "Authenticated users can view zones" ON zones;
DROP POLICY IF EXISTS "Enable all for users" ON users;
DROP POLICY IF EXISTS "Enable all for reservations" ON reservations;
DROP POLICY IF EXISTS "Enable all for seats" ON seats;
DROP POLICY IF EXISTS "Enable all for zones" ON zones;

-- Recreate User policies with type casting
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  TO authenticated
  USING (id::text = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

-- Recreate Reservation policies with type casting
CREATE POLICY "Students can view own reservations" ON reservations
  FOR SELECT
  TO authenticated
  USING (userid::text = auth.uid()::text);

CREATE POLICY "Students can insert own reservations" ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (userid::text = auth.uid()::text);

CREATE POLICY "Students can update own reservations" ON reservations
  FOR UPDATE
  TO authenticated
  USING (userid::text = auth.uid()::text)
  WITH CHECK (userid::text = auth.uid()::text);

CREATE POLICY "Students can delete own reservations" ON reservations
  FOR DELETE
  TO authenticated
  USING (userid::text = auth.uid()::text);

-- Recreate Admin policies with type casting
CREATE POLICY "Admins can view all reservations" ON reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update all reservations" ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete all reservations" ON reservations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'ADMIN'
    )
  );

-- Recreate Seat policies
CREATE POLICY "Authenticated users can view seats" ON seats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update seats" ON seats
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Recreate Zone policies
CREATE POLICY "Authenticated users can view zones" ON zones
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON seats TO authenticated;
GRANT SELECT ON zones TO authenticated;

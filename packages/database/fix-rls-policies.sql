-- Fixed RLS Policies for ELSMS Reservations System
-- Updated to use lowercase column names matching database schema

-- Enable RLS on all tables
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
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

-- Drop any other existing policies that might conflict
DROP POLICY IF EXISTS "Enable all for users" ON users;
DROP POLICY IF EXISTS "Enable all for reservations" ON reservations;
DROP POLICY IF EXISTS "Enable all for seats" ON seats;
DROP POLICY IF EXISTS "Enable all for zones" ON zones;

-- Users Table Policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  TO authenticated
  USING (id::text = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

-- Reservations Table Policies - FIXED with lowercase column names and type casting
-- Student policies - can only access their own reservations
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

-- Admin policies - can access all reservations
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

-- Seats Table Policies - Allow authenticated users to view and update
CREATE POLICY "Authenticated users can view seats" ON seats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update seats" ON seats
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Zones Table Policies
CREATE POLICY "Authenticated users can view zones" ON zones
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON seats TO authenticated;
GRANT SELECT ON zones TO authenticated;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role = 'ADMIN'
  );
END;
$$;

-- Create function to check if user owns reservation - FIXED with lowercase and type casting
CREATE OR REPLACE FUNCTION owns_reservation(reservation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM reservations
    WHERE reservations.id = reservation_id
    AND reservations.userid::text = auth.uid()::text
  );
END;
$$;

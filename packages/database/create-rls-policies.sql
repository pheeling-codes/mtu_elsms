-- Row Level Security Policies for ELSMS Reservations System
-- Ensures students can only see their own reservations, admins can see all

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
DROP POLICY IF EXISTS "Authenticated users can view zones" ON zones;

-- Users Table Policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Reservations Table Policies
-- Student policies - can only access their own reservations
CREATE POLICY "Students can view own reservations" ON reservations
  FOR SELECT
  TO authenticated
  USING (userId = auth.uid());

CREATE POLICY "Students can insert own reservations" ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (userId = auth.uid());

CREATE POLICY "Students can update own reservations" ON reservations
  FOR UPDATE
  TO authenticated
  USING (userId = auth.uid())
  WITH CHECK (userId = auth.uid());

CREATE POLICY "Students can delete own reservations" ON reservations
  FOR DELETE
  TO authenticated
  USING (userId = auth.uid());

-- Admin policies - can access all reservations
CREATE POLICY "Admins can view all reservations" ON reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update all reservations" ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete all reservations" ON reservations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

-- Seats Table Policies
CREATE POLICY "Authenticated users can view seats" ON seats
  FOR SELECT
  TO authenticated
  USING (true);

-- Zones Table Policies
CREATE POLICY "Authenticated users can view zones" ON zones
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT SELECT ON seats TO authenticated;
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
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  );
END;
$$;

-- Create function to check if user owns reservation
CREATE OR REPLACE FUNCTION owns_reservation(reservation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM reservations 
    WHERE reservations.id = reservation_id 
    AND reservations.userId = auth.uid()
  );
END;
$$;

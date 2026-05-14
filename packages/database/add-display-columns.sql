-- Add display name columns to reservations table for denormalization
-- This allows us to display names without using joins (which cause PostgREST errors)

-- Add seat name column
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS seatname TEXT;

-- Add zone name column
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS zonename TEXT;

-- Add student name column
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS studentname TEXT;

-- Add student matric number column
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS studentmatric TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'reservations'
    AND column_name IN ('seatname', 'zonename', 'studentname', 'studentmatric')
ORDER BY column_name;

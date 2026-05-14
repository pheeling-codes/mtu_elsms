-- Add zoneId column to reservations table for admin filtering
-- This column is needed for the zone filter in the admin reservations page

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS zoneId TEXT;

-- Add comment for documentation
COMMENT ON COLUMN reservations.zoneId IS 'Foreign key reference to zones table for admin filtering';

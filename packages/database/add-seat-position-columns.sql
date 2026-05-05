-- Add missing columns to seats table for seat editor
-- These columns store the visual position and size of seats on the canvas

ALTER TABLE seats
ADD COLUMN IF NOT EXISTS x DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS y DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS width DECIMAL DEFAULT 50,
ADD COLUMN IF NOT EXISTS height DECIMAL DEFAULT 50;

-- If seatNumber column doesn't exist, create it and copy data from name
DO $$
BEGIN
    -- Add seatNumber column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seats' AND column_name = 'seatNumber'
    ) THEN
        ALTER TABLE seats ADD COLUMN seatNumber TEXT;
        
        -- Copy existing name values to seatNumber
        UPDATE seats SET seatNumber = name WHERE seatNumber IS NULL;
        
        -- Make seatNumber required
        ALTER TABLE seats ALTER COLUMN seatNumber SET NOT NULL;
    END IF;
END $$;

-- Make position columns nullable to handle existing data gracefully
ALTER TABLE seats ALTER COLUMN x DROP NOT NULL;
ALTER TABLE seats ALTER COLUMN y DROP NOT NULL;
ALTER TABLE seats ALTER COLUMN width DROP NOT NULL;
ALTER TABLE seats ALTER COLUMN height DROP NOT NULL;

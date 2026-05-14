-- Fix duplicate zone columns issue
-- This script cleans up any duplicate columns and ensures consistent data types

-- Drop existing columns if they exist (to avoid duplicates)
DO $$
BEGIN
    -- Drop canvasWidth if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zones' AND column_name = 'canvaswidth') THEN
        ALTER TABLE zones DROP COLUMN canvaswidth;
    END IF;
    
    -- Drop canvasHeight if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zones' AND column_name = 'canvasheight') THEN
        ALTER TABLE zones DROP COLUMN canvasheight;
    END IF;
    
    -- Drop gridBlockSize if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zones' AND column_name = 'gridblocksize') THEN
        ALTER TABLE zones DROP COLUMN gridblocksize;
    END IF;
    
    -- Drop seatSize if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zones' AND column_name = 'seatsize') THEN
        ALTER TABLE zones DROP COLUMN seatsize;
    END IF;
END $$;

-- Add columns with consistent data types and naming
ALTER TABLE zones ADD COLUMN IF NOT EXISTS canvasWidth INTEGER DEFAULT 400;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS canvasHeight INTEGER DEFAULT 300;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS gridBlockSize FLOAT DEFAULT 0.5;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS seatSize FLOAT DEFAULT 1.0;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comments
COMMENT ON COLUMN zones.canvasWidth IS 'Width of the canvas area for this zone in pixels';
COMMENT ON COLUMN zones.canvasHeight IS 'Height of the canvas area for this zone in pixels';
COMMENT ON COLUMN zones.gridBlockSize IS 'Grid block size for seat positioning in canvas';
COMMENT ON COLUMN zones.seatSize IS 'Size of individual seats in canvas';
COMMENT ON COLUMN zones.features IS 'Array of features available in this zone';

-- Add zone settings columns for dynamic canvas rendering
-- These columns allow the admin panel to control zone layout on the student view

-- Add gridBlockSize column (default 0.5)
ALTER TABLE zones ADD COLUMN IF NOT EXISTS gridBlockSize FLOAT DEFAULT 0.5;

-- Add seatSize column (default 1.0)
ALTER TABLE zones ADD COLUMN IF NOT EXISTS seatSize FLOAT DEFAULT 1.0;

-- Add canvasWidth column (default 20)
ALTER TABLE zones ADD COLUMN IF NOT EXISTS canvasWidth FLOAT DEFAULT 20;

-- Add canvasHeight column (default 15)
ALTER TABLE zones ADD COLUMN IF NOT EXISTS canvasHeight FLOAT DEFAULT 15;

-- Add features column (default empty array)
ALTER TABLE zones ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN zones.gridBlockSize IS 'Grid block size for seat positioning in canvas';
COMMENT ON COLUMN zones.seatSize IS 'Size of individual seats in canvas';
COMMENT ON COLUMN zones.canvasWidth IS 'Width of the canvas area for this zone';
COMMENT ON COLUMN zones.canvasHeight IS 'Height of the canvas area for this zone';
COMMENT ON COLUMN zones.features IS 'Array of features available in this zone';

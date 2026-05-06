-- Add audit columns to zones table if they don't exist
-- This ensures proper tracking of creation and update timestamps

-- Ensure the update_updated_at_column function exists first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zones' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE zones ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zones' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE zones ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Create trigger to automatically update updated_at
    DROP TRIGGER IF EXISTS update_zones_updated_at ON zones;
    CREATE TRIGGER update_zones_updated_at
        BEFORE UPDATE ON zones
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Set created_at for existing records if null
    UPDATE zones SET created_at = NOW() WHERE created_at IS NULL;
    UPDATE zones SET updated_at = NOW() WHERE updated_at IS NULL;
END $$;

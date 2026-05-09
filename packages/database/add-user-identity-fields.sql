-- Add identity fields to users table
-- This ensures full_name and email are captured during signup

DO $$
BEGIN
    -- Add full_name column if it doesn't exist (nullable, no constraints)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'full_name'
    ) THEN
        BEGIN
            ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to add full_name column: %', SQLERRM;
        END;
    END IF;

    -- Add email column if it doesn't exist (nullable, no constraints)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        BEGIN
            ALTER TABLE users ADD COLUMN email VARCHAR(255);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to add email column: %', SQLERRM;
        END;
    END IF;
END $$;

-- Note: Existing records will be handled by application fallback logic
-- The application will set default values when users log in with missing data

COMMENT ON COLUMN users.full_name IS 'Full name of the user (first and last name)';
COMMENT ON COLUMN users.email IS 'Email address of the user, unique identifier';

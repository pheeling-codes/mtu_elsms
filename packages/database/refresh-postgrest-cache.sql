-- Force PostgREST schema cache refresh by making a minor schema change
-- This will trigger PostgREST to rebuild its schema cache

-- Add a comment to the reservations table (this is a harmless change that triggers cache refresh)
COMMENT ON TABLE reservations IS 'Student seat reservations table - cache refresh';

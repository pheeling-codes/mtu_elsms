-- Check actual column names in reservations table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'reservations'
ORDER BY ordinal_position;

-- Check if lowercase columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'reservations' 
    AND column_name IN ('userid', 'seatid', 'starttime', 'endtime', 'createdat');

-- Show sample data to understand structure
SELECT * FROM reservations LIMIT 1;

-- Debug current reservations table structure
SELECT * FROM reservations LIMIT 1;

-- Check if endTime column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'reservations' 
    AND column_name ILIKE '%end%';

-- Check actual column names in reservations
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'reservations'
ORDER BY ordinal_position;

-- Check if userId column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'reservations' 
    AND column_name ILIKE '%user%';

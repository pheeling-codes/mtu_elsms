-- Check actual column names in reservations table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'reservations'
ORDER BY ordinal_position;

-- Check if there are any end-related columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'reservations' 
    AND (column_name ILIKE '%end%' OR column_name ILIKE '%time%');

-- Show sample data to understand structure
SELECT * FROM reservations LIMIT 1;

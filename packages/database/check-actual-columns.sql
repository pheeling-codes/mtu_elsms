-- Check the actual column names in the reservations table
-- Run this to see exactly what columns exist

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

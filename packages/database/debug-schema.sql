-- Debug function to show actual column names in reservations table
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;

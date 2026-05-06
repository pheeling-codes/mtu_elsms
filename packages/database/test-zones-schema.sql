-- Test query to check if zones table has audit columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'zones' 
AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;

-- Simple test query to verify reservations table structure and data
-- Run this in Supabase SQL editor to debug the issue

-- Test 1: Check if reservations table exists and has data
SELECT COUNT(*) as total_count FROM reservations;

-- Test 2: Check table structure
DESCRIBE reservations;

-- Test 3: Get sample data with basic query
SELECT id, userId, seatId, startTime, status 
FROM reservations 
LIMIT 3;

-- Test 4: Check if users table has data for the reservations
SELECT r.id, u.fullName, u.email 
FROM reservations r
LEFT JOIN users u ON r.userId = u.id
LIMIT 3;

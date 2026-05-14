-- Debug query to check if reservations exist in database
-- Run this in Supabase SQL editor to verify data

SELECT 
    COUNT(*) as total_reservations,
    COUNT(CASE WHEN status = 'UPCOMING' THEN 1 END) as upcoming_reservations,
    COUNT(CASE WHEN status = 'RESERVED' THEN 1 END) as reserved_reservations,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_reservations,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_reservations
FROM reservations;

-- Check if any reservations exist with user details
SELECT 
    r.id,
    r.userId,
    r.seatId,
    r.startTime,
    r.status,
    u.fullName,
    u.email,
    u.matricNumber,
    s.seatNumber,
    z.name as zoneName
FROM reservations r
LEFT JOIN users u ON r.userId = u.id
LEFT JOIN seats s ON r.seatId = s.id
LEFT JOIN zones z ON s.zoneId = z.id
LIMIT 5;

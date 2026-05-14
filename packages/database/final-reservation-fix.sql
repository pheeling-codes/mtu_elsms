-- Final comprehensive solution for admin reservations display issue
-- This script will completely rebuild the reservations table structure

-- Step 1: Drop and recreate reservations table with proper structure
DROP TABLE IF EXISTS reservations CASCADE;

-- Step 2: Create reservations table with all required columns
CREATE TABLE reservations (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    seatId TEXT NOT NULL,
    zoneId TEXT,
    startTime TIMESTAMP WITH TIME ZONE NOT NULL,
    endTime TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'UPCOMING',
    checkInTime TIMESTAMP WITH TIME ZONE,
    checkOutTime TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Insert sample test data
INSERT INTO reservations (id, userId, seatId, zoneId, startTime, endTime, status, createdAt, updatedAt) VALUES
    ('test-reservation-1', 'user-123', 'seat-456', 'zone-789', NOW(), NOW() + INTERVAL '2 hours', 'UPCOMING', NOW(), NOW()),
    ('test-reservation-2', 'user-456', 'seat-789', 'zone-789', NOW(), NOW() + INTERVAL '4 hours', 'UPCOMING', NOW(), NOW()),
    ('test-reservation-3', 'user-789', 'seat-123', 'zone-456', NOW(), NOW() + INTERVAL '6 hours', 'UPCOMING', NOW(), NOW());

-- Step 4: Verify data
SELECT * FROM reservations ORDER BY createdAt DESC LIMIT 5;

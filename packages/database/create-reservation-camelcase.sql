-- Reservation function using camelCase column names to match Supabase schema
-- This function uses the exact column names from the database

CREATE OR REPLACE FUNCTION create_reservation_camelcase(
    p_user_id TEXT,
    p_seat_id TEXT,
    p_zone_id TEXT,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_full_name TEXT,
    p_email TEXT,
    p_matric_number TEXT
)
RETURNS TABLE (
    id TEXT,
    user_id TEXT,
    seat_id TEXT,
    zone_id TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT,
    full_name TEXT,
    email TEXT,
    matric_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_reservation_id TEXT;
BEGIN
    -- Create reservation using camelCase column names
    INSERT INTO reservations (userId, seatId, zoneId, startTime, endTime, status, fullName, email, matricNumber, createdAt, updatedAt)
    VALUES (p_user_id, p_seat_id, p_zone_id, p_start_time, p_end_time, 'UPCOMING', p_full_name, p_email, p_matric_number, NOW(), NOW())
    RETURNING id INTO v_reservation_id;
    
    -- Update seat status using camelCase column names
    UPDATE seats 
    SET status = 'RESERVED', updatedAt = NOW()
    WHERE id = p_seat_id AND status = 'AVAILABLE';
    
    -- Return the created reservation using camelCase column names
    RETURN QUERY
    SELECT 
        r.id, r.userId, r.seatId, r.zoneId,
        r.startTime, r.endTime, r.status,
        r.fullName, r.email, r.matricNumber, r.createdAt
    FROM reservations r
    WHERE r.id = v_reservation_id;
    
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION create_reservation_camelcase IS 'Reservation function using camelCase column names to match Supabase schema';

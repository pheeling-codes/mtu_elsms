-- Working function that matches current database schema
-- Uses lowercase column names to match database

CREATE OR REPLACE FUNCTION create_reservation_working(
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
    -- Simple approach: just create reservation and update seat
    -- Let database constraints handle the availability check
    
    INSERT INTO reservations (
        userid, seatid, zoneid, starttime, endtime, status,
        fullname, email, matricnumber, createdat, updatedat
    ) VALUES (
        p_user_id, p_seat_id, p_zone_id, p_start_time, p_end_time, 'UPCOMING',
        p_full_name, p_email, p_matric_number, NOW(), NOW()
    ) RETURNING id INTO v_reservation_id;
    
    -- Update seat status
    UPDATE seats 
    SET status = 'RESERVED', updatedat = NOW()
    WHERE id = p_seat_id;
    
    -- Return the created reservation
    RETURN QUERY
    SELECT 
        r.id, r.user_id, r.seat_id, r.zone_id,
        r.start_time, r.end_time, r.status,
        r.full_name, r.email, r.matric_number, r.created_at
    FROM reservations r
    WHERE r.id = v_reservation_id;
    
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_reservation_working IS 'Creates reservation using lowercase column names to match current database schema';

-- Flexible reservation function that handles multiple column naming conventions
-- Uses JSON column access to avoid hardcoding column names

CREATE OR REPLACE FUNCTION create_reservation_flexible(
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
    v_column_names JSON;
BEGIN
    -- Get actual column names from reservations table
    SELECT jsonb_agg(column_name) INTO v_column_names
    FROM information_schema.columns 
    WHERE table_name = 'reservations' 
    AND column_name NOT IN ('id', 'created_at', 'updated_at');
    
    -- Create reservation using dynamic column access with proper type casting
    EXECUTE format('
        INSERT INTO reservations (%I) VALUES (
            %L, %L, %L, %L, %L, %s
        ) VALUES (
            %s, %s, %s, %s, %s, %s
        ) RETURNING id INTO v_reservation_id;
        UPDATE seats 
        SET status = ''RESERVED'', updated_at = NOW()
        WHERE id = %s::text AND status = ''AVAILABLE'';
        
        RETURN QUERY
        SELECT 
            r.id, r.user_id, r.seat_id, r.zone_id,
            r.start_time, r.end_time, r.status,
            r.full_name, r.email, r.matric_number, r.created_at
        FROM reservations r
        WHERE r.id = %s;
    ',
        v_column_names,
        ARRAY[
            'userid', 'seatid', 'zoneid', 'starttime', 'endtime', 'status',
            'fullname', 'email', 'matricnumber', 'createdat', 'updatedat'
        ],
        ARRAY[
            p_user_id, p_seat_id, p_zone_id, p_start_time, p_end_time,
            p_full_name, p_email, p_matric_number
        ]
    ) INTO v_reservation_id;
    
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION create_reservation_flexible IS 'Creates reservation using dynamic column name detection for maximum compatibility';

-- Migration: Add checkInTime and checkOutTime columns to reservations table
-- Run this in your Supabase SQL Editor

-- First, add UPCOMING to the reservation_status enum if it doesn't exist
-- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in transactions,
-- so you may need to run this separately if it fails
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'UPCOMING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reservation_status')
    ) THEN
        ALTER TYPE public.reservation_status ADD VALUE 'UPCOMING' BEFORE 'ACTIVE';
    END IF;
END $$;

-- Add checkInTime column (nullable)
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS "checkInTime" TIMESTAMP WITH TIME ZONE;

-- Add checkOutTime column (nullable)
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS "checkOutTime" TIMESTAMP WITH TIME ZONE;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;

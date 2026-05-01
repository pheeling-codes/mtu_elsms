-- Add UPCOMING to ReservationStatus enum
-- Run this in your Supabase SQL Editor

-- Add UPCOMING value to the enum (must be done outside a transaction)
-- This will fail if UPCOMING already exists, that's OK
ALTER TYPE "ReservationStatus" ADD VALUE 'UPCOMING';

-- Verify
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ReservationStatus')
ORDER BY enumsortorder;

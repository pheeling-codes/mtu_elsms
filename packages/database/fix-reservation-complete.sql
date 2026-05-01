-- Complete Fix for Reservations Table
-- Run this in your Supabase SQL Editor

-- ==========================================
-- Step 1: Add missing columns (nullable)
-- ==========================================

ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS "checkInTime" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "checkOutTime" TIMESTAMP WITH TIME ZONE;

-- ==========================================
-- Step 2: Update status constraint to include UPCOMING
-- ==========================================

-- First, drop the existing constraint if it exists
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Add new constraint with UPCOMING included
ALTER TABLE public.reservations
ADD CONSTRAINT reservations_status_check 
CHECK (status IN ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'));

-- ==========================================
-- Step 3: Verify the changes
-- ==========================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;

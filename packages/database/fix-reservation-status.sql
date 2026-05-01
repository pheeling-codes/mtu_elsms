-- Fix: Add UPCOMING status constraint and columns to reservations table
-- Run this in your Supabase SQL Editor

-- First check what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;

-- Check the current status constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.reservations'::regclass AND contype = 'c';

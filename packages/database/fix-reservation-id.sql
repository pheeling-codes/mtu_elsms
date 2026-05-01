-- Fix: Add default UUID generator for reservations.id column
-- Run this in your Supabase SQL Editor

-- First check if the id column has a default
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations' AND column_name = 'id';

-- Add default UUID generation if not exists
ALTER TABLE public.reservations
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations' AND column_name = 'id';

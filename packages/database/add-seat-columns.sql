-- Add missing columns to seats table for map coordinates and features
-- Run this in your Supabase SQL Editor

-- Add x, y coordinates for map positioning
ALTER TABLE public.seats
ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 0;

-- Add features array for seat amenities
ALTER TABLE public.seats
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}'::TEXT[];

-- Update existing seats with sample coordinates and features
UPDATE public.seats SET x = 100, y = 100, features = ARRAY['Power Outlet'] WHERE id = 'seat-001';
UPDATE public.seats SET x = 160, y = 100, features = ARRAY['Window View'] WHERE id = 'seat-002';
UPDATE public.seats SET x = 220, y = 100, features = ARRAY['Ergonomic Chair'] WHERE id = 'seat-003';
UPDATE public.seats SET x = 400, y = 100, features = ARRAY['Whiteboard'] WHERE id = 'seat-101';
UPDATE public.seats SET x = 460, y = 100, features = ARRAY['Power Outlet', 'Dual Monitors'] WHERE id = 'seat-102';

-- Verify
SELECT id, "seatNumber", x, y, features FROM public.seats;

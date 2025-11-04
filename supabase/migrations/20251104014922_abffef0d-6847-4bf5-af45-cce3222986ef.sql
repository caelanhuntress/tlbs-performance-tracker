-- Add notes column to entries table
ALTER TABLE public.entries 
ADD COLUMN notes TEXT;
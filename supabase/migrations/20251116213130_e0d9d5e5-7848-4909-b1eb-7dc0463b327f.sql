-- Add tags column to entries table
ALTER TABLE public.entries 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for tag searches
CREATE INDEX idx_entries_tags ON public.entries USING GIN(tags);
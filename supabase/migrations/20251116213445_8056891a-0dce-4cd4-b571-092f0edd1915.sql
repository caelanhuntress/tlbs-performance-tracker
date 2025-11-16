-- Create metrics table for tracking lead metrics
CREATE TABLE public.metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_metric_type CHECK (metric_type IN ('Calls', 'Emails', 'Coffees', 'Meetings', 'Proposals', 'Pitches')),
  CONSTRAINT valid_count CHECK (count >= 0 AND count <= 100)
);

-- Enable Row Level Security
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own metrics" 
ON public.metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metrics" 
ON public.metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics" 
ON public.metrics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metrics" 
ON public.metrics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_metrics_updated_at
BEFORE UPDATE ON public.metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_metrics_user_date ON public.metrics(user_id, date);
CREATE INDEX idx_metrics_date ON public.metrics(date);
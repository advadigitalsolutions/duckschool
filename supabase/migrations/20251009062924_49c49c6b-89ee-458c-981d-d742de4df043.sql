-- Add archived field to courses table
ALTER TABLE public.courses 
ADD COLUMN archived boolean DEFAULT false;

-- Create index for better query performance on archived courses
CREATE INDEX idx_courses_archived ON public.courses(archived);

-- Add updated_at field to track when courses are modified
ALTER TABLE public.courses 
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courses_updated_at_trigger
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION update_courses_updated_at();
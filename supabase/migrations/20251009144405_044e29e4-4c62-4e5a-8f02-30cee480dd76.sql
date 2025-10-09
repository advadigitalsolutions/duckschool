-- Create assignment notes table
CREATE TABLE public.assignment_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, assignment_id)
);

-- Create course reference notes table
CREATE TABLE public.course_reference_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_assignment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reference_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignment_notes
CREATE POLICY "Students can manage their own assignment notes"
ON public.assignment_notes
FOR ALL
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Parents can view their students assignment notes"
ON public.assignment_notes
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- RLS policies for course_reference_notes
CREATE POLICY "Students can manage their own reference notes"
ON public.course_reference_notes
FOR ALL
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Parents can view their students reference notes"
ON public.course_reference_notes
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_assignment_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_notes_updated_at
BEFORE UPDATE ON public.assignment_notes
FOR EACH ROW
EXECUTE FUNCTION update_assignment_notes_updated_at();

CREATE TRIGGER course_reference_notes_updated_at
BEFORE UPDATE ON public.course_reference_notes
FOR EACH ROW
EXECUTE FUNCTION update_assignment_notes_updated_at();
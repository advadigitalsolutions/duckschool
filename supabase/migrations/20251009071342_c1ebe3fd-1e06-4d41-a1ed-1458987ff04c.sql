-- Create daily_goals table for student micro-goals
CREATE TABLE public.daily_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  goal_text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_goals
CREATE POLICY "Students can manage their own daily goals"
ON public.daily_goals
FOR ALL
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Parents can view their students daily goals"
ON public.daily_goals
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX idx_daily_goals_student_date ON public.daily_goals(student_id, date DESC);
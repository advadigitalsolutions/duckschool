-- Create table for student research resources
CREATE TABLE assignment_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  resource_url text NOT NULL,
  resource_title text,
  resource_type text CHECK (resource_type IN ('video', 'article', 'interactive', 'other')),
  notes text,
  validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'invalid')),
  validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, student_id, resource_url)
);

-- Enable RLS
ALTER TABLE assignment_research ENABLE ROW LEVEL SECURITY;

-- Students can manage their own research
CREATE POLICY "Students can manage own research"
  ON assignment_research
  FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Parents can view their students' research
CREATE POLICY "Parents can view student research"
  ON assignment_research
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Create table for learning wizard progress
CREATE TABLE assignment_learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  current_step text DEFAULT 'research' CHECK (
    current_step IN ('research', 'notes', 'discussion', 'practice', 'assessment', 'completed')
  ),
  steps_completed jsonb DEFAULT '[]'::jsonb,
  ai_coaching_history jsonb DEFAULT '[]'::jsonb,
  research_completed boolean DEFAULT false,
  notes_completed boolean DEFAULT false,
  discussion_completed boolean DEFAULT false,
  practice_completed boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Enable RLS
ALTER TABLE assignment_learning_progress ENABLE ROW LEVEL SECURITY;

-- Students can manage own progress
CREATE POLICY "Students can manage own progress"
  ON assignment_learning_progress
  FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Parents can view student progress
CREATE POLICY "Parents can view student progress"
  ON assignment_learning_progress
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_assignment_research_updated_at
  BEFORE UPDATE ON assignment_research
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

CREATE TRIGGER update_assignment_learning_progress_updated_at
  BEFORE UPDATE ON assignment_learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();
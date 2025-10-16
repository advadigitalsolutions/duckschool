-- Phase 1: Smart Scheduling Foundation Tables

-- Store analyzed focus patterns per student (15-minute granularity)
CREATE TABLE IF NOT EXISTS student_focus_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Time-of-day performance (15-minute blocks throughout the day)
  -- Format: { "09:00": 0.85, "09:15": 0.92, "09:30": 0.78, ... }
  hourly_focus_scores JSONB DEFAULT '{}'::jsonb,
  
  -- Detected peak focus windows
  -- Format: [{ "start": "09:00", "end": "11:00", "avg_score": 0.88, "confidence": 0.9 }]
  peak_focus_windows JSONB DEFAULT '[]'::jsonb,
  
  -- Subject-specific optimal times
  -- Format: { "Math": { "best_time": "morning", "avg_focus": 0.82, "optimal_start": "09:00" }, ... }
  subject_performance JSONB DEFAULT '{}'::jsonb,
  
  -- Day-of-week patterns
  -- Format: { "monday": 0.85, "tuesday": 0.78, ... }
  day_patterns JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  sessions_analyzed INTEGER DEFAULT 0,
  data_quality_score DECIMAL DEFAULT 0.0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence_level DECIMAL DEFAULT 0.5,
  
  UNIQUE(student_id, analysis_date)
);

-- Parent-defined time blocks (appointments, preferences, restrictions)
CREATE TABLE IF NOT EXISTS scheduling_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('unavailable', 'preferred', 'restricted')),
  
  -- Recurring schedule (null specific_date = recurring)
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- One-time blocks (overrides recurring when set)
  specific_date DATE,
  
  -- Metadata
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  
  CHECK (end_time > start_time)
);

-- Track actual vs estimated time for learning
CREATE TABLE IF NOT EXISTS assignment_time_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  estimated_minutes INTEGER NOT NULL,
  actual_minutes INTEGER NOT NULL,
  accuracy_ratio DECIMAL GENERATED ALWAYS AS (
    CASE 
      WHEN estimated_minutes > 0 THEN actual_minutes::DECIMAL / estimated_minutes
      ELSE 1.0
    END
  ) STORED,
  subject TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced assignment table for smart scheduling
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS optimal_time_of_day TEXT[],
ADD COLUMN IF NOT EXISTS prerequisite_assignments UUID[],
ADD COLUMN IF NOT EXISTS sequence_order INTEGER,
ADD COLUMN IF NOT EXISTS scheduling_flexibility DECIMAL DEFAULT 0.5 CHECK (scheduling_flexibility >= 0 AND scheduling_flexibility <= 1),
ADD COLUMN IF NOT EXISTS auto_scheduled_time TIME,
ADD COLUMN IF NOT EXISTS locked_schedule BOOLEAN DEFAULT FALSE;

-- Enable RLS on new tables
ALTER TABLE student_focus_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_time_actuals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_focus_patterns
CREATE POLICY "Parents can view their students focus patterns"
  ON student_focus_patterns FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own focus patterns"
  ON student_focus_patterns FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage focus patterns"
  ON student_focus_patterns FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for scheduling_blocks
CREATE POLICY "Parents can manage their students scheduling blocks"
  ON scheduling_blocks FOR ALL
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their scheduling blocks"
  ON scheduling_blocks FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for assignment_time_actuals
CREATE POLICY "Parents can view their students time actuals"
  ON assignment_time_actuals FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own time actuals"
  ON assignment_time_actuals FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert time actuals"
  ON assignment_time_actuals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_focus_patterns_student_date ON student_focus_patterns(student_id, analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_scheduling_blocks_student ON scheduling_blocks(student_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_time_actuals_student_subject ON assignment_time_actuals(student_id, subject, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_auto_scheduled ON assignments(auto_scheduled_time) WHERE auto_scheduled_time IS NOT NULL;
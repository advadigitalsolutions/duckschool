-- Fix XP events RLS to allow system to insert
CREATE POLICY "System can insert XP events"
  ON public.xp_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Students can insert own XP events"
  ON public.xp_events
  FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Create function to calculate and update standard mastery
CREATE OR REPLACE FUNCTION public.update_standard_mastery()
RETURNS TRIGGER AS $$
DECLARE
  v_assignment assignments%ROWTYPE;
  v_curriculum curriculum_items%ROWTYPE;
  v_standard TEXT;
  v_total_attempts INT;
  v_correct_attempts INT;
  v_mastery_level NUMERIC;
BEGIN
  -- Get assignment details
  SELECT * INTO v_assignment FROM assignments WHERE id = NEW.assignment_id;
  
  -- Get curriculum item with standards
  SELECT * INTO v_curriculum FROM curriculum_items WHERE id = v_assignment.curriculum_item_id;
  
  -- Process each standard in the curriculum item
  IF v_curriculum.standards IS NOT NULL AND jsonb_array_length(v_curriculum.standards) > 0 THEN
    FOR v_standard IN SELECT jsonb_array_elements_text(v_curriculum.standards)
    LOOP
      -- Calculate total attempts and correct attempts for this standard
      SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE (s.score / NULLIF(s.max_score, 0) * 100) >= 70)
      INTO v_total_attempts, v_correct_attempts
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN curriculum_items ci ON a.curriculum_item_id = ci.id
      WHERE s.student_id = NEW.student_id
        AND ci.standards @> jsonb_build_array(v_standard)::jsonb;
      
      -- Calculate mastery level (percentage of correct attempts)
      IF v_total_attempts > 0 THEN
        v_mastery_level := (v_correct_attempts::NUMERIC / v_total_attempts::NUMERIC * 100);
      ELSE
        v_mastery_level := 0;
      END IF;
      
      -- Insert or update standard mastery
      INSERT INTO public.standard_mastery (
        student_id,
        course_id,
        standard_code,
        mastery_level,
        total_attempts,
        correct_attempts,
        last_attempted_at
      )
      VALUES (
        NEW.student_id,
        v_curriculum.course_id,
        v_standard,
        v_mastery_level,
        v_total_attempts,
        v_correct_attempts,
        NOW()
      )
      ON CONFLICT (student_id, course_id, standard_code)
      DO UPDATE SET
        mastery_level = v_mastery_level,
        total_attempts = v_total_attempts,
        correct_attempts = v_correct_attempts,
        last_attempted_at = NOW(),
        updated_at = NOW();
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update mastery when grades are created/updated
DROP TRIGGER IF EXISTS trigger_update_standard_mastery ON grades;
CREATE TRIGGER trigger_update_standard_mastery
  AFTER INSERT OR UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_standard_mastery();

-- Create function to update course mastery summary
CREATE OR REPLACE FUNCTION public.update_course_mastery_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_student_id UUID;
  v_total_standards INT;
  v_mastered INT;
  v_in_progress INT;
  v_not_started INT;
  v_overall_mastery NUMERIC;
BEGIN
  v_course_id := NEW.course_id;
  v_student_id := NEW.student_id;
  
  -- Count standards by mastery level
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE mastery_level >= 80),
    COUNT(*) FILTER (WHERE mastery_level >= 40 AND mastery_level < 80),
    COUNT(*) FILTER (WHERE mastery_level < 40),
    COALESCE(AVG(mastery_level), 0)
  INTO v_total_standards, v_mastered, v_in_progress, v_not_started, v_overall_mastery
  FROM standard_mastery
  WHERE student_id = v_student_id AND course_id = v_course_id;
  
  -- Insert or update course mastery summary
  INSERT INTO public.course_mastery_summary (
    student_id,
    course_id,
    total_standards,
    standards_mastered,
    standards_in_progress,
    standards_not_started,
    overall_mastery_percentage,
    last_calculated_at
  )
  VALUES (
    v_student_id,
    v_course_id,
    v_total_standards,
    v_mastered,
    v_in_progress,
    v_not_started,
    v_overall_mastery,
    NOW()
  )
  ON CONFLICT (student_id, course_id)
  DO UPDATE SET
    total_standards = v_total_standards,
    standards_mastered = v_mastered,
    standards_in_progress = v_in_progress,
    standards_not_started = v_not_started,
    overall_mastery_percentage = v_overall_mastery,
    last_calculated_at = NOW(),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update course mastery summary when standard mastery changes
DROP TRIGGER IF EXISTS trigger_update_course_mastery_summary ON standard_mastery;
CREATE TRIGGER trigger_update_course_mastery_summary
  AFTER INSERT OR UPDATE ON standard_mastery
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_mastery_summary();
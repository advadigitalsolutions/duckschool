
-- Fix update_standard_mastery function to use grades table instead of submissions
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
      -- FIX: Changed from 'submissions s' to 'grades g'
      SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE (g.score / NULLIF(g.max_score, 0) * 100) >= 70)
      INTO v_total_attempts, v_correct_attempts
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      JOIN curriculum_items ci ON a.curriculum_item_id = ci.id
      WHERE g.student_id = NEW.student_id
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

-- Function to recalculate mastery for all existing grades
CREATE OR REPLACE FUNCTION public.recalculate_all_mastery()
RETURNS void AS $$
DECLARE
  v_grade RECORD;
BEGIN
  -- Process all existing grades
  FOR v_grade IN 
    SELECT * FROM grades 
    WHERE assignment_id IS NOT NULL 
    ORDER BY graded_at
  LOOP
    BEGIN
      -- Call the update function for each grade
      PERFORM public.update_standard_mastery_for_grade(v_grade);
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing
      RAISE NOTICE 'Error processing grade %: %', v_grade.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Mastery recalculation complete';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to update mastery for a specific grade
CREATE OR REPLACE FUNCTION public.update_standard_mastery_for_grade(p_grade grades)
RETURNS void AS $$
DECLARE
  v_assignment assignments%ROWTYPE;
  v_curriculum curriculum_items%ROWTYPE;
  v_standard TEXT;
  v_total_attempts INT;
  v_correct_attempts INT;
  v_mastery_level NUMERIC;
BEGIN
  -- Get assignment details
  SELECT * INTO v_assignment FROM assignments WHERE id = p_grade.assignment_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get curriculum item with standards
  SELECT * INTO v_curriculum FROM curriculum_items WHERE id = v_assignment.curriculum_item_id;
  
  IF NOT FOUND OR v_curriculum.standards IS NULL THEN
    RETURN;
  END IF;
  
  -- Process each standard in the curriculum item
  IF jsonb_array_length(v_curriculum.standards) > 0 THEN
    FOR v_standard IN SELECT jsonb_array_elements_text(v_curriculum.standards)
    LOOP
      -- Calculate total attempts and correct attempts for this standard
      SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE g.score >= (g.max_score * 0.7))
      INTO v_total_attempts, v_correct_attempts
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      JOIN curriculum_items ci ON a.curriculum_item_id = ci.id
      WHERE g.student_id = p_grade.student_id
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
        p_grade.student_id,
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
        
      -- Update course mastery summary
      PERFORM public.update_course_mastery_for_student(p_grade.student_id, v_curriculum.course_id);
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to update course mastery summary for a student
CREATE OR REPLACE FUNCTION public.update_course_mastery_for_student(p_student_id UUID, p_course_id UUID)
RETURNS void AS $$
DECLARE
  v_total_standards INT;
  v_mastered INT;
  v_in_progress INT;
  v_not_started INT;
  v_overall_mastery NUMERIC;
BEGIN
  -- Count standards by mastery level
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE mastery_level >= 80),
    COUNT(*) FILTER (WHERE mastery_level >= 40 AND mastery_level < 80),
    COUNT(*) FILTER (WHERE mastery_level < 40),
    COALESCE(AVG(mastery_level), 0)
  INTO v_total_standards, v_mastered, v_in_progress, v_not_started, v_overall_mastery
  FROM standard_mastery
  WHERE student_id = p_student_id AND course_id = p_course_id;
  
  -- Only insert if there are standards
  IF v_total_standards > 0 THEN
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
      p_student_id,
      p_course_id,
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
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the recalculation for existing data
SELECT public.recalculate_all_mastery();
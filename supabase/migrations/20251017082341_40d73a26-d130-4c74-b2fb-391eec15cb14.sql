-- Recalculate mastery data for Jasmine's English Literature course
DO $$
DECLARE
  v_student_id uuid := 'ee6fbdea-f4fa-42c6-9f09-75e8f86164a1';
  v_course_id uuid := '72cbf367-f475-46be-b324-9a57543bd748';
  v_grade RECORD;
BEGIN
  -- Process all grades for this student in this course
  FOR v_grade IN 
    SELECT g.* 
    FROM grades g
    JOIN assignments a ON g.assignment_id = a.id
    JOIN curriculum_items ci ON a.curriculum_item_id = ci.id
    WHERE g.student_id = v_student_id
    AND ci.course_id = v_course_id
    ORDER BY g.graded_at
  LOOP
    BEGIN
      PERFORM public.update_standard_mastery_for_grade(v_grade);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error processing grade %: %', v_grade.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Mastery recalculation complete for English Literature course';
END $$;
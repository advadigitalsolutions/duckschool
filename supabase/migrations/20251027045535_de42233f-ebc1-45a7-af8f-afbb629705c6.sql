-- First, check if trigger exists and recreate it properly
DROP TRIGGER IF EXISTS update_mastery_on_grade ON grades;

-- Create the trigger to automatically update mastery when grades are inserted or updated
CREATE TRIGGER update_mastery_on_grade
  AFTER INSERT OR UPDATE ON grades
  FOR EACH ROW
  WHEN (NEW.assignment_id IS NOT NULL AND NEW.student_id IS NOT NULL)
  EXECUTE FUNCTION update_standard_mastery();

-- Also ensure the trigger for course mastery summary exists
DROP TRIGGER IF EXISTS update_course_summary_on_mastery ON standard_mastery;

CREATE TRIGGER update_course_summary_on_mastery
  AFTER INSERT OR UPDATE ON standard_mastery
  FOR EACH ROW
  EXECUTE FUNCTION update_course_mastery_summary();

-- Add helpful logging to verify triggers are working
COMMENT ON TRIGGER update_mastery_on_grade ON grades IS 
  'Automatically updates standard_mastery table when grades are inserted/updated';
COMMENT ON TRIGGER update_course_summary_on_mastery ON standard_mastery IS 
  'Automatically updates course_mastery_summary when standard_mastery changes';
-- Update existing courses with NULL initiated_by to set it from student's user_id
UPDATE courses
SET 
  initiated_by = students.user_id,
  initiated_by_role = 'student'
FROM students
WHERE 
  courses.student_id = students.id
  AND courses.initiated_by IS NULL;
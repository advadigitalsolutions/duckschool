-- Delete all algebra-related content for Isaiah (student_id: 4d473428-a1ae-48a2-a9cc-a0d0d394e8df)

-- First, delete all assignments for these algebra courses
DELETE FROM assignments
WHERE curriculum_item_id IN (
  SELECT ci.id 
  FROM curriculum_items ci
  JOIN courses c ON ci.course_id = c.id
  WHERE c.student_id = '4d473428-a1ae-48a2-a9cc-a0d0d394e8df'
  AND (c.subject ILIKE '%algebra%' OR c.title ILIKE '%algebra%')
);

-- Then delete all curriculum items (lessons) for these courses
DELETE FROM curriculum_items
WHERE course_id IN (
  SELECT id FROM courses
  WHERE student_id = '4d473428-a1ae-48a2-a9cc-a0d0d394e8df'
  AND (subject ILIKE '%algebra%' OR title ILIKE '%algebra%')
);

-- Finally, delete the algebra courses themselves
DELETE FROM courses
WHERE student_id = '4d473428-a1ae-48a2-a9cc-a0d0d394e8df'
AND (subject ILIKE '%algebra%' OR title ILIKE '%algebra%');
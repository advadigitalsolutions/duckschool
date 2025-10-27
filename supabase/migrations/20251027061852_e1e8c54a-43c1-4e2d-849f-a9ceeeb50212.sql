-- Enable prerequisite bridge mode for existing Algebra I course
UPDATE courses 
SET standards_scope = jsonb_build_array(
  jsonb_build_object(
    'framework', 'CA-CCSS',
    'subject', 'Mathematics',
    'grade_band', '12',
    'prerequisite_bands', jsonb_build_array('5', '6', '7', '8'),
    'bridge_mode', true,
    'diagnostic_baseline', '5-6'
  )
)
WHERE id = 'c1d37040-c2dc-45fc-acdb-9a61ea1a540c';
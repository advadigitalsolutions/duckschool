-- Clean up any existing assignments with capitalized day names
UPDATE assignments 
SET day_of_week = LOWER(day_of_week)
WHERE day_of_week IS NOT NULL 
  AND day_of_week != LOWER(day_of_week);

-- Add comment for documentation
COMMENT ON COLUMN assignments.day_of_week IS 'Day of week in lowercase (monday, tuesday, etc.)';

-- Update Kristy's learning goals from Mandarin to Cantonese
UPDATE students 
SET goals = jsonb_set(goals, '{notes}', '"master Cantonese"')
WHERE id = '27e70584-8418-4051-8643-2e66a2895ad9';

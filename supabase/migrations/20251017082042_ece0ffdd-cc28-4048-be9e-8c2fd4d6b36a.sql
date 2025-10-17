-- Delete all -10 XP entries for Jasmine
DELETE FROM xp_events 
WHERE student_id = 'ee6fbdea-f4fa-42c6-9f09-75e8f86164a1' 
AND amount = -10;
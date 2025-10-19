-- Delete all negative XP events for Isaiah (student_id: 4d473428-a1ae-48a2-a9cc-a0d0d394e8df)
DELETE FROM xp_events 
WHERE student_id = '4d473428-a1ae-48a2-a9cc-a0d0d394e8df' 
AND amount < 0;
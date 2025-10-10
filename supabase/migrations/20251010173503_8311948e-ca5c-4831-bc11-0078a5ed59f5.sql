-- Add header_settings to students table for customizable header features
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS header_settings jsonb DEFAULT '{
  "showName": true,
  "customName": null,
  "showGrade": true,
  "customGrade": null,
  "greetingType": "name",
  "rotatingDisplay": "quote",
  "funFactTopic": null,
  "locations": [],
  "showWeather": false,
  "customReminders": [],
  "countdowns": [],
  "pomodoroEnabled": false,
  "pomodoroSettings": {
    "workMinutes": 25,
    "breakMinutes": 5,
    "longBreakMinutes": 15,
    "sessionsUntilLongBreak": 4,
    "visualTimer": true,
    "timerColor": "hsl(var(--primary))",
    "numberColor": "hsl(var(--foreground))"
  },
  "celebrateWins": true,
  "show8BitStars": false
}'::jsonb;
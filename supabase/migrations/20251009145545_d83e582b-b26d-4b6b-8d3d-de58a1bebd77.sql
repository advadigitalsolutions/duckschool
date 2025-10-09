-- Add text_to_speech_voice column to students and profiles tables
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS text_to_speech_voice TEXT DEFAULT 'alloy';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS text_to_speech_voice TEXT DEFAULT 'alloy';
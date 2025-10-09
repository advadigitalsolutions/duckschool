-- Add focus mode glow intensity column to students table
ALTER TABLE students ADD COLUMN focus_mode_glow_intensity integer DEFAULT 100 CHECK (focus_mode_glow_intensity >= 0 AND focus_mode_glow_intensity <= 100);

-- Add focus mode glow intensity column to profiles table
ALTER TABLE profiles ADD COLUMN focus_mode_glow_intensity integer DEFAULT 100 CHECK (focus_mode_glow_intensity >= 0 AND focus_mode_glow_intensity <= 100);
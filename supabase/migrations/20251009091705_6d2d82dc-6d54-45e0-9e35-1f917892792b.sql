-- Add focus mode customization columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS focus_mode_overlay_opacity integer DEFAULT 70 CHECK (focus_mode_overlay_opacity >= 0 AND focus_mode_overlay_opacity <= 100),
ADD COLUMN IF NOT EXISTS focus_mode_glow_color text DEFAULT 'yellow';

-- Add focus mode customization columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS focus_mode_overlay_opacity integer DEFAULT 70 CHECK (focus_mode_overlay_opacity >= 0 AND focus_mode_overlay_opacity <= 100),
ADD COLUMN IF NOT EXISTS focus_mode_glow_color text DEFAULT 'yellow';
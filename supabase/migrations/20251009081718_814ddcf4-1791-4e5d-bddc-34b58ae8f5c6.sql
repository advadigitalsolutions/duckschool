-- Add accessibility settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dyslexia_font_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS line_spacing text DEFAULT 'normal' CHECK (line_spacing IN ('normal', '1.5x', '2x')),
ADD COLUMN IF NOT EXISTS letter_spacing text DEFAULT 'normal' CHECK (letter_spacing IN ('normal', 'wide', 'wider')),
ADD COLUMN IF NOT EXISTS color_overlay text DEFAULT 'none' CHECK (color_overlay IN ('none', 'cream', 'mint', 'lavender', 'peach', 'aqua')),
ADD COLUMN IF NOT EXISTS focus_mode_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reading_ruler_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS text_to_speech_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS high_contrast_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bionic_reading_enabled boolean DEFAULT false;
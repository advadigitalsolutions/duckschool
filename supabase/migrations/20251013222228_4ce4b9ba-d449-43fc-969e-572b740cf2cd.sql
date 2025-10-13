-- Add header_settings column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS header_settings jsonb DEFAULT '{}'::jsonb;
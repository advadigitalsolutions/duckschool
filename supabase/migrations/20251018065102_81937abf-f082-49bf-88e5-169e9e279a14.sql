-- Add first_login flag to profiles table to track if user has seen initial tutorial
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- Update existing users to have seen initial tutorial (since they're already in the system)
UPDATE public.profiles
SET first_login = false
WHERE first_login IS NULL;
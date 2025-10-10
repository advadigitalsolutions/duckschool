-- Add hotkey settings column to store keyboard shortcuts for accessibility features
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hotkey_settings JSONB DEFAULT '{}'::jsonb;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS hotkey_settings JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.hotkey_settings IS 'Stores keyboard shortcuts for accessibility features (e.g., {"bionicReading": "ctrl+b"})';
COMMENT ON COLUMN students.hotkey_settings IS 'Stores keyboard shortcuts for accessibility features (e.g., {"bionicReading": "ctrl+b"})';
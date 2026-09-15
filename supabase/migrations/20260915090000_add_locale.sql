-- Add locale column to user_preferences
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'vi';

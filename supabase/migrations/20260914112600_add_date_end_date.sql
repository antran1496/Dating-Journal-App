-- Add end_date to dates table
ALTER TABLE dates ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Migration: Add multi-image support to dates
ALTER TABLE dates ADD COLUMN IF NOT EXISTS checkin_image_urls TEXT[];

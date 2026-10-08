-- Migration: 20261101000200_default_font_be_vietnam.sql
-- Description: Set default fonts to Be Vietnam Pro in user_preferences

ALTER TABLE public.user_preferences
  ALTER COLUMN font_heading SET DEFAULT 'Be Vietnam Pro',
  ALTER COLUMN font_body SET DEFAULT 'Be Vietnam Pro';

UPDATE public.user_preferences
SET font_heading = 'Be Vietnam Pro', font_body = 'Be Vietnam Pro'
WHERE font_heading = 'Playfair Display' AND font_body = 'Inter';

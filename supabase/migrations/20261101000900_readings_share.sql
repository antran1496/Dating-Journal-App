-- Migration 20261101000900_readings_share.sql
-- Add shared_with_partner to ai_readings and RLS policies

ALTER TABLE ai_readings 
ADD COLUMN IF NOT EXISTS shared_with_partner BOOLEAN NOT NULL DEFAULT false;

-- Allow user to update their own readings (for toggling shared_with_partner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_readings' AND policyname = 'ai_readings_update'
  ) THEN
    CREATE POLICY "ai_readings_update" ON ai_readings
    FOR UPDATE USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());
  END IF;
END $$;

-- Allow partner to read shared readings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_readings' AND policyname = 'ai_readings_partner_select'
  ) THEN
    CREATE POLICY "ai_readings_partner_select" ON ai_readings
    FOR SELECT USING (
      shared_with_partner = true
      AND profile_id IN (
        SELECT cm2.profile_id
        FROM couple_members cm1
        JOIN couple_members cm2 ON cm1.couple_id = cm2.couple_id
        WHERE cm1.profile_id = auth.uid()
          AND cm2.profile_id != auth.uid()
      )
    );
  END IF;
END $$;

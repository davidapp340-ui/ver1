/*
  # Add avatar_id column to children table

  1. Modified Tables
    - `children`
      - Added `avatar_id` (text, default 'default') - stores the selected avatar identifier

  2. Notes
    - Children can select from a set of pre-defined avatars
    - Default value is 'default' so all existing children get a valid avatar
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'avatar_id'
  ) THEN
    ALTER TABLE children ADD COLUMN avatar_id text NOT NULL DEFAULT 'default';
  END IF;
END $$;

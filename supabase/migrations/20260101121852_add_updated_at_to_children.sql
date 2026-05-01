/*
  # Add updated_at Column to Children Table
  
  ## Overview
  This migration adds the missing `updated_at` column to the `children` table.
  This column is required by the `validate_and_link_child` RPC function.
  
  ## Changes
  
  ### children table
  - Add `updated_at` (timestamptz, default now()) - Tracks when child records are modified
  
  ## Important Notes
  - Uses conditional logic to prevent errors if column already exists
  - Sets default value to `now()` for automatic timestamp management
  - Existing records will have `updated_at` set to the current timestamp
*/

-- Add updated_at column to children table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE children ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

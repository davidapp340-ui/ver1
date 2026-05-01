/*
  # Add Medical and Vision Profile Schema

  ## Overview
  This migration adds comprehensive medical and vision tracking capabilities to the children profile system.

  ## 1. Children Table Updates
  Adds the following columns to the `children` table:
    - `birth_date` (date, required) - Child's date of birth for age-appropriate activities
    - `gender` (text, optional) - Gender identity with check constraint (male/female/other)
    - `vision_condition` (text) - Current vision diagnosis (myopia, amblyopia, hyperopia, strabismus, other, unknown)
    - `wears_glasses` (boolean, default false) - Whether child currently wears corrective lenses
    - `current_prescription_left` (decimal, nullable) - Current prescription for left eye
    - `current_prescription_right` (decimal, nullable) - Current prescription for right eye
    - `data_consent_at` (timestamptz, required) - Legal consent timestamp for data collection

  ## 2. New Tables
  ### `vision_history`
    - Tracks historical vision test results and prescription changes over time
    - Columns:
      - `id` (uuid, primary key) - Unique identifier
      - `child_id` (uuid, foreign key) - References children table
      - `recorded_at` (date) - Date of vision test or prescription update
      - `prescription_left` (decimal) - Left eye prescription value
      - `prescription_right` (decimal) - Right eye prescription value
      - `notes` (text, nullable) - Additional notes from optometrist or parent
      - `created_at` (timestamptz) - Record creation timestamp

  ## 3. Security
    - Enable RLS on vision_history table
    - Add policies for authenticated parents to manage their children's vision history
    - Parents can only access vision history for children in their family
*/

-- Add new columns to children table
DO $$
BEGIN
  -- Add birth_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE children ADD COLUMN birth_date date;
  END IF;

  -- Add gender column with check constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'gender'
  ) THEN
    ALTER TABLE children ADD COLUMN gender text;
    ALTER TABLE children ADD CONSTRAINT children_gender_check 
      CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));
  END IF;

  -- Add vision_condition column with check constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'vision_condition'
  ) THEN
    ALTER TABLE children ADD COLUMN vision_condition text DEFAULT 'unknown';
    ALTER TABLE children ADD CONSTRAINT children_vision_condition_check 
      CHECK (vision_condition IN ('myopia', 'amblyopia', 'hyperopia', 'strabismus', 'other', 'unknown'));
  END IF;

  -- Add wears_glasses column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'wears_glasses'
  ) THEN
    ALTER TABLE children ADD COLUMN wears_glasses boolean DEFAULT false;
  END IF;

  -- Add current_prescription_left column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'current_prescription_left'
  ) THEN
    ALTER TABLE children ADD COLUMN current_prescription_left decimal(4, 2);
  END IF;

  -- Add current_prescription_right column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'current_prescription_right'
  ) THEN
    ALTER TABLE children ADD COLUMN current_prescription_right decimal(4, 2);
  END IF;

  -- Add data_consent_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'data_consent_at'
  ) THEN
    ALTER TABLE children ADD COLUMN data_consent_at timestamptz;
  END IF;
END $$;

-- Create vision_history table
CREATE TABLE IF NOT EXISTS vision_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  prescription_left decimal(4, 2),
  prescription_right decimal(4, 2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries by child_id
CREATE INDEX IF NOT EXISTS vision_history_child_id_idx ON vision_history(child_id);

-- Create index for sorting by date
CREATE INDEX IF NOT EXISTS vision_history_recorded_at_idx ON vision_history(recorded_at DESC);

-- Enable RLS on vision_history table
ALTER TABLE vision_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vision_history

-- Parents can view vision history for children in their family
CREATE POLICY "Parents can view their children's vision history"
  ON vision_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = vision_history.child_id
      AND children.family_id IN (
        SELECT family_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Parents can insert vision history for children in their family
CREATE POLICY "Parents can create vision history for their children"
  ON vision_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = vision_history.child_id
      AND children.family_id IN (
        SELECT family_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Parents can update vision history for children in their family
CREATE POLICY "Parents can update their children's vision history"
  ON vision_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = vision_history.child_id
      AND children.family_id IN (
        SELECT family_id FROM profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = vision_history.child_id
      AND children.family_id IN (
        SELECT family_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Parents can delete vision history for children in their family
CREATE POLICY "Parents can delete their children's vision history"
  ON vision_history
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = vision_history.child_id
      AND children.family_id IN (
        SELECT family_id FROM profiles WHERE id = auth.uid()
      )
    )
  );
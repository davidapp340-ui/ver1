/*
  # Create Library Items Configuration Table

  1. New Tables
    - `library_items`
      - `id` (uuid, primary key) - Unique identifier
      - `exercise_id` (uuid, foreign key) - References exercises table
      - `category_name` (text) - Category grouping (e.g., "Zoom", "Relax")
      - `category_color` (text) - HEX color code for UI theming (e.g., "#FF5733")
      - `enable_audio` (boolean) - Whether to play audio for this configuration
      - `enable_animation` (boolean) - Whether to show animation for this configuration
      - `sort_order` (integer) - Display order within category
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `library_items` table
    - Add policies for authenticated users to read library configurations
    - Add policies for authenticated users to manage their library items

  3. Relationships
    - Foreign key constraint to exercises table
    - Cascade delete when exercise is removed

  4. Seed Data
    - Add Palming Exercise to "Relax" category with blue color
*/

-- Create library_items table
CREATE TABLE IF NOT EXISTS library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  category_color text NOT NULL DEFAULT '#4A90E2',
  enable_audio boolean NOT NULL DEFAULT true,
  enable_animation boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_library_items_exercise_id ON library_items(exercise_id);
CREATE INDEX IF NOT EXISTS idx_library_items_category ON library_items(category_name);
CREATE INDEX IF NOT EXISTS idx_library_items_sort_order ON library_items(sort_order);

-- Enable RLS
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read all library items
CREATE POLICY "Authenticated users can view library items"
  ON library_items
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies: Allow authenticated users to insert library items
CREATE POLICY "Authenticated users can create library items"
  ON library_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies: Allow authenticated users to update library items
CREATE POLICY "Authenticated users can update library items"
  ON library_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies: Allow authenticated users to delete library items
CREATE POLICY "Authenticated users can delete library items"
  ON library_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_library_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER library_items_updated_at
  BEFORE UPDATE ON library_items
  FOR EACH ROW
  EXECUTE FUNCTION update_library_items_updated_at();

-- Seed data: Add Palming Exercise to "Relax" category
INSERT INTO library_items (exercise_id, category_name, category_color, enable_audio, enable_animation, sort_order)
SELECT 
  id,
  'Relax',
  '#4A90E2',
  true,
  true,
  1
FROM exercises
WHERE animation_id = 'palming_v1'
ON CONFLICT DO NOTHING;

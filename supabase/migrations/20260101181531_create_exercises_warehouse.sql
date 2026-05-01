/*
  # Create Exercises Warehouse Infrastructure
  
  ## Overview
  This migration establishes the central exercises inventory system. This table serves
  as a clean repository of exercise metadata and references, without mixing in runtime
  configurations like timers, colors, or category associations (those will be managed
  separately in future tables that reference this one).
  
  ## New Tables
  
  ### `exercises`
  Central index for all exercises in the system.
  
  **Logical Keys:**
  - `id` (uuid, primary key) - Unique identifier for cross-table references
  - `animation_id` (text) - String linking to animation component code (e.g., 'eye_rolling_v1')
  - `icon_id` (text) - String linking to icon animation component code
  
  **Media Asset References:**
  - `audio_path_en` (text, nullable) - Path to English audio file in Supabase Storage
  - `audio_path_he` (text, nullable) - Path to Hebrew audio file in Supabase Storage
  
  **Textual Content:**
  - `title_en` (text) - English title
  - `title_he` (text) - Hebrew title
  - `description_en` (text, nullable) - English description
  - `description_he` (text, nullable) - Hebrew description
  
  **System Status:**
  - `status` (text) - Either 'active' or 'hidden' for warehouse management
  
  **Timestamps:**
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last modification time
  
  ## Storage
  Creates a public bucket 'exercise-audio' for audio file storage
  
  ## Security
  - Enable RLS on exercises table
  - Public/anon can read active exercises
  - Authenticated users can manage all exercises
  
  ## Seed Data
  Includes one example "ball tracking" exercise with complete metadata
*/

-- Create the exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Logical keys for code integration
  animation_id text NOT NULL,
  icon_id text NOT NULL,
  
  -- Media asset references (paths to Storage)
  audio_path_en text,
  audio_path_he text,
  
  -- Textual content (i18n)
  title_en text NOT NULL,
  title_he text NOT NULL,
  description_en text,
  description_he text,
  
  -- System status for warehouse management
  status text NOT NULL DEFAULT 'active',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'hidden'))
);

-- Create index for faster queries by status
CREATE INDEX IF NOT EXISTS idx_exercises_status ON exercises(status);

-- Create index for animation_id lookups
CREATE INDEX IF NOT EXISTS idx_exercises_animation_id ON exercises(animation_id);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Public/anon can read active exercises
CREATE POLICY "Public can view active exercises"
  ON exercises
  FOR SELECT
  USING (status = 'active');

-- Policy: Authenticated users can view all exercises
CREATE POLICY "Authenticated users can view all exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert exercises
CREATE POLICY "Authenticated users can insert exercises"
  ON exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update exercises
CREATE POLICY "Authenticated users can update exercises"
  ON exercises
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete exercises
CREATE POLICY "Authenticated users can delete exercises"
  ON exercises
  FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for exercise audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-audio', 'exercise-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies with conditional creation
DO $$
BEGIN
  -- Public can read audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can read exercise audio'
  ) THEN
    CREATE POLICY "Public can read exercise audio"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'exercise-audio');
  END IF;

  -- Authenticated users can upload audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload exercise audio'
  ) THEN
    CREATE POLICY "Authenticated users can upload exercise audio"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'exercise-audio');
  END IF;

  -- Authenticated users can update audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update exercise audio'
  ) THEN
    CREATE POLICY "Authenticated users can update exercise audio"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'exercise-audio')
      WITH CHECK (bucket_id = 'exercise-audio');
  END IF;

  -- Authenticated users can delete audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete exercise audio'
  ) THEN
    CREATE POLICY "Authenticated users can delete exercise audio"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'exercise-audio');
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS exercises_updated_at ON exercises;
CREATE TRIGGER exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_exercises_updated_at();

-- Seed data: Ball tracking exercise example
INSERT INTO exercises (
  animation_id,
  icon_id,
  audio_path_en,
  audio_path_he,
  title_en,
  title_he,
  description_en,
  description_he,
  status
) VALUES (
  'ball_tracking_v1',
  'ball_icon_v1',
  'exercise-audio/ball_tracking_en.mp3',
  'exercise-audio/ball_tracking_he.mp3',
  'Ball Tracking',
  'מעקב אחר כדור',
  'Follow the moving ball with your eyes to improve visual tracking and focus.',
  'עקבו אחר הכדור הנע בעיניים כדי לשפר מעקב ויזואלי ומיקוד.',
  'active'
) ON CONFLICT DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE exercises IS 
'Central inventory of all exercises. Contains metadata and references only - runtime configurations like timers and categories are managed in separate tables that reference this one.';

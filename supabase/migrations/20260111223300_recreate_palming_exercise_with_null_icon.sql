/*
  # Recreate Palming Exercise with NULL icon_id
  
  ## Overview
  This migration removes the existing Palming exercise and recreates it with a NULL
  icon_id, since icons are not yet available. It also ensures the library item
  is properly configured.
  
  ## Changes
  1. Delete existing Palming exercise (cascade deletes library_items)
  2. Insert new Palming exercise with NULL icon_id
  3. Insert library item configuration for Relax category
  
  ## Data
  - animation_id: 'palming_v1' (matches ExerciseRegistry.tsx)
  - icon_id: NULL (icons not ready yet)
  - Bilingual titles and descriptions
  - Category: 'Relax' with blue color (#4A90E2)
*/

-- Delete existing Palming exercise (cascade will remove library_items)
DELETE FROM exercises WHERE animation_id = 'palming_v1';

-- Insert Palming exercise with NULL icon_id
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
  'palming_v1',
  NULL,
  NULL,
  NULL,
  'Palming',
  'הרפיית עיניים',
  'Rub your palms together until warm, then gently cover your closed eyes. Breathe deeply and relax.',
  'שפשפו את כפות הידיים זו בזו עד שיתחממו, ואז כסו בעדינות את העיניים העצומות. נשמו עמוק והירגעו.',
  'active'
);

-- Add Palming exercise to library with Relax category
INSERT INTO library_items (
  exercise_id,
  category_name,
  category_color,
  enable_audio,
  enable_animation,
  sort_order
)
SELECT 
  id,
  'Relax',
  '#4A90E2',
  false,
  true,
  1
FROM exercises
WHERE animation_id = 'palming_v1';

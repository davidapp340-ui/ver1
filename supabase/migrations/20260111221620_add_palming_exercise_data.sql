/*
  # Add Palming Exercise Data
  
  ## Overview
  This migration adds the Palming relaxation exercise to both the exercises warehouse
  and the library_items table, making it available in the child's app.
  
  ## 1. Exercise Record
  Inserts into `exercises` table:
    - animation_id: 'palming_v1' (matches ExerciseRegistry.tsx)
    - icon_id: 'palming_icon'
    - audio_path_en: NULL (no audio yet)
    - audio_path_he: NULL (no audio yet)
    - title_en: 'Palming'
    - title_he: 'הרפיית עיניים'
    - description_en: English instructions
    - description_he: Hebrew instructions
    - status: 'active'
  
  ## 2. Library Item Record
  Inserts into `library_items` table:
    - References the inserted exercise
    - category_name: 'Relax'
    - category_color: '#4A90E2' (blue)
    - enable_audio: false (no audio files available)
    - enable_animation: true
    - sort_order: 1
  
  ## Benefits
    - Makes Palming exercise visible in child app library
    - Provides relaxation exercise for eye training
    - Bilingual support (English/Hebrew)
*/

-- Insert the Palming exercise into the warehouse
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
  'palming_icon',
  NULL,
  NULL,
  'Palming',
  'הרפיית עיניים',
  'Rub your palms together until warm, then gently cover your closed eyes. Breathe deeply and relax.',
  'שפשפו את כפות הידיים זו בזו עד שיתחממו, ואז כסו בעדינות את העיניים העצומות. נשמו עמוק והירגעו.',
  'active'
) ON CONFLICT DO NOTHING;

-- Add the Palming exercise to the library with Relax category
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
WHERE animation_id = 'palming_v1'
ON CONFLICT DO NOTHING;

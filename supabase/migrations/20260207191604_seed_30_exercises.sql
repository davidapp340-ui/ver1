/*
  # Seed 30 Exercises for Library Testing
  
  ## Overview
  This migration adds 29 placeholder exercises (Exercise 2-30) to the exercises warehouse
  and library_items table to enable comprehensive testing of the gallery and player functionality.
  
  ## 1. Exercise Records
  Inserts into `exercises` table for each exercise:
    - animation_id: 'ex_02' through 'ex_30' (matching ExerciseRegistry.tsx)
    - icon_id: NULL (no custom icons yet)
    - audio_path_en: NULL
    - audio_path_he: NULL
    - title_en: 'Exercise [Number]'
    - title_he: 'תרגיל [Number]'
    - description_en: Generic English description
    - description_he: Generic Hebrew description
    - status: 'active'
  
  ## 2. Library Item Records
  For each exercise, inserts into `library_items` table:
    - References the inserted exercise
    - category_name: Randomly assigned ('Relax', 'Focus', or 'Energy')
    - category_color: Corresponding color for category
    - enable_audio: false
    - enable_animation: true
    - sort_order: Sequential (2-30)
  
  ## Category Distribution
    - Relax (Blue #4A90E2): Exercises 2, 5, 8, 11, 14, 17, 20, 23, 26, 29
    - Focus (Green #66BB6A): Exercises 3, 6, 9, 12, 15, 18, 21, 24, 27, 30
    - Energy (Orange #FF9800): Exercises 4, 7, 10, 13, 16, 19, 22, 25, 28
  
  ## Benefits
    - Provides 30 total exercises for comprehensive gallery testing
    - Demonstrates scrolling and pagination in library view
    - Tests exercise player functionality with multiple items
    - Balanced category distribution for filtering tests
*/

DO $$
DECLARE
  v_exercise_id uuid;
  v_category_name text;
  v_category_color text;
  v_animation_id text;
  v_exists boolean;
BEGIN
  -- Loop through exercises 2 to 30
  FOR i IN 2..30 LOOP
    v_animation_id := 'ex_' || LPAD(i::text, 2, '0');
    
    -- Check if exercise already exists
    SELECT EXISTS(
      SELECT 1 FROM exercises WHERE animation_id = v_animation_id
    ) INTO v_exists;
    
    -- Skip if already exists
    IF v_exists THEN
      CONTINUE;
    END IF;
    
    -- Determine category based on exercise number (rotating pattern)
    IF (i % 3) = 2 THEN
      v_category_name := 'Relax';
      v_category_color := '#4A90E2';
    ELSIF (i % 3) = 0 THEN
      v_category_name := 'Focus';
      v_category_color := '#66BB6A';
    ELSE
      v_category_name := 'Energy';
      v_category_color := '#FF9800';
    END IF;

    -- Insert into exercises table
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
      v_animation_id,
      NULL,
      NULL,
      NULL,
      'Exercise ' || i,
      'תרגיל ' || i,
      'This is a placeholder exercise for testing the gallery and player functionality. The full exercise will be available soon.',
      'זהו תרגיל מציין מיקום לבדיקת גלריה ונגן. התרגיל המלא יהיה זמין בקרוב.',
      'active'
    )
    RETURNING id INTO v_exercise_id;

    -- Add to library_items
    INSERT INTO library_items (
      exercise_id,
      category_name,
      category_color,
      enable_audio,
      enable_animation,
      sort_order
    ) VALUES (
      v_exercise_id,
      v_category_name,
      v_category_color,
      false,
      true,
      i
    );
  END LOOP;
END $$;

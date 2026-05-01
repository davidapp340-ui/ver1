/*
  # Seed Initial Daily Plans and Workout Items
  
  ## Overview
  This migration seeds the database with initial daily plans for Days 1 and 2
  across all three track levels (child, teen, adult).
  
  ## Changes
  
  ### Daily Plans
  - Creates Day 1 and Day 2 plans for each track level
  - Each plan has a title and description
  
  ### Workout Items
  - Adds one workout item per plan
  - Links to the palming exercise (animation_id = 'palming_v1')
  - Sets duration to 30 seconds
  - Sets sequence order to 1
  
  ## Notes
  - Uses IF NOT EXISTS to prevent duplicate insertions
  - Dynamically looks up the exercise ID for palming_v1
  - Safe to run multiple times
*/

DO $$
DECLARE
  v_exercise_id uuid;
  v_child_day1_id uuid;
  v_child_day2_id uuid;
  v_teen_day1_id uuid;
  v_teen_day2_id uuid;
  v_adult_day1_id uuid;
  v_adult_day2_id uuid;
BEGIN
  -- Find the palming exercise ID
  -- First try the specific UUID, then fallback to animation_id lookup
  SELECT id INTO v_exercise_id 
  FROM exercises 
  WHERE id = 'cf2d5453-2538-48b7-824b-5d282958513f'::uuid;
  
  -- If not found, look up by animation_id
  IF v_exercise_id IS NULL THEN
    SELECT id INTO v_exercise_id 
    FROM exercises 
    WHERE animation_id = 'palming_v1'
    LIMIT 1;
  END IF;
  
  -- If still not found, raise an error
  IF v_exercise_id IS NULL THEN
    RAISE EXCEPTION 'Palming exercise not found. Please ensure the exercise data is seeded first.';
  END IF;
  
  -- Insert Day 1 plans for all tracks
  -- Child Track - Day 1
  INSERT INTO daily_plans (track_level, day_number, title, description)
  VALUES ('child', 1, 'Welcome to Your Journey!', 'Start your vision adventure with a relaxing palming exercise.')
  ON CONFLICT (track_level, day_number) DO NOTHING
  RETURNING id INTO v_child_day1_id;
  
  -- If the plan already existed, get its ID
  IF v_child_day1_id IS NULL THEN
    SELECT id INTO v_child_day1_id FROM daily_plans WHERE track_level = 'child' AND day_number = 1;
  END IF;
  
  -- Teen Track - Day 1
  INSERT INTO daily_plans (track_level, day_number, title, description)
  VALUES ('teen', 1, 'Begin Your Vision Quest', 'Kick off your eye training with palming relaxation.')
  ON CONFLICT (track_level, day_number) DO NOTHING
  RETURNING id INTO v_teen_day1_id;
  
  IF v_teen_day1_id IS NULL THEN
    SELECT id INTO v_teen_day1_id FROM daily_plans WHERE track_level = 'teen' AND day_number = 1;
  END IF;
  
  -- Adult Track - Day 1
  INSERT INTO daily_plans (track_level, day_number, title, description)
  VALUES ('adult', 1, 'Start Your Vision Training', 'Begin with a foundational palming exercise for eye relaxation.')
  ON CONFLICT (track_level, day_number) DO NOTHING
  RETURNING id INTO v_adult_day1_id;
  
  IF v_adult_day1_id IS NULL THEN
    SELECT id INTO v_adult_day1_id FROM daily_plans WHERE track_level = 'adult' AND day_number = 1;
  END IF;
  
  -- Insert Day 2 plans for all tracks
  -- Child Track - Day 2
  INSERT INTO daily_plans (track_level, day_number, title, description)
  VALUES ('child', 2, 'Keep Going Strong!', 'Practice palming again to build your routine.')
  ON CONFLICT (track_level, day_number) DO NOTHING
  RETURNING id INTO v_child_day2_id;
  
  IF v_child_day2_id IS NULL THEN
    SELECT id INTO v_child_day2_id FROM daily_plans WHERE track_level = 'child' AND day_number = 2;
  END IF;
  
  -- Teen Track - Day 2
  INSERT INTO daily_plans (track_level, day_number, title, description)
  VALUES ('teen', 2, 'Day 2: Building Momentum', 'Continue your progress with another palming session.')
  ON CONFLICT (track_level, day_number) DO NOTHING
  RETURNING id INTO v_teen_day2_id;
  
  IF v_teen_day2_id IS NULL THEN
    SELECT id INTO v_teen_day2_id FROM daily_plans WHERE track_level = 'teen' AND day_number = 2;
  END IF;
  
  -- Adult Track - Day 2
  INSERT INTO daily_plans (track_level, day_number, title, description)
  VALUES ('adult', 2, 'Day 2: Consistency is Key', 'Reinforce your practice with a second palming session.')
  ON CONFLICT (track_level, day_number) DO NOTHING
  RETURNING id INTO v_adult_day2_id;
  
  IF v_adult_day2_id IS NULL THEN
    SELECT id INTO v_adult_day2_id FROM daily_plans WHERE track_level = 'adult' AND day_number = 2;
  END IF;
  
  -- Insert workout items for all plans
  -- Child Day 1
  INSERT INTO workout_items (plan_id, exercise_id, sequence_order, duration_seconds)
  VALUES (v_child_day1_id, v_exercise_id, 1, 30)
  ON CONFLICT (plan_id, sequence_order) DO NOTHING;
  
  -- Child Day 2
  INSERT INTO workout_items (plan_id, exercise_id, sequence_order, duration_seconds)
  VALUES (v_child_day2_id, v_exercise_id, 1, 30)
  ON CONFLICT (plan_id, sequence_order) DO NOTHING;
  
  -- Teen Day 1
  INSERT INTO workout_items (plan_id, exercise_id, sequence_order, duration_seconds)
  VALUES (v_teen_day1_id, v_exercise_id, 1, 30)
  ON CONFLICT (plan_id, sequence_order) DO NOTHING;
  
  -- Teen Day 2
  INSERT INTO workout_items (plan_id, exercise_id, sequence_order, duration_seconds)
  VALUES (v_teen_day2_id, v_exercise_id, 1, 30)
  ON CONFLICT (plan_id, sequence_order) DO NOTHING;
  
  -- Adult Day 1
  INSERT INTO workout_items (plan_id, exercise_id, sequence_order, duration_seconds)
  VALUES (v_adult_day1_id, v_exercise_id, 1, 30)
  ON CONFLICT (plan_id, sequence_order) DO NOTHING;
  
  -- Adult Day 2
  INSERT INTO workout_items (plan_id, exercise_id, sequence_order, duration_seconds)
  VALUES (v_adult_day2_id, v_exercise_id, 1, 30)
  ON CONFLICT (plan_id, sequence_order) DO NOTHING;
  
  RAISE NOTICE 'Successfully seeded daily plans and workout items for Days 1-2 across all tracks';
END $$;

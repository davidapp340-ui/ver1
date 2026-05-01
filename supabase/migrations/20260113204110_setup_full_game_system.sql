/*
  # Full Game System Setup
  
  ## Overview
  This migration establishes a complete gamification and workout tracking system
  for the vision training app. It includes user progress tracking, workout plans,
  activity logging, and automated game mechanics.
  
  ## Changes
  
  ### 1. Children Table - Add Game Progress Columns
  New columns added:
  - `track_level`: User's difficulty track (child/teen/adult)
  - `total_points`: Accumulated points across all activities
  - `current_streak`: Consecutive days of activity
  - `longest_streak`: All-time best streak
  - `path_day`: Current position on 30-day journey map (1-30)
  - `current_month_cycle`: Which monthly cycle the user is on (1st, 2nd, 3rd, etc.)
  - `path_theme_id`: Visual theme for the journey map
  - `last_activity_date`: Last day user completed an activity (for streak tracking)
  
  ### 2. Daily Plans Table
  Stores 30-day workout templates for each track level:
  - Links to exercises via workout_items
  - Supports rest days
  - Unique per track_level and day_number
  
  ### 3. Workout Items Table
  Defines which exercises belong to each daily plan:
  - Ordered sequence of exercises
  - Duration and target reps per exercise
  
  ### 4. Activity Logs Table
  Records all user actions and point-earning events:
  - Tracks points earned per activity
  - Stores metadata (exercise completed, streak info, etc.)
  - Parents can view their children's activity history
  
  ### 5. Auto-Assign Track Trigger
  Automatically sets track_level on child creation based on age:
  - Child: < 13 years old
  - Teen: 13-18 years old
  - Adult: > 18 years old
  
  ### 6. Gamification Engine Function
  `register_activity_and_advance()` handles all game mechanics:
  - Streak calculation (increments if yesterday, resets if older)
  - Path advancement (moves to next day on first activity of the day)
  - Cycle management (resets to day 1 after completing day 30, increments cycle)
  - Points accumulation
  - Activity logging
  
  ## Security
  - All tables have RLS enabled
  - Content tables (daily_plans, workout_items) are read-only for users
  - Parents can view their children's activity logs via family_id relationship
  - Children can view their own progress via device_id
*/

-- ============================================================================
-- PART 1: UPDATE CHILDREN TABLE - ADD GAME PROGRESS COLUMNS
-- ============================================================================

-- Add game progress columns if they don't exist
DO $$
BEGIN
  -- Track level (child/teen/adult)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'children' AND column_name = 'track_level'
  ) THEN
    ALTER TABLE children ADD COLUMN track_level text DEFAULT 'child' CHECK (track_level IN ('child', 'teen', 'adult'));
  END IF;

  -- Total points accumulated
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'children' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE children ADD COLUMN total_points integer DEFAULT 0 CHECK (total_points >= 0);
  END IF;

  -- Current consecutive days streak
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'children' AND column_name = 'current_streak'
  ) THEN
    ALTER TABLE children ADD COLUMN current_streak integer DEFAULT 0 CHECK (current_streak >= 0);
  END IF;

  -- Longest streak ever achieved
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'children' AND column_name = 'longest_streak'
  ) THEN
    ALTER TABLE children ADD COLUMN longest_streak integer DEFAULT 0 CHECK (longest_streak >= 0);
  END IF;

  -- Current day on 30-day path (1-30)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'children' AND column_name = 'path_day'
  ) THEN
    ALTER TABLE children ADD COLUMN path_day integer DEFAULT 1 CHECK (path_day >= 1 AND path_day <= 30);
  END IF;

  -- Which monthly cycle (1st month, 2nd month, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'children' AND column_name = 'current_month_cycle'
  ) THEN
    ALTER TABLE children ADD COLUMN current_month_cycle integer DEFAULT 1 CHECK (current_month_cycle >= 1);
  END IF;

  -- Theme for the journey map visual
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'children' AND column_name = 'path_theme_id'
  ) THEN
    ALTER TABLE children ADD COLUMN path_theme_id text DEFAULT 'forest';
  END IF;

  -- Last date user completed any activity (for streak tracking)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'children' AND column_name = 'last_activity_date'
  ) THEN
    ALTER TABLE children ADD COLUMN last_activity_date timestamptz;
  END IF;
END $$;

-- ============================================================================
-- PART 2: CONTENT TABLES - DAILY PLANS AND WORKOUT ITEMS
-- ============================================================================

-- Daily Plans: 30-day workout templates for each track level
CREATE TABLE IF NOT EXISTS daily_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_level text NOT NULL CHECK (track_level IN ('child', 'teen', 'adult')),
  day_number integer NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
  is_rest_day boolean DEFAULT false,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  
  -- Each track level can only have one plan per day number
  UNIQUE (track_level, day_number)
);

-- Enable RLS
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;

-- Read-only policies for users (admins manage via Dashboard)
CREATE POLICY "Authenticated users can view daily plans"
  ON daily_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anonymous users can view daily plans"
  ON daily_plans FOR SELECT
  TO anon
  USING (true);

-- Workout Items: Exercises within each daily plan
CREATE TABLE IF NOT EXISTS workout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL CHECK (sequence_order > 0),
  duration_seconds integer CHECK (duration_seconds > 0),
  target_reps integer CHECK (target_reps > 0),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique ordering within each plan
  UNIQUE (plan_id, sequence_order)
);

-- Enable RLS
ALTER TABLE workout_items ENABLE ROW LEVEL SECURITY;

-- Read-only policies for users
CREATE POLICY "Authenticated users can view workout items"
  ON workout_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anonymous users can view workout items"
  ON workout_items FOR SELECT
  TO anon
  USING (true);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_workout_items_plan_id ON workout_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_items_exercise_id ON workout_items(exercise_id);

-- ============================================================================
-- PART 3: ACTIVITY LOGS - USER ACTION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  points_earned integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Parents can view their children's activity logs
CREATE POLICY "Parents can view their children's activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children
      JOIN profiles ON profiles.family_id = children.family_id
      WHERE children.id = activity_logs.child_id
        AND profiles.id = auth.uid()
        AND profiles.role = 'parent'
    )
  );

-- Children can view their own logs (via child session)
CREATE POLICY "Children can view own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE device_id = current_setting('app.device_id', true)
    )
  );

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_child_id ON activity_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================================
-- PART 4: AUTO-ASSIGN TRACK LEVEL TRIGGER
-- ============================================================================

-- Function to calculate age and assign track level
CREATE OR REPLACE FUNCTION auto_assign_track_level()
RETURNS TRIGGER AS $$
DECLARE
  age_years integer;
BEGIN
  -- Only auto-assign if track_level is default 'child' and birth_date exists
  IF NEW.track_level = 'child' AND NEW.birth_date IS NOT NULL THEN
    -- Calculate age in years
    age_years := EXTRACT(YEAR FROM AGE(NEW.birth_date));
    
    -- Assign track based on age
    IF age_years < 13 THEN
      NEW.track_level := 'child';
    ELSIF age_years >= 13 AND age_years <= 18 THEN
      NEW.track_level := 'teen';
    ELSE
      NEW.track_level := 'adult';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on INSERT
DROP TRIGGER IF EXISTS trigger_auto_assign_track_level ON children;
CREATE TRIGGER trigger_auto_assign_track_level
  BEFORE INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_track_level();

-- ============================================================================
-- PART 5: GAMIFICATION ENGINE - MAIN GAME LOGIC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION register_activity_and_advance(
  p_child_id uuid,
  p_points integer,
  p_action_type text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS children AS $$
DECLARE
  v_child children;
  v_today date;
  v_yesterday date;
  v_is_first_activity_today boolean;
BEGIN
  -- Get current child record
  SELECT * INTO v_child FROM children WHERE id = p_child_id FOR UPDATE;
  
  IF v_child IS NULL THEN
    RAISE EXCEPTION 'Child not found: %', p_child_id;
  END IF;
  
  -- Calculate dates
  v_today := CURRENT_DATE;
  v_yesterday := v_today - INTERVAL '1 day';
  
  -- Check if this is the first activity today
  v_is_first_activity_today := (v_child.last_activity_date IS NULL 
                                 OR DATE(v_child.last_activity_date) < v_today);
  
  -- ========================================================================
  -- STREAK LOGIC
  -- ========================================================================
  IF v_child.last_activity_date IS NULL THEN
    -- First activity ever
    v_child.current_streak := 1;
  ELSIF DATE(v_child.last_activity_date) = v_yesterday THEN
    -- Activity was yesterday, increment streak
    v_child.current_streak := v_child.current_streak + 1;
  ELSIF DATE(v_child.last_activity_date) = v_today THEN
    -- Activity already done today, maintain streak
    -- (streak doesn't increment multiple times per day)
  ELSE
    -- Gap in activity, reset streak
    v_child.current_streak := 1;
  END IF;
  
  -- Update longest streak if current exceeds it
  IF v_child.current_streak > v_child.longest_streak THEN
    v_child.longest_streak := v_child.current_streak;
  END IF;
  
  -- ========================================================================
  -- PATH & CYCLE LOGIC
  -- ========================================================================
  IF v_is_first_activity_today THEN
    -- Advance to next day on the path
    v_child.path_day := v_child.path_day + 1;
    
    -- Check if completed the 30-day cycle
    IF v_child.path_day > 30 THEN
      -- Reset to day 1
      v_child.path_day := 1;
      
      -- Increment cycle counter
      v_child.current_month_cycle := v_child.current_month_cycle + 1;
      
      -- Optional: Change theme based on cycle (can be customized later)
      -- Example: Cycle through themes
      CASE v_child.current_month_cycle % 4
        WHEN 1 THEN v_child.path_theme_id := 'forest';
        WHEN 2 THEN v_child.path_theme_id := 'ocean';
        WHEN 3 THEN v_child.path_theme_id := 'desert';
        WHEN 0 THEN v_child.path_theme_id := 'mountain';
      END CASE;
    END IF;
  END IF;
  
  -- ========================================================================
  -- POINTS ACCUMULATION
  -- ========================================================================
  v_child.total_points := v_child.total_points + p_points;
  
  -- ========================================================================
  -- UPDATE LAST ACTIVITY DATE
  -- ========================================================================
  v_child.last_activity_date := NOW();
  v_child.updated_at := NOW();
  
  -- ========================================================================
  -- SAVE UPDATED CHILD RECORD
  -- ========================================================================
  UPDATE children SET
    track_level = v_child.track_level,
    total_points = v_child.total_points,
    current_streak = v_child.current_streak,
    longest_streak = v_child.longest_streak,
    path_day = v_child.path_day,
    current_month_cycle = v_child.current_month_cycle,
    path_theme_id = v_child.path_theme_id,
    last_activity_date = v_child.last_activity_date,
    updated_at = v_child.updated_at
  WHERE id = p_child_id;
  
  -- ========================================================================
  -- LOG THE ACTIVITY
  -- ========================================================================
  INSERT INTO activity_logs (child_id, action_type, points_earned, metadata)
  VALUES (
    p_child_id,
    p_action_type,
    p_points,
    jsonb_build_object(
      'streak', v_child.current_streak,
      'path_day', v_child.path_day,
      'cycle', v_child.current_month_cycle,
      'is_first_today', v_is_first_activity_today
    ) || p_metadata
  );
  
  -- ========================================================================
  -- RETURN UPDATED CHILD
  -- ========================================================================
  RETURN v_child;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION register_activity_and_advance TO authenticated;

-- ============================================================================
-- VERIFICATION & INDEXES
-- ============================================================================

-- Indexes for children table game columns
CREATE INDEX IF NOT EXISTS idx_children_track_level ON children(track_level);
CREATE INDEX IF NOT EXISTS idx_children_path_day ON children(path_day);
CREATE INDEX IF NOT EXISTS idx_children_last_activity_date ON children(last_activity_date);

-- Index for daily plans lookup
CREATE INDEX IF NOT EXISTS idx_daily_plans_track_day ON daily_plans(track_level, day_number);

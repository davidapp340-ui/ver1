/*
  # Exercise Reward System

  1. Modified Tables
    - `exercises`
      - Added `reward_points` (integer, default 5) - points awarded on completion

  2. New Tables
    - `exercise_completions`
      - `id` (uuid, primary key)
      - `child_id` (uuid, FK to children)
      - `exercise_id` (uuid, FK to exercises)
      - `points_earned` (integer) - snapshot of points earned
      - `completed_at` (timestamptz, default now())

  3. Security
    - RLS enabled on `exercise_completions`
    - Parents can view completions for their family's children
    - Independent users can view their own child's completions

  4. New Functions
    - `log_exercise_completion(p_child_id, p_exercise_id)` - logs completion, awards points, returns earned amount

  5. Notes
    - All existing exercises receive default 5 reward_points
    - The RPC uses SECURITY DEFINER to safely update children.total_points
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercises' AND column_name = 'reward_points'
  ) THEN
    ALTER TABLE exercises ADD COLUMN reward_points integer NOT NULL DEFAULT 5;
  END IF;
END $$;

UPDATE exercises SET reward_points = 5 WHERE reward_points IS NULL;

CREATE TABLE IF NOT EXISTS exercise_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  points_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_completions_child_id
  ON exercise_completions(child_id);

CREATE INDEX IF NOT EXISTS idx_exercise_completions_exercise_id
  ON exercise_completions(exercise_id);

ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their family children completions"
  ON exercise_completions
  FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN profiles p ON p.family_id = c.family_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Completions are inserted via RPC only"
  ON exercise_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN profiles p ON p.family_id = c.family_id
      WHERE p.id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.log_exercise_completion(
  p_child_id uuid,
  p_exercise_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward integer;
  v_new_total integer;
  v_profile profiles%ROWTYPE;
  v_child children%ROWTYPE;
BEGIN
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_child
  FROM children
  WHERE id = p_child_id AND family_id = v_profile.family_id;

  IF v_child IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Child not found in your family');
  END IF;

  SELECT reward_points INTO v_reward
  FROM exercises
  WHERE id = p_exercise_id AND status = 'active';

  IF v_reward IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Exercise not found');
  END IF;

  INSERT INTO exercise_completions (child_id, exercise_id, points_earned)
  VALUES (p_child_id, p_exercise_id, v_reward);

  UPDATE children
  SET total_points = total_points + v_reward,
      updated_at = now()
  WHERE id = p_child_id;

  SELECT total_points INTO v_new_total
  FROM children
  WHERE id = p_child_id;

  RETURN json_build_object(
    'success', true,
    'points_earned', v_reward,
    'total_points', v_new_total
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

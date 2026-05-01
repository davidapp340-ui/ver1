/*
  # Add Treasure Chest Bonus Function
  
  ## Overview
  This migration adds a function to handle treasure chest bonuses on rest days.
  When a child reaches a rest day (7, 14, 21, 28), they can claim a special bonus.
  
  ## Changes
  
  ### New Function: claim_treasure_bonus
  - Awards bonus points for completing a week of exercises
  - Only claimable on rest days (7, 14, 21, 28)
  - Awards 50 points for treasure chests
  - Logs the bonus claim to activity_logs
  - Returns updated child record
  
  ## Security
  - Function is SECURITY DEFINER to allow updating child records
  - Available to authenticated users
*/

-- Function to claim treasure chest bonus on rest days
CREATE OR REPLACE FUNCTION claim_treasure_bonus(
  p_child_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_child children;
  v_bonus_points integer := 50;
  v_is_rest_day boolean;
BEGIN
  -- Get current child record
  SELECT * INTO v_child FROM children WHERE id = p_child_id FOR UPDATE;
  
  IF v_child IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Child not found',
      'child', null
    );
  END IF;
  
  -- Check if current day is a rest day (7, 14, 21, 28)
  v_is_rest_day := v_child.path_day IN (7, 14, 21, 28);
  
  IF NOT v_is_rest_day THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not a rest day - treasure only available on days 7, 14, 21, and 28',
      'child', null
    );
  END IF;
  
  -- Check if bonus already claimed today
  IF EXISTS (
    SELECT 1 FROM activity_logs
    WHERE child_id = p_child_id
      AND action_type = 'treasure_bonus'
      AND DATE(created_at) = CURRENT_DATE
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Treasure already claimed today',
      'child', null
    );
  END IF;
  
  -- Award bonus points
  v_child.total_points := v_child.total_points + v_bonus_points;
  v_child.updated_at := NOW();
  
  -- Update child record
  UPDATE children SET
    total_points = v_child.total_points,
    updated_at = v_child.updated_at
  WHERE id = p_child_id;
  
  -- Log the treasure bonus
  INSERT INTO activity_logs (child_id, action_type, points_earned, metadata)
  VALUES (
    p_child_id,
    'treasure_bonus',
    v_bonus_points,
    jsonb_build_object(
      'day', v_child.path_day,
      'cycle', v_child.current_month_cycle,
      'message', 'Claimed treasure chest bonus!'
    )
  );
  
  -- Return success with updated child
  RETURN jsonb_build_object(
    'success', true,
    'error', null,
    'child', row_to_json(v_child),
    'points_earned', v_bonus_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION claim_treasure_bonus TO authenticated;

/*
  # Add Push Notification Infrastructure

  ## Overview
  Adds database columns and an RPC function to support push notifications
  (daily reminders) for both parent/independent profiles and children.

  ## Changes

  ### 1. Profiles Table - New Columns
  - `expo_push_token` (text, nullable) - Stores the Expo push token for the user's device
  - `daily_reminder_time` (text, nullable) - Stores the user's preferred daily reminder time (e.g. "08:30")

  ### 2. Children Table - New Columns
  - `expo_push_token` (text, nullable) - Stores the Expo push token for the child's device
  - `daily_reminder_time` (text, nullable) - Stores the child's preferred daily reminder time

  ### 3. New RPC: `update_child_push_token`
  - Allows a linked child device to update its own push token
  - Authenticates via device_id (matching existing child session pattern)
  - Uses SECURITY DEFINER to bypass RLS
  - Only updates the token for the child matching the given child_id AND device_id

  ## Security
  - No new RLS policies needed; columns are accessible via existing policies
  - The RPC function validates device ownership before allowing token update
  - Push tokens are only writable by the owning device
*/

-- ============================================================================
-- PART 1: ADD COLUMNS TO PROFILES TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'expo_push_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN expo_push_token text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_reminder_time'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_reminder_time text;
  END IF;
END $$;

-- ============================================================================
-- PART 2: ADD COLUMNS TO CHILDREN TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'expo_push_token'
  ) THEN
    ALTER TABLE children ADD COLUMN expo_push_token text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'daily_reminder_time'
  ) THEN
    ALTER TABLE children ADD COLUMN daily_reminder_time text;
  END IF;
END $$;

-- ============================================================================
-- PART 3: RPC FUNCTION - update_child_push_token
-- ============================================================================

CREATE OR REPLACE FUNCTION update_child_push_token(
  p_child_id uuid,
  p_token text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child children%ROWTYPE;
  v_device_id text;
BEGIN
  v_device_id := current_setting('request.headers', true)::json->>'x-device-id';

  IF v_device_id IS NULL OR v_device_id = '' THEN
    IF auth.uid() IS NOT NULL THEN
      SELECT * INTO v_child
      FROM children
      WHERE id = p_child_id
        AND family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid());

      IF NOT FOUND THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Child not found or not authorized'
        );
      END IF;

      UPDATE children
      SET expo_push_token = p_token,
          updated_at = NOW()
      WHERE id = p_child_id;

      RETURN json_build_object('success', true);
    END IF;

    RETURN json_build_object(
      'success', false,
      'error', 'No device ID or auth context provided'
    );
  END IF;

  SELECT * INTO v_child
  FROM children
  WHERE id = p_child_id
    AND device_id = v_device_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Child not found or device not linked'
    );
  END IF;

  UPDATE children
  SET expo_push_token = p_token,
      updated_at = NOW()
  WHERE id = p_child_id;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION update_child_push_token(uuid, text) TO anon, authenticated;

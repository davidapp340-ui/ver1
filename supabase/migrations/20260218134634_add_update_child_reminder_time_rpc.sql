/*
  # Add update_child_reminder_time RPC function

  ## Overview
  Creates a secure RPC function that allows a child device session to update
  the daily_reminder_time on their own children row. Follows the same
  device-based authentication pattern as update_child_push_token.

  ## New Function
  - `update_child_reminder_time(p_child_id uuid, p_time text)`
    - Authenticates via device_id header OR auth.uid() for independent/parent users
    - Updates the daily_reminder_time column on the matching child row
    - Returns JSON with success/error status

  ## Security
  - SECURITY DEFINER to bypass RLS after validating ownership
  - Device-based children authenticate via x-device-id header
  - Authenticated users (parents/independent) validate via family_id
*/

CREATE OR REPLACE FUNCTION update_child_reminder_time(
  p_child_id uuid,
  p_time text
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
      SET daily_reminder_time = p_time,
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
  SET daily_reminder_time = p_time,
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

GRANT EXECUTE ON FUNCTION update_child_reminder_time(uuid, text) TO anon, authenticated;

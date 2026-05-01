/*
  # Add Single Session Lock System

  1. Modified Tables
    - `profiles`
      - `is_active_session` (boolean, default false) - whether user has an active session
      - `last_heartbeat` (timestamptz, nullable) - last heartbeat timestamp
      - `session_device_id` (text, nullable) - device ID of current active session
    - `children`
      - `is_active_session` (boolean, default false) - whether child has an active session
      - `last_heartbeat` (timestamptz, nullable) - last heartbeat timestamp
      - `session_device_id` (text, nullable) - device ID of current active session

  2. New Functions
    - `check_session_lock_profile` - checks if a profile has an active session lock
    - `check_session_lock_child` - checks if a child has an active session lock
    - `heartbeat_profile` - updates heartbeat for a profile session
    - `heartbeat_child` - updates heartbeat for a child session
    - `release_session_profile` - releases session lock for a profile
    - `release_session_child` - releases session lock for a child

  3. Security
    - All functions use SECURITY DEFINER with explicit search_path
    - Profile heartbeat requires authenticated user matching profile ID
    - Child heartbeat uses child ID parameter
    - Session lock check is accessible during login flow
*/

-- Add session columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_active_session'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active_session boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_heartbeat'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_heartbeat timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'session_device_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN session_device_id text;
  END IF;
END $$;

-- Add session columns to children
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'is_active_session'
  ) THEN
    ALTER TABLE children ADD COLUMN is_active_session boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'last_heartbeat'
  ) THEN
    ALTER TABLE children ADD COLUMN last_heartbeat timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'session_device_id'
  ) THEN
    ALTER TABLE children ADD COLUMN session_device_id text;
  END IF;
END $$;

-- Function: Check session lock for a profile (used before login)
CREATE OR REPLACE FUNCTION check_session_lock_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_active boolean;
  v_last_heartbeat timestamptz;
  v_device_id text;
BEGIN
  SELECT is_active_session, last_heartbeat, session_device_id
  INTO v_is_active, v_last_heartbeat, v_device_id
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('locked', false, 'reason', 'not_found');
  END IF;

  IF v_is_active = true AND v_last_heartbeat IS NOT NULL
     AND v_last_heartbeat > (now() - interval '2 minutes') THEN
    RETURN jsonb_build_object('locked', true, 'device_id', v_device_id);
  END IF;

  RETURN jsonb_build_object('locked', false);
END;
$$;

-- Function: Check session lock for a child (used before login)
CREATE OR REPLACE FUNCTION check_session_lock_child(p_child_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_active boolean;
  v_last_heartbeat timestamptz;
  v_device_id text;
BEGIN
  SELECT is_active_session, last_heartbeat, session_device_id
  INTO v_is_active, v_last_heartbeat, v_device_id
  FROM children
  WHERE id = p_child_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('locked', false, 'reason', 'not_found');
  END IF;

  IF v_is_active = true AND v_last_heartbeat IS NOT NULL
     AND v_last_heartbeat > (now() - interval '2 minutes') THEN
    RETURN jsonb_build_object('locked', true, 'device_id', v_device_id);
  END IF;

  RETURN jsonb_build_object('locked', false);
END;
$$;

-- Function: Send heartbeat for a profile session
CREATE OR REPLACE FUNCTION heartbeat_profile(p_device_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  UPDATE profiles
  SET is_active_session = true,
      last_heartbeat = now(),
      session_device_id = p_device_id
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Send heartbeat for a child session
CREATE OR REPLACE FUNCTION heartbeat_child(p_child_id uuid, p_device_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE children
  SET is_active_session = true,
      last_heartbeat = now(),
      session_device_id = p_device_id
  WHERE id = p_child_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Release session lock for a profile
CREATE OR REPLACE FUNCTION release_session_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  UPDATE profiles
  SET is_active_session = false,
      last_heartbeat = null,
      session_device_id = null
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Release session lock for a child
CREATE OR REPLACE FUNCTION release_session_child(p_child_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE children
  SET is_active_session = false,
      last_heartbeat = null,
      session_device_id = null
  WHERE id = p_child_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

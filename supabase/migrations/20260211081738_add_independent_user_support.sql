/*
  # Independent User Support - Schema, Trigger, & RPC Functions

  ## Overview
  Adds support for "Independent Users" who function as both parent and child.
  Uses the "Phantom Child Pattern" where independent users automatically
  get a linked child record so existing game logic (Path, Exercises, Progress)
  works without modification.

  ## Changes

  ### 1. Profiles Table
  - Add CHECK constraint on `role` column to restrict values to ('parent', 'independent')

  ### 2. Updated `handle_new_user` Trigger Function
  - Now reads `role` from user signup metadata
  - If role = 'independent': atomically creates family + profile + phantom child record
  - If role = 'parent' (default): existing behavior unchanged
  - Phantom child receives medical details from signup metadata (birth_date, gender,
    vision_condition, wears_glasses, prescriptions)
  - If glasses with prescriptions, also creates initial vision_history entry

  ### 3. New RPC: `register_independent_user`
  - Idempotent safety function called after signup
  - Verifies the calling user has role = 'independent'
  - Creates phantom child if not already created by trigger
  - Updates medical details on existing child record
  - Returns the child record for immediate use by the client

  ### 4. New RPC: `get_independent_child`
  - Simple read function for ChildSessionContext
  - Returns the single child record for an independent user
  - Used for auto-login into game mode

  ### 5. Security
  - Existing RLS policies on families and children already work for independent users
    because they use family_id matching via profiles table
  - No new RLS policies needed -- independent users access their data through the
    same family_id mechanism as parents
*/

-- ============================================================================
-- PART 1: ADD CHECK CONSTRAINT TO PROFILES ROLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('parent', 'independent'));
  END IF;
END $$;

-- ============================================================================
-- PART 2: UPDATE handle_new_user TRIGGER - ROLE-AWARE WITH PHANTOM CHILD
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_family_id uuid;
  user_first_name text;
  user_last_name text;
  user_role text;
  family_name text;
  v_child_id uuid;
  v_birth_date date;
  v_gender text;
  v_vision_condition text;
  v_wears_glasses boolean;
  v_prescription_left numeric;
  v_prescription_right numeric;
BEGIN
  user_first_name := NEW.raw_user_meta_data->>'first_name';
  user_last_name := NEW.raw_user_meta_data->>'last_name';
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'parent');

  IF user_role NOT IN ('parent', 'independent') THEN
    user_role := 'parent';
  END IF;

  IF user_last_name IS NOT NULL AND user_last_name != '' THEN
    family_name := user_last_name || ' Family';
  ELSE
    family_name := 'My Family';
  END IF;

  INSERT INTO public.families (name)
  VALUES (family_name)
  RETURNING id INTO new_family_id;

  INSERT INTO public.profiles (id, family_id, email, role, first_name, last_name)
  VALUES (NEW.id, new_family_id, NEW.email, user_role, user_first_name, user_last_name);

  IF user_role = 'independent' THEN
    v_birth_date := (NEW.raw_user_meta_data->>'birth_date')::date;
    v_gender := NULLIF(NEW.raw_user_meta_data->>'gender', '');
    v_vision_condition := COALESCE(NEW.raw_user_meta_data->>'vision_condition', 'unknown');
    v_wears_glasses := COALESCE((NEW.raw_user_meta_data->>'wears_glasses')::boolean, false);
    v_prescription_left := (NEW.raw_user_meta_data->>'prescription_left')::numeric;
    v_prescription_right := (NEW.raw_user_meta_data->>'prescription_right')::numeric;

    INSERT INTO public.children (
      family_id,
      name,
      birth_date,
      gender,
      vision_condition,
      wears_glasses,
      current_prescription_left,
      current_prescription_right,
      data_consent_at,
      created_at,
      updated_at
    ) VALUES (
      new_family_id,
      COALESCE(user_first_name, 'User'),
      v_birth_date,
      v_gender,
      v_vision_condition,
      v_wears_glasses,
      v_prescription_left,
      v_prescription_right,
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_child_id;

    IF v_wears_glasses AND (v_prescription_left IS NOT NULL OR v_prescription_right IS NOT NULL) THEN
      INSERT INTO public.vision_history (
        child_id,
        recorded_at,
        prescription_left,
        prescription_right,
        notes,
        created_at
      ) VALUES (
        v_child_id,
        CURRENT_DATE,
        v_prescription_left,
        v_prescription_right,
        'Initial profile creation',
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 3: RPC - register_independent_user (idempotent safety net)
-- ============================================================================

CREATE OR REPLACE FUNCTION register_independent_user(
  p_name text,
  p_birth_date date,
  p_gender text DEFAULT NULL,
  p_vision_condition text DEFAULT 'unknown',
  p_wears_glasses boolean DEFAULT false,
  p_prescription_left numeric DEFAULT NULL,
  p_prescription_right numeric DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_child children%ROWTYPE;
  v_existing_child children%ROWTYPE;
BEGIN
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_profile.role != 'independent' THEN
    RETURN json_build_object('success', false, 'error', 'User is not an independent user');
  END IF;

  SELECT * INTO v_existing_child
  FROM children
  WHERE family_id = v_profile.family_id
  LIMIT 1;

  IF v_existing_child.id IS NOT NULL THEN
    UPDATE children SET
      name = p_name,
      birth_date = p_birth_date,
      gender = NULLIF(p_gender, ''),
      vision_condition = p_vision_condition,
      wears_glasses = p_wears_glasses,
      current_prescription_left = p_prescription_left,
      current_prescription_right = p_prescription_right,
      data_consent_at = COALESCE(v_existing_child.data_consent_at, NOW()),
      updated_at = NOW()
    WHERE id = v_existing_child.id
    RETURNING * INTO v_child;
  ELSE
    INSERT INTO children (
      family_id,
      name,
      birth_date,
      gender,
      vision_condition,
      wears_glasses,
      current_prescription_left,
      current_prescription_right,
      data_consent_at,
      created_at,
      updated_at
    ) VALUES (
      v_profile.family_id,
      p_name,
      p_birth_date,
      NULLIF(p_gender, ''),
      p_vision_condition,
      p_wears_glasses,
      p_prescription_left,
      p_prescription_right,
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING * INTO v_child;
  END IF;

  IF p_wears_glasses AND (p_prescription_left IS NOT NULL OR p_prescription_right IS NOT NULL) THEN
    INSERT INTO vision_history (
      child_id,
      recorded_at,
      prescription_left,
      prescription_right,
      notes,
      created_at
    ) VALUES (
      v_child.id,
      CURRENT_DATE,
      p_prescription_left,
      p_prescription_right,
      'Independent user registration',
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN json_build_object(
    'success', true,
    'child', row_to_json(v_child)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION register_independent_user(text, date, text, text, boolean, numeric, numeric) TO authenticated;

-- ============================================================================
-- PART 4: RPC - get_independent_child (for ChildSessionContext)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_independent_child()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_child children%ROWTYPE;
BEGIN
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_profile.role != 'independent' THEN
    RETURN json_build_object('success', false, 'error', 'User is not an independent user');
  END IF;

  SELECT * INTO v_child
  FROM children
  WHERE family_id = v_profile.family_id
  LIMIT 1;

  IF v_child.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No child record found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'child', row_to_json(v_child)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_independent_child() TO authenticated;

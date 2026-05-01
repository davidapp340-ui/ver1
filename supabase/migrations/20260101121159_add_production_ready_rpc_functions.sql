/*
  # Add Production-Ready RPC Functions
  
  ## Overview
  This migration adds two critical RPC functions to improve app stability and data integrity:
  
  ## New Functions
  
  ### 1. validate_and_link_child
  - **Purpose**: Validates a linking code using server-side time (fixes device time bug)
  - **Parameters**: 
    - p_linking_code (text): The 6-character linking code to validate
    - p_device_id (text): The device ID to link to the child
  - **Returns**: JSON object with either child data or error
  - **Security**: Uses server-side NOW() to check expiration, preventing client time manipulation
  
  ### 2. create_child_profile  
  - **Purpose**: Creates a child profile with vision history in a single transaction (fixes zombie child bug)
  - **Parameters**:
    - p_family_id (uuid): The family ID
    - p_name (text): Child's name
    - p_birth_date (date): Child's birth date
    - p_gender (text, optional): Child's gender
    - p_vision_condition (text): Vision condition type
    - p_wears_glasses (boolean): Whether child wears glasses
    - p_prescription_left (numeric, optional): Left eye prescription
    - p_prescription_right (numeric, optional): Right eye prescription
    - p_data_consent_at (timestamptz): Consent timestamp
  - **Returns**: JSON object with child data
  - **Security**: All inserts wrapped in transaction (BEGIN...COMMIT), automatic rollback on error
  
  ## Important Notes
  - Both functions use server-side validation and atomic operations
  - Transactions ensure data integrity - no partial writes
  - Error messages are user-friendly and informative
*/

-- Function 1: Validate and link child with server-side time check
CREATE OR REPLACE FUNCTION validate_and_link_child(
  p_linking_code text,
  p_device_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child children%ROWTYPE;
BEGIN
  -- Find child with valid (non-expired) linking code using server time
  SELECT * INTO v_child
  FROM children
  WHERE linking_code = p_linking_code
    AND linking_code_expires_at > NOW()
  LIMIT 1;
  
  -- Check if child was found
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired code'
    );
  END IF;
  
  -- Update the child with the device ID
  UPDATE children
  SET device_id = p_device_id,
      updated_at = NOW()
  WHERE id = v_child.id
  RETURNING * INTO v_child;
  
  -- Return success with child data
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

-- Function 2: Create child profile with vision history in a transaction
CREATE OR REPLACE FUNCTION create_child_profile(
  p_family_id uuid,
  p_name text,
  p_birth_date date,
  p_gender text,
  p_vision_condition text,
  p_wears_glasses boolean,
  p_prescription_left numeric,
  p_prescription_right numeric,
  p_data_consent_at timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child children%ROWTYPE;
  v_vision_history vision_history%ROWTYPE;
BEGIN
  -- Insert child profile
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
    p_family_id,
    p_name,
    p_birth_date,
    NULLIF(p_gender, ''),
    p_vision_condition,
    p_wears_glasses,
    p_prescription_left,
    p_prescription_right,
    p_data_consent_at,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_child;
  
  -- If child wears glasses and has prescription data, create vision history
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
      'Initial profile creation',
      NOW()
    )
    RETURNING * INTO v_vision_history;
  END IF;
  
  -- Return success with child data
  RETURN json_build_object(
    'success', true,
    'child', row_to_json(v_child)
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Transaction automatically rolls back on error
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION validate_and_link_child(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_child_profile(uuid, text, date, text, text, boolean, numeric, numeric, timestamptz) TO authenticated;

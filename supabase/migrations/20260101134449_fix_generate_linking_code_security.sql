/*
  # Fix Generate Linking Code Function Security
  
  ## Problem
  The `generate_linking_code` function is defined with SECURITY INVOKER, which means
  it respects Row Level Security (RLS) policies. When the function tries to UPDATE
  the children table, the RLS policies block the operation even though the function
  already manually validates that the child belongs to the user's family.
  
  ## Solution
  Change the function to use SECURITY DEFINER instead of SECURITY INVOKER. This allows
  the function to bypass RLS policies since it already performs comprehensive security
  checks:
  - Verifies the user is authenticated
  - Validates the child exists
  - Confirms the child belongs to the user's family
  
  ## Changes
  - Drop existing function
  - Recreate with SECURITY DEFINER
  - Add SET search_path = public for additional security
  - Improve return value to match pattern of other RPC functions
  
  ## Security Notes
  This is safe because:
  1. Function validates user authentication (auth.uid())
  2. Function checks family ownership before any operations
  3. Function only updates linking_code fields, nothing sensitive
  4. Pattern matches other secure functions like create_child_profile
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS generate_linking_code(uuid);

-- Recreate with SECURITY DEFINER
CREATE OR REPLACE FUNCTION generate_linking_code(child_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_code text;
  expires_at timestamptz;
  code_exists boolean;
  retry_count int := 0;
  max_retries int := 50;
  child_family_id uuid;
  user_family_id uuid;
BEGIN
  -- Get the authenticated user's family_id
  SELECT family_id INTO user_family_id
  FROM profiles
  WHERE id = auth.uid();

  -- Check if user is authenticated
  IF user_family_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: User not authenticated or profile not found'
    );
  END IF;

  -- Get the child's family_id and verify it belongs to the user's family
  SELECT family_id INTO child_family_id
  FROM children
  WHERE id = child_id_param;

  -- Check if child exists
  IF child_family_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Child not found'
    );
  END IF;

  -- Verify the child belongs to the user's family
  IF child_family_id != user_family_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Child does not belong to your family'
    );
  END IF;

  -- Generate unique code
  LOOP
    -- Generate a random 6-character code
    generated_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    -- Replace any lowercase letters with uppercase and ensure only alphanumeric
    generated_code := translate(
      generated_code,
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    );

    -- Check if this code already exists with active expiration
    SELECT EXISTS(
      SELECT 1
      FROM children
      WHERE linking_code = generated_code
        AND linking_code_expires_at > now()
    ) INTO code_exists;

    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;

    -- Increment retry counter
    retry_count := retry_count + 1;

    -- Prevent infinite loop
    IF retry_count >= max_retries THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Failed to generate unique code after multiple attempts'
      );
    END IF;
  END LOOP;

  -- Set expiration time to 10 minutes from now
  expires_at := now() + interval '10 minutes';

  -- Update the child record with the new code and expiration
  UPDATE children
  SET 
    linking_code = generated_code,
    linking_code_expires_at = expires_at,
    updated_at = now()
  WHERE id = child_id_param;

  -- Return success with the code and expiration time
  RETURN json_build_object(
    'success', true,
    'code', generated_code,
    'expires_at', expires_at
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_linking_code(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION generate_linking_code(uuid) IS 
'Generates a unique 6-character linking code for a child account with 10-minute expiration. Validates family ownership and ensures code uniqueness. Uses SECURITY DEFINER to bypass RLS after manual validation.';

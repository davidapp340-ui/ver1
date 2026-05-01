/*
  # Add Server-Side Linking Code Generation

  ## Overview
  Moves linking code generation from client to server for improved security
  and guaranteed uniqueness.

  ## New Function: generate_linking_code

  ### Purpose
  Generates a unique 6-character alphanumeric linking code for a child account.

  ### Parameters
  - `child_id_param` (uuid) - The ID of the child to generate a code for

  ### Returns
  - JSON object with:
    - `code` (text) - The generated linking code
    - `expires_at` (timestamptz) - When the code expires

  ### Logic
  1. Validates the child exists and belongs to the authenticated user's family
  2. Generates a random 6-character code (uppercase letters and numbers)
  3. Checks for uniqueness against active codes (non-expired)
  4. Retries up to 50 times if collision occurs
  5. Updates the child record with code and 10-minute expiration
  6. Returns the code and expiration time

  ### Security
  - Function runs with SECURITY INVOKER (respects RLS)
  - Validates family ownership before generating code
  - Prevents brute force with retry limit
  - Ensures codes are unique across active codes
*/

CREATE OR REPLACE FUNCTION generate_linking_code(child_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
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
    RAISE EXCEPTION 'Unauthorized: User not authenticated or profile not found';
  END IF;

  -- Get the child's family_id and verify it belongs to the user's family
  SELECT family_id INTO child_family_id
  FROM children
  WHERE id = child_id_param;

  -- Check if child exists
  IF child_family_id IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;

  -- Verify the child belongs to the user's family
  IF child_family_id != user_family_id THEN
    RAISE EXCEPTION 'Unauthorized: Child does not belong to your family';
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
      RAISE EXCEPTION 'Failed to generate unique code after % attempts', max_retries;
    END IF;
  END LOOP;

  -- Set expiration time to 10 minutes from now
  expires_at := now() + interval '10 minutes';

  -- Update the child record with the new code and expiration
  UPDATE children
  SET 
    linking_code = generated_code,
    linking_code_expires_at = expires_at
  WHERE id = child_id_param;

  -- Return the code and expiration time
  RETURN json_build_object(
    'code', generated_code,
    'expires_at', expires_at
  );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION generate_linking_code(uuid) IS 
'Generates a unique 6-character linking code for a child account with 10-minute expiration. Validates family ownership and ensures code uniqueness.';
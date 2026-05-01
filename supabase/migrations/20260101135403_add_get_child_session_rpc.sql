/*
  # Add Child Session Retrieval by Device ID
  
  ## Overview
  This migration adds a secure RPC function to retrieve a child session based on
  the device_id. This solves a critical bug where child sessions were lost after
  the linking_code expired, even though the device was still properly linked.
  
  ## Problem
  The existing RLS policy "Public can view child by valid linking code" only allows
  anonymous access to children when:
  - linking_code_expires_at > now()
  
  This means after the linking code expires (10 minutes), the child app cannot
  restore the session using a direct SELECT query, even though the device_id
  is valid and permanent.
  
  ## Solution
  This RPC function allows session restoration based on device_id (which is permanent)
  rather than linking_code (which is temporary). It bypasses RLS using SECURITY DEFINER
  since device_id is the trusted persistent identifier after successful linking.
  
  ## New Function: get_child_session
  
  ### Parameters
  - p_device_id (text) - The device ID to look up
  
  ### Returns
  JSON object with:
  - success (boolean) - Whether the child was found
  - child (json) - The child record if found
  - error (text) - Error message if failed
  
  ### Security
  - Uses SECURITY DEFINER to bypass RLS
  - Only returns data based on device_id (which is set by secure linking process)
  - Public/anon access is safe because device_id is a strong identifier
  
  ## Important Notes
  - This function is specifically for session restoration
  - The initial linking still requires a valid linking_code through validate_and_link_child
  - Once linked, the device_id becomes the persistent session identifier
*/

CREATE OR REPLACE FUNCTION get_child_session(p_device_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child children%ROWTYPE;
BEGIN
  -- Look up child by device_id
  SELECT * INTO v_child
  FROM children
  WHERE device_id = p_device_id
  LIMIT 1;
  
  -- Check if child was found
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No child found for this device'
    );
  END IF;
  
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

-- Grant execute permissions to public/anon (safe because device_id is the auth mechanism)
GRANT EXECUTE ON FUNCTION get_child_session(text) TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_child_session(text) IS 
'Retrieves a child session by device_id. Used for session restoration after the linking_code expires. Bypasses RLS using SECURITY DEFINER since device_id is a trusted persistent identifier.';

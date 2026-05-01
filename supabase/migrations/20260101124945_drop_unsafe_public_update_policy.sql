/*
  # Remove Unsafe Public Update Policy
  
  ## Overview
  This migration removes a security vulnerability by dropping the policy that allows
  anonymous users to directly update the children table. Device linking should only
  occur through the secure `validate_and_link_child` RPC function.
  
  ## Security Changes
  
  ### Removed Policies
  - "Public can pair device with valid code" - Allowed anon users to directly update
    device_id on children table, bypassing validation logic
  
  ## Important Notes
  - Device linking now ONLY works through the `validate_and_link_child` RPC function
  - This RPC function includes proper validation and security checks
  - Frontend already uses the RPC function exclusively (no code changes needed)
*/

-- Drop the unsafe policy that allows direct updates from anonymous users
DROP POLICY IF EXISTS "Public can pair device with valid code" ON children;

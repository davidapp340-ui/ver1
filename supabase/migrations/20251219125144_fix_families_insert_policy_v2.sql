/*
  # Fix Family Creation During Signup

  ## Problem
  The families table has RLS enabled but the trigger function wasn't properly
  configured to bypass RLS restrictions during family creation.

  ## Solution
  Properly configure the handle_new_user() function with correct security settings
  and error handling.

  ## Changes
  1. Drop the trigger first
  2. Replace the function with proper security configuration
  3. Recreate the trigger
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop and recreate the function with proper security settings
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_family_id uuid;
BEGIN
  -- Create a new family
  INSERT INTO public.families (name)
  VALUES ('My Family')
  RETURNING id INTO new_family_id;

  -- Create the profile linked to the new family
  INSERT INTO public.profiles (id, family_id, email, role)
  VALUES (NEW.id, new_family_id, NEW.email, 'parent');

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();
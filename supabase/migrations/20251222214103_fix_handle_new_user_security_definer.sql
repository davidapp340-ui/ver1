/*
  # Fix handle_new_user Function - Ensure SECURITY DEFINER

  ## Technical Issue
  PostgreSQL functions run with SECURITY INVOKER by default, executing with the
  permissions of the calling user. During signup, new users don't have RLS
  permissions to INSERT into the families table, causing trigger failures.

  ## Solution
  Explicitly recreate the function with SECURITY DEFINER to ensure it executes
  with elevated (admin) privileges, bypassing RLS during the signup process.

  ## Changes
  1. Recreate handle_new_user() function with explicit SECURITY DEFINER
  2. Extract first_name and last_name from NEW.raw_user_meta_data
  3. Create personalized family name using last_name
  4. Store first_name in profiles table
  5. Maintain all existing logic

  ## Security Note
  SECURITY DEFINER is safe here because:
  - Function is triggered automatically by Supabase Auth
  - Only executes during new user signup
  - Creates records that belong to the signing-up user
  - No user-controlled input determines access to other users' data
*/

-- Recreate the handle_new_user function with explicit SECURITY DEFINER
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
  family_name text;
BEGIN
  -- Extract first_name and last_name from user metadata
  user_first_name := NEW.raw_user_meta_data->>'first_name';
  user_last_name := NEW.raw_user_meta_data->>'last_name';

  -- Create family name based on last_name, or use default
  IF user_last_name IS NOT NULL AND user_last_name != '' THEN
    family_name := user_last_name || ' Family';
  ELSE
    family_name := 'My Family';
  END IF;

  -- Create a new family with personalized name
  -- This executes with admin privileges, bypassing RLS
  INSERT INTO public.families (name)
  VALUES (family_name)
  RETURNING id INTO new_family_id;

  -- Create the profile linked to the new family with first_name
  -- This also executes with admin privileges
  INSERT INTO public.profiles (id, family_id, email, role, first_name)
  VALUES (NEW.id, new_family_id, NEW.email, 'parent', user_first_name);

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

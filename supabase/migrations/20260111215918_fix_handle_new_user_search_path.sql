/*
  # Fix handle_new_user Function - Restore search_path Configuration

  ## Issue
  The handle_new_user() function is failing during parent signup because it's missing
  the critical "SET search_path = public" clause. Without this, SECURITY DEFINER
  functions may not properly bypass RLS and can encounter security/execution issues.

  ## Solution
  Recreate the function with the complete SECURITY DEFINER configuration:
  - SECURITY DEFINER: Run with elevated privileges
  - SET search_path = public: Ensure proper schema context and RLS bypass
  
  ## Changes
  - Restore the SET search_path = public clause
  - Maintain all existing logic for first_name and last_name handling
  - Ensure function can successfully insert into families and profiles tables
  
  ## Security Note
  This is safe because the function only creates records for the signing-up user
  and is triggered automatically by Supabase Auth during signup.
*/

-- Recreate the handle_new_user function with proper configuration
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
  -- Executes with admin privileges, bypassing RLS
  INSERT INTO public.families (name)
  VALUES (family_name)
  RETURNING id INTO new_family_id;

  -- Create the profile linked to the new family with first_name and last_name
  -- Executes with admin privileges, bypassing RLS
  INSERT INTO public.profiles (id, family_id, email, role, first_name, last_name)
  VALUES (NEW.id, new_family_id, NEW.email, 'parent', user_first_name, user_last_name);

  RETURN NEW;
END;
$$;

-- Ensure the trigger is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

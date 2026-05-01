/*
  # Add Parent Names to Registration Flow

  ## Overview
  Enhances the parent registration process to capture and store first and last names,
  creating more personalized family records.

  ## 1. Profiles Table Updates
  Adds the following column to the `profiles` table:
    - `first_name` (text, nullable) - Parent's first name captured during registration

  ## 2. Function Updates
  ### Updated `handle_new_user()` function
    - Extracts `first_name` and `last_name` from user metadata (raw_user_meta_data)
    - Uses last_name to create personalized family name (e.g., "Cohen Family")
    - Stores first_name in the profiles table
    - Falls back to "My Family" if no last name provided

  ## 3. Benefits
    - More personalized user experience
    - Better family organization and identification
    - Improved data structure for future features
*/

-- Add first_name column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;
END $$;

-- Update the handle_new_user function to extract names from metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
  INSERT INTO families (name)
  VALUES (family_name)
  RETURNING id INTO new_family_id;

  -- Create the profile linked to the new family with first_name
  INSERT INTO profiles (id, family_id, email, role, first_name)
  VALUES (NEW.id, new_family_id, NEW.email, 'parent', user_first_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
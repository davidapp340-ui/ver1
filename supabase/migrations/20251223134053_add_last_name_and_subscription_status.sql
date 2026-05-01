/*
  # Add Last Name and Subscription Status

  1. Profile Updates
    - Add `last_name` (text, nullable) to profiles table for complete parent name
  
  2. Children Updates
    - Add `subscription_status` (text, default 'active') to track subscription state
    - Possible values: 'active', 'inactive'
  
  3. Benefits
    - Complete parent profile with first and last name
    - Ability to freeze/unfreeze child subscriptions
*/

-- Add last_name column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;
END $$;

-- Add subscription_status column to children table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE children ADD COLUMN subscription_status text NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- Update existing handle_new_user function to include last_name
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

  -- Create the profile linked to the new family with first_name and last_name
  INSERT INTO profiles (id, family_id, email, role, first_name, last_name)
  VALUES (NEW.id, new_family_id, NEW.email, 'parent', user_first_name, user_last_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
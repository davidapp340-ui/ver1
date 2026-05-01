/*
  # Zoomi Fitness App - Initial Schema

  ## Overview
  This migration sets up the core database schema for the Zoomi fitness training app.
  The app uses a Parent-Child hierarchy where parents manage accounts and children
  perform workouts using device pairing without authentication.

  ## New Tables

  ### 1. families
  - `id` (uuid, primary key)
  - `created_at` (timestamptz)
  - `name` (text) - Family display name
  
  Purpose: Groups parents and children into family units

  ### 2. profiles
  - `id` (uuid, primary key, references auth.users)
  - `family_id` (uuid, references families.id)
  - `role` (text) - Currently only 'parent'
  - `email` (text) - Parent's email
  - `created_at` (timestamptz)
  
  Purpose: Extends auth.users for parent accounts

  ### 3. children
  - `id` (uuid, primary key)
  - `family_id` (uuid, references families.id)
  - `name` (text) - Child's display name
  - `linking_code` (text, nullable) - 6-character alphanumeric code for device pairing
  - `linking_code_expires_at` (timestamptz, nullable) - Code expiration timestamp
  - `device_id` (text, nullable) - Device identifier after successful pairing
  - `created_at` (timestamptz)
  
  Purpose: Non-authenticated child accounts that link via device pairing

  ## Security (RLS Policies)

  ### families table
  - Parents can view their own family
  - Parents can update their own family name
  - New families are created via trigger on profile insert

  ### profiles table
  - Parents can view their own profile
  - Parents can update their own profile

  ### children table
  - Parents can view children in their family
  - Parents can insert/update/delete children in their family
  - Public can view children by valid linking code (for pairing)
  - Public can update device_id when pairing
*/

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL DEFAULT 'My Family'
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'parent',
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  linking_code text,
  linking_code_expires_at timestamptz,
  device_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Create index for fast linking code lookup
CREATE INDEX IF NOT EXISTS idx_children_linking_code ON children(linking_code) WHERE linking_code IS NOT NULL;

-- RLS Policies for families table
CREATE POLICY "Parents can view own family"
  ON families FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can update own family"
  ON families FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for children table
CREATE POLICY "Parents can view children in their family"
  ON children FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert children in their family"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can update children in their family"
  ON children FOR UPDATE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete children in their family"
  ON children FOR DELETE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow public access to view children by valid linking code (for pairing)
CREATE POLICY "Public can view child by valid linking code"
  ON children FOR SELECT
  TO anon
  USING (
    linking_code IS NOT NULL 
    AND linking_code_expires_at > now()
  );

-- Allow public to update device_id when pairing
CREATE POLICY "Public can pair device with valid code"
  ON children FOR UPDATE
  TO anon
  USING (
    linking_code IS NOT NULL 
    AND linking_code_expires_at > now()
  )
  WITH CHECK (
    linking_code IS NOT NULL 
    AND linking_code_expires_at > now()
  );

-- Function to automatically create family and profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id uuid;
BEGIN
  -- Create a new family
  INSERT INTO families (name)
  VALUES ('My Family')
  RETURNING id INTO new_family_id;

  -- Create the profile linked to the new family
  INSERT INTO profiles (id, family_id, email, role)
  VALUES (NEW.id, new_family_id, NEW.email, 'parent');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
/*
  # Add Public Access to Library Items
  
  ## Issue
  Children access the app without authentication (device pairing), but the library_items
  table only has policies for authenticated users. This prevents children from seeing
  exercises in their gallery.
  
  ## Solution
  Add RLS policy to allow public/anonymous users to read library_items so children
  can see the exercise gallery.
  
  ## Changes
  1. Add SELECT policy for public/anon users on library_items table
  
  ## Security Note
  This is safe because:
  - Library items are public-facing exercise configurations
  - No sensitive user data is exposed
  - Children need read access to see available exercises
  - Write operations still require authentication
*/

-- Allow public/anonymous users to read library items
CREATE POLICY "Public can view library items"
  ON library_items
  FOR SELECT
  TO anon
  USING (true);

/*
  # Make icon_id Optional in Exercises Table
  
  ## Overview
  This migration modifies the exercises table to make the icon_id column nullable,
  allowing exercises to be created without icons until icons are ready.
  
  ## Changes
  1. Remove NOT NULL constraint from icon_id column in exercises table
  
  ## Benefits
  - Allows exercises to be added without icons
  - More flexible development workflow
  - Can add icons later when ready
  
  ## Security
  No security changes - existing RLS policies remain in place
*/

-- Remove NOT NULL constraint from icon_id column
ALTER TABLE exercises 
ALTER COLUMN icon_id DROP NOT NULL;

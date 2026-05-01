/*
  # Secure Content Tables - Make Read-Only for App Users
  
  ## Security Hardening
  This migration locks down the content management tables (exercises, library_items)
  and storage (exercise-audio bucket) to prevent unauthorized modifications by app users.
  
  ## Changes
  
  ### 1. Exercises Table - Remove Write Access
  Drop policies that allow authenticated users to:
  - INSERT new exercises
  - UPDATE existing exercises
  - DELETE exercises
  
  Keep policies that allow:
  - Public users to SELECT active exercises
  - Authenticated users to SELECT all exercises
  
  ### 2. Library Items Table - Remove Write Access
  Drop policies that allow authenticated users to:
  - INSERT new library items
  - UPDATE existing library items
  - DELETE library items
  
  Keep policies that allow:
  - Anonymous users to SELECT library items
  - Authenticated users to SELECT library items
  
  ### 3. Storage (exercise-audio bucket) - Remove Write Access
  Drop policies that allow authenticated users to:
  - INSERT (upload) audio files
  - UPDATE audio files
  - DELETE audio files
  
  Keep policies that allow:
  - Public users to SELECT (download/stream) audio files
  
  ## Admin Access
  Admins manage content via Supabase Dashboard using service_role credentials,
  which bypass RLS policies. No special admin policies are needed.
  
  ## Security Benefits
  - Prevents app users from modifying or deleting exercises
  - Prevents app users from tampering with library configuration
  - Prevents unauthorized audio file uploads/deletions
  - Maintains read-only access for app functionality
  - Allows admins full control via Dashboard
*/

-- ============================================================================
-- EXERCISES TABLE - REMOVE WRITE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON exercises;
DROP POLICY IF EXISTS "Authenticated users can update exercises" ON exercises;
DROP POLICY IF EXISTS "Authenticated users can delete exercises" ON exercises;

-- Read policies remain unchanged:
-- ✅ "Public can view active exercises" (public role)
-- ✅ "Authenticated users can view all exercises" (authenticated role)

-- ============================================================================
-- LIBRARY_ITEMS TABLE - REMOVE WRITE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create library items" ON library_items;
DROP POLICY IF EXISTS "Authenticated users can update library items" ON library_items;
DROP POLICY IF EXISTS "Authenticated users can delete library items" ON library_items;

-- Read policies remain unchanged:
-- ✅ "Public can view library items" (anon role)
-- ✅ "Authenticated users can view library items" (authenticated role)

-- ============================================================================
-- STORAGE - REMOVE WRITE POLICIES FOR EXERCISE-AUDIO BUCKET
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can upload exercise audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update exercise audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete exercise audio" ON storage.objects;

-- Read policy remains unchanged:
-- ✅ "Public can read exercise audio" (public role)

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

-- After this migration:
-- 1. App users can READ exercises and library items (required for app functionality)
-- 2. App users CANNOT write/modify/delete any content (security hardened)
-- 3. Admins can manage all content via Supabase Dashboard (service_role bypasses RLS)
-- 4. Audio files are publicly readable but not writable by users

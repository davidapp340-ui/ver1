/*
  # Drop Legal Documents Table

  1. Removed Tables
    - `legal_documents` - No longer needed; legal documents are now served
      via external URLs opened in the user's browser instead of being
      stored and rendered in-app.

  2. Security
    - All RLS policies on `legal_documents` are automatically removed with the table drop.

  3. Notes
    - Privacy Policy and Terms of Service are now accessed via external URLs.
    - No data loss concern: the table only contained static legal text that is
      now hosted externally.
*/

DROP TABLE IF EXISTS legal_documents;

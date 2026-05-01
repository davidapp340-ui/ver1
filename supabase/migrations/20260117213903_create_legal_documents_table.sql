/*
  # Create Legal Documents Table

  1. New Tables
    - `legal_documents`
      - `id` (uuid, primary key) - Unique identifier for each legal document
      - `type` (text, unique) - Document type identifier (e.g., 'privacy_policy', 'terms')
      - `title_en` (text) - English title of the document
      - `title_he` (text) - Hebrew title of the document
      - `content_en` (text) - Full policy text in English
      - `content_he` (text) - Full policy text in Hebrew
      - `created_at` (timestamptz) - Timestamp when document was created
      - `updated_at` (timestamptz) - Timestamp when document was last updated

  2. Security
    - Enable RLS on `legal_documents` table
    - Add policy for public read access (anyone can view legal documents)
    - Future: Add admin-only write policies

  3. Seed Data
    - Insert privacy policy document with placeholder content in both languages
*/

-- Create the legal_documents table
CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text UNIQUE NOT NULL,
  title_en text NOT NULL,
  title_he text NOT NULL,
  content_en text NOT NULL,
  content_he text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
-- Anyone (authenticated or not) can read legal documents
CREATE POLICY "Legal documents are publicly readable"
  ON legal_documents
  FOR SELECT
  TO public
  USING (true);

-- Create index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(type);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_legal_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
DROP TRIGGER IF EXISTS set_legal_documents_updated_at ON legal_documents;
CREATE TRIGGER set_legal_documents_updated_at
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_legal_documents_updated_at();

-- Seed data: Insert privacy policy with placeholder content
INSERT INTO legal_documents (type, title_en, title_he, content_en, content_he)
VALUES (
  'privacy_policy',
  'Privacy Policy & Terms of Use',
  'מדיניות פרטיות ותנאי שימוש',
  '# Privacy Policy & Terms of Use

## Last Updated: January 2026

### Introduction
Welcome to Zoomi. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our vision therapy application.

### Information We Collect

**Personal Information:**
- Parent/Guardian contact information (name, email)
- Child profile information (name, date of birth, gender)

**Medical Information:**
- Vision conditions and diagnoses
- Prescription information
- Exercise performance data
- Progress tracking metrics

**Usage Data:**
- App usage patterns
- Exercise completion rates
- Device information

### How We Use Your Information

We use the information we collect to:
- Provide personalized vision therapy exercises
- Track progress and improvement
- Communicate with parents about their child''s progress
- Improve our services and develop new features
- Ensure the safety and security of our platform

### Data Protection

We implement industry-standard security measures to protect your data:
- Encrypted data transmission
- Secure database storage
- Regular security audits
- Limited access to personal information

### Parental Rights

As a parent or legal guardian, you have the right to:
- Access your child''s data
- Request data correction or deletion
- Withdraw consent at any time
- Export your child''s data

### Children''s Privacy

We are committed to protecting children''s privacy. We:
- Require parental consent before collecting any child data
- Only collect information necessary for the service
- Do not sell or share children''s data with third parties
- Comply with COPPA and GDPR regulations

### Data Retention

We retain your data for as long as your account is active or as needed to provide services. You may request data deletion at any time.

### Contact Us

If you have questions about this Privacy Policy, please contact us at:
- Email: privacy@zoomi.app
- Website: www.zoomi.app

### Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app.

### Consent

By using Zoomi, you consent to this Privacy Policy and agree to its terms.',
  '# מדיניות פרטיות ותנאי שימוש

## עדכון אחרון: ינואר 2026

### מבוא
ברוכים הבאים ל-Zoomi. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים, חושפים ומגנים על המידע שלך בעת שימוש באפליקציית הטיפול בראייה שלנו.

### מידע שאנו אוספים

**מידע אישי:**
- פרטי יצירת קשר של הורה/אפוטרופוס (שם, אימייל)
- מידע על פרופיל הילד (שם, תאריך לידה, מגדר)

**מידע רפואי:**
- מצבי ראייה ואבחנות
- מידע על מרשם משקפיים
- נתוני ביצוע תרגילים
- מדדי מעקב התקדמות

**נתוני שימוש:**
- דפוסי שימוש באפליקציה
- שיעורי השלמת תרגילים
- מידע על המכשיר

### כיצד אנו משתמשים במידע שלך

אנו משתמשים במידע שאנו אוספים כדי:
- לספק תרגילי טיפול בראייה מותאמים אישית
- לעקוב אחר התקדמות ושיפור
- לתקשר עם הורים על התקדמות ילדם
- לשפר את השירותים שלנו ולפתח תכונות חדשות
- להבטיח את הבטיחות והאבטחה של הפלטפורמה שלנו

### הגנת מידע

אנו מיישמים אמצעי אבטחה סטנדרטיים בתעשייה כדי להגן על הנתונים שלך:
- העברת נתונים מוצפנת
- אחסון מאובטח במסד נתונים
- ביקורות אבטחה קבועות
- גישה מוגבלת למידע אישי

### זכויות הורים

כהורה או אפוטרופוס חוקי, יש לך את הזכות:
- לגשת לנתוני הילד שלך
- לבקש תיקון או מחיקת נתונים
- למשוך את ההסכמה בכל עת
- לייצא את נתוני הילד שלך

### פרטיות ילדים

אנו מחויבים להגן על פרטיות הילדים. אנחנו:
- דורשים הסכמת הורים לפני איסוף כל נתוני ילד
- אוספים רק מידע הדרוש לשירות
- לא מוכרים או משתפים נתוני ילדים עם צדדים שלישיים
- עומדים בתקנות COPPA ו-GDPR

### שמירת נתונים

אנו שומרים את הנתונים שלך כל עוד החשבון שלך פעיל או לפי הצורך לספק שירותים. תוכל לבקש מחיקת נתונים בכל עת.

### צור קשר

אם יש לך שאלות לגבי מדיניות פרטיות זו, אנא צור איתנו קשר בכתובת:
- דוא"ל: privacy@zoomi.app
- אתר אינטרנט: www.zoomi.app

### שינויים במדיניות זו

אנו עשויים לעדכן את מדיניות הפרטיות הזו מעת לעת. אנו נודיע לך על כל שינוי על ידי פרסום מדיניות הפרטיות החדשה באפליקציה.

### הסכמה

על ידי שימוש ב-Zoomi, אתה מסכים למדיניות פרטיות זו ומסכים לתנאיה.'
)
ON CONFLICT (type) DO NOTHING;
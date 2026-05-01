/*
  # Create FAQ Items Table

  1. New Tables
    - `faq_items`
      - `id` (uuid, primary key) - Unique identifier
      - `question_he` (text) - Question in Hebrew
      - `question_en` (text) - Question in English
      - `answer_he` (text) - Answer in Hebrew (supports markdown)
      - `answer_en` (text) - Answer in English (supports markdown)
      - `sort_order` (integer) - Display ordering
      - `created_at` (timestamptz) - Row creation timestamp

  2. Security
    - Enable RLS on `faq_items` table
    - Add policy for authenticated users to read FAQ items

  3. Seed Data
    - 3 sample FAQ items in both English and Hebrew
*/

CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_he text NOT NULL DEFAULT '',
  question_en text NOT NULL DEFAULT '',
  answer_he text NOT NULL DEFAULT '',
  answer_en text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read FAQ items"
  ON faq_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

INSERT INTO faq_items (question_he, question_en, answer_he, answer_en, sort_order) VALUES
(
  'איך מתחילים?',
  'How do I start?',
  'ברוכים הבאים ל-Zoomi! כדי להתחיל, פשוט היכנסו למסך הבית ולחצו על **"התחל את האימון היומי"**. כל יום תקבלו תרגיל חדש שמותאם אישית להתקדמות שלכם. התרגילים קצרים ופשוטים - בדרך כלל לוקחים 3-5 דקות בלבד.',
  'Welcome to Zoomi! To get started, simply go to the Home screen and tap **"Start Today''s Exercise"**. Each day you''ll receive a new exercise tailored to your progress. The exercises are short and simple - usually taking only 3-5 minutes.',
  1
),
(
  'האם התרגילים בטוחים?',
  'Are the exercises safe?',
  'כן, כל התרגילים ב-Zoomi פותחו על ידי מומחי ראייה ונבדקו בקפידה. התרגילים מבוססים על שיטות מוכחות מדעית לאימון חזותי. עם זאת, אם אתם חשים באי-נוחות כלשהי, הפסיקו מיד ופנו לרופא העיניים שלכם.',
  'Yes, all exercises in Zoomi are developed by vision specialists and have been carefully reviewed. The exercises are based on scientifically proven methods for visual training. However, if you experience any discomfort, stop immediately and consult your eye care professional.',
  2
),
(
  'מידע על המנוי',
  'Subscription information',
  'Zoomi מציעה תקופת ניסיון חינמית כדי שתוכלו להכיר את המערכת. לאחר מכן, תוכלו לבחור בתוכנית המנוי שמתאימה לכם. המנוי כולל גישה מלאה לכל התרגילים, מעקב התקדמות, ותוכן חינוכי. ניתן לבטל בכל עת.',
  'Zoomi offers a free trial period so you can get to know the system. After that, you can choose the subscription plan that suits you. The subscription includes full access to all exercises, progress tracking, and educational content. You can cancel at any time.',
  3
);

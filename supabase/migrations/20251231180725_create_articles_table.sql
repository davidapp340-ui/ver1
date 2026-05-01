/*
  # Create Articles Table for Science & Tips Section

  1. New Tables
    - `articles`
      - `id` (uuid, primary key, auto-generated)
      - `created_at` (timestamptz, default now())
      - `image_url` (text) - Cover image URL
      - `category_he` (text) - Hebrew category
      - `category_en` (text) - English category
      - `title_he` (text) - Hebrew title
      - `title_en` (text) - English title
      - `subtitle_he` (text) - Hebrew subtitle
      - `subtitle_en` (text) - English subtitle
      - `content_he` (text) - Full Hebrew Markdown content
      - `content_en` (text) - Full English Markdown content

  2. Security
    - Enable RLS on `articles` table
    - Add policy for authenticated users to read all articles
    
  3. Seed Data
    - Insert sample article about myopia and focus
*/

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  image_url text NOT NULL,
  category_he text NOT NULL,
  category_en text NOT NULL,
  title_he text NOT NULL,
  title_en text NOT NULL,
  subtitle_he text NOT NULL,
  subtitle_en text NOT NULL,
  content_he text NOT NULL,
  content_en text NOT NULL
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read articles"
  ON articles
  FOR SELECT
  TO authenticated
  USING (true);

-- Seed data: Insert sample article
INSERT INTO articles (
  image_url,
  category_he,
  category_en,
  title_he,
  title_en,
  subtitle_he,
  subtitle_en,
  content_he,
  content_en
) VALUES (
  'https://images.unsplash.com/photo-1544126592-807ade215a0b',
  'מדע ורפואה',
  'Science & Medicine',
  'המיתוס של חוסר ריכוז',
  'The Myth of Lack of Focus',
  'איך קוצר ראייה גונב לילדכם את האנרגיה ללמידה?',
  'How myopia steals your child''s learning energy?',
  '# המיתוס של חוסר ריכוז

האם אי פעם תהיתם מדוע הילד שלכם פשוט ''מתנתק'' אחרי עשר דקות? האמת המדעית מרתקת: לעיתים קרובות, הבעיה היא בעומס המטבולי שהעיניים מייצרות.

### הפיזיקה של המאמץ
ילד עם קוצר ראייה משקיע המון אנרגיה רק כדי לראות. השריר הציליארי עובד שעות נוספות.

### הפתרון של Zoomi
אנחנו מאמנים את המוח והעין לעבוד ביעילות.',
  '# The Myth of Lack of Focus

Have you ever wondered why your child simply "disconnects" after ten minutes? The scientific truth is fascinating: often, the problem lies in the metabolic load that the eyes generate.

### The Physics of Effort
A child with myopia invests tremendous energy just to see. The ciliary muscle works overtime, constantly adjusting to maintain clear vision.

### The Zoomi Solution
We train the brain and eye to work efficiently, reducing visual strain and freeing up cognitive resources for learning.'
);
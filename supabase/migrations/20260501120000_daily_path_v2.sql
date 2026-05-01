/*
  # Daily Path v2 — Completions log, taxonomy, themes, instructions, admin

  Adds:
  - daily_completions: audit trail of completed days per cycle
  - exercise_categories: lookup for library category metadata
  - monthly_themes: lookup driving path theme rotation
  - exercises: instructions_he/en, exercise_type, default_duration_seconds, default_reps
  - profiles.is_admin: gates write access to content tables
  - RPC get_today_task: one-shot fetch for today's plan + items + completion
  - RPC complete_daily_plan: wraps register_activity_and_advance + inserts completion + rotates theme
  - Tightened RLS on exercises / library_items / daily_plans / workout_items so
    only profiles.is_admin can INSERT/UPDATE/DELETE; SELECT remains public/auth.

  First admin must be promoted manually:
    UPDATE profiles SET is_admin = true WHERE email = '<your-email>';
*/

-- ============================================================================
-- PART 1: profiles.is_admin
-- ============================================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Helper used by all admin policies
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated, anon;

-- ============================================================================
-- PART 2: exercise_categories lookup
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercise_categories (
  id text PRIMARY KEY,
  name_en text NOT NULL,
  name_he text NOT NULL,
  color text NOT NULL,
  icon_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON exercise_categories;
CREATE POLICY "Public can view categories"
  ON exercise_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON exercise_categories;
CREATE POLICY "Admins can insert categories"
  ON exercise_categories FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "Admins can update categories" ON exercise_categories;
CREATE POLICY "Admins can update categories"
  ON exercise_categories FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "Admins can delete categories" ON exercise_categories;
CREATE POLICY "Admins can delete categories"
  ON exercise_categories FOR DELETE TO authenticated USING (is_admin_user());

INSERT INTO exercise_categories (id, name_en, name_he, color, sort_order) VALUES
  ('relax',  'Relax',  'הרפיה',  '#4A90E2', 1),
  ('focus',  'Focus',  'מיקוד',  '#66BB6A', 2),
  ('energy', 'Energy', 'אנרגיה', '#FF9800', 3)
ON CONFLICT (id) DO NOTHING;

-- Add category_id to library_items and backfill from category_name
ALTER TABLE library_items
  ADD COLUMN IF NOT EXISTS category_id text REFERENCES exercise_categories(id);

UPDATE library_items
SET category_id = lower(category_name)
WHERE category_id IS NULL
  AND lower(category_name) IN ('relax','focus','energy');

CREATE INDEX IF NOT EXISTS idx_library_items_category_id ON library_items(category_id);

-- ============================================================================
-- PART 3: monthly_themes lookup
-- ============================================================================
CREATE TABLE IF NOT EXISTS monthly_themes (
  id text PRIMARY KEY,
  name_en text NOT NULL,
  name_he text NOT NULL,
  cycle_position integer NOT NULL UNIQUE,
  background_colors jsonb NOT NULL,
  path_color text NOT NULL,
  path_stroke text NOT NULL,
  node_color text NOT NULL,
  node_stroke text NOT NULL,
  locked_node_color text NOT NULL,
  locked_node_stroke text NOT NULL,
  current_glow text NOT NULL,
  decoration jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE monthly_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view themes" ON monthly_themes;
CREATE POLICY "Public can view themes"
  ON monthly_themes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage themes" ON monthly_themes;
CREATE POLICY "Admins can manage themes"
  ON monthly_themes FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

INSERT INTO monthly_themes (
  id, name_en, name_he, cycle_position,
  background_colors, path_color, path_stroke,
  node_color, node_stroke, locked_node_color, locked_node_stroke,
  current_glow, decoration
) VALUES
  ('forest', 'Forest', 'יער', 0,
    '["#0F2A1D","#1A4731","#1E5A3A"]'::jsonb, '#2D6B45', '#3E8E5E',
    '#10B981', '#059669', '#1F3D2D', '#2A5240',
    '#FFD700',
    '{"primary":"#2E7D32","secondary":"#1B5E20","accent":"#4CAF50"}'::jsonb),
  ('ocean', 'Ocean', 'אוקיינוס', 1,
    '["#0A1929","#0D2847","#133E68"]'::jsonb, '#1A4B7A', '#2563A8',
    '#0EA5E9', '#0284C7', '#1A2D40', '#243C55',
    '#67E8F9',
    '{"primary":"#0369A1","secondary":"#075985","accent":"#38BDF8"}'::jsonb),
  ('desert', 'Desert', 'מדבר', 2,
    '["#3B2410","#5C3A1E","#7A4F2C"]'::jsonb, '#A0623A', '#B8794D',
    '#F59E0B', '#D97706', '#4A2F18', '#5E3F22',
    '#FCD34D',
    '{"primary":"#92400E","secondary":"#78350F","accent":"#FBBF24"}'::jsonb),
  ('mountain', 'Mountain', 'הרים', 3,
    '["#1E1B4B","#312E81","#3730A3"]'::jsonb, '#4338CA', '#5B52DC',
    '#818CF8', '#6366F1', '#262050', '#312A60',
    '#F0ABFC',
    '{"primary":"#4C1D95","secondary":"#3730A3","accent":"#A78BFA"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 4: exercises columns (instructions, type, defaults)
-- ============================================================================
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS instructions_he jsonb,
  ADD COLUMN IF NOT EXISTS instructions_en jsonb,
  ADD COLUMN IF NOT EXISTS exercise_type text,
  ADD COLUMN IF NOT EXISTS default_duration_seconds integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS default_reps integer;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'exercises' AND constraint_name = 'exercises_type_valid'
  ) THEN
    ALTER TABLE exercises
      ADD CONSTRAINT exercises_type_valid
      CHECK (exercise_type IS NULL OR exercise_type IN
        ('eye_muscle','near_far','relaxation','blinking','tracking'));
  END IF;
END $$;

-- Seed instructions + types for the exercises that get real animations
-- (palming + 7 placeholders we replace).
UPDATE exercises SET
  exercise_type = 'relaxation',
  default_duration_seconds = 60,
  instructions_he = '[
    {"step":1,"text":"שפשפי את כפות הידיים זו בזו עד שהן מתחממות"},
    {"step":2,"text":"הניחי בעדינות את כפות הידיים על העיניים העצומות"},
    {"step":3,"text":"נשמי לאט ועמוק במשך דקה"}
  ]'::jsonb,
  instructions_en = '[
    {"step":1,"text":"Rub your palms together until they feel warm"},
    {"step":2,"text":"Gently place your warm palms over your closed eyes"},
    {"step":3,"text":"Breathe slowly and deeply for one minute"}
  ]'::jsonb
WHERE animation_id = 'palming_v1';

UPDATE exercises SET
  exercise_type = 'tracking',
  default_duration_seconds = 30,
  title_he = 'מעקב נקודה', title_en = 'Moving Dot',
  instructions_he = '[
    {"step":1,"text":"שבי בנוחות והחזיקי את הראש קבוע"},
    {"step":2,"text":"עקבי אחרי הנקודה הצבעונית בעיניים בלבד"},
    {"step":3,"text":"נסי לא להניע את הראש"}
  ]'::jsonb,
  instructions_en = '[
    {"step":1,"text":"Sit comfortably and keep your head still"},
    {"step":2,"text":"Follow the colored dot with your eyes only"},
    {"step":3,"text":"Try not to move your head"}
  ]'::jsonb
WHERE animation_id = 'ex_03';

UPDATE exercises SET
  exercise_type = 'near_far',
  default_duration_seconds = 30,
  title_he = 'קרוב ורחוק', title_en = 'Near and Far',
  instructions_he = '[
    {"step":1,"text":"התמקדי בעיגול הקטן הקרוב כשהוא מופיע"},
    {"step":2,"text":"כשהוא נעלם, התמקדי בעיגול הגדול הרחוק"},
    {"step":3,"text":"חזרי בכל פעם שמופיעה ההחלפה"}
  ]'::jsonb,
  instructions_en = '[
    {"step":1,"text":"Focus on the small near circle when it appears"},
    {"step":2,"text":"When it disappears, focus on the larger far circle"},
    {"step":3,"text":"Switch focus each time the prompt changes"}
  ]'::jsonb
WHERE animation_id = 'ex_06';

UPDATE exercises SET
  exercise_type = 'blinking',
  default_duration_seconds = 60,
  title_he = 'מצמוץ מודע', title_en = 'Mindful Blinking',
  instructions_he = '[
    {"step":1,"text":"עקבי אחרי קצב המצמוץ המוצג על המסך"},
    {"step":2,"text":"מצמצי בעדינות יחד עם העין שעל המסך"},
    {"step":3,"text":"שימי לב להרגשת הלחות בעיניים"}
  ]'::jsonb,
  instructions_en = '[
    {"step":1,"text":"Follow the blinking rhythm shown on screen"},
    {"step":2,"text":"Blink gently together with the on-screen eye"},
    {"step":3,"text":"Notice how moist your eyes feel"}
  ]'::jsonb
WHERE animation_id = 'ex_09';

UPDATE exercises SET
  exercise_type = 'eye_muscle',
  default_duration_seconds = 40,
  title_he = 'שמינייה', title_en = 'Figure Eight',
  instructions_he = '[
    {"step":1,"text":"דמייני שמינייה גדולה (∞) מולך"},
    {"step":2,"text":"עקבי אחרי הנקודה לאורך השמינייה"},
    {"step":3,"text":"כשמסיימים, החליפי כיוון"}
  ]'::jsonb,
  instructions_en = '[
    {"step":1,"text":"Imagine a large figure-eight (∞) in front of you"},
    {"step":2,"text":"Follow the dot tracing the figure-eight"},
    {"step":3,"text":"When complete, switch direction"}
  ]'::jsonb
WHERE animation_id = 'ex_12';

UPDATE exercises SET
  exercise_type = 'relaxation',
  default_duration_seconds = 90,
  title_he = 'נשימת הרפיה', title_en = 'Breathing Relaxation',
  instructions_he = '[
    {"step":1,"text":"שאפי כשהעיגול מתרחב (4 שניות)"},
    {"step":2,"text":"החזיקי כשהעיגול נעצר (4 שניות)"},
    {"step":3,"text":"נשפי כשהעיגול מתכווץ (4 שניות)"}
  ]'::jsonb,
  instructions_en = '[
    {"step":1,"text":"Inhale as the circle expands (4 seconds)"},
    {"step":2,"text":"Hold while the circle pauses (4 seconds)"},
    {"step":3,"text":"Exhale as the circle contracts (4 seconds)"}
  ]'::jsonb
WHERE animation_id = 'ex_15';

UPDATE exercises SET
  exercise_type = 'eye_muscle',
  default_duration_seconds = 30,
  title_he = 'סריקת פינות', title_en = 'Corners Scan',
  instructions_he = '[
    {"step":1,"text":"כשפינה מאירה — הסיטי את העיניים אליה"},
    {"step":2,"text":"שמרי על הראש קבוע, רק עיניים זזות"},
    {"step":3,"text":"החליפי במהירות בין הפינות"}
  ]'::jsonb,
  instructions_en = '[
    {"step":1,"text":"When a corner lights up, shift your eyes to it"},
    {"step":2,"text":"Keep your head still — only eyes move"},
    {"step":3,"text":"Switch quickly between corners"}
  ]'::jsonb
WHERE animation_id = 'ex_18';

UPDATE exercises SET
  exercise_type = 'near_far',
  default_duration_seconds = 30,
  title_he = 'תרגיל עיפרון', title_en = 'Pencil Push-Ups',
  instructions_he = '[
    {"step":1,"text":"דמייני עיפרון במרחק זרוע מהפנים"},
    {"step":2,"text":"קרבי אותו לאט לאף ושמרי עליו ממוקד"},
    {"step":3,"text":"הרחיקי בחזרה לאט"}
  ]'::jsonb,
  instructions_en = '[
    {"step":1,"text":"Hold a pencil at arm''s length"},
    {"step":2,"text":"Move it slowly toward your nose, keeping it in focus"},
    {"step":3,"text":"Slowly move it back out"}
  ]'::jsonb
WHERE animation_id = 'ex_21';

-- ============================================================================
-- PART 5: daily_completions audit log
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES daily_plans(id),
  day_number integer NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  cycle_number integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer,
  exercises_completed integer NOT NULL DEFAULT 0,
  exercises_total integer NOT NULL,
  points_earned integer NOT NULL DEFAULT 0,
  UNIQUE (child_id, plan_id, cycle_number)
);

CREATE INDEX IF NOT EXISTS idx_daily_completions_child_completed
  ON daily_completions(child_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_completions_child_cycle
  ON daily_completions(child_id, cycle_number);

ALTER TABLE daily_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents view family children completions" ON daily_completions;
CREATE POLICY "Parents view family children completions"
  ON daily_completions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children c
      JOIN profiles p ON p.family_id = c.family_id
      WHERE c.id = daily_completions.child_id
        AND p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Children view own completions" ON daily_completions;
CREATE POLICY "Children view own completions"
  ON daily_completions FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT id FROM children WHERE device_id = current_setting('app.device_id', true)
    )
  );

DROP POLICY IF EXISTS "Anon view completions by device" ON daily_completions;
CREATE POLICY "Anon view completions by device"
  ON daily_completions FOR SELECT TO anon
  USING (
    child_id IN (
      SELECT id FROM children WHERE device_id = current_setting('app.device_id', true)
    )
  );

-- Inserts/updates only via SECURITY DEFINER RPC (no direct policies)

-- ============================================================================
-- PART 6: tighten RLS — admin-only writes on content tables
-- ============================================================================

-- exercises: replace permissive auth-only writes with admin-gated
DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON exercises;
DROP POLICY IF EXISTS "Authenticated users can update exercises" ON exercises;
DROP POLICY IF EXISTS "Authenticated users can delete exercises" ON exercises;

DROP POLICY IF EXISTS "Admins can insert exercises" ON exercises;
CREATE POLICY "Admins can insert exercises"
  ON exercises FOR INSERT TO authenticated WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "Admins can update exercises" ON exercises;
CREATE POLICY "Admins can update exercises"
  ON exercises FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "Admins can delete exercises" ON exercises;
CREATE POLICY "Admins can delete exercises"
  ON exercises FOR DELETE TO authenticated USING (is_admin_user());

-- library_items (existing policy names use "create"/"update"/"delete library items")
DROP POLICY IF EXISTS "Authenticated users can create library items" ON library_items;
DROP POLICY IF EXISTS "Authenticated users can update library items" ON library_items;
DROP POLICY IF EXISTS "Authenticated users can delete library items" ON library_items;

DROP POLICY IF EXISTS "Admins can insert library_items" ON library_items;
CREATE POLICY "Admins can insert library_items"
  ON library_items FOR INSERT TO authenticated WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "Admins can update library_items" ON library_items;
CREATE POLICY "Admins can update library_items"
  ON library_items FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "Admins can delete library_items" ON library_items;
CREATE POLICY "Admins can delete library_items"
  ON library_items FOR DELETE TO authenticated USING (is_admin_user());

-- daily_plans (no existing write policies — add admin-gated ones)
DROP POLICY IF EXISTS "Admins can insert daily_plans" ON daily_plans;
CREATE POLICY "Admins can insert daily_plans"
  ON daily_plans FOR INSERT TO authenticated WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "Admins can update daily_plans" ON daily_plans;
CREATE POLICY "Admins can update daily_plans"
  ON daily_plans FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "Admins can delete daily_plans" ON daily_plans;
CREATE POLICY "Admins can delete daily_plans"
  ON daily_plans FOR DELETE TO authenticated USING (is_admin_user());

-- workout_items (no existing write policies — add admin-gated ones)
DROP POLICY IF EXISTS "Admins can insert workout_items" ON workout_items;
CREATE POLICY "Admins can insert workout_items"
  ON workout_items FOR INSERT TO authenticated WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "Admins can update workout_items" ON workout_items;
CREATE POLICY "Admins can update workout_items"
  ON workout_items FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
DROP POLICY IF EXISTS "Admins can delete workout_items" ON workout_items;
CREATE POLICY "Admins can delete workout_items"
  ON workout_items FOR DELETE TO authenticated USING (is_admin_user());

-- ============================================================================
-- PART 7: get_today_task RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION get_today_task(p_child_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_child children;
  v_plan daily_plans;
  v_items jsonb;
  v_completed_today boolean;
BEGIN
  SELECT * INTO v_child FROM children WHERE id = p_child_id;
  IF v_child IS NULL THEN
    RAISE EXCEPTION 'Child not found: %', p_child_id;
  END IF;

  SELECT * INTO v_plan
  FROM daily_plans
  WHERE track_level = v_child.track_level
    AND day_number = v_child.path_day;

  IF v_plan IS NULL THEN
    RETURN jsonb_build_object(
      'plan', null,
      'items', '[]'::jsonb,
      'completed_this_cycle', false,
      'path_day', v_child.path_day,
      'cycle', v_child.current_month_cycle
    );
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', wi.id,
        'sequence_order', wi.sequence_order,
        'duration_seconds', wi.duration_seconds,
        'target_reps', wi.target_reps,
        'exercise', jsonb_build_object(
          'id', e.id,
          'animation_id', e.animation_id,
          'title_he', e.title_he,
          'title_en', e.title_en,
          'description_he', e.description_he,
          'description_en', e.description_en,
          'instructions_he', e.instructions_he,
          'instructions_en', e.instructions_en,
          'exercise_type', e.exercise_type,
          'audio_path_he', e.audio_path_he,
          'audio_path_en', e.audio_path_en
        )
      )
      ORDER BY wi.sequence_order
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM workout_items wi
  JOIN exercises e ON e.id = wi.exercise_id
  WHERE wi.plan_id = v_plan.id;

  SELECT EXISTS(
    SELECT 1 FROM daily_completions
    WHERE child_id = p_child_id
      AND plan_id = v_plan.id
      AND cycle_number = v_child.current_month_cycle
  ) INTO v_completed_today;

  RETURN jsonb_build_object(
    'plan', to_jsonb(v_plan),
    'items', v_items,
    'completed_this_cycle', v_completed_today,
    'path_day', v_child.path_day,
    'cycle', v_child.current_month_cycle
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_today_task TO authenticated, anon;

-- ============================================================================
-- PART 8: complete_daily_plan RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_daily_plan(
  p_child_id uuid,
  p_plan_id uuid,
  p_duration_seconds integer DEFAULT NULL,
  p_exercises_completed integer DEFAULT 0,
  p_exercises_total integer DEFAULT 0,
  p_points integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_child_before children;
  v_child_after children;
  v_plan daily_plans;
  v_streak_increased boolean;
  v_cycle_rolled boolean;
  v_new_theme_id text;
  v_theme_count integer;
BEGIN
  SELECT * INTO v_child_before FROM children WHERE id = p_child_id FOR UPDATE;
  IF v_child_before IS NULL THEN
    RAISE EXCEPTION 'Child not found: %', p_child_id;
  END IF;

  SELECT * INTO v_plan FROM daily_plans WHERE id = p_plan_id;
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'Plan not found: %', p_plan_id;
  END IF;

  -- Insert completion (ignore if already done this cycle)
  INSERT INTO daily_completions (
    child_id, plan_id, day_number, cycle_number,
    duration_seconds, exercises_completed, exercises_total, points_earned
  ) VALUES (
    p_child_id, p_plan_id, v_plan.day_number, v_child_before.current_month_cycle,
    p_duration_seconds, p_exercises_completed, p_exercises_total, p_points
  )
  ON CONFLICT (child_id, plan_id, cycle_number) DO NOTHING;

  -- Run the existing engine
  v_child_after := register_activity_and_advance(
    p_child_id,
    p_points,
    'daily_plan_complete',
    jsonb_build_object('plan_id', p_plan_id, 'day_number', v_plan.day_number)
  );

  v_streak_increased := v_child_after.current_streak > v_child_before.current_streak;
  v_cycle_rolled := v_child_after.current_month_cycle > v_child_before.current_month_cycle;

  -- Drive theme from monthly_themes by cycle position
  IF v_cycle_rolled THEN
    SELECT count(*) INTO v_theme_count FROM monthly_themes;
    IF v_theme_count > 0 THEN
      SELECT id INTO v_new_theme_id
      FROM monthly_themes
      WHERE cycle_position = ((v_child_after.current_month_cycle - 1) % v_theme_count);
      IF v_new_theme_id IS NOT NULL THEN
        UPDATE children SET path_theme_id = v_new_theme_id WHERE id = p_child_id;
        v_child_after.path_theme_id := v_new_theme_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'child', to_jsonb(v_child_after),
    'streak_increased', v_streak_increased,
    'cycle_rolled', v_cycle_rolled,
    'points_earned', p_points
  );
END;
$$;

GRANT EXECUTE ON FUNCTION complete_daily_plan TO authenticated, anon;

-- ============================================================================
-- DONE
-- ============================================================================
COMMENT ON TABLE daily_completions IS 'Audit trail of completed daily plans, one row per (child, plan, cycle).';
COMMENT ON TABLE exercise_categories IS 'Category metadata referenced by library_items.category_id.';
COMMENT ON TABLE monthly_themes IS 'Theme rotation source; theme = monthly_themes WHERE cycle_position = (current_month_cycle - 1) % count.';
COMMENT ON FUNCTION complete_daily_plan IS 'Records a daily-plan completion, advances streak/path/cycle, rotates theme on cycle roll.';

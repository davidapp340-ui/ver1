-- ============================================================
-- ZOOMI - SETUP MISSING TABLES & DEMO USER
-- הרץ קובץ זה ב-Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vzjsycgkvfmkjntkabpc/sql/new
-- ============================================================

-- ============================================================
-- PART 1: CHILDREN TABLE - עמודות חסרות
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='track_level') THEN
    ALTER TABLE children ADD COLUMN track_level text DEFAULT 'child' CHECK (track_level IN ('child','teen','adult'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='total_points') THEN
    ALTER TABLE children ADD COLUMN total_points integer DEFAULT 0 CHECK (total_points >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='current_streak') THEN
    ALTER TABLE children ADD COLUMN current_streak integer DEFAULT 0 CHECK (current_streak >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='longest_streak') THEN
    ALTER TABLE children ADD COLUMN longest_streak integer DEFAULT 0 CHECK (longest_streak >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='path_day') THEN
    ALTER TABLE children ADD COLUMN path_day integer DEFAULT 1 CHECK (path_day >= 1 AND path_day <= 30);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='current_month_cycle') THEN
    ALTER TABLE children ADD COLUMN current_month_cycle integer DEFAULT 1 CHECK (current_month_cycle >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='path_theme_id') THEN
    ALTER TABLE children ADD COLUMN path_theme_id text DEFAULT 'forest';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='last_activity_date') THEN
    ALTER TABLE children ADD COLUMN last_activity_date timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='avatar_id') THEN
    ALTER TABLE children ADD COLUMN avatar_id text NOT NULL DEFAULT 'default';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='expo_push_token') THEN
    ALTER TABLE children ADD COLUMN expo_push_token text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='daily_reminder_time') THEN
    ALTER TABLE children ADD COLUMN daily_reminder_time text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='is_active_session') THEN
    ALTER TABLE children ADD COLUMN is_active_session boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='last_heartbeat') THEN
    ALTER TABLE children ADD COLUMN last_heartbeat timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='session_device_id') THEN
    ALTER TABLE children ADD COLUMN session_device_id text;
  END IF;
END $$;

-- ============================================================
-- PART 2: PROFILES TABLE - עמודות חסרות
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='expo_push_token') THEN
    ALTER TABLE profiles ADD COLUMN expo_push_token text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='daily_reminder_time') THEN
    ALTER TABLE profiles ADD COLUMN daily_reminder_time text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_active_session') THEN
    ALTER TABLE profiles ADD COLUMN is_active_session boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_heartbeat') THEN
    ALTER TABLE profiles ADD COLUMN last_heartbeat timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='session_device_id') THEN
    ALTER TABLE profiles ADD COLUMN session_device_id text;
  END IF;
END $$;

-- ============================================================
-- PART 3: EXERCISES TABLE - עמודת reward_points
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='reward_points') THEN
    ALTER TABLE exercises ADD COLUMN reward_points integer NOT NULL DEFAULT 5;
  END IF;
END $$;

-- ============================================================
-- PART 4: DAILY_PLANS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_level text NOT NULL CHECK (track_level IN ('child','teen','adult')),
  day_number integer NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
  is_rest_day boolean DEFAULT false,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (track_level, day_number)
);

ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_plans' AND policyname='Authenticated users can view daily plans') THEN
    CREATE POLICY "Authenticated users can view daily plans" ON daily_plans FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_plans' AND policyname='Anonymous users can view daily plans') THEN
    CREATE POLICY "Anonymous users can view daily plans" ON daily_plans FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- ============================================================
-- PART 5: WORKOUT_ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS workout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL CHECK (sequence_order > 0),
  duration_seconds integer CHECK (duration_seconds > 0),
  target_reps integer CHECK (target_reps > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE (plan_id, sequence_order)
);

ALTER TABLE workout_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='workout_items' AND policyname='Authenticated users can view workout items') THEN
    CREATE POLICY "Authenticated users can view workout items" ON workout_items FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='workout_items' AND policyname='Anonymous users can view workout items') THEN
    CREATE POLICY "Anonymous users can view workout items" ON workout_items FOR SELECT TO anon USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workout_items_plan_id ON workout_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_items_exercise_id ON workout_items(exercise_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_track_day ON daily_plans(track_level, day_number);

-- ============================================================
-- PART 6: ACTIVITY_LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  points_earned integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_logs' AND policyname='Parents can view their children''s activity logs') THEN
    CREATE POLICY "Parents can view their children's activity logs"
      ON activity_logs FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM children
          JOIN profiles ON profiles.family_id = children.family_id
          WHERE children.id = activity_logs.child_id
            AND profiles.id = auth.uid()
            AND profiles.role = 'parent'
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_logs' AND policyname='Children can view own activity logs') THEN
    CREATE POLICY "Children can view own activity logs"
      ON activity_logs FOR SELECT TO authenticated
      USING (
        child_id IN (
          SELECT id FROM children WHERE device_id = current_setting('app.device_id', true)
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_logs_child_id ON activity_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================
-- PART 7: EXERCISE_COMPLETIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS exercise_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  points_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercise_completions' AND policyname='Parents can view their family children completions') THEN
    CREATE POLICY "Parents can view their family children completions"
      ON exercise_completions FOR SELECT TO authenticated
      USING (
        child_id IN (
          SELECT c.id FROM children c
          JOIN profiles p ON p.family_id = c.family_id
          WHERE p.id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercise_completions' AND policyname='Completions are inserted via RPC only') THEN
    CREATE POLICY "Completions are inserted via RPC only"
      ON exercise_completions FOR INSERT TO authenticated
      WITH CHECK (
        child_id IN (
          SELECT c.id FROM children c
          JOIN profiles p ON p.family_id = c.family_id
          WHERE p.id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exercise_completions_child_id ON exercise_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_exercise_id ON exercise_completions(exercise_id);

-- ============================================================
-- PART 8: FAQ_ITEMS TABLE
-- ============================================================

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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='faq_items' AND policyname='Authenticated users can read FAQ items') THEN
    CREATE POLICY "Authenticated users can read FAQ items"
      ON faq_items FOR SELECT TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

INSERT INTO faq_items (question_he, question_en, answer_he, answer_en, sort_order) VALUES
('איך מתחילים?','How do I start?','ברוכים הבאים ל-Zoomi! כדי להתחיל, היכנסו למסך הבית ולחצו על **"התחל את האימון היומי"**. כל יום תקבלו תרגיל חדש שמותאם להתקדמות שלכם.','Welcome to Zoomi! To get started, go to the Home screen and tap **"Start Today''s Exercise"**. Each day you''ll receive a new exercise tailored to your progress.',1),
('האם התרגילים בטוחים?','Are the exercises safe?','כן, כל התרגילים פותחו על ידי מומחי ראייה ונבדקו בקפידה. אם אתם חשים באי-נוחות, הפסיקו ופנו לרופא.','Yes, all exercises are developed by vision specialists. If you experience discomfort, stop and consult your eye care professional.',2),
('מידע על המנוי','Subscription information','Zoomi מציעה תקופת ניסיון חינמית. לאחר מכן ניתן לבחור בתוכנית מנוי. ניתן לבטל בכל עת.','Zoomi offers a free trial period. After that, you can choose a subscription plan. You can cancel at any time.',3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART 9: FUNCTIONS
-- ============================================================

-- Auto-assign track level trigger
CREATE OR REPLACE FUNCTION auto_assign_track_level()
RETURNS TRIGGER AS $$
DECLARE age_years integer;
BEGIN
  IF NEW.track_level = 'child' AND NEW.birth_date IS NOT NULL THEN
    age_years := EXTRACT(YEAR FROM AGE(NEW.birth_date));
    IF age_years < 13 THEN NEW.track_level := 'child';
    ELSIF age_years <= 18 THEN NEW.track_level := 'teen';
    ELSE NEW.track_level := 'adult';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_assign_track_level ON children;
CREATE TRIGGER trigger_auto_assign_track_level
  BEFORE INSERT ON children FOR EACH ROW
  EXECUTE FUNCTION auto_assign_track_level();

-- Gamification engine
CREATE OR REPLACE FUNCTION register_activity_and_advance(
  p_child_id uuid, p_points integer, p_action_type text, p_metadata jsonb DEFAULT '{}'
) RETURNS children AS $$
DECLARE
  v_child children; v_today date; v_yesterday date; v_is_first boolean;
BEGIN
  SELECT * INTO v_child FROM children WHERE id = p_child_id FOR UPDATE;
  IF v_child IS NULL THEN RAISE EXCEPTION 'Child not found: %', p_child_id; END IF;
  v_today := CURRENT_DATE; v_yesterday := v_today - INTERVAL '1 day';
  v_is_first := (v_child.last_activity_date IS NULL OR DATE(v_child.last_activity_date) < v_today);
  IF v_child.last_activity_date IS NULL THEN v_child.current_streak := 1;
  ELSIF DATE(v_child.last_activity_date) = v_yesterday THEN v_child.current_streak := v_child.current_streak + 1;
  ELSIF DATE(v_child.last_activity_date) = v_today THEN NULL;
  ELSE v_child.current_streak := 1; END IF;
  IF v_child.current_streak > v_child.longest_streak THEN v_child.longest_streak := v_child.current_streak; END IF;
  IF v_is_first THEN
    v_child.path_day := v_child.path_day + 1;
    IF v_child.path_day > 30 THEN
      v_child.path_day := 1; v_child.current_month_cycle := v_child.current_month_cycle + 1;
      CASE v_child.current_month_cycle % 4
        WHEN 1 THEN v_child.path_theme_id := 'forest';
        WHEN 2 THEN v_child.path_theme_id := 'ocean';
        WHEN 3 THEN v_child.path_theme_id := 'desert';
        WHEN 0 THEN v_child.path_theme_id := 'mountain';
      END CASE;
    END IF;
  END IF;
  v_child.total_points := v_child.total_points + p_points;
  v_child.last_activity_date := NOW(); v_child.updated_at := NOW();
  UPDATE children SET track_level=v_child.track_level, total_points=v_child.total_points,
    current_streak=v_child.current_streak, longest_streak=v_child.longest_streak,
    path_day=v_child.path_day, current_month_cycle=v_child.current_month_cycle,
    path_theme_id=v_child.path_theme_id, last_activity_date=v_child.last_activity_date,
    updated_at=v_child.updated_at WHERE id = p_child_id;
  INSERT INTO activity_logs (child_id, action_type, points_earned, metadata)
  VALUES (p_child_id, p_action_type, p_points,
    jsonb_build_object('streak',v_child.current_streak,'path_day',v_child.path_day,
      'cycle',v_child.current_month_cycle,'is_first_today',v_is_first) || p_metadata);
  RETURN v_child;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION register_activity_and_advance TO authenticated;

-- Claim treasure bonus
CREATE OR REPLACE FUNCTION claim_treasure_bonus(p_child_id uuid)
RETURNS jsonb AS $$
DECLARE v_child children; v_bonus integer := 50;
BEGIN
  SELECT * INTO v_child FROM children WHERE id = p_child_id FOR UPDATE;
  IF v_child IS NULL THEN RETURN jsonb_build_object('success',false,'error','Child not found','child',null); END IF;
  IF v_child.path_day NOT IN (7,14,21,28) THEN
    RETURN jsonb_build_object('success',false,'error','Not a rest day','child',null); END IF;
  IF EXISTS (SELECT 1 FROM activity_logs WHERE child_id=p_child_id AND action_type='treasure_bonus' AND DATE(created_at)=CURRENT_DATE) THEN
    RETURN jsonb_build_object('success',false,'error','Treasure already claimed today','child',null); END IF;
  v_child.total_points := v_child.total_points + v_bonus; v_child.updated_at := NOW();
  UPDATE children SET total_points=v_child.total_points, updated_at=v_child.updated_at WHERE id=p_child_id;
  INSERT INTO activity_logs (child_id, action_type, points_earned, metadata)
  VALUES (p_child_id,'treasure_bonus',v_bonus,
    jsonb_build_object('day',v_child.path_day,'cycle',v_child.current_month_cycle,'message','Claimed treasure chest bonus!'));
  RETURN jsonb_build_object('success',true,'error',null,'child',row_to_json(v_child),'points_earned',v_bonus);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION claim_treasure_bonus TO authenticated;

-- Log exercise completion
CREATE OR REPLACE FUNCTION public.log_exercise_completion(p_child_id uuid, p_exercise_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reward integer; v_new_total integer; v_profile profiles%ROWTYPE; v_child children%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
  IF v_profile IS NULL THEN RETURN json_build_object('success',false,'error','Not authenticated'); END IF;
  SELECT * INTO v_child FROM children WHERE id=p_child_id AND family_id=v_profile.family_id;
  IF v_child IS NULL THEN RETURN json_build_object('success',false,'error','Child not found in your family'); END IF;
  SELECT reward_points INTO v_reward FROM exercises WHERE id=p_exercise_id AND status='active';
  IF v_reward IS NULL THEN RETURN json_build_object('success',false,'error','Exercise not found'); END IF;
  INSERT INTO exercise_completions (child_id, exercise_id, points_earned) VALUES (p_child_id, p_exercise_id, v_reward);
  UPDATE children SET total_points=total_points+v_reward, updated_at=now() WHERE id=p_child_id;
  SELECT total_points INTO v_new_total FROM children WHERE id=p_child_id;
  RETURN json_build_object('success',true,'points_earned',v_reward,'total_points',v_new_total);
EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success',false,'error',SQLERRM);
END; $$;

-- Session lock functions
CREATE OR REPLACE FUNCTION check_session_lock_profile(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_is_active boolean; v_last_heartbeat timestamptz; v_device_id text;
BEGIN
  SELECT is_active_session, last_heartbeat, session_device_id INTO v_is_active, v_last_heartbeat, v_device_id
  FROM profiles WHERE id=p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('locked',false,'reason','not_found'); END IF;
  IF v_is_active=true AND v_last_heartbeat IS NOT NULL AND v_last_heartbeat > (now()-interval '2 minutes') THEN
    RETURN jsonb_build_object('locked',true,'device_id',v_device_id); END IF;
  RETURN jsonb_build_object('locked',false);
END; $$;

CREATE OR REPLACE FUNCTION check_session_lock_child(p_child_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_is_active boolean; v_last_heartbeat timestamptz; v_device_id text;
BEGIN
  SELECT is_active_session, last_heartbeat, session_device_id INTO v_is_active, v_last_heartbeat, v_device_id
  FROM children WHERE id=p_child_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('locked',false,'reason','not_found'); END IF;
  IF v_is_active=true AND v_last_heartbeat IS NOT NULL AND v_last_heartbeat > (now()-interval '2 minutes') THEN
    RETURN jsonb_build_object('locked',true,'device_id',v_device_id); END IF;
  RETURN jsonb_build_object('locked',false);
END; $$;

CREATE OR REPLACE FUNCTION heartbeat_profile(p_device_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success',false,'error','not_authenticated'); END IF;
  UPDATE profiles SET is_active_session=true, last_heartbeat=now(), session_device_id=p_device_id WHERE id=v_user_id;
  RETURN jsonb_build_object('success',true);
END; $$;

CREATE OR REPLACE FUNCTION heartbeat_child(p_child_id uuid, p_device_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE children SET is_active_session=true, last_heartbeat=now(), session_device_id=p_device_id WHERE id=p_child_id;
  RETURN jsonb_build_object('success',true);
END; $$;

CREATE OR REPLACE FUNCTION release_session_profile()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success',false,'error','not_authenticated'); END IF;
  UPDATE profiles SET is_active_session=false, last_heartbeat=null, session_device_id=null WHERE id=v_user_id;
  RETURN jsonb_build_object('success',true);
END; $$;

CREATE OR REPLACE FUNCTION release_session_child(p_child_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE children SET is_active_session=false, last_heartbeat=null, session_device_id=null WHERE id=p_child_id;
  RETURN jsonb_build_object('success',true);
END; $$;

-- Update child push token
CREATE OR REPLACE FUNCTION update_child_push_token(p_child_id uuid, p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_child children%ROWTYPE; v_device_id text;
BEGIN
  v_device_id := current_setting('request.headers',true)::json->>'x-device-id';
  IF v_device_id IS NULL OR v_device_id='' THEN
    IF auth.uid() IS NOT NULL THEN
      SELECT * INTO v_child FROM children WHERE id=p_child_id
        AND family_id IN (SELECT family_id FROM profiles WHERE id=auth.uid());
      IF NOT FOUND THEN RETURN json_build_object('success',false,'error','Child not found or not authorized'); END IF;
      UPDATE children SET expo_push_token=p_token, updated_at=NOW() WHERE id=p_child_id;
      RETURN json_build_object('success',true);
    END IF;
    RETURN json_build_object('success',false,'error','No device ID or auth context provided');
  END IF;
  SELECT * INTO v_child FROM children WHERE id=p_child_id AND device_id=v_device_id;
  IF NOT FOUND THEN RETURN json_build_object('success',false,'error','Child not found or device not linked'); END IF;
  UPDATE children SET expo_push_token=p_token, updated_at=NOW() WHERE id=p_child_id;
  RETURN json_build_object('success',true);
EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success',false,'error',SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION update_child_push_token(uuid,text) TO anon, authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_children_track_level ON children(track_level);
CREATE INDEX IF NOT EXISTS idx_children_path_day ON children(path_day);
CREATE INDEX IF NOT EXISTS idx_children_last_activity_date ON children(last_activity_date);

-- ============================================================
-- PART 10: SEED INITIAL DAILY PLANS (Days 1-2)
-- ============================================================

DO $$
DECLARE
  v_exercise_id uuid;
  v_child_day1 uuid; v_child_day2 uuid;
  v_teen_day1 uuid;  v_teen_day2 uuid;
  v_adult_day1 uuid; v_adult_day2 uuid;
BEGIN
  SELECT id INTO v_exercise_id FROM exercises WHERE animation_id='palming_v1' LIMIT 1;
  IF v_exercise_id IS NULL THEN SELECT id INTO v_exercise_id FROM exercises LIMIT 1; END IF;
  IF v_exercise_id IS NULL THEN RAISE NOTICE 'No exercises found - skipping seed'; RETURN; END IF;

  INSERT INTO daily_plans (track_level,day_number,title,description)
    VALUES ('child',1,'ברוכים הבאים למסע!','מתחילים עם תרגיל Palming מרגיע.')
    ON CONFLICT (track_level,day_number) DO NOTHING RETURNING id INTO v_child_day1;
  IF v_child_day1 IS NULL THEN SELECT id INTO v_child_day1 FROM daily_plans WHERE track_level='child' AND day_number=1; END IF;

  INSERT INTO daily_plans (track_level,day_number,title,description)
    VALUES ('child',2,'ממשיכים קדימה!','יום שני - בונים את השגרה.')
    ON CONFLICT (track_level,day_number) DO NOTHING RETURNING id INTO v_child_day2;
  IF v_child_day2 IS NULL THEN SELECT id INTO v_child_day2 FROM daily_plans WHERE track_level='child' AND day_number=2; END IF;

  INSERT INTO daily_plans (track_level,day_number,title,description)
    VALUES ('teen',1,'מתחילים את המסע','מתחילים עם הרפיית עיניים.')
    ON CONFLICT (track_level,day_number) DO NOTHING RETURNING id INTO v_teen_day1;
  IF v_teen_day1 IS NULL THEN SELECT id INTO v_teen_day1 FROM daily_plans WHERE track_level='teen' AND day_number=1; END IF;

  INSERT INTO daily_plans (track_level,day_number,title,description)
    VALUES ('teen',2,'יום 2: בונים תאוצה','ממשיכים עם Palming.')
    ON CONFLICT (track_level,day_number) DO NOTHING RETURNING id INTO v_teen_day2;
  IF v_teen_day2 IS NULL THEN SELECT id INTO v_teen_day2 FROM daily_plans WHERE track_level='teen' AND day_number=2; END IF;

  INSERT INTO daily_plans (track_level,day_number,title,description)
    VALUES ('adult',1,'מתחילים את האימון','תרגיל Palming לבסיס חזק.')
    ON CONFLICT (track_level,day_number) DO NOTHING RETURNING id INTO v_adult_day1;
  IF v_adult_day1 IS NULL THEN SELECT id INTO v_adult_day1 FROM daily_plans WHERE track_level='adult' AND day_number=1; END IF;

  INSERT INTO daily_plans (track_level,day_number,title,description)
    VALUES ('adult',2,'יום 2: עקביות היא המפתח','מחזקים את הבסיס.')
    ON CONFLICT (track_level,day_number) DO NOTHING RETURNING id INTO v_adult_day2;
  IF v_adult_day2 IS NULL THEN SELECT id INTO v_adult_day2 FROM daily_plans WHERE track_level='adult' AND day_number=2; END IF;

  INSERT INTO workout_items (plan_id,exercise_id,sequence_order,duration_seconds)
    VALUES (v_child_day1,v_exercise_id,1,30) ON CONFLICT (plan_id,sequence_order) DO NOTHING;
  INSERT INTO workout_items (plan_id,exercise_id,sequence_order,duration_seconds)
    VALUES (v_child_day2,v_exercise_id,1,30) ON CONFLICT (plan_id,sequence_order) DO NOTHING;
  INSERT INTO workout_items (plan_id,exercise_id,sequence_order,duration_seconds)
    VALUES (v_teen_day1,v_exercise_id,1,30)  ON CONFLICT (plan_id,sequence_order) DO NOTHING;
  INSERT INTO workout_items (plan_id,exercise_id,sequence_order,duration_seconds)
    VALUES (v_teen_day2,v_exercise_id,1,30)  ON CONFLICT (plan_id,sequence_order) DO NOTHING;
  INSERT INTO workout_items (plan_id,exercise_id,sequence_order,duration_seconds)
    VALUES (v_adult_day1,v_exercise_id,1,30) ON CONFLICT (plan_id,sequence_order) DO NOTHING;
  INSERT INTO workout_items (plan_id,exercise_id,sequence_order,duration_seconds)
    VALUES (v_adult_day2,v_exercise_id,1,30) ON CONFLICT (plan_id,sequence_order) DO NOTHING;

  RAISE NOTICE 'Daily plans seeded successfully';
END $$;

-- ============================================================
-- PART 11: DEMO PARENT USER
-- פרטי התחברות: demo.parent@zoomi.app / Demo1234!
-- ============================================================

DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_family_id uuid := gen_random_uuid();
BEGIN
  -- בדוק אם כבר קיים
  IF EXISTS (SELECT 1 FROM auth.users WHERE email='demo.parent@zoomi.app') THEN
    RAISE NOTICE 'Demo user already exists - skipping';
    RETURN;
  END IF;

  -- צור משתמש ב-auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    aud, role, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'demo.parent@zoomi.app',
    crypt('Demo1234!', gen_salt('bf')),
    now(), now(), now(),
    '{"first_name":"הורה","last_name":"לדוגמא","role":"parent"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated',
    '', '', '', ''
  );

  -- צור רשומת identity
  INSERT INTO auth.identities (
    id, user_id, provider_id, provider,
    identity_data, created_at, updated_at, last_sign_in_at
  ) VALUES (
    gen_random_uuid(), v_user_id, 'demo.parent@zoomi.app', 'email',
    jsonb_build_object('sub', v_user_id::text, 'email', 'demo.parent@zoomi.app'),
    now(), now(), now()
  );

  -- צור family
  INSERT INTO families (id, created_at)
  VALUES (v_family_id, now());

  -- צור profile
  INSERT INTO profiles (id, family_id, role, first_name, last_name, subscription_status)
  VALUES (v_user_id, v_family_id, 'parent', 'הורה', 'לדוגמא', 'trial');

  RAISE NOTICE 'Demo parent user created: demo.parent@zoomi.app / Demo1234!';
END $$;

-- ============================================================
-- סיום - בדיקת תוצאות
-- ============================================================

SELECT
  t.table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema='public') AS columns
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

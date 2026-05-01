import { supabase } from './supabase';
import { Database } from './database.types';

// Note: types for new tables/columns from the v2 migration are not yet in
// database.types.ts. Regenerate via `supabase gen types typescript` to drop the
// `as any` casts below.
const sb = supabase as any;

export type ExerciseRow = Database['public']['Tables']['exercises']['Row'] & {
  exercise_type?: string | null;
  default_duration_seconds?: number | null;
  default_reps?: number | null;
  instructions_he?: any;
  instructions_en?: any;
  svg_content?: string | null;
};
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update'];
export type DailyPlanRow = Database['public']['Tables']['daily_plans']['Row'];
export type WorkoutItemRow = Database['public']['Tables']['workout_items']['Row'];

export async function listExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('animation_id', { ascending: true });
  if (error) throw error;
  return (data || []) as ExerciseRow[];
}

export async function upsertExercise(row: Partial<ExerciseRow> & { id?: string }) {
  if (row.id) {
    const { id, ...rest } = row;
    const { data, error } = await supabase
      .from('exercises')
      .update(rest as ExerciseUpdate)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ExerciseRow;
  }
  const { data, error } = await supabase
    .from('exercises')
    .insert(row as ExerciseInsert)
    .select()
    .single();
  if (error) throw error;
  return data as ExerciseRow;
}

export async function deleteExercise(id: string) {
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
}

export async function listDailyPlans(trackLevel?: string) {
  let q = sb.from('daily_plans').select('*').order('day_number', { ascending: true });
  if (trackLevel) q = q.eq('track_level', trackLevel);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as DailyPlanRow[];
}

export async function listWorkoutItems(planId: string) {
  const { data, error } = await supabase
    .from('workout_items')
    .select('*, exercise:exercises(id, animation_id, title_he, title_en)')
    .eq('plan_id', planId)
    .order('sequence_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addWorkoutItem(args: {
  planId: string;
  exerciseId: string;
  durationSeconds?: number | null;
  targetReps?: number | null;
}) {
  const { data: existing, error: existingErr } = await supabase
    .from('workout_items')
    .select('sequence_order')
    .eq('plan_id', args.planId)
    .order('sequence_order', { ascending: false })
    .limit(1);
  if (existingErr) throw existingErr;
  const nextSeq = (existing?.[0]?.sequence_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('workout_items')
    .insert({
      plan_id: args.planId,
      exercise_id: args.exerciseId,
      sequence_order: nextSeq,
      duration_seconds: args.durationSeconds ?? null,
      target_reps: args.targetReps ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeWorkoutItem(id: string) {
  const { error } = await supabase.from('workout_items').delete().eq('id', id);
  if (error) throw error;
}

export async function updateWorkoutItemOrder(id: string, sequenceOrder: number) {
  const { error } = await supabase
    .from('workout_items')
    .update({ sequence_order: sequenceOrder })
    .eq('id', id);
  if (error) throw error;
}

export async function listCategories() {
  const { data, error } = await sb
    .from('exercise_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createCategory(args: {
  name_he: string;
  name_en: string;
  color: string;
  sort_order?: number | null;
}) {
  const { data, error } = await sb
    .from('exercise_categories')
    .insert({
      name_he: args.name_he,
      name_en: args.name_en,
      color: args.color,
      sort_order: args.sort_order ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createDailyPlan(args: {
  track_level: string;
  day_number: number;
  title?: string | null;
  description?: string | null;
  is_rest_day?: boolean;
}) {
  const { data, error } = await sb
    .from('daily_plans')
    .insert({
      track_level: args.track_level,
      day_number: args.day_number,
      title: args.title ?? null,
      description: args.description ?? null,
      is_rest_day: args.is_rest_day ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as DailyPlanRow;
}

export async function listMonthlyThemes() {
  const { data, error } = await sb
    .from('monthly_themes')
    .select('*')
    .order('cycle_position', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function adminStats() {
  const [exercises, plans, completions] = await Promise.all([
    sb.from('exercises').select('id, status', { count: 'exact', head: false }),
    sb.from('daily_plans').select('id, track_level', { count: 'exact', head: false }),
    sb.from('daily_completions').select('id, completed_at', { count: 'exact', head: false })
      .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return {
    totalExercises: exercises.count ?? exercises.data?.length ?? 0,
    activeExercises: (exercises.data || []).filter((r: any) => r.status === 'active').length,
    totalPlans: plans.count ?? plans.data?.length ?? 0,
    plansByTrack: (plans.data || []).reduce((acc: Record<string, number>, r: any) => {
      acc[r.track_level] = (acc[r.track_level] || 0) + 1;
      return acc;
    }, {}),
    completionsLast30Days: completions.count ?? completions.data?.length ?? 0,
  };
}

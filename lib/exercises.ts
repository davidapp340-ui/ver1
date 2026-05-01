import { supabase } from './supabase';
import { Database } from './database.types';

type Exercise = Database['public']['Tables']['exercises']['Row'];
type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];
type ExerciseUpdate = Database['public']['Tables']['exercises']['Update'];

/**
 * Exercise Warehouse Service
 *
 * This module provides type-safe access to the exercises inventory.
 * Note: This is the raw exercise data only - timers, colors, and category
 * associations will be managed in separate tables.
 */

/**
 * Fetch all active exercises
 */
export async function getActiveExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single exercise by ID
 */
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Fetch an exercise by animation ID
 */
export async function getExerciseByAnimationId(animationId: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('animation_id', animationId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new exercise (authenticated users only)
 */
export async function createExercise(exercise: ExerciseInsert): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing exercise (authenticated users only)
 */
export async function updateExercise(
  id: string,
  updates: ExerciseUpdate
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Hide an exercise (soft delete)
 */
export async function hideExercise(id: string): Promise<Exercise> {
  return updateExercise(id, { status: 'hidden' });
}

/**
 * Activate a hidden exercise
 */
export async function activateExercise(id: string): Promise<Exercise> {
  return updateExercise(id, { status: 'active' });
}

/**
 * Get the full audio URL for an exercise based on locale
 */
export function getExerciseAudioUrl(exercise: Exercise, locale: 'en' | 'he'): string | null {
  const audioPath = locale === 'he' ? exercise.audio_path_he : exercise.audio_path_en;

  if (!audioPath) return null;

  const { data } = supabase.storage
    .from('exercise-audio')
    .getPublicUrl(audioPath);

  return data.publicUrl;
}

/**
 * Get localized exercise data
 */
export function getLocalizedExercise(
  exercise: Exercise,
  locale: 'en' | 'he'
): {
  title: string;
  description: string | null;
  audioUrl: string | null;
} {
  return {
    title: locale === 'he' ? exercise.title_he : exercise.title_en,
    description: locale === 'he' ? exercise.description_he : exercise.description_en,
    audioUrl: getExerciseAudioUrl(exercise, locale),
  };
}

export type { Exercise, ExerciseInsert, ExerciseUpdate };

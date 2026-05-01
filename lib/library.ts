/**
 * Library Service Functions
 *
 * This module provides functions to interact with the library_items table,
 * which configures how exercises are displayed in the library UI.
 */

import { supabase } from './supabase';
import { Database } from './database.types';

export type LibraryItem = Database['public']['Tables']['library_items']['Row'];
export type LibraryItemInsert = Database['public']['Tables']['library_items']['Insert'];
export type LibraryItemUpdate = Database['public']['Tables']['library_items']['Update'];

/**
 * Extended library item with exercise details joined
 */
export interface LibraryItemWithExercise extends LibraryItem {
  exercise: {
    id: string;
    animation_id: string;
    icon_id: string | null;
    audio_path_en: string | null;
    audio_path_he: string | null;
    title_en: string;
    title_he: string;
    description_en: string | null;
    description_he: string | null;
    status: string;
  };
}

export interface ExerciseData {
  id: string;
  animation_id: string;
  icon_id: string | null;
  audio_path_en: string | null;
  audio_path_he: string | null;
  title_en: string;
  title_he: string;
  description_en: string | null;
  description_he: string | null;
  status: string;
}

export interface PlaylistExerciseItem {
  workoutItemId: string;
  exerciseId: string;
  sequenceOrder: number;
  durationSeconds: number | null;
  targetReps: number | null;
  exercise: ExerciseData;
}

/**
 * Category grouping for library display
 */
export interface LibraryCategory {
  category_name: string;
  category_color: string;
  items: LibraryItemWithExercise[];
}

/**
 * Get all library items with their exercise details, grouped by category
 */
export async function getLibraryByCategories(): Promise<LibraryCategory[]> {
  const { data, error } = await supabase
    .from('library_items')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('exercise.status', 'active')
    .order('category_name')
    .order('sort_order');

  if (error) {
    throw error;
  }

  const items = (data as unknown as LibraryItemWithExercise[]) || [];

  // Group by category
  const categoriesMap = new Map<string, LibraryCategory>();

  items.forEach((item) => {
    const categoryKey = item.category_name;

    if (!categoriesMap.has(categoryKey)) {
      categoriesMap.set(categoryKey, {
        category_name: item.category_name,
        category_color: item.category_color,
        items: [],
      });
    }

    categoriesMap.get(categoryKey)!.items.push(item);
  });

  return Array.from(categoriesMap.values());
}

/**
 * Get all library items with exercise details (flat list)
 */
export async function getAllLibraryItems(): Promise<LibraryItemWithExercise[]> {
  const { data, error } = await supabase
    .from('library_items')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('exercise.status', 'active')
    .order('category_name')
    .order('sort_order');

  if (error) {
    throw error;
  }

  return (data as unknown as LibraryItemWithExercise[]) || [];
}

/**
 * Get a single library item by ID with exercise details
 */
export async function getLibraryItemById(id: string): Promise<LibraryItemWithExercise | null> {
  const { data, error } = await supabase
    .from('library_items')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as unknown as LibraryItemWithExercise | null;
}

/**
 * Get library items by category name
 */
export async function getLibraryItemsByCategory(
  categoryName: string
): Promise<LibraryItemWithExercise[]> {
  const { data, error } = await supabase
    .from('library_items')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('category_name', categoryName)
    .eq('exercise.status', 'active')
    .order('sort_order');

  if (error) {
    throw error;
  }

  return (data as unknown as LibraryItemWithExercise[]) || [];
}

/**
 * Create a new library item
 */
export async function createLibraryItem(item: LibraryItemInsert): Promise<LibraryItem> {
  const { data, error } = await supabase
    .from('library_items')
    .insert(item)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update a library item
 */
export async function updateLibraryItem(
  id: string,
  updates: LibraryItemUpdate
): Promise<LibraryItem> {
  const { data, error } = await supabase
    .from('library_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete a library item
 */
export async function deleteLibraryItem(id: string): Promise<void> {
  const { error } = await supabase.from('library_items').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

/**
 * Get audio URL for a library item based on locale
 */
export function getLibraryItemAudioUrl(
  item: LibraryItemWithExercise,
  locale: 'en' | 'he'
): string | null {
  if (!item.enable_audio) {
    return null;
  }

  const audioPath = locale === 'he' ? item.exercise.audio_path_he : item.exercise.audio_path_en;

  if (!audioPath) {
    return null;
  }

  const { data } = supabase.storage.from('exercise-audio').getPublicUrl(audioPath);

  return data.publicUrl;
}

/**
 * Get localized content for a library item
 */
export function getLocalizedLibraryItem(
  item: LibraryItemWithExercise,
  locale: 'en' | 'he'
): {
  title: string;
  description: string | null;
  audioUrl: string | null;
} {
  const title = locale === 'he' ? item.exercise.title_he : item.exercise.title_en;
  const description =
    locale === 'he' ? item.exercise.description_he : item.exercise.description_en;
  const audioUrl = getLibraryItemAudioUrl(item, locale);

  return {
    title,
    description,
    audioUrl,
  };
}

export function getExerciseAudioUrl(
  exercise: ExerciseData,
  locale: 'en' | 'he'
): string | null {
  const audioPath = locale === 'he' ? exercise.audio_path_he : exercise.audio_path_en;
  if (!audioPath) return null;
  const { data } = supabase.storage.from('exercise-audio').getPublicUrl(audioPath);
  return data.publicUrl;
}

export function getLocalizedExercise(
  exercise: ExerciseData,
  locale: 'en' | 'he'
): { title: string; description: string | null; audioUrl: string | null } {
  return {
    title: locale === 'he' ? exercise.title_he : exercise.title_en,
    description: locale === 'he' ? exercise.description_he : exercise.description_en,
    audioUrl: getExerciseAudioUrl(exercise, locale),
  };
}

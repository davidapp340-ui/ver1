import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { PlaylistExerciseItem } from '@/lib/library';

interface UsePlaylistQueueReturn {
  queue: PlaylistExerciseItem[];
  currentIndex: number;
  currentItem: PlaylistExerciseItem | null;
  isLastExercise: boolean;
  totalExercises: number;
  loading: boolean;
  error: string | null;
  advanceToNext: () => boolean;
  reset: () => void;
}

export function usePlaylistQueue(planId: string | undefined): UsePlaylistQueueReturn {
  const [queue, setQueue] = useState<PlaylistExerciseItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;

    let cancelled = false;

    const fetchWorkoutItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('workout_items')
          .select('id, exercise_id, sequence_order, duration_seconds, target_reps, exercises(*)')
          .eq('plan_id', planId)
          .order('sequence_order', { ascending: true });

        if (fetchError) throw fetchError;
        if (cancelled) return;

        const items: PlaylistExerciseItem[] = (data || []).map((row: any) => ({
          workoutItemId: row.id,
          exerciseId: row.exercise_id,
          sequenceOrder: row.sequence_order,
          durationSeconds: row.duration_seconds,
          targetReps: row.target_reps,
          exercise: row.exercises,
        }));

        setQueue(items);
        setCurrentIndex(0);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load workout items:', err);
          setError('Failed to load workout');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWorkoutItems();

    return () => {
      cancelled = true;
    };
  }, [planId]);

  const advanceToNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((i) => i + 1);
      return true;
    }
    return false;
  }, [currentIndex, queue.length]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const currentItem = queue.length > 0 ? queue[currentIndex] ?? null : null;
  const isLastExercise = queue.length > 0 && currentIndex >= queue.length - 1;

  return {
    queue,
    currentIndex,
    currentItem,
    isLastExercise,
    totalExercises: queue.length,
    loading,
    error,
    advanceToNext,
    reset,
  };
}

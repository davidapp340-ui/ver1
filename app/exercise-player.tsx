import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, RotateCcw, SkipForward } from 'lucide-react-native';
import {
  getLibraryItemById,
  getLocalizedLibraryItem,
  getLocalizedExercise,
} from '@/lib/library';
import type { ExerciseData } from '@/lib/library';
import { ExerciseAnimationRenderer } from '@/components/exercises/ExerciseRegistry';
import CompletionModal from '@/components/exercises/CompletionModal';
import PlaylistProgressBar from '@/components/exercises/PlaylistProgressBar';
import ExerciseTimerDisplay from '@/components/exercises/ExerciseTimerDisplay';
import ExerciseRepsPrompt from '@/components/exercises/ExerciseRepsPrompt';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { usePlaylistQueue } from '@/hooks/usePlaylistQueue';
import { useExerciseAudio } from '@/hooks/useExerciseAudio';
import { useExerciseTimer } from '@/hooks/useExerciseTimer';
import { supabase } from '@/lib/supabase';

interface ResolvedExercise {
  exerciseId: string;
  animationId: string;
  enableAudio: boolean;
  enableAnimation: boolean;
  audioUrl: string | null;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  targetReps: number | null;
}

export default function ExercisePlayerScreen() {
  const params = useLocalSearchParams<{
    libraryItemId?: string;
    exerciseId?: string;
    planId?: string;
  }>();
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const { child, refreshChild } = useChildSession();

  const locale = (i18n.language === 'he' ? 'he' : 'en') as 'en' | 'he';
  const isPlaylistMode = !!params.planId;

  const [resolved, setResolved] = useState<ResolvedExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [loggingCompletion, setLoggingCompletion] = useState(false);

  const animationTriggerRef = useRef(false);
  const [animKey, setAnimKey] = useState(0);

  const playlist = usePlaylistQueue(params.planId);

  const handleExerciseFinished = useCallback(async () => {
    if (!resolved || !child || loggingCompletion) return;

    setIsPlaying(false);
    animationTriggerRef.current = false;

    try {
      setLoggingCompletion(true);
      const { data } = await supabase.rpc('log_exercise_completion', {
        p_child_id: child.id,
        p_exercise_id: resolved.exerciseId,
      });
      const pts = data?.success ? data.points_earned : 5;
      setTotalPointsEarned((prev) => prev + pts);
    } catch (_) {
      setTotalPointsEarned((prev) => prev + 5);
    } finally {
      setLoggingCompletion(false);
    }

    if (isPlaylistMode && !playlist.isLastExercise) {
      setTransitioning(true);
      setTimeout(() => {
        playlist.advanceToNext();
        setTransitioning(false);
      }, 600);
    } else {
      setHasCompleted(true);
      setShowModal(true);
    }
  }, [resolved, child, loggingCompletion, isPlaylistMode, playlist.isLastExercise]);

  const audio = useExerciseAudio(
    resolved?.audioUrl ?? null,
    resolved?.enableAudio ?? false,
    useCallback(() => {
      if (!isPlaylistMode || (!resolved?.durationSeconds && !resolved?.targetReps)) {
        handleExerciseFinished();
      }
    }, [isPlaylistMode, resolved?.durationSeconds, resolved?.targetReps, handleExerciseFinished])
  );

  const timer = useExerciseTimer(
    resolved?.durationSeconds ?? 0,
    useCallback(() => {
      handleExerciseFinished();
    }, [handleExerciseFinished])
  );

  const resolveFromPlaylist = useCallback(() => {
    const item = playlist.currentItem;
    if (!item) return;

    const localized = getLocalizedExercise(item.exercise, locale);
    const hasAudio = !!(item.exercise.audio_path_en || item.exercise.audio_path_he);

    setResolved({
      exerciseId: item.exerciseId,
      animationId: item.exercise.animation_id,
      enableAudio: hasAudio,
      enableAnimation: true,
      audioUrl: localized.audioUrl,
      title: localized.title,
      description: localized.description,
      durationSeconds: item.durationSeconds,
      targetReps: item.targetReps,
    });
    setIsPlaying(false);
    setHasCompleted(false);
    animationTriggerRef.current = false;
    setAnimKey((k) => k + 1);
    setLoading(false);

    if (item.durationSeconds && item.durationSeconds > 0) {
      timer.reset(item.durationSeconds);
    }
  }, [playlist.currentItem, locale]);

  useEffect(() => {
    if (!isPlaylistMode) return;
    if (playlist.loading) {
      setLoading(true);
      return;
    }
    if (playlist.error) {
      setError(playlist.error);
      setLoading(false);
      return;
    }
    if (playlist.currentItem) {
      resolveFromPlaylist();
    }
  }, [isPlaylistMode, playlist.loading, playlist.error, playlist.currentIndex, playlist.currentItem]);

  useEffect(() => {
    if (isPlaylistMode) return;

    const loadSingle = async () => {
      try {
        setLoading(true);
        setError(null);

        const libraryItemId = params.libraryItemId;
        const exerciseId = params.exerciseId;

        if (!libraryItemId && !exerciseId) {
          setError('No exercise specified');
          return;
        }

        let exercise: ExerciseData | null = null;
        let enableAudio = false;
        let enableAnimation = true;

        if (libraryItemId) {
          const item = await getLibraryItemById(libraryItemId);
          if (!item) { setError('Exercise not found'); return; }
          const loc = getLocalizedLibraryItem(item, locale);
          setResolved({
            exerciseId: item.exercise.id,
            animationId: item.exercise.animation_id,
            enableAudio: item.enable_audio,
            enableAnimation: item.enable_animation,
            audioUrl: loc.audioUrl,
            title: loc.title,
            description: loc.description,
            durationSeconds: null,
            targetReps: null,
          });
          return;
        }

        if (exerciseId) {
          const { data, error: fetchError } = await supabase
            .from('exercises')
            .select('*')
            .eq('id', exerciseId)
            .maybeSingle();

          if (fetchError) throw fetchError;
          if (!data) { setError('Exercise not found'); return; }

          exercise = data as ExerciseData;
          enableAudio = !!(data.audio_path_en || data.audio_path_he);
          const loc = getLocalizedExercise(exercise, locale);

          setResolved({
            exerciseId: exercise.id,
            animationId: exercise.animation_id,
            enableAudio,
            enableAnimation: true,
            audioUrl: loc.audioUrl,
            title: loc.title,
            description: loc.description,
            durationSeconds: null,
            targetReps: null,
          });
        }
      } catch (_) {
        setError('Failed to load exercise');
      } finally {
        setLoading(false);
      }
    };

    loadSingle();
  }, [isPlaylistMode]);

  const handlePlay = useCallback(async () => {
    if (!resolved) return;

    setIsPlaying(true);
    setHasCompleted(false);
    animationTriggerRef.current = true;
    setAnimKey((k) => k + 1);

    if (resolved.enableAudio) {
      await audio.playAudio();
    }

    if (isPlaylistMode && resolved.durationSeconds && resolved.durationSeconds > 0) {
      timer.start();
    }

    if (!isPlaylistMode && !resolved.enableAudio) {
      setTimeout(() => handleExerciseFinished(), 10000);
    }
  }, [resolved, audio, timer, isPlaylistMode, handleExerciseFinished]);

  const handleReplay = useCallback(async () => {
    setHasCompleted(false);
    setIsPlaying(false);
    animationTriggerRef.current = false;
    await audio.resetAudio();
    if (resolved?.durationSeconds && resolved.durationSeconds > 0) {
      timer.reset(resolved.durationSeconds);
    }
  }, [audio, timer, resolved]);

  const handleModalDismiss = useCallback(() => {
    setShowModal(false);
    refreshChild();
    router.back();
  }, [refreshChild, router]);

  const isReadyToPlay = audio.audioReady && !loading && !error && !!resolved;

  const isDurationBased = isPlaylistMode && (resolved?.durationSeconds ?? 0) > 0;
  const isRepsBased = isPlaylistMode && !isDurationBased && (resolved?.targetReps ?? 0) > 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>
            {t('common.loading', { defaultValue: 'Loading...' })}
          </Text>
        </View>
      </View>
    );
  }

  if (error || !resolved) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Exercise not available'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>
              {t('common.ok', { defaultValue: 'OK' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (transitioning) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <SkipForward size={40} color="#10B981" />
          <Text style={styles.loadingText}>
            {t('exercise_player.loading_next', { defaultValue: 'Next exercise...' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIconButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {resolved.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isPlaylistMode && (
        <PlaylistProgressBar
          currentIndex={playlist.currentIndex}
          totalCount={playlist.totalExercises}
          exerciseTitle={resolved.title}
        />
      )}

      <View style={styles.animationContainer}>
        {resolved.enableAnimation && animationTriggerRef.current ? (
          <ExerciseAnimationRenderer
            key={animKey}
            animationId={resolved.animationId}
          />
        ) : (
          <View style={styles.placeholderAnimation}>
            <Text style={styles.placeholderIcon}>&#129496;</Text>
            <Text style={styles.placeholderText}>
              {t('exercise_player.ready', { defaultValue: 'Ready to start' })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {resolved.description && !isPlaying && (
          <Text style={styles.description}>{resolved.description}</Text>
        )}

        {isDurationBased && isPlaying && (
          <ExerciseTimerDisplay
            secondsRemaining={timer.secondsRemaining}
            totalSeconds={resolved.durationSeconds!}
            isRunning={timer.isRunning}
          />
        )}

        {isRepsBased && isPlaying && (
          <ExerciseRepsPrompt
            targetReps={resolved.targetReps!}
            onDone={handleExerciseFinished}
            disabled={loggingCompletion}
          />
        )}

        {loggingCompletion && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.bufferingText}>
              {t('exercise_player.saving', { defaultValue: 'Saving progress...' })}
            </Text>
          </View>
        )}

        {!isPlaying && !hasCompleted && !loggingCompletion && (
          <TouchableOpacity
            style={[styles.playButton, !isReadyToPlay && styles.playButtonDisabled]}
            onPress={handlePlay}
            disabled={!isReadyToPlay}
          >
            <Play size={24} color="#FFFFFF" />
            <Text style={styles.playButtonText}>
              {isPlaylistMode && playlist.currentIndex === 0
                ? t('exercise_player.start_workout', { defaultValue: 'Start Workout' })
                : t('exercise_player.start', { defaultValue: 'Start Exercise' })}
            </Text>
          </TouchableOpacity>
        )}

        {isPlaying && !isDurationBased && !isRepsBased && !loggingCompletion && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.bufferingText}>
              {t('exercise_player.playing', { defaultValue: 'Playing...' })}
            </Text>
          </View>
        )}

        {!isPlaylistMode && hasCompleted && !showModal && !loggingCompletion && (
          <TouchableOpacity
            style={[styles.playButton, styles.replayButton]}
            onPress={handleReplay}
          >
            <RotateCcw size={24} color="#FFFFFF" />
            <Text style={styles.playButtonText}>
              {t('exercise_player.play_again', { defaultValue: 'Play Again' })}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.metaInfo}>
          {resolved.enableAudio && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>&#128266;</Text>
              <Text style={styles.metaText}>Audio</Text>
            </View>
          )}
          {resolved.enableAnimation && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>&#127916;</Text>
              <Text style={styles.metaText}>Animated</Text>
            </View>
          )}
        </View>
      </View>

      <CompletionModal
        visible={showModal}
        pointsEarned={totalPointsEarned}
        onDismiss={handleModalDismiss}
        isWorkout={isPlaylistMode}
        exerciseCount={isPlaylistMode ? playlist.totalExercises : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backIconButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
  },
  animationContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  placeholderAnimation: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 18,
    color: '#6B7280',
  },
  controls: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  bufferingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  bufferingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  playButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  playButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  replayButton: {
    backgroundColor: '#3B82F6',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

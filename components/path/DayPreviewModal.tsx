import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { X, Clock, RotateCcw, Play } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type DailyPlan = Database['public']['Tables']['daily_plans']['Row'];

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  sequence_order: number;
  duration_seconds: number | null;
  target_reps: number | null;
  title: string;
}

interface DayPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  plan: DailyPlan | null;
  onStart: (planId: string) => void;
}

export default function DayPreviewModal({
  visible,
  onClose,
  plan,
  onStart,
}: DayPreviewModalProps) {
  const { t, i18n } = useTranslation();
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const isHebrew = i18n.language === 'he';

  useEffect(() => {
    if (visible && plan) {
      fetchExercises(plan.id);
    }
    if (!visible) {
      setExercises([]);
      setError(false);
    }
  }, [visible, plan?.id]);

  const fetchExercises = async (planId: string) => {
    try {
      setLoading(true);
      setError(false);

      const { data, error: fetchError } = await supabase
        .from('workout_items')
        .select('id, sequence_order, duration_seconds, target_reps, exercise_id, exercises(title_en, title_he)')
        .eq('plan_id', planId)
        .order('sequence_order', { ascending: true });

      if (fetchError) throw fetchError;

      const mapped: WorkoutExercise[] = (data || []).map((item: any) => ({
        id: item.id,
        exercise_id: item.exercise_id,
        sequence_order: item.sequence_order,
        duration_seconds: item.duration_seconds,
        target_reps: item.target_reps,
        title: isHebrew
          ? item.exercises?.title_he || item.exercises?.title_en || ''
          : item.exercises?.title_en || '',
      }));

      setExercises(mapped);
    } catch (err) {
      console.error('Error fetching workout exercises:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  const totalDuration = exercises.reduce(
    (sum, ex) => sum + (ex.duration_seconds || 0),
    0
  );

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {Platform.OS === 'web' ? (
          <View style={styles.backdropFill} />
        ) : (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        )}
      </Pressable>

      <View style={styles.sheetContainer} pointerEvents="box-none">
        <View style={styles.sheet}>
          {Platform.OS !== 'web' && (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={styles.sheetContent}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.dayLabel}>
                  {t('path.day_label', { defaultValue: 'Day {{day}}', day: plan.day_number })}
                </Text>
                <Text style={styles.planTitle} numberOfLines={2}>
                  {plan.title}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={12}
              >
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {plan.description ? (
              <Text style={styles.description} numberOfLines={3}>
                {plan.description}
              </Text>
            ) : null}

            {totalDuration > 0 && !loading && (
              <View style={styles.metaRow}>
                <Clock size={14} color="#9CA3AF" />
                <Text style={styles.metaText}>
                  {t('path.total_duration', { defaultValue: '~{{time}} total', time: formatDuration(totalDuration) })}
                </Text>
                <View style={styles.metaDot} />
                <Text style={styles.metaText}>
                  {t('path.exercise_count', { defaultValue: '{{count}} exercises', count: exercises.length })}
                </Text>
              </View>
            )}

            <View style={styles.listContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.loadingText}>
                    {t('common.loading', { defaultValue: 'Loading...' })}
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {t('common.error_loading_data', { defaultValue: 'Could not load data' })}
                  </Text>
                  <TouchableOpacity onPress={() => plan && fetchExercises(plan.id)}>
                    <Text style={styles.retryText}>
                      {t('common.retry', { defaultValue: 'Retry' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : exercises.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {t('path.no_exercises', { defaultValue: 'No exercises found for this day.' })}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.exerciseList}
                  showsVerticalScrollIndicator={false}
                >
                  {exercises.map((ex, idx) => (
                    <View key={ex.id} style={styles.exerciseRow}>
                      <View style={styles.sequenceBadge}>
                        <Text style={styles.sequenceText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName} numberOfLines={1}>
                          {ex.title}
                        </Text>
                        <View style={styles.exerciseMeta}>
                          {ex.duration_seconds && ex.duration_seconds > 0 ? (
                            <>
                              <Clock size={12} color="#6B7280" />
                              <Text style={styles.exerciseMetaText}>
                                {formatDuration(ex.duration_seconds)}
                              </Text>
                            </>
                          ) : ex.target_reps && ex.target_reps > 0 ? (
                            <>
                              <RotateCcw size={12} color="#6B7280" />
                              <Text style={styles.exerciseMetaText}>
                                {t('path.reps_count', { defaultValue: '{{count}} reps', count: ex.target_reps })}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  ))}
                  <View style={styles.listSpacer} />
                </ScrollView>
              )}
            </View>

            <TouchableOpacity
              style={[styles.startButton, (loading || exercises.length === 0) && styles.startButtonDisabled]}
              onPress={() => {
                if (exercises.length > 0 && plan) {
                  onStart(plan.id);
                }
              }}
              disabled={loading || exercises.length === 0}
              activeOpacity={0.8}
            >
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startButtonText}>
                {t('path.start_workout', { defaultValue: 'Start Workout' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '75%',
    backgroundColor: Platform.OS === 'web' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.75)',
  },
  sheetContent: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'web' ? 32 : 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#4B5563',
  },
  listContainer: {
    minHeight: 100,
    maxHeight: 280,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#F87171',
  },
  retryText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  exerciseList: {
    flex: 1,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  sequenceBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sequenceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  listSpacer: {
    height: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

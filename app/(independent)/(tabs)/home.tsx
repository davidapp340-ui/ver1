import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Play, Flame, Star, TrendingUp, Coffee } from 'lucide-react-native';
import { Database } from '@/lib/database.types';

type DailyPlan = Database['public']['Tables']['daily_plans']['Row'];

interface ChildProgress {
  total_points: number;
  current_streak: number;
  path_day: number;
  current_month_cycle: number;
  track_level: string;
}

export default function IndependentHomeScreen() {
  const { child } = useChildSession();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [todayPlan, setTodayPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const isRestDay = progress ? [7, 14, 21, 28].includes(progress.path_day) : false;

  const fetchData = useCallback(async () => {
    if (!child?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('children')
        .select('total_points, current_streak, path_day, current_month_cycle, track_level')
        .eq('id', child.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching progress:', error);
        return;
      }

      if (data) {
        const p: ChildProgress = {
          total_points: data.total_points || 0,
          current_streak: data.current_streak || 0,
          path_day: data.path_day || 1,
          current_month_cycle: data.current_month_cycle || 1,
          track_level: data.track_level || 'adult',
        };
        setProgress(p);

        const { data: plan } = await supabase
          .from('daily_plans')
          .select('*')
          .eq('track_level', p.track_level)
          .eq('day_number', p.path_day)
          .maybeSingle();

        setTodayPlan(plan);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [child?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleStartExercise = () => {
    if (!todayPlan) return;
    router.push({
      pathname: '/exercise-player',
      params: { planId: todayPlan.id },
    });
  };

  if (!child) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{t('independent.home.session_error')}</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0369A1" />
        </View>
      </View>
    );
  }

  const progressPercent = progress ? Math.round((progress.path_day / 30) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {t('independent.home.greeting', { name: profile?.first_name || child.name })}
          </Text>
          {progress && progress.current_month_cycle > 1 && (
            <Text style={styles.cycleText}>
              {t('independent.home.cycle', { cycle: progress.current_month_cycle })}
            </Text>
          )}
        </View>

        <View style={styles.content}>
          {progress && (
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>{t('independent.home.progress_title')}</Text>
              <Text style={styles.dayText}>
                {t('independent.home.day_of', { current: progress.path_day, total: 30 })}
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          )}

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Star size={22} color="#D97706" />
              </View>
              <Text style={styles.statValue}>{progress?.total_points || 0}</Text>
              <Text style={styles.statLabel}>{t('independent.home.stats.points')}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Flame size={22} color="#DC2626" />
              </View>
              <Text style={styles.statValue}>{progress?.current_streak || 0}</Text>
              <Text style={styles.statLabel}>
                {t('independent.home.stats.streak')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <TrendingUp size={22} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>{progressPercent}%</Text>
              <Text style={styles.statLabel}>
                {t('independent.home.day_of', { current: progress?.path_day || 1, total: 30 })}
              </Text>
            </View>
          </View>

          {isRestDay ? (
            <View style={styles.restDayCard}>
              <Coffee size={40} color="#0369A1" />
              <Text style={styles.restDayTitle}>{t('independent.home.rest_day')}</Text>
              <Text style={styles.restDayDescription}>
                {t('independent.home.rest_day_description')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.startButton, !todayPlan && styles.startButtonDisabled]}
              onPress={handleStartExercise}
              disabled={!todayPlan}
              activeOpacity={0.8}
            >
              <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startButtonText}>
                {t('independent.home.start_exercise')}
              </Text>
            </TouchableOpacity>
          )}

          {todayPlan && !isRestDay && (
            <View style={styles.planCard}>
              <Text style={styles.planTitle}>{todayPlan.title}</Text>
              {todayPlan.description && (
                <Text style={styles.planDescription}>{todayPlan.description}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  cycleText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0369A1',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#0369A1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#0369A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  restDayCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  restDayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0369A1',
    marginTop: 16,
    marginBottom: 8,
  },
  restDayDescription: {
    fontSize: 15,
    color: '#0C4A6E',
    textAlign: 'center',
    lineHeight: 22,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0369A1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
});

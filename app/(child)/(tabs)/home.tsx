import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import StatsRow from '@/components/StatsRow';
import { getAvatarEntry } from '@/lib/avatars';

interface ChildProgress {
  total_points: number;
  current_streak: number;
  path_day: number;
}

export default function ChildHomeScreen() {
  const { child } = useChildSession();
  const { t } = useTranslation();
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!child?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('children')
        .select('total_points, current_streak, path_day')
        .eq('id', child.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching child progress:', error);
        return;
      }

      if (data) {
        setProgress({
          total_points: data.total_points || 0,
          current_streak: data.current_streak || 0,
          path_day: data.path_day || 1,
        });
      }
    } catch (err) {
      console.error('Unexpected error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  }, [child?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchProgress();
    }, [fetchProgress])
  );

  const avatar = getAvatarEntry(child?.avatar_id ?? 'default');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('child_home.title')}</Text>
            <Text style={styles.subtitle}>{t('child_home.welcome', { childName: child?.name })}</Text>
          </View>
          <View style={[styles.headerAvatar, { backgroundColor: avatar.color + '20' }]}>
            <Text style={styles.headerAvatarEmoji}>{avatar.emoji}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : progress ? (
        <>
          <StatsRow
            totalPoints={progress.total_points}
            currentStreak={progress.current_streak}
            pathDay={progress.path_day}
          />

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>
                {t('child_navigation.home_screen.placeholder')}
              </Text>
            </View>
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerAvatarEmoji: {
    fontSize: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
  },
});

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useWindowDimensions, Platform } from 'react-native';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { Check, Lock, Star, Gift, Play, Sparkles } from 'lucide-react-native';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { type WorldTheme } from '@/lib/worldThemes';
import { useMonthlyTheme } from '@/hooks/useMonthlyTheme';
import SvgConnectedPath, { type NodeCoord } from '@/components/game-path/SvgConnectedPath';
import PathDecoration from '@/components/path/PathDecoration';
import DayPreviewModal from '@/components/path/DayPreviewModal';
import React from 'react';

type DailyPlan = Database['public']['Tables']['daily_plans']['Row'];

const SINE_FREQUENCY = 0.55;
const MOBILE_BREAKPOINT = 480;

function getLayoutMetrics(containerWidth: number) {
  const isCompact = containerWidth < MOBILE_BREAKPOINT;
  return {
    isCompact,
    nodeSize: isCompact ? 52 : 60,
    currentNodeSize: isCompact ? 64 : 72,
    verticalSpacing: isCompact ? 96 : 116,
    topPadding: isCompact ? 28 : 40,
    bottomPadding: isCompact ? 80 : 120,
  };
}

function computeSinePositions(
  count: number,
  containerWidth: number,
  metrics: ReturnType<typeof getLayoutMetrics>,
): NodeCoord[] {
  const centerX = containerWidth / 2;
  const amplitude = containerWidth * (metrics.isCompact ? 0.32 : 0.28);

  const positions: NodeCoord[] = [];
  for (let i = 0; i < count; i++) {
    const fromBottom = count - 1 - i;
    positions.push({
      x: centerX + Math.sin(i * SINE_FREQUENCY) * amplitude,
      y: metrics.topPadding + fromBottom * metrics.verticalSpacing,
    });
  }

  return positions;
}

export default function PathScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { child, loading: sessionLoading } = useChildSession();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [claimingTreasure, setClaimingTreasure] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<DailyPlan | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const autoOpenedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const pathWidth = screenWidth;
  const dayCount = 30;
  const safePathDay = Math.min(30, Math.max(1, Number(child?.path_day) || 1));

  const layout = useMemo(() => getLayoutMetrics(pathWidth), [pathWidth]);

  const nodePositions = useMemo(
    () => computeSinePositions(dayCount, pathWidth, layout),
    [dayCount, pathWidth, layout]
  );

  const totalPathHeight = useMemo(
    () => (dayCount - 1) * layout.verticalSpacing + layout.topPadding + layout.bottomPadding,
    [dayCount, layout]
  );

  const theme: WorldTheme = useMonthlyTheme(child?.current_month_cycle ?? 1);

  const fetchData = async () => {
    if (!child?.id || !child?.track_level) return;

    try {
      setDataLoading(true);
      setLoadError(false);

      const { data: plans, error: plansError } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('track_level', child.track_level)
        .order('day_number', { ascending: true });

      if (plansError) throw plansError;
      setDailyPlans(plans || []);

      const { data: todayTask } = await (supabase as any).rpc('get_today_task', {
        p_child_id: child.id,
      });
      setTodayCompleted(!!(todayTask as any)?.completed_this_cycle);
    } catch (error) {
      console.error('Error fetching path data:', error);
      setLoadError(true);
    } finally {
      setDataLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (child?.id) {
        fetchData();
      }
    }, [child?.id])
  );

  useFocusEffect(
    React.useCallback(() => {
      autoOpenedRef.current = false;
      return () => {
        autoOpenedRef.current = false;
      };
    }, [])
  );

  useEffect(() => {
    if (!child || dataLoading || dailyPlans.length === 0) return;
    if (autoOpenedRef.current) return;
    if (todayCompleted) return;
    if (isPreviewVisible) return;

    const todayPlan = dailyPlans.find(p => p.day_number === safePathDay);
    const isRestDay = [7, 14, 21, 28].includes(safePathDay);
    if (!todayPlan || isRestDay) return;

    autoOpenedRef.current = true;
    setSelectedPlan(todayPlan);
    setIsPreviewVisible(true);
  }, [child, dataLoading, dailyPlans, todayCompleted, isPreviewVisible, safePathDay]);

  useFocusEffect(
    React.useCallback(() => {
      if (!child || !scrollRef.current || nodePositions.length === 0) return;

      const timer = setTimeout(() => {
        const currentIndex = safePathDay - 1;
        const node = nodePositions[currentIndex];
        if (!node) return;

        const scrollTarget = node.y - screenHeight / 2 + layout.nodeSize / 2;

        scrollRef.current?.scrollTo({
          y: Math.max(0, scrollTarget),
          animated: true,
        });
      }, 150);

      return () => clearTimeout(timer);
    }, [child, safePathDay, nodePositions, screenHeight, layout])
  );

  const handleNodePress = async (day: number, plan: DailyPlan | undefined) => {
    if (!child) return;

    if (day > safePathDay) {
      return;
    }

    const isRestDay = [7, 14, 21, 28].includes(day);

    if (isRestDay && day === safePathDay) {
      await handleClaimTreasure();
      return;
    }

    if (isRestDay) return;

    if (!plan && day !== safePathDay) {
      Alert.alert(
        t('path.coming_soon_title', { defaultValue: 'Coming Soon' }),
        t('path.coming_soon_message', { defaultValue: 'This day\'s exercises are not available yet. Check back soon!' })
      );
      return;
    }

    setSelectedPlan(plan ?? null);
    setIsPreviewVisible(true);
  };

  const handleClaimTreasure = async () => {
    if (!child?.id || claimingTreasure) return;

    try {
      setClaimingTreasure(true);

      const { data, error } = await supabase.rpc('claim_treasure_bonus', {
        p_child_id: child.id
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success) {
          Alert.alert(
            '🎉 ' + t('path.treasure_claimed'),
            t('path.treasure_points', { points: data.points_earned || 50 }),
            [{ text: t('common.ok'), onPress: fetchData }]
          );
        } else {
          Alert.alert(t('common.error'), data.error || t('path.treasure_error'));
        }
      }
    } catch (error) {
      console.error('Error claiming treasure:', error);
      Alert.alert(t('common.error'), t('path.treasure_error'));
    } finally {
      setClaimingTreasure(false);
    }
  };

  const renderNode = (day: number, index: number) => {
    if (!child) return null;

    const plan = dailyPlans.find(p => p.day_number === day);
    const pos = nodePositions[index];
    if (!pos) return null;

    const isRestDay = [7, 14, 21, 28].includes(day);
    const isPast = day < safePathDay;
    const isCurrent = day === safePathDay;
    const isFuture = day > safePathDay;
    const size = isCurrent ? layout.currentNodeSize : layout.nodeSize;
    const half = size / 2;

    return (
      <TouchableOpacity
        key={day}
        style={[
          styles.nodeContainer,
          {
            left: pos.x - half,
            top: pos.y - half,
            width: size + 40,
          }
        ]}
        onPress={() => handleNodePress(day, plan)}
        disabled={isFuture}
        activeOpacity={isFuture ? 1 : 0.7}
      >
        {isCurrent && !isRestDay && (
          <View style={styles.avatarContainer}>
            <Star size={28} color="#FFD700" fill="#FFD700" />
          </View>
        )}

        {isRestDay ? (
          <TreasureNode
            isPast={isPast}
            isCurrent={isCurrent}
            isFuture={isFuture}
            size={size}
            theme={theme}
          />
        ) : (
          <DayNode
            day={day}
            isPast={isPast}
            isCurrent={isCurrent}
            isFuture={isFuture}
            title={plan?.title}
            size={size}
            theme={theme}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (sessionLoading || dataLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColors[0] }]}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!child) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('common.session_error', { defaultValue: 'Session error. Please log in again.' })}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.replace('/child-login')}
          >
            <Text style={styles.errorButtonText}>{t('common.go_to_login', { defaultValue: 'Go to Login' })}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColors[0] }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('common.error_loading_data')}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={fetchData}
          >
            <Text style={styles.errorButtonText}>{t('common.retry', { defaultValue: 'Retry' })}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const completedCount = Math.max(0, safePathDay - 1);
  const progressPct = Math.min(100, Math.max(0, (completedCount / dayCount) * 100));
  const todayPlan = dailyPlans.find(p => p.day_number === safePathDay);
  const todayIsRest = [7, 14, 21, 28].includes(safePathDay);

  const openToday = () => {
    if (todayIsRest) {
      handleClaimTreasure();
      return;
    }
    setSelectedPlan(todayPlan ?? null);
    setIsPreviewVisible(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.backgroundColors}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, layout.isCompact && styles.headerCompact]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, layout.isCompact && styles.titleCompact]}>
            {t('path.title', { defaultValue: 'Your Journey' })}
          </Text>
          <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>{safePathDay}/30</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: theme.nodeColor }]} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>{t('path.streak')}</Text>
            <Text style={styles.statChipValue}>🔥 {child.current_streak}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>{t('path.points')}</Text>
            <Text style={styles.statChipValue}>⭐ {child.total_points}</Text>
          </View>
        </View>

        {todayCompleted ? (
          <View style={styles.todayCardDone}>
            <Check size={18} color="#10B981" strokeWidth={3} />
            <Text style={styles.todayCardDoneText}>
              {t('path.today_completed', { defaultValue: '✓ הושלם להיום — נתראה מחר' })}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.todayCard, { borderColor: theme.nodeColor }]}
            onPress={openToday}
            activeOpacity={0.85}
          >
            <View style={styles.todayCardLeft}>
              <Text style={styles.todayCardLabel}>
                {t('path.today_label', { defaultValue: 'היום · יום' })} {safePathDay}
              </Text>
              <Text style={styles.todayCardTitle} numberOfLines={1}>
                {todayIsRest
                  ? t('path.treasure_day', { defaultValue: 'יום אוצר 🎁' })
                  : todayPlan?.title || t('path.coming_soon_title', { defaultValue: 'בקרוב' })}
              </Text>
            </View>
            <View style={[styles.todayCardCta, { backgroundColor: theme.nodeColor }]}>
              {todayIsRest ? (
                <Sparkles size={18} color="#1F2937" />
              ) : (
                <Play size={18} color="#1F2937" fill="#1F2937" />
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.pathContainer,
          { height: totalPathHeight },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {nodePositions.map((pos, i) => (
          <PathDecoration
            key={`deco-${i}`}
            rowIndex={i}
            nodeX={pos.x}
            nodeY={pos.y}
            themeId={theme.id}
            colors={theme.decoration}
            containerWidth={pathWidth}
          />
        ))}

        <SvgConnectedPath
          nodes={nodePositions}
          width={pathWidth}
          height={totalPathHeight}
          pathColor={theme.pathColor}
          strokeColor={theme.pathStroke}
          completedCount={completedCount}
          completedColor={theme.nodeColor}
        />

        {Array.from({ length: dayCount }, (_, i) => i + 1).map((day, index) =>
          renderNode(day, index)
        )}
      </ScrollView>

      <DayPreviewModal
        visible={isPreviewVisible}
        onClose={() => {
          setIsPreviewVisible(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        dayNumber={safePathDay}
        onStart={(planId: string | null, firstExerciseId?: string) => {
          setIsPreviewVisible(false);
          if (planId) {
            router.push({ pathname: '/exercise-player', params: { planId } });
          } else if (firstExerciseId) {
            router.push({ pathname: '/exercise-player', params: { exerciseId: firstExerciseId } });
          }
          setSelectedPlan(null);
        }}
      />
    </View>
  );
}

function DayNode({
  day,
  isPast,
  isCurrent,
  isFuture,
  title,
  size,
  theme,
}: {
  day: number;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  title?: string;
  size: number;
  theme: WorldTheme;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isCurrent) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 450, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 450, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isCurrent]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgColor = isPast
    ? theme.nodeColor
    : isCurrent
      ? theme.currentGlow
      : theme.lockedNodeColor;
  const borderColor = isPast
    ? theme.nodeStroke
    : isCurrent
      ? '#E6B800'
      : theme.lockedNodeStroke;

  return (
    <View style={styles.nodeWrapper}>
      {isCurrent && (
        <View style={[
          styles.glowRing,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            backgroundColor: theme.currentGlow,
            opacity: 0.25,
          },
        ]} />
      )}
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            borderWidth: 3,
            backgroundColor: bgColor,
            borderColor: borderColor,
          },
          isCurrent && animatedStyle,
          isCurrent && Platform.select({
            web: { boxShadow: `0 0 18px ${theme.currentGlow}80` } as any,
            default: {
              shadowColor: theme.currentGlow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 12,
              elevation: 10,
            },
          }),
        ]}
      >
        {isPast && <Check size={24} color="#FFFFFF" strokeWidth={3} />}
        {isCurrent && <Text style={styles.nodeTextCurrent}>{day}</Text>}
        {isFuture && <Lock size={20} color="#6B7280" />}
      </Animated.View>
      {title && isCurrent && (
        <View style={styles.titleBubble}>
          <Text style={styles.nodeTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
      )}
    </View>
  );
}

function TreasureNode({
  isPast,
  isCurrent,
  isFuture,
  size,
  theme,
}: {
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  size: number;
  theme: WorldTheme;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isCurrent) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 140 }),
          withTiming(8, { duration: 280 }),
          withTiming(0, { duration: 140 })
        ),
        -1,
        false
      );
    }
  }, [isCurrent]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const bgColor = isPast
    ? theme.nodeColor
    : isCurrent
      ? theme.currentGlow
      : theme.lockedNodeColor;
  const borderColor = isPast
    ? theme.nodeStroke
    : isCurrent
      ? '#E6B800'
      : theme.lockedNodeStroke;

  return (
    <View style={styles.nodeWrapper}>
      {isCurrent && (
        <View style={[
          styles.glowRing,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            backgroundColor: theme.currentGlow,
            opacity: 0.25,
          },
        ]} />
      )}
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            borderWidth: 3,
            backgroundColor: bgColor,
            borderColor: borderColor,
          },
          isCurrent && animatedStyle,
          isCurrent && Platform.select({
            web: { boxShadow: `0 0 18px ${theme.currentGlow}80` } as any,
            default: {
              shadowColor: theme.currentGlow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 12,
              elevation: 10,
            },
          }),
        ]}
      >
        <Gift
          size={isCurrent ? 28 : 24}
          color={isFuture ? '#6B7280' : '#FFD700'}
          fill={isPast ? '#FFD700' : 'none'}
        />
      </Animated.View>
      {isCurrent && (
        <View style={styles.titleBubble}>
          <Text style={styles.treasureLabel}>Tap to open!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2A1D',
  },
  header: {
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    zIndex: 10,
    gap: 10,
  },
  headerCompact: {
    paddingTop: Platform.OS === 'web' ? 12 : 48,
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleCompact: {
    fontSize: 20,
  },
  dayPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dayPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statChipLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statChipValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  todayCardLeft: {
    flex: 1,
    minWidth: 0,
  },
  todayCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  todayCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  todayCardCta: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCardDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderColor: 'rgba(16,185,129,0.45)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  todayCardDoneText: {
    color: '#D1FAE5',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  pathContainer: {
    position: 'relative',
  },
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeWrapper: {
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
  },
  avatarContainer: {
    position: 'absolute',
    top: -36,
    zIndex: 10,
    alignSelf: 'center',
  },
  nodeTextCurrent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  titleBubble: {
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  nodeTitle: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    maxWidth: 90,
  },
  treasureLabel: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F87171',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

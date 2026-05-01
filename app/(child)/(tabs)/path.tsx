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
import { Check, Lock, Star, Gift } from 'lucide-react-native';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { getThemeById, type WorldTheme } from '@/lib/worldThemes';
import SvgConnectedPath, { type NodeCoord } from '@/components/game-path/SvgConnectedPath';
import PathDecoration from '@/components/path/PathDecoration';
import DayPreviewModal from '@/components/path/DayPreviewModal';
import React from 'react';

type DailyPlan = Database['public']['Tables']['daily_plans']['Row'];

const NODE_SIZE = 60;
const CURRENT_NODE_SIZE = 72;
const VERTICAL_SPACING = 120;
const TOP_PADDING = 40;
const BOTTOM_PADDING = 120;
const SINE_FREQUENCY = 0.55;

function computeSinePositions(
  count: number,
  containerWidth: number,
): NodeCoord[] {
  const centerX = containerWidth / 2;
  const amplitude = containerWidth * 0.28;
  const totalHeight = (count - 1) * VERTICAL_SPACING + TOP_PADDING + BOTTOM_PADDING;

  const positions: NodeCoord[] = [];
  for (let i = 0; i < count; i++) {
    const fromBottom = count - 1 - i;
    positions.push({
      x: centerX + Math.sin(i * SINE_FREQUENCY) * amplitude,
      y: TOP_PADDING + fromBottom * VERTICAL_SPACING,
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
  const scrollRef = useRef<ScrollView>(null);

  const pathWidth = screenWidth;
  const dayCount = 30;

  const nodePositions = useMemo(
    () => computeSinePositions(dayCount, pathWidth),
    [dayCount, pathWidth]
  );

  const totalPathHeight = useMemo(
    () => (dayCount - 1) * VERTICAL_SPACING + TOP_PADDING + BOTTOM_PADDING,
    [dayCount]
  );

  const theme = useMemo<WorldTheme>(() => {
    if (!child) return getThemeById('forest');
    return getThemeById(child.path_theme_id || 'forest');
  }, [child?.path_theme_id]);

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
      if (!child || !scrollRef.current || nodePositions.length === 0) return;

      const timer = setTimeout(() => {
        const currentIndex = child.path_day - 1;
        if (currentIndex < 0 || currentIndex >= nodePositions.length) return;

        const nodeY = nodePositions[currentIndex].y;
        const scrollTarget = nodeY - screenHeight / 2 + NODE_SIZE / 2;

        scrollRef.current?.scrollTo({
          y: Math.max(0, scrollTarget),
          animated: true,
        });
      }, 150);

      return () => clearTimeout(timer);
    }, [child?.path_day, nodePositions, screenHeight])
  );

  const handleNodePress = async (day: number, plan: DailyPlan | undefined) => {
    if (!child) return;

    if (day > child.path_day) {
      return;
    }

    if (!plan) {
      Alert.alert(
        t('path.coming_soon_title', { defaultValue: 'Coming Soon' }),
        t('path.coming_soon_message', { defaultValue: 'This day\'s exercises are not available yet. Check back soon!' })
      );
      return;
    }

    const isRestDay = [7, 14, 21, 28].includes(day);

    if (isRestDay && day === child.path_day) {
      await handleClaimTreasure();
    } else if (!isRestDay) {
      setSelectedPlan(plan);
      setIsPreviewVisible(true);
    }
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
    const isPast = day < child.path_day;
    const isCurrent = day === child.path_day;
    const isFuture = day > child.path_day;
    const size = isCurrent ? CURRENT_NODE_SIZE : NODE_SIZE;
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

  const completedCount = Math.max(0, child.path_day - 1);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.backgroundColors}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Text style={styles.title}>{t('path.title', { defaultValue: 'Your Journey' })}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('path.day')}</Text>
            <Text style={styles.statValue}>{child.path_day}/30</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('path.streak')}</Text>
            <Text style={styles.statValue}>{child.current_streak}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('path.points')}</Text>
            <Text style={styles.statValue}>{child.total_points}</Text>
          </View>
        </View>
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
        onStart={(planId: string) => {
          setIsPreviewVisible(false);
          router.push({
            pathname: '/exercise-player',
            params: { planId },
          });
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
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
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
          withTiming(-10, { duration: 200 }),
          withTiming(10, { duration: 400 }),
          withTiming(0, { duration: 200 })
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
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

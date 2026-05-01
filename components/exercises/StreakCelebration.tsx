import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CONFETTI_COUNT = 24;
const COLORS = ['#FCD34D', '#34D399', '#60A5FA', '#F472B6', '#A78BFA', '#FB7185'];

interface Props {
  visible: boolean;
  streak: number;
  onDismiss: () => void;
}

const StreakCelebration: React.FC<Props> = ({ visible, streak, onDismiss }) => {
  const { t } = useTranslation();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withSpring(1, { damping: 8, stiffness: 110 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.7, { duration: 200 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="auto">
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiPiece key={i} index={i} visible={visible} />
      ))}
      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>
          {t('celebration.day_streak', { defaultValue: 'ימים ברצף!' })}
        </Text>
        <Text style={styles.subtitle}>
          {t('celebration.keep_going', { defaultValue: 'נמשיך מחר!' })}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

function ConfettiPiece({ index, visible }: { index: number; visible: boolean }) {
  const t = useSharedValue(0);
  const startX = (index / CONFETTI_COUNT) * SCREEN_W;
  const driftX = (Math.random() - 0.5) * 120;
  const color = COLORS[index % COLORS.length];
  const rotateBase = Math.random() * 360;
  const delay = (index % 6) * 60;
  const size = 8 + Math.random() * 6;

  useEffect(() => {
    if (visible) {
      t.value = 0;
      t.value = withDelay(
        delay,
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    transform: [
      { translateY: interpolate(t.value, [0, 1], [-40, SCREEN_H * 0.7]) },
      { translateX: interpolate(t.value, [0, 1], [0, driftX]) },
      { rotate: `${rotateBase + t.value * 540}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: startX,
          width: size,
          height: size * 1.6,
          backgroundColor: color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2,6,23,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 36,
    paddingVertical: 28,
    borderRadius: 22,
    alignItems: 'center',
    minWidth: 240,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 18,
  },
  flame: { fontSize: 56, marginBottom: 4 },
  streakNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#F97316',
    lineHeight: 70,
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
});

export default StreakCelebration;

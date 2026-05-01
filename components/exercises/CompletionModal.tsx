import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CompletionModalProps {
  visible: boolean;
  pointsEarned: number;
  onDismiss: () => void;
  isWorkout?: boolean;
  exerciseCount?: number;
}

export default function CompletionModal({
  visible,
  pointsEarned,
  onDismiss,
  isWorkout,
  exerciseCount,
}: CompletionModalProps) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const coinBounce = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      coinBounce.setValue(0);
      fadeAnim.setValue(0);
      shimmerAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 65,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(coinBounce, {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const cardScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const coinScale = coinBounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.3, 1],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <Animated.View style={[styles.shimmer, { opacity: shimmerOpacity }]} />

          <View style={styles.starBurst}>
            <Text style={styles.starEmoji}>&#127881;</Text>
          </View>

          {/* TODO: Add Victory Lottie Animation Here */}

          <Text style={styles.title}>
            {isWorkout
              ? t('completion_modal.workout_title', { defaultValue: 'Workout Complete!' })
              : t('completion_modal.title')}
          </Text>
          <Text style={styles.subtitle}>
            {isWorkout
              ? t('completion_modal.workout_subtitle', {
                  defaultValue: 'You completed all {{count}} exercises!',
                  count: exerciseCount ?? 0,
                })
              : t('completion_modal.subtitle')}
          </Text>

          <Animated.View
            style={[styles.pointsContainer, { transform: [{ scale: coinScale }] }]}
          >
            <Text style={styles.coinEmoji}>&#129689;</Text>
            <Text style={styles.pointsValue}>+{pointsEarned}</Text>
            <Text style={styles.pointsLabel}>{t('completion_modal.points_label')}</Text>
          </Animated.View>

          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{t('completion_modal.button')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: Math.min(SCREEN_WIDTH - 64, 380),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FEF3C7',
    borderRadius: 28,
  },
  starBurst: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  starEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 28,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#F59E0B',
    gap: 8,
  },
  coinEmoji: {
    fontSize: 28,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#B45309',
  },
  pointsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400E',
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const CYCLE_MS = 6000;

const Exercise06: React.FC = () => {
  const { t } = useTranslation();
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(
      withSequence(
        withTiming(1, { duration: CYCLE_MS / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: CYCLE_MS / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );
  }, []);

  const nearStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 0.4, 0.5], [1, 1, 0.15]),
    transform: [{ scale: interpolate(phase.value, [0, 0.5], [1.0, 0.6]) }],
  }));

  const farStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0.5, 0.6, 1], [0.15, 1, 1]),
    transform: [{ scale: interpolate(phase.value, [0.5, 1], [0.6, 1.0]) }],
  }));

  const labelNear = useAnimatedStyle(() => ({ opacity: phase.value < 0.5 ? 1 : 0 }));
  const labelFar = useAnimatedStyle(() => ({ opacity: phase.value >= 0.5 ? 1 : 0 }));

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Animated.View style={[styles.farCircle, farStyle]} />
        <Animated.View style={[styles.nearCircle, nearStyle]} />
      </View>
      <View style={styles.labels}>
        <Animated.Text style={[styles.label, labelNear]}>
          {t('exercise.near', { defaultValue: 'קרוב' })}
        </Animated.Text>
        <Animated.Text style={[styles.label, labelFar]}>
          {t('exercise.far', { defaultValue: 'רחוק' })}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1A2D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  stage: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  farCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: '#60A5FA',
    backgroundColor: 'rgba(96,165,250,0.05)',
  },
  nearCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FCD34D',
    shadowColor: '#FCD34D',
    shadowOpacity: 0.7,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  labels: {
    height: 56,
    marginTop: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});

export default Exercise06;

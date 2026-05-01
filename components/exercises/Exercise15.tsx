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
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';

const INHALE = 4000;
const HOLD = 4000;
const EXHALE = 4000;

type Phase = 'inhale' | 'hold' | 'exhale';

const Exercise15: React.FC = () => {
  const { t } = useTranslation();
  const progress = useSharedValue(0);
  const [phase, setPhase] = React.useState<Phase>('inhale');

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: INHALE,
          easing: Easing.inOut(Easing.cubic),
        }),
        withTiming(1, { duration: HOLD }),
        withTiming(0, {
          duration: EXHALE,
          easing: Easing.inOut(Easing.cubic),
        }),
      ),
      -1,
      false
    );

    const cycleLength = INHALE + HOLD + EXHALE;
    const interval = setInterval(() => {
      const now = Date.now() % cycleLength;
      if (now < INHALE) setPhase('inhale');
      else if (now < INHALE + HOLD) setPhase('hold');
      else setPhase('exhale');
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.55, 1.0]) }],
    opacity: interpolate(progress.value, [0, 1], [0.65, 1]),
  }));

  const labels: Record<Phase, string> = {
    inhale: t('exercise.breathe_in', { defaultValue: 'שאפי' }),
    hold: t('exercise.breathe_hold', { defaultValue: 'החזיקי' }),
    exhale: t('exercise.breathe_out', { defaultValue: 'נשפי' }),
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.outerRing, circleStyle]}>
        <Animated.View style={styles.innerRing}>
          <Animated.Text style={styles.cue}>{labels[phase]}</Animated.Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#082F49',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(56,189,248,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(125,211,252,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(125,211,252,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

export default Exercise15;

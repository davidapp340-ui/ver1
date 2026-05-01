import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, G } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const EYE_W = 240;
const EYE_H = 140;

const Exercise09: React.FC = () => {
  const { t } = useTranslation();
  const blink = useSharedValue(0); // 0 = open, 1 = closed

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2200 }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) }),
        withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) }),
      ),
      -1,
      false
    );
  }, []);

  // Lid path interpolation between open and closed
  const lidProps = useAnimatedProps(() => {
    const openY = 10;
    const closedY = 70;
    const y = interpolate(blink.value, [0, 1], [openY, closedY]);
    const d = `M 20 70 Q 120 ${y} 220 70 L 220 75 Q 120 ${y + 5} 20 75 Z`;
    return { d };
  });

  const cueStyle = useAnimatedStyle(() => ({
    opacity: interpolate(blink.value, [0, 0.5, 1], [0, 0.6, 1]),
    transform: [{ scale: interpolate(blink.value, [0, 1], [0.85, 1.1]) }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.eyeWrap}>
        <Svg width={EYE_W} height={EYE_H} viewBox="0 0 240 140">
          {/* Eye outline */}
          <Path
            d="M 20 70 Q 120 10 220 70 Q 120 130 20 70 Z"
            fill="#F8FAFC"
            stroke="#94A3B8"
            strokeWidth={3}
          />
          {/* Iris */}
          <G>
            <Path d="M 95 70 a 25 25 0 1 0 50 0 a 25 25 0 1 0 -50 0" fill="#1E40AF" />
            <Path d="M 110 70 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0" fill="#0F172A" />
          </G>
          {/* Lid */}
          <AnimatedPath animatedProps={lidProps} fill="#FCA5A5" stroke="#B91C1C" strokeWidth={2} />
        </Svg>
        <Animated.Text style={[styles.cue, cueStyle]}>
          {t('exercise.blink_now', { defaultValue: 'מצמצי' })}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeWrap: {
    alignItems: 'center',
    gap: 32,
  },
  cue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FCA5A5',
    letterSpacing: 1.5,
  },
});

export default Exercise09;

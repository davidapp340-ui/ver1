import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Polygon, Rect, G } from 'react-native-svg';

const Exercise21: React.FC = () => {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 3500, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false
    );
  }, []);

  const pencilStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [-120, 80]) },
      { scale: interpolate(t.value, [0, 1], [0.6, 1.4]) },
    ],
  }));

  const focusRing = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.5, 1], [0.4, 0.85, 0.4]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.8, 1.3]) }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.focusRing, focusRing]} />
      <Animated.View style={pencilStyle}>
        <Svg width={60} height={220} viewBox="0 0 60 220">
          {/* Pencil shaft */}
          <Rect x={20} y={20} width={20} height={140} fill="#FBBF24" stroke="#92400E" strokeWidth={1.5} />
          {/* Eraser */}
          <Rect x={20} y={6} width={20} height={18} rx={4} fill="#F87171" stroke="#7F1D1D" strokeWidth={1.5} />
          {/* Metal band */}
          <Rect x={20} y={20} width={20} height={6} fill="#9CA3AF" />
          {/* Wooden tip */}
          <Polygon points="20,160 40,160 30,200" fill="#FCD34D" stroke="#92400E" strokeWidth={1.5} />
          {/* Lead point */}
          <Polygon points="26,182 34,182 30,200" fill="#1F2937" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C4A6E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#67E8F9',
  },
});

export default Exercise21;

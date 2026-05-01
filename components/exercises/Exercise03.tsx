import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TRACK_W = Math.min(SCREEN_W - 48, 360);
const TRACK_H = 220;
const DOT_SIZE = 36;

const Exercise03: React.FC = () => {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Infinity / lemniscate parametric path
  const dotStyle = useAnimatedStyle(() => {
    const angle = t.value * Math.PI * 2;
    const ax = (TRACK_W / 2) - DOT_SIZE / 2;
    const ay = (TRACK_H / 2) - DOT_SIZE / 2;
    const x = ax + (Math.sin(angle) * ax) / (1 + Math.cos(angle) ** 2);
    const y = ay + (Math.sin(angle) * Math.cos(angle) * ay) / (1 + Math.cos(angle) ** 2);
    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  const pulse = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(Math.sin(t.value * Math.PI * 4), [-1, 1], [0.9, 1.15]) }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.dot, dotStyle]}>
          <Animated.View style={[styles.dotInner, pulse]} />
        </Animated.View>
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
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#FCD34D',
    shadowColor: '#FCD34D',
    shadowOpacity: 0.8,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});

export default Exercise03;

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');
const STAGE = Math.min(SCREEN_W - 24, 360);
const TARGET = 64;
const PADDING = 18;

const CORNERS = [
  { x: PADDING, y: PADDING },                     // TL
  { x: STAGE - TARGET - PADDING, y: PADDING },    // TR
  { x: STAGE - TARGET - PADDING, y: STAGE - TARGET - PADDING }, // BR
  { x: PADDING, y: STAGE - TARGET - PADDING },    // BL
];

const Exercise18: React.FC = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive(prev => (prev + 1) % 4);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.stage, { width: STAGE, height: STAGE }]}>
        {CORNERS.map((pos, i) => (
          <Corner key={i} x={pos.x} y={pos.y} active={i === active} />
        ))}
      </View>
    </View>
  );
};

function Corner({ x, y, active }: { x: number; y: number; active: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withTiming(active ? 1.25 : 1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(active ? 1 : 0.3, { duration: 300 });
  }, [active]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.target,
        { left: x, top: y, width: TARGET, height: TARGET, borderRadius: TARGET / 2 },
        active && styles.targetActive,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stage: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    position: 'relative',
  },
  target: {
    position: 'absolute',
    backgroundColor: '#475569',
    borderWidth: 3,
    borderColor: '#64748B',
  },
  targetActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#FBBF24',
    shadowColor: '#FBBF24',
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
});

export default Exercise18;

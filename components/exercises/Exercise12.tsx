import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const SIZE = 280;
const DOT = 28;

// Vertical figure-eight parametric
function pos(t: number) {
  const a = (SIZE - DOT) / 2 - 10;
  const angle = t * Math.PI * 2;
  const x = (a * Math.sin(angle * 2)) / 2;
  const y = a * Math.sin(angle);
  return { x, y };
}

const Exercise12: React.FC = () => {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => {
    const { x, y } = pos(t.value);
    return {
      transform: [
        { translateX: x },
        { translateY: y },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Svg
          width={SIZE}
          height={SIZE}
          viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
          style={StyleSheet.absoluteFill}
        >
          <Path
            d={describeFigureEight(110)}
            stroke="rgba(167,139,250,0.3)"
            strokeWidth={2}
            strokeDasharray="6 8"
            fill="none"
          />
        </Svg>
        <Animated.View style={[styles.dot, dotStyle]} />
      </View>
    </View>
  );
};

function describeFigureEight(a: number): string {
  const steps = 60;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const tt = i / steps;
    const angle = tt * Math.PI * 2;
    const x = (a * Math.sin(angle * 2)) / 2;
    const y = a * Math.sin(angle);
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B4B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stage: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: '#A78BFA',
    shadowColor: '#A78BFA',
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
});

export default Exercise12;

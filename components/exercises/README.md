# Exercise Animation Components

This directory contains React Native animation components for eye exercises.

## Component Requirements

All exercise animation components must be:

1. **React Native Compatible**
   - Use `View`, `Text`, `Animated.View` instead of HTML elements
   - Use `StyleSheet.create()` for styling
   - Use `react-native-svg` for vector graphics
   - Use `react-native-reanimated` for smooth animations

2. **Self-Contained**
   - Each component should be a complete, standalone animation
   - Include all animation logic within the component
   - Accept optional props for configuration (duration, colors, etc.)

3. **Performance Optimized**
   - Use native animations when possible
   - Avoid excessive re-renders
   - Clean up timers and listeners on unmount

## Example Structure

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

interface ExerciseAnimationProps {
  duration?: number;
  onComplete?: () => void;
}

export default function MyExerciseAnimation({
  duration = 10000,
  onComplete
}: ExerciseAnimationProps) {
  // Animation logic here

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 400 500">
        {/* SVG content */}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

## Registering New Components

After creating a component, register it in `ExerciseRegistry.tsx`:

```typescript
import MyExerciseAnimation from './MyExerciseAnimation';

export const ExerciseRegistry = {
  'my_exercise_v1': MyExerciseAnimation,
  // ... other exercises
};
```

The `animation_id` in the database must match the key in this registry.

## Web Preview Components

Web preview components (like `palming_preview.tsx` in the root components directory) are for visualization and demonstration purposes only. They use web-specific code and cannot be used directly in the React Native app.

To convert a web preview to React Native:

1. Replace HTML elements with React Native equivalents
2. Convert CSS animations to `react-native-reanimated`
3. Use `react-native-svg` instead of inline SVG
4. Test on actual device/simulator for performance

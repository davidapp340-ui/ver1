import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const PalmingExercise = () => {
  const animationProgress = useSharedValue(0);

  useEffect(() => {
    animationProgress.value = withRepeat(
      withTiming(1, {
        duration: 10000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  // Left hand animation props
  const leftHandAnimatedProps = useAnimatedProps(() => {
    // 0-0.3: Rubbing (vibration)
    const rubbingOffset = interpolate(
      animationProgress.value,
      [0, 0.15, 0.3],
      [0, -8, 0],
      Extrapolate.CLAMP
    );
    
    const rubbingX = animationProgress.value < 0.3 
      ? Math.sin(animationProgress.value * 100) * rubbingOffset
      : 0;

    // 0.3-0.5: Movement to eyes
    const moveY = interpolate(
      animationProgress.value,
      [0, 0.3, 0.5],
      [0, 0, -180],
      Extrapolate.CLAMP
    );

    const moveX = interpolate(
      animationProgress.value,
      [0, 0.3, 0.5],
      [0, 0, 60],
      Extrapolate.CLAMP
    );

    // 0.5-1.0: Breathing pulse
    const breathingScale = interpolate(
      animationProgress.value,
      [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      [1, 1.02, 1, 1.02, 1, 1.02],
      Extrapolate.CLAMP
    );

    const scale = animationProgress.value >= 0.5 ? breathingScale : 1;

    return {
      transform: [
        { translateX: moveX + rubbingX },
        { translateY: moveY },
        { scale },
      ],
    };
  });

  // Right hand animation props
  const rightHandAnimatedProps = useAnimatedProps(() => {
    const rubbingOffset = interpolate(
      animationProgress.value,
      [0, 0.15, 0.3],
      [0, 8, 0],
      Extrapolate.CLAMP
    );
    
    const rubbingX = animationProgress.value < 0.3 
      ? Math.sin(animationProgress.value * 100) * rubbingOffset
      : 0;

    const moveY = interpolate(
      animationProgress.value,
      [0, 0.3, 0.5],
      [0, 0, -180],
      Extrapolate.CLAMP
    );

    const moveX = interpolate(
      animationProgress.value,
      [0, 0.3, 0.5],
      [0, 0, -60],
      Extrapolate.CLAMP
    );

    const breathingScale = interpolate(
      animationProgress.value,
      [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      [1, 1.02, 1, 1.02, 1, 1.02],
      Extrapolate.CLAMP
    );

    const scale = animationProgress.value >= 0.5 ? breathingScale : 1;

    return {
      transform: [
        { translateX: moveX + rubbingX },
        { translateY: moveY },
        { scale },
      ],
    };
  });

  // Eyes animation props (open to closed)
  const eyesAnimatedProps = useAnimatedProps(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0.4, 0.45],
      [1, 0],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  const closedEyesAnimatedProps = useAnimatedProps(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0.4, 0.45],
      [0, 1],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  // Head breathing animation
  const headAnimatedProps = useAnimatedProps(() => {
    const breathingY = interpolate(
      animationProgress.value,
      [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      [0, -3, 0, -3, 0, -3],
      Extrapolate.CLAMP
    );

    const translateY = animationProgress.value >= 0.5 ? breathingY : 0;

    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} viewBox="0 0 400 500">
        <Defs>
          <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#B8E0F6" stopOpacity="1" />
            <Stop offset="100%" stopColor="#C8E6C9" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect width="400" height="500" fill="url(#bgGradient)" />

        {/* Head and Face */}
        <AnimatedG animatedProps={headAnimatedProps}>
          {/* Shoulders */}
          <Ellipse cx="150" cy="420" rx="60" ry="35" fill="#87CEEB" />
          <Ellipse cx="250" cy="420" rx="60" ry="35" fill="#87CEEB" />

          {/* Neck */}
          <Rect x="175" y="320" width="50" height="60" fill="#FFD4A3" rx="10" />

          {/* Head */}
          <Ellipse cx="200" cy="220" rx="75" ry="85" fill="#FFD4A3" />

          {/* Ears */}
          <Ellipse cx="140" cy="220" rx="12" ry="18" fill="#FFCC99" />
          <Ellipse cx="260" cy="220" rx="12" ry="18" fill="#FFCC99" />
          <Ellipse cx="140" cy="222" rx="6" ry="10" fill="#FFB380" />
          <Ellipse cx="260" cy="222" rx="6" ry="10" fill="#FFB380" />

          {/* Hair */}
          <Path
            d="M 125 165 Q 115 125 145 115 Q 175 110 200 105 Q 225 110 255 115 Q 285 125 275 165 Q 270 145 265 155 Q 255 135 245 150 Q 235 130 225 145 Q 215 125 205 143 Q 200 120 195 143 Q 185 125 175 145 Q 165 130 155 150 Q 145 135 135 155 Q 130 145 125 165"
            fill="#8B6F47"
          />

          {/* Eyebrows */}
          <Path d="M 165 195 Q 178 190 190 193" stroke="#6B5639" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Path d="M 210 193 Q 222 190 235 195" stroke="#6B5639" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Open Eyes */}
          <AnimatedG animatedProps={eyesAnimatedProps}>
            {/* Left Eye */}
            <Ellipse cx="177" cy="210" rx="14" ry="16" fill="white" />
            <Circle cx="179" cy="212" r="8" fill="#6B4423" />
            <Circle cx="181" cy="210" r="4" fill="black" />
            <Circle cx="182" cy="208" r="2" fill="white" />

            {/* Right Eye */}
            <Ellipse cx="223" cy="210" rx="14" ry="16" fill="white" />
            <Circle cx="221" cy="212" r="8" fill="#6B4423" />
            <Circle cx="219" cy="210" r="4" fill="black" />
            <Circle cx="218" cy="208" r="2" fill="white" />
          </AnimatedG>

          {/* Closed Eyes */}
          <AnimatedG animatedProps={closedEyesAnimatedProps}>
            <AnimatedPath d="M 165 210 Q 177 215 189 210" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
            <AnimatedPath d="M 211 210 Q 223 215 235 210" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          </AnimatedG>

          {/* Nose */}
          <Path d="M 200 225 L 196 238 Q 198 241 200 241 Q 202 241 204 238 L 200 225" fill="#FFB380" />
          <Ellipse cx="194" cy="241" rx="3" ry="4" fill="#FFB380" />
          <Ellipse cx="206" cy="241" rx="3" ry="4" fill="#FFB380" />

          {/* Smile */}
          <Path d="M 180 260 Q 200 270 220 260" stroke="#E0A080" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </AnimatedG>

        {/* Left Hand */}
        <AnimatedG animatedProps={leftHandAnimatedProps}>
          <G transform="translate(140, 420)">
            {/* Palm */}
            <Ellipse cx="0" cy="0" rx="28" ry="32" fill="#FFCC99" />
            {/* Thumb */}
            <Ellipse cx="-18" cy="-12" rx="11" ry="15" fill="#FFCC99" transform="rotate(-25 -18 -12)" />
            {/* Fingers */}
            <Ellipse cx="-8" cy="-25" rx="9" ry="18" fill="#FFCC99" transform="rotate(-8 -8 -25)" />
            <Ellipse cx="2" cy="-28" rx="9" ry="19" fill="#FFCC99" />
            <Ellipse cx="12" cy="-26" rx="9" ry="18" fill="#FFCC99" transform="rotate(8 12 -26)" />
            <Ellipse cx="20" cy="-20" rx="8" ry="15" fill="#FFCC99" transform="rotate(15 20 -20)" />
          </G>
        </AnimatedG>

        {/* Right Hand */}
        <AnimatedG animatedProps={rightHandAnimatedProps}>
          <G transform="translate(260, 420)">
            {/* Palm */}
            <Ellipse cx="0" cy="0" rx="28" ry="32" fill="#FFCC99" />
            {/* Thumb */}
            <Ellipse cx="18" cy="-12" rx="11" ry="15" fill="#FFCC99" transform="rotate(25 18 -12)" />
            {/* Fingers */}
            <Ellipse cx="8" cy="-25" rx="9" ry="18" fill="#FFCC99" transform="rotate(8 8 -25)" />
            <Ellipse cx="-2" cy="-28" rx="9" ry="19" fill="#FFCC99" />
            <Ellipse cx="-12" cy="-26" rx="9" ry="18" fill="#FFCC99" transform="rotate(-8 -12 -26)" />
            <Ellipse cx="-20" cy="-20" rx="8" ry="15" fill="#FFCC99" transform="rotate(-15 -20 -20)" />
          </G>
        </AnimatedG>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B8E0F6',
  },
});

export default PalmingExercise;
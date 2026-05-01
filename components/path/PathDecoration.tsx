import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { pseudoRandom } from '@/lib/math';
import type { DecorationColors } from '@/lib/worldThemes';

// TODO: Replace SVGs with Lottie files or Image assets in Phase 3

interface PathDecorationProps {
  rowIndex: number;
  nodeX: number;
  nodeY: number;
  themeId: string;
  colors: DecorationColors;
  containerWidth: number;
}

const SPAWN_CHANCE = 0.6;
const MIN_OFFSET = 50;
const MAX_EXTRA_OFFSET = 40;
const VERTICAL_JITTER = 20;
const SIZE_VARIATION = [0.7, 0.85, 1, 1.15];

function ForestTree({ scale, color }: { scale: number; color: string }) {
  const w = 28 * scale;
  const h = 36 * scale;
  return (
    <Svg width={w} height={h} viewBox="0 0 28 36">
      <Path d="M14 0 L26 24 L18 20 L24 36 L4 36 L10 20 L2 24 Z" fill={color} opacity={0.5} />
    </Svg>
  );
}

function OceanBubble({ scale, color }: { scale: number; color: string }) {
  const s = 22 * scale;
  const r = 10 * scale;
  return (
    <Svg width={s} height={s} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r={r} fill={color} opacity={0.35} />
      <Circle cx="8" cy="8" r={r * 0.25} fill="#FFFFFF" opacity={0.4} />
    </Svg>
  );
}

export default function PathDecoration({
  rowIndex,
  nodeX,
  nodeY,
  themeId,
  colors,
  containerWidth,
}: PathDecorationProps) {
  const rand1 = pseudoRandom(rowIndex * 3 + 1);
  const rand2 = pseudoRandom(rowIndex * 3 + 2);
  const rand3 = pseudoRandom(rowIndex * 3 + 3);

  if (rand1 > SPAWN_CHANCE) return null;

  const isLeft = rand2 < 0.5;
  const sideOffset = MIN_OFFSET + rand3 * MAX_EXTRA_OFFSET;

  let x: number;
  if (isLeft) {
    x = nodeX - sideOffset;
  } else {
    x = nodeX + sideOffset;
  }

  const edge = 20;
  x = Math.max(edge, Math.min(containerWidth - edge, x));

  const yJitter = (rand2 - 0.5) * 2 * VERTICAL_JITTER;
  const y = nodeY + yJitter;

  const sizeIdx = Math.floor(rand3 * SIZE_VARIATION.length);
  const scale = SIZE_VARIATION[sizeIdx];

  const colorVariant = rand1 < 0.3 ? colors.secondary : rand1 < 0.5 ? colors.accent : colors.primary;

  let decoration: React.ReactNode;
  switch (themeId) {
    case 'ocean':
      decoration = <OceanBubble scale={scale} color={colorVariant} />;
      break;
    case 'forest':
    default:
      decoration = <ForestTree scale={scale} color={colorVariant} />;
      break;
  }

  return (
    <View style={[styles.wrapper, { left: x, top: y }]} pointerEvents="none">
      {decoration}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 1,
  },
});

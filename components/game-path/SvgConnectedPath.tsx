import Svg, { Path as SvgPath, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface NodeCoord {
  x: number;
  y: number;
}

interface SvgConnectedPathProps {
  nodes: NodeCoord[];
  width: number;
  height: number;
  pathColor: string;
  strokeColor: string;
  completedCount: number;
  completedColor: string;
}

function buildSmoothBezier(points: NodeCoord[]): string {
  if (points.length < 2) return '';

  const parts: string[] = [];
  parts.push(`M ${points[0].x} ${points[0].y}`);

  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midY = (curr.y + next.y) / 2;

    parts.push(`C ${curr.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y}`);
  }

  return parts.join(' ');
}

export default function SvgConnectedPath({
  nodes,
  width,
  height,
  pathColor,
  strokeColor,
  completedCount,
  completedColor,
}: SvgConnectedPathProps) {
  if (nodes.length < 2) return null;

  const fullPath = buildSmoothBezier(nodes);

  const completedSlice = nodes.slice(0, completedCount + 1);
  const completedPath = completedSlice.length >= 2
    ? buildSmoothBezier(completedSlice)
    : '';

  const trackWidth = width < 480 ? 16 : 20;
  const dashWidth = width < 480 ? 2.5 : 3;

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    >
      <Defs>
        <LinearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={completedColor} stopOpacity="1" />
          <Stop offset="1" stopColor={completedColor} stopOpacity="0.7" />
        </LinearGradient>
      </Defs>

      <SvgPath
        d={fullPath}
        stroke={pathColor}
        strokeWidth={trackWidth}
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />

      <SvgPath
        d={fullPath}
        stroke={strokeColor}
        strokeWidth={dashWidth}
        strokeDasharray="8, 10"
        strokeLinecap="round"
        fill="none"
        opacity={0.35}
      />

      {completedPath ? (
        <SvgPath
          d={completedPath}
          stroke="url(#completedGradient)"
          strokeWidth={trackWidth}
          strokeLinecap="round"
          fill="none"
        />
      ) : null}
    </Svg>
  );
}

import Svg, { Path as SvgPath } from 'react-native-svg';

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

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    >
      <SvgPath
        d={fullPath}
        stroke={pathColor}
        strokeWidth={20}
        strokeLinecap="round"
        fill="none"
      />

      {completedPath ? (
        <SvgPath
          d={completedPath}
          stroke={completedColor}
          strokeWidth={20}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
      ) : null}

      <SvgPath
        d={fullPath}
        stroke={strokeColor}
        strokeWidth={3}
        strokeDasharray="10, 10"
        strokeLinecap="round"
        fill="none"
        opacity={0.4}
      />
    </Svg>
  );
}

'use client';

import { FixedPoint } from '@/lib/odeSolver';

interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface FixedPointsProps {
  fixedPoints: FixedPoint[];
  transform: Transform;
  centerX: number;
  centerY: number;
}

const typeColors: Record<FixedPoint['type'], string> = {
  'stable-node': '#10b981', // green
  'unstable-node': '#ef4444', // red
  'saddle': '#f59e0b', // orange
  'stable-spiral': '#3b82f6', // blue
  'unstable-spiral': '#ec4899', // pink
  'center': '#8b5cf6', // purple
};

const typeLabels: Record<FixedPoint['type'], string> = {
  'stable-node': 'Stable Node',
  'unstable-node': 'Unstable Node',
  'saddle': 'Saddle',
  'stable-spiral': 'Stable Spiral',
  'unstable-spiral': 'Unstable Spiral',
  'center': 'Center',
};

export function FixedPoints({ fixedPoints, transform, centerX, centerY }: FixedPointsProps) {
  const pointRadius = Math.max(6, Math.min(10, transform.scale / 25));

  return (
    <g>
      {fixedPoints.map((fp, idx) => {
        const x = centerX + transform.offsetX + fp.x * transform.scale;
        const y = centerY - transform.offsetY - fp.y * transform.scale;
        const color = typeColors[fp.type];

        return (
          <g key={idx}>
            {/* Outer ring for visibility */}
            <circle
              cx={x}
              cy={y}
              r={pointRadius + 2}
              fill="white"
              stroke={color}
              strokeWidth="2"
              opacity="0.9"
            />
            {/* Main point */}
            <circle
              cx={x}
              cy={y}
              r={pointRadius}
              fill={color}
              stroke="white"
              strokeWidth="1.5"
              opacity="0.9"
            />
            {/* Label */}
            <text
              x={x}
              y={y - pointRadius - 8}
              fill={color}
              fontSize={Math.max(10, transform.scale / 15)}
              fontWeight="600"
              textAnchor="middle"
              className="pointer-events-none"
            >
              {typeLabels[fp.type].split(' ')[0]}
            </text>
          </g>
        );
      })}
    </g>
  );
}


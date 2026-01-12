'use client';

type Point = [number, number];

interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface FlowLinesProps {
  trajectories: Array<Array<Point>>;
  transform: Transform;
  centerX: number;
  centerY: number;
}

export function FlowLines({ trajectories, transform, centerX, centerY }: FlowLinesProps) {
  return (
    <g>
      {trajectories.map((trajectory, idx) => {
        if (trajectory.length < 2) return null;

        const pathData = trajectory
          .map(([x, y], i) => {
            const px = centerX + transform.offsetX + x * transform.scale;
            const py = centerY - transform.offsetY - y * transform.scale;
            return i === 0 ? `M ${px} ${py}` : `L ${px} ${py}`;
          })
          .join(' ');

        return (
          <path
            key={idx}
            d={pathData}
            fill="none"
            stroke="#ef4444"
            strokeWidth={Math.max(1.5, transform.scale / 80)}
            opacity="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}

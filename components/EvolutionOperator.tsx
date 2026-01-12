'use client';

import { SystemType, evolutionOperator, SystemParameters } from '@/lib/odeSolver';

type Point = [number, number];

interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface EvolutionOperatorProps {
  initialPoints: Array<Point>;
  systemType: SystemType;
  time: number;
  transform: Transform;
  centerX: number;
  centerY: number;
  parameters?: SystemParameters;
}

export function EvolutionOperator({
  initialPoints,
  systemType,
  time,
  transform,
  centerX,
  centerY,
  parameters,
}: EvolutionOperatorProps) {
  const pointRadius = Math.max(3, Math.min(6, transform.scale / 30));

  return (
    <g>
      {initialPoints.map((point, idx) => {
        const [x0, y0] = point;
        const [xt, yt] = evolutionOperator(systemType, point, time, parameters);

        const x0Px = centerX + transform.offsetX + x0 * transform.scale;
        const y0Px = centerY - transform.offsetY - y0 * transform.scale;
        const xtPx = centerX + transform.offsetX + xt * transform.scale;
        const ytPx = centerY - transform.offsetY - yt * transform.scale;

        return (
          <g key={idx}>
            {/* Initial point */}
            <circle
              cx={x0Px}
              cy={y0Px}
              r={pointRadius}
              fill="#10b981"
              stroke="white"
              strokeWidth={Math.max(1, pointRadius / 3)}
            />
            {/* Evolved point */}
            <circle
              cx={xtPx}
              cy={ytPx}
              r={pointRadius}
              fill="#f59e0b"
              stroke="white"
              strokeWidth={Math.max(1, pointRadius / 3)}
            />
            {/* Connection line showing evolution */}
            <line
              x1={x0Px}
              y1={y0Px}
              x2={xtPx}
              y2={ytPx}
              stroke="#8b5cf6"
              strokeWidth={Math.max(1.5, transform.scale / 80)}
              strokeDasharray="5,5"
              opacity="0.6"
            />
            {/* Arrow showing direction */}
            {time > 0.1 && (() => {
              const dx = xtPx - x0Px;
              const dy = ytPx - y0Px;
              const angle = Math.atan2(dy, dx);
              const arrowLength = Math.max(6, Math.min(12, transform.scale / 25));
              const arrowWidth = Math.max(4, Math.min(8, transform.scale / 40));
              const arrowX1 = xtPx - arrowLength * Math.cos(angle) + arrowWidth * Math.cos(angle + Math.PI / 2);
              const arrowY1 = ytPx - arrowLength * Math.sin(angle) + arrowWidth * Math.sin(angle + Math.PI / 2);
              const arrowX2 = xtPx - arrowLength * Math.cos(angle) + arrowWidth * Math.cos(angle - Math.PI / 2);
              const arrowY2 = ytPx - arrowLength * Math.sin(angle) + arrowWidth * Math.sin(angle - Math.PI / 2);
              return (
                <polygon
                  points={`${xtPx},${ytPx} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
                  fill="#8b5cf6"
                  opacity="0.6"
                />
              );
            })()}
          </g>
        );
      })}
    </g>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { SystemType, vectorField, SystemParameters } from '@/lib/odeSolver';

interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface VectorFieldProps {
  systemType: SystemType;
  transform: Transform;
  centerX: number;
  centerY: number;
  parameters?: SystemParameters;
}

export function VectorField({ systemType, transform, centerX, centerY, parameters }: VectorFieldProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <g />;
  }

  const arrowLength = 0.3;
  const round = (n: number) => Math.round(n * 100) / 100;

  // Calculate visible range
  const canvasWidth = 800;
  const canvasHeight = 800;
  const minX = (-centerX - transform.offsetX) / transform.scale;
  const maxX = (canvasWidth - centerX - transform.offsetX) / transform.scale;
  const minY = (-centerY + transform.offsetY) / transform.scale;
  const maxY = (canvasHeight - centerY + transform.offsetY) / transform.scale;

  // Adaptive grid spacing based on zoom
  const gridSpacing = Math.max(0.5, Math.min(2, 2 / (transform.scale / 50)));

  const arrows: React.ReactElement[] = [];

  // Generate grid points in visible range
  for (let x = Math.floor(minX / gridSpacing) * gridSpacing; x <= maxX + gridSpacing; x += gridSpacing) {
    for (let y = Math.floor(minY / gridSpacing) * gridSpacing; y <= maxY + gridSpacing; y += gridSpacing) {
      const [dx, dy] = vectorField(systemType, x, y, parameters);
      
      // Normalize for visualization
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      if (magnitude < 0.01) continue;
      
      const normalizedDx = (dx / magnitude) * arrowLength;
      const normalizedDy = (dy / magnitude) * arrowLength;
      
      const startX = round(centerX + transform.offsetX + x * transform.scale);
      const startY = round(centerY - transform.offsetY - y * transform.scale);
      const endX = round(startX + normalizedDx * transform.scale);
      const endY = round(startY - normalizedDy * transform.scale);

      // Arrow shaft
      arrows.push(
        <line
          key={`arrow-${x}-${y}`}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#3b82f6"
          strokeWidth={Math.max(1, transform.scale / 100)}
          opacity="0.6"
          suppressHydrationWarning
        />
      );

      // Arrowhead
      const angle = Math.atan2(normalizedDy, normalizedDx);
      const arrowheadLength = Math.max(4, Math.min(12, transform.scale / 20));
      const arrowheadAngle = Math.PI / 6;

      const arrowheadX1 = round(endX - arrowheadLength * Math.cos(angle - arrowheadAngle));
      const arrowheadY1 = round(endY + arrowheadLength * Math.sin(angle - arrowheadAngle));
      const arrowheadX2 = round(endX - arrowheadLength * Math.cos(angle + arrowheadAngle));
      const arrowheadY2 = round(endY + arrowheadLength * Math.sin(angle + arrowheadAngle));

      arrows.push(
        <polygon
          key={`head-${x}-${y}`}
          points={`${endX},${endY} ${arrowheadX1},${arrowheadY1} ${arrowheadX2},${arrowheadY2}`}
          fill="#3b82f6"
          opacity="0.6"
          suppressHydrationWarning
        />
      );
    }
  }

  return <g suppressHydrationWarning>{arrows}</g>;
}

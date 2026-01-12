'use client';

interface AxisLabelsProps {
  scale: number;
  centerX: number;
  centerY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function AxisLabels({ scale, centerX, centerY, minX, maxX, minY, maxY }: AxisLabelsProps) {
  const tickLength = 5;
  // Adaptive tick spacing based on zoom level
  const tickSpacing = scale > 200 ? 0.5 : scale > 100 ? 1 : scale > 50 ? 2 : 5;
  const fontSize = 11;

  // Calculate tick positions
  const xTicks: number[] = [];
  const yTicks: number[] = [];

  // X-axis ticks
  for (let x = Math.ceil(minX / tickSpacing) * tickSpacing; x <= maxX; x += tickSpacing) {
    if (Math.abs(x) > 0.01) { // Don't show tick at 0 (we'll show it separately)
      xTicks.push(x);
    }
  }

  // Y-axis ticks
  for (let y = Math.ceil(minY / tickSpacing) * tickSpacing; y <= maxY; y += tickSpacing) {
    if (Math.abs(y) > 0.01) { // Don't show tick at 0
      yTicks.push(y);
    }
  }

  return (
    <g>
      {/* X-axis ticks and labels */}
      {xTicks.map((x) => {
        const xPos = centerX + x * scale;
        return (
          <g key={`x-tick-${x}`}>
            <line
              x1={xPos}
              y1={centerY - tickLength}
              x2={xPos}
              y2={centerY + tickLength}
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <text
              x={xPos}
              y={centerY + tickLength + fontSize + 2}
              fill="#64748b"
              fontSize={fontSize}
              textAnchor="middle"
            >
              {tickSpacing >= 1 ? x.toFixed(0) : x.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Y-axis ticks and labels */}
      {yTicks.map((y) => {
        const yPos = centerY - y * scale;
        return (
          <g key={`y-tick-${y}`}>
            <line
              x1={centerX - tickLength}
              y1={yPos}
              x2={centerX + tickLength}
              y2={yPos}
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <text
              x={centerX - tickLength - 4}
              y={yPos + fontSize / 3}
              fill="#64748b"
              fontSize={fontSize}
              textAnchor="end"
            >
              {tickSpacing >= 1 ? y.toFixed(0) : y.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Origin label */}
      <text
        x={centerX - 8}
        y={centerY + fontSize + 2}
        fill="#64748b"
        fontSize={fontSize}
        textAnchor="end"
      >
        0
      </text>

      {/* Axis labels */}
      <text
        x={centerX + (maxX - minX) * scale / 2 + 10}
        y={centerY - 5}
        fill="#64748b"
        fontSize="14"
        fontWeight="500"
      >
        x
      </text>
      <text
        x={centerX + 5}
        y={centerY - (maxY - minY) * scale / 2 - 10}
        fill="#64748b"
        fontSize="14"
        fontWeight="500"
      >
        y
      </text>
    </g>
  );
}


'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VectorField } from './VectorField';
import { FlowLines } from './FlowLines';
import { EvolutionOperator } from './EvolutionOperator';
import { SystemSelector } from './SystemSelector';
import { ControlPanel } from './ControlPanel';
import { ParameterControls } from './ParameterControls';
import { FixedPoints } from './FixedPoints';
import { FixedPointsInfo } from './FixedPointsInfo';
import { AxisLabels } from './AxisLabels';
import { solveODE, SystemType, SystemParameters, defaultParameters, getSystemParameters, findFixedPoints, FixedPoint } from '@/lib/odeSolver';

interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export default function DynamicalSystemVisualizer() {
  const [systemType, setSystemType] = useState<SystemType>('center');
  const [parameters, setParameters] = useState<SystemParameters>({});
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVectorField, setShowVectorField] = useState(true);
  const [showFlowLines, setShowFlowLines] = useState(true);
  const [showEvolution, setShowEvolution] = useState(true);
  const [showFixedPoints, setShowFixedPoints] = useState(true);
  const [fixedPoints, setFixedPoints] = useState<FixedPoint[]>([]);
  const [initialPoints, setInitialPoints] = useState<Array<[number, number]>>([
    [0.5, 0.5],
    [-0.5, 0.5],
    [0.5, -0.5],
    [-0.5, -0.5],
  ]);
  const [trajectories, setTrajectories] = useState<Array<Array<[number, number]>>>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Reset parameters when system type changes
  useEffect(() => {
    const paramDefs = getSystemParameters(systemType);
    if (paramDefs.length > 0) {
      const newParams: SystemParameters = {};
      switch (systemType) {
        case 'vanDerPol':
          newParams.vanDerPol = defaultParameters.vanDerPol;
          break;
        case 'lotkaVolterra':
          newParams.lotkaVolterra = defaultParameters.lotkaVolterra;
          break;
        case 'duffing':
          newParams.duffing = defaultParameters.duffing;
          break;
        case 'pendulum':
          newParams.pendulum = defaultParameters.pendulum;
          break;
        case 'spiral':
          newParams.spiral = defaultParameters.spiral;
          break;
        case 'focus':
          newParams.focus = defaultParameters.focus;
          break;
      }
      setParameters(newParams);
    } else {
      setParameters({});
    }
  }, [systemType]);
  
  // Zoom and pan state
  const [transform, setTransform] = useState<Transform>({
    scale: 100,
    offsetX: 0,
    offsetY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number] | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const canvasWidth = 800;
  const canvasHeight = 800;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Transform mathematical coordinates to screen coordinates
  const mathToScreen = useCallback((mathX: number, mathY: number): [number, number] => {
    const screenX = centerX + transform.offsetX + mathX * transform.scale;
    const screenY = centerY - transform.offsetY - mathY * transform.scale;
    return [screenX, screenY];
  }, [transform, centerX, centerY]);

  // Transform screen coordinates to mathematical coordinates
  const screenToMath = useCallback((screenX: number, screenY: number): [number, number] => {
    const mathX = (screenX - centerX - transform.offsetX) / transform.scale;
    const mathY = (centerY - screenY + transform.offsetY) / transform.scale;
    return [mathX, mathY];
  }, [transform, centerX, centerY]);

  // Compute trajectories for initial points
  useEffect(() => {
    const newTrajectories = initialPoints.map(point => {
      return solveODE(systemType, point, time, 0.01, parameters);
    });
    setTrajectories(newTrajectories);
  }, [systemType, time, initialPoints, parameters]);

  // Find fixed points when system type or parameters change
  useEffect(() => {
    const searchRange = {
      minX: -10,
      maxX: 10,
      minY: -10,
      maxY: 10,
    };
    
    const fps = findFixedPoints(systemType, parameters, searchRange, 20);
    setFixedPoints(fps);
  }, [systemType, parameters]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setTime(prev => {
          const newTime = prev + 0.02;
          return newTime > 10 ? 0 : newTime;
        });
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Handle wheel event natively to prevent page scroll and enable zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Get mathematical coordinates of mouse position
      const mathX = (mouseX - centerX - transform.offsetX) / transform.scale;
      const mathY = (centerY - mouseY + transform.offsetY) / transform.scale;
      
      // Zoom factor
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(10, Math.min(500, transform.scale * zoomFactor));
      
      // Adjust offset to zoom towards mouse position
      const newOffsetX = mouseX - centerX - mathX * newScale;
      const newOffsetY = centerY - mouseY + mathY * newScale;
      
      setTransform({
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    };

    // Use capture phase to ensure we catch the event early
    svg.addEventListener('wheel', handleWheelNative, { passive: false, capture: true });

    return () => {
      svg.removeEventListener('wheel', handleWheelNative, { capture: true });
    };
  }, [transform, centerX, centerY]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // Don't add point if we just finished dragging
    if (hasDragged) {
      setHasDragged(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const [mathX, mathY] = screenToMath(x, y);
    setInitialPoints(prev => [...prev, [mathX, mathY]]);
  }, [screenToMath, hasDragged]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) { // Left mouse button
      const rect = e.currentTarget.getBoundingClientRect();
      setDragStart([e.clientX - rect.left, e.clientY - rect.top]);
      setIsDragging(true);
      setHasDragged(false); // Reset drag flag
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging && dragStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const dx = currentX - dragStart[0];
      const dy = currentY - dragStart[1];
      
      // Only mark as dragged if mouse moved more than a few pixels
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        setHasDragged(true);
      }
      
      setTransform(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY - dy, // Invert Y for mathematical coordinates
      }));
      
      setDragStart([currentX, currentY]);
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);


  const resetView = useCallback(() => {
    setTransform({
      scale: 100,
      offsetX: 0,
      offsetY: 0,
    });
  }, []);

  const clearPoints = useCallback(() => {
    setInitialPoints([]);
  }, []);

  // Calculate visible range for axis labels
  const minX = (-centerX - transform.offsetX) / transform.scale;
  const maxX = (canvasWidth - centerX - transform.offsetX) / transform.scale;
  const minY = (-centerY + transform.offsetY) / transform.scale;
  const maxY = (canvasHeight - centerY + transform.offsetY) / transform.scale;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <div className="relative border-2 border-slate-300 dark:border-slate-600 rounded overflow-hidden">
            <svg
              ref={svgRef}
              width="800"
              height="800"
              viewBox="0 0 800 800"
              className="bg-white dark:bg-slate-900 cursor-move"
              style={{ touchAction: 'none' }}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Grid - adjust pattern based on zoom */}
              <defs>
                <pattern 
                  id="grid" 
                  width={transform.scale} 
                  height={transform.scale} 
                  patternUnits="userSpaceOnUse"
                >
                  <path 
                    d={`M ${transform.scale} 0 L 0 0 0 ${transform.scale}`} 
                    fill="none" 
                    stroke="#e2e8f0" 
                    strokeWidth="1" 
                  />
                </pattern>
              </defs>
              <rect width="800" height="800" fill="url(#grid)" />
              
              {/* Axes */}
              <g transform={`translate(${centerX + transform.offsetX}, ${centerY - transform.offsetY})`}>
                <line 
                  x1={-canvasWidth} 
                  y1="0" 
                  x2={canvasWidth} 
                  y2="0" 
                  stroke="#64748b" 
                  strokeWidth="2" 
                />
                <line 
                  x1="0" 
                  y1={-canvasHeight} 
                  x2="0" 
                  y2={canvasHeight} 
                  stroke="#64748b" 
                  strokeWidth="2" 
                />
              </g>
              
              {/* Enhanced axis labels */}
              <AxisLabels
                scale={transform.scale}
                centerX={centerX + transform.offsetX}
                centerY={centerY - transform.offsetY}
                minX={minX}
                maxX={maxX}
                minY={minY}
                maxY={maxY}
              />

              {/* Vector field */}
              {showVectorField && (
                <VectorField 
                  systemType={systemType}
                  transform={transform}
                  centerX={centerX}
                  centerY={centerY}
                  parameters={parameters}
                />
              )}

              {/* Flow lines */}
              {showFlowLines && (
                <FlowLines 
                  trajectories={trajectories}
                  transform={transform}
                  centerX={centerX}
                  centerY={centerY}
                />
              )}

              {/* Evolution operator visualization */}
              {showEvolution && (
                <EvolutionOperator
                  initialPoints={initialPoints}
                  systemType={systemType}
                  time={time}
                  transform={transform}
                  centerX={centerX}
                  centerY={centerY}
                  parameters={parameters}
                />
              )}

              {/* Fixed points */}
              {showFixedPoints && (
                <FixedPoints
                  fixedPoints={fixedPoints}
                  transform={transform}
                  centerX={centerX}
                  centerY={centerY}
                />
              )}
            </svg>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Click to add points • Drag to pan • Scroll to zoom
            </p>
            <button
              onClick={resetView}
              className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded transition-colors"
            >
              Reset View
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        <ControlPanel
          time={time}
          onTimeChange={setTime}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onReset={() => {
            setTime(0);
            setIsPlaying(false);
          }}
          showVectorField={showVectorField}
          onToggleVectorField={() => setShowVectorField(!showVectorField)}
          showFlowLines={showFlowLines}
          onToggleFlowLines={() => setShowFlowLines(!showFlowLines)}
          showEvolution={showEvolution}
          onToggleEvolution={() => setShowEvolution(!showEvolution)}
          showFixedPoints={showFixedPoints}
          onToggleFixedPoints={() => setShowFixedPoints(!showFixedPoints)}
          onClearPoints={clearPoints}
        />
        <SystemSelector
          systemType={systemType}
          onSystemChange={setSystemType}
          parameters={parameters}
        />
        <ParameterControls
          systemType={systemType}
          parameters={parameters}
          onParametersChange={setParameters}
        />
        <FixedPointsInfo fixedPoints={fixedPoints} />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getCurvePoints,
  stateAtTime,
  vectorField,
  getFixedPoints,
  solveTrajectory,
  type InteractingModelType,
  type InteractingParams,
} from '@/lib/interactingModels';

const PLOT_WIDTH = 700;
const PLOT_HEIGHT = 400;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const INNER_WIDTH = PLOT_WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = PLOT_HEIGHT - PADDING.top - PADDING.bottom;
const T_MAX_DEFAULT = 20;

const defaultParams: InteractingParams = {
  alpha: 1,
  beta: 0.5,
  delta: 0.5,
  gamma: 0.5,
  epsilon: 0.1,
  eta: 0.1,
  r1: 1,
  K1: 100,
  a12: 0.5,
  r2: 0.8,
  K2: 80,
  a21: 0.5,
  richardsonK: 0.5,
  richardsonL: 0.5,
  richardsonAlpha: 0.2,
  richardsonBeta: 0.2,
  g: 1,
  h: 1,
};

export default function InteractingModelVisualizer() {
  const [modelType, setModelType] = useState<InteractingModelType>('lotkaVolterra');
  const [params, setParams] = useState<InteractingParams>({ ...defaultParams });
  const [x0, setX0] = useState(2);
  const [y0, setY0] = useState(2);
  const [tMax, setTMax] = useState(T_MAX_DEFAULT);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'time' | 'phase'>('time');
  const [showVectorField, setShowVectorField] = useState(true);
  const animationRef = useRef<number | undefined>(undefined);
  const svgRef = useRef<SVGSVGElement>(null);

  const curves = getCurvePoints(modelType, params, x0, y0, tMax);
  const [currentX, currentY] = stateAtTime(modelType, params, x0, y0, time);
  const fixedPoints = getFixedPoints(modelType, params);
  const trajectory = solveTrajectory(modelType, params, x0, y0, tMax, 0.05);

  const valueMin = Math.min(
    ...curves.x.map(([, v]) => v),
    ...curves.y.map(([, v]) => v),
    0
  );
  const valueMax = Math.max(
    ...curves.x.map(([, v]) => v),
    ...curves.y.map(([, v]) => v),
    1
  );
  const vMargin = (valueMax - valueMin) * 0.05 || 1;
  const phaseXMin = Math.min(...trajectory.map(([, x]) => x), 0) - 0.5;
  const phaseXMax = Math.max(...trajectory.map(([, x]) => x), 1) + 0.5;
  const phaseYMin = Math.min(...trajectory.map(([, , y]) => y), 0) - 0.5;
  const phaseYMax = Math.max(...trajectory.map(([, , y]) => y), 1) + 0.5;

  const [viewTime, setViewTime] = useState(() => ({
    tMin: 0,
    tMax: T_MAX_DEFAULT,
    vMin: 0,
    vMax: Math.max(valueMax + vMargin, 5),
  }));
  const [viewPhase, setViewPhase] = useState(() => ({
    xMin: 0,
    xMax: 5,
    yMin: 0,
    yMax: 5,
  }));
  const viewTimeRef = useRef(viewTime);
  const viewPhaseRef = useRef(viewPhase);
  viewTimeRef.current = viewTime;
  viewPhaseRef.current = viewPhase;

  const scaleTimeX = (t: number) =>
    PADDING.left + ((t - viewTime.tMin) / (viewTime.tMax - viewTime.tMin || 1)) * INNER_WIDTH;
  const scaleTimeY = (v: number) =>
    PADDING.top +
    INNER_HEIGHT -
    ((v - viewTime.vMin) / (viewTime.vMax - viewTime.vMin || 1)) * INNER_HEIGHT;
  const scalePhaseX = (x: number) =>
    PADDING.left + ((x - viewPhase.xMin) / (viewPhase.xMax - viewPhase.xMin || 1)) * INNER_WIDTH;
  const scalePhaseY = (y: number) =>
    PADDING.top +
    INNER_HEIGHT -
    ((y - viewPhase.yMin) / (viewPhase.yMax - viewPhase.yMin || 1)) * INNER_HEIGHT;

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number] | null>(null);

  const resetViewTime = useCallback(() => {
    setViewTime({ tMin: 0, tMax, vMin: valueMin - vMargin, vMax: valueMax + vMargin });
  }, [tMax, valueMin, valueMax, vMargin]);
  const resetViewPhase = useCallback(() => {
    setViewPhase({
      xMin: phaseXMin,
      xMax: phaseXMax,
      yMin: phaseYMin,
      yMax: phaseYMax,
    });
  }, [phaseXMin, phaseXMax, phaseYMin, phaseYMax]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setDragStart([e.clientX, e.clientY]);
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDragging || !dragStart) return;
      const dx = e.clientX - dragStart[0];
      const dy = e.clientY - dragStart[1];
      if (viewMode === 'time') {
        const vt = viewTimeRef.current;
        const rangeT = vt.tMax - vt.tMin;
        const rangeV = vt.vMax - vt.vMin;
        setViewTime((prev) => ({
          ...prev,
          tMin: Math.max(0, prev.tMin - (dx / INNER_WIDTH) * rangeT),
          tMax: Math.min(100, prev.tMax - (dx / INNER_WIDTH) * rangeT),
          vMin: prev.vMin + (dy / INNER_HEIGHT) * rangeV,
          vMax: prev.vMax + (dy / INNER_HEIGHT) * rangeV,
        }));
      } else {
        const vp = viewPhaseRef.current;
        const rangeX = vp.xMax - vp.xMin;
        const rangeY = vp.yMax - vp.yMin;
        setViewPhase((prev) => ({
          ...prev,
          xMin: prev.xMin - (dx / INNER_WIDTH) * rangeX,
          xMax: prev.xMax - (dx / INNER_WIDTH) * rangeX,
          yMin: prev.yMin + (dy / INNER_HEIGHT) * rangeY,
          yMax: prev.yMax + (dy / INNER_HEIGHT) * rangeY,
        }));
      }
      setDragStart([e.clientX, e.clientY]);
    },
    [isDragging, dragStart, viewMode]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (viewMode === 'time') {
        const vt = viewTimeRef.current;
        const rect = svg.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const tMouse = vt.tMin + ((px - PADDING.left) / INNER_WIDTH) * (vt.tMax - vt.tMin);
        const vMouse = vt.vMin + ((PADDING.top + INNER_HEIGHT - py) / INNER_HEIGHT) * (vt.vMax - vt.vMin);
        const zoom = e.deltaY > 0 ? 0.85 : 1 / 0.85;
        setViewTime((prev) => {
          const newRangeT = (prev.tMax - prev.tMin) * zoom;
          const newRangeV = (prev.vMax - prev.vMin) * zoom;
          return {
            tMin: Math.max(0, tMouse - (tMouse - prev.tMin) * zoom),
            tMax: Math.min(100, prev.tMax - (prev.tMax - tMouse) * (1 - zoom)),
            vMin: vMouse - (vMouse - prev.vMin) * zoom,
            vMax: vMouse + (prev.vMax - vMouse) * zoom,
          };
        });
      } else {
        const vp = viewPhaseRef.current;
        const rect = svg.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const xMouse = vp.xMin + ((px - PADDING.left) / INNER_WIDTH) * (vp.xMax - vp.xMin);
        const yMouse = vp.yMin + ((PADDING.top + INNER_HEIGHT - py) / INNER_HEIGHT) * (vp.yMax - vp.yMin);
        const zoom = e.deltaY > 0 ? 0.85 : 1 / 0.85;
        setViewPhase((prev) => ({
          xMin: xMouse - (xMouse - prev.xMin) * zoom,
          xMax: xMouse + (prev.xMax - xMouse) * zoom,
          yMin: yMouse - (yMouse - prev.yMin) * zoom,
          yMax: yMouse + (prev.yMax - yMouse) * zoom,
        }));
      }
    };
    svg.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => svg.removeEventListener('wheel', handleWheel, { capture: true });
  }, [viewMode]);

  useEffect(() => {
    if (!isPlaying) return;
    const dt = 0.05;
    const animate = () => {
      setTime((prev) => {
        const next = prev + dt;
        if (next >= tMax) {
          setIsPlaying(false);
          return tMax;
        }
        return next;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, tMax]);

  const pathX = curves.x.map(([t, v], i) => `${i === 0 ? 'M' : 'L'} ${scaleTimeX(t)} ${scaleTimeY(v)}`).join(' ');
  const pathY = curves.y.map(([t, v], i) => `${i === 0 ? 'M' : 'L'} ${scaleTimeX(t)} ${scaleTimeY(v)}`).join(' ');
  const pathPhase = trajectory
    .map(([, x, y], i) => `${i === 0 ? 'M' : 'L'} ${scalePhaseX(x)} ${scalePhaseY(y)}`)
    .join(' ');

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 order-2 lg:order-1">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Model</label>
            <select
              value={modelType}
              onChange={(e) => {
                const next = e.target.value as InteractingModelType;
                setModelType(next);
                setParams((p) => ({ ...defaultParams, ...p }));
              }}
              className="w-full max-w-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="lotkaVolterra">Lotka-Volterra (predator-prey)</option>
              <option value="lotkaVolterraSelfLimit">Lotka-Volterra with self-limitation</option>
              <option value="lotkaVolterraCompetition">Lotka-Volterra two-species competition</option>
              <option value="richardson">Richardson (arms race)</option>
            </select>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setViewMode('time')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'time' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Time series
            </button>
            <button
              type="button"
              onClick={() => setViewMode('phase')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'phase' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Phase portrait
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial x₀</label>
              <input
                type="number"
                min={0.01}
                step={0.5}
                value={x0}
                onChange={(e) => setX0(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial y₀</label>
              <input
                type="number"
                min={0.01}
                step={0.5}
                value={y0}
                onChange={(e) => setY0(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {(modelType === 'lotkaVolterra' || modelType === 'lotkaVolterraSelfLimit') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">α (prey growth)</label>
                  <input
                    type="number"
                    min={0.1}
                    max={3}
                    step={0.1}
                    value={params.alpha ?? 1}
                    onChange={(e) => setParams((p) => ({ ...p, alpha: parseFloat(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">β (predation)</label>
                  <input
                    type="number"
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={params.beta ?? 0.5}
                    onChange={(e) => setParams((p) => ({ ...p, beta: parseFloat(e.target.value) || 0.5 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">γ (predator death)</label>
                  <input
                    type="number"
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={params.gamma ?? 0.5}
                    onChange={(e) => setParams((p) => ({ ...p, gamma: parseFloat(e.target.value) || 0.5 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">δ (predator benefit)</label>
                  <input
                    type="number"
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={params.delta ?? 0.5}
                    onChange={(e) => setParams((p) => ({ ...p, delta: parseFloat(e.target.value) || 0.5 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                {modelType === 'lotkaVolterraSelfLimit' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ε (prey self-limitation)</label>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={params.epsilon ?? 0.1}
                        onChange={(e) => setParams((p) => ({ ...p, epsilon: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">η (predator self-limitation)</label>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={params.eta ?? 0.1}
                        onChange={(e) => setParams((p) => ({ ...p, eta: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {modelType === 'lotkaVolterraCompetition' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">r₁</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={params.r1 ?? 1}
                    onChange={(e) => setParams((p) => ({ ...p, r1: parseFloat(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">K₁</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={params.K1 ?? 100}
                    onChange={(e) => setParams((p) => ({ ...p, K1: parseFloat(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">α₁₂ (competition on 1)</label>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={params.a12 ?? 0.5}
                    onChange={(e) => setParams((p) => ({ ...p, a12: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">r₂</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={params.r2 ?? 0.8}
                    onChange={(e) => setParams((p) => ({ ...p, r2: parseFloat(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">K₂</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={params.K2 ?? 80}
                    onChange={(e) => setParams((p) => ({ ...p, K2: parseFloat(e.target.value) || 80 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">α₂₁ (competition on 2)</label>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={params.a21 ?? 0.5}
                    onChange={(e) => setParams((p) => ({ ...p, a21: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            {modelType === 'richardson' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">k (threat to 1)</label>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={params.richardsonK ?? 0.5}
                    onChange={(e) => setParams((p) => ({ ...p, richardsonK: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">l (threat to 2)</label>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={params.richardsonL ?? 0.5}
                    onChange={(e) => setParams((p) => ({ ...p, richardsonL: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">α (fatigue 1)</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={params.richardsonAlpha ?? 0.2}
                    onChange={(e) => setParams((p) => ({ ...p, richardsonAlpha: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">β (fatigue 2)</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={params.richardsonBeta ?? 0.2}
                    onChange={(e) => setParams((p) => ({ ...p, richardsonBeta: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">g (grievance 1)</label>
                  <input
                    type="number"
                    step={0.5}
                    value={params.g ?? 1}
                    onChange={(e) => setParams((p) => ({ ...p, g: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">h (grievance 2)</label>
                  <input
                    type="number"
                    step={0.5}
                    value={params.h ?? 1}
                    onChange={(e) => setParams((p) => ({ ...p, h: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time range (t max)</label>
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={tMax}
                onChange={(e) => setTMax(Math.max(1, parseFloat(e.target.value) || 10))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
            <svg
              ref={svgRef}
              width={PLOT_WIDTH}
              height={PLOT_HEIGHT}
              className="w-full max-w-full cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                <clipPath id="interactingPlotClip">
                  <rect x={PADDING.left} y={PADDING.top} width={INNER_WIDTH} height={INNER_HEIGHT} />
                </clipPath>
              </defs>
              {viewMode === 'time' ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <g key={i}>
                      <line
                        x1={scaleTimeX(viewTime.tMin + (i / 4) * (viewTime.tMax - viewTime.tMin))}
                        y1={PADDING.top}
                        x2={scaleTimeX(viewTime.tMin + (i / 4) * (viewTime.tMax - viewTime.tMin))}
                        y2={PADDING.top + INNER_HEIGHT}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                      <line
                        x1={PADDING.left}
                        y1={scaleTimeY(viewTime.vMin + (i / 4) * (viewTime.vMax - viewTime.vMin))}
                        x2={PADDING.left + INNER_WIDTH}
                        y2={scaleTimeY(viewTime.vMin + (i / 4) * (viewTime.vMax - viewTime.vMin))}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                    </g>
                  ))}
                  <rect x={PADDING.left} y={PADDING.top} width={INNER_WIDTH} height={INNER_HEIGHT} fill="none" stroke="#94a3b8" strokeWidth="1" />
                  <g clipPath="url(#interactingPlotClip)">
                    <path d={pathX} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={pathY} fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={scaleTimeX(time)} cy={scaleTimeY(currentX)} r="5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                    <circle cx={scaleTimeX(time)} cy={scaleTimeY(currentY)} r="5" fill="#dc2626" stroke="white" strokeWidth="1.5" />
                    <g fontSize="10">
                      <line x1={PADDING.left + INNER_WIDTH - 70} y1={PADDING.top + 12} x2={PADDING.left + INNER_WIDTH - 55} y2={PADDING.top + 12} stroke="#3b82f6" strokeWidth="2" />
                      <text x={PADDING.left + INNER_WIDTH - 52} y={PADDING.top + 15} fill="#3b82f6">x</text>
                      <line x1={PADDING.left + INNER_WIDTH - 38} y1={PADDING.top + 12} x2={PADDING.left + INNER_WIDTH - 23} y2={PADDING.top + 12} stroke="#dc2626" strokeWidth="2" />
                      <text x={PADDING.left + INNER_WIDTH - 20} y={PADDING.top + 15} fill="#dc2626">y</text>
                    </g>
                  </g>
                  <text x={PADDING.left + INNER_WIDTH / 2} y={PLOT_HEIGHT - 8} textAnchor="middle" fill="#64748b" fontSize="12">t</text>
                  <text x={12} y={PADDING.top + INNER_HEIGHT / 2} textAnchor="middle" fill="#64748b" fontSize="12" transform={`rotate(-90, 12, ${PADDING.top + INNER_HEIGHT / 2})`}>x, y</text>
                </>
              ) : (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <g key={i}>
                      <line
                        x1={scalePhaseX(viewPhase.xMin + (i / 4) * (viewPhase.xMax - viewPhase.xMin))}
                        y1={PADDING.top}
                        x2={scalePhaseX(viewPhase.xMin + (i / 4) * (viewPhase.xMax - viewPhase.xMin))}
                        y2={PADDING.top + INNER_HEIGHT}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                      <line
                        x1={PADDING.left}
                        y1={scalePhaseY(viewPhase.yMin + (i / 4) * (viewPhase.yMax - viewPhase.yMin))}
                        x2={PADDING.left + INNER_WIDTH}
                        y2={scalePhaseY(viewPhase.yMin + (i / 4) * (viewPhase.yMax - viewPhase.yMin))}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                    </g>
                  ))}
                  <rect x={PADDING.left} y={PADDING.top} width={INNER_WIDTH} height={INNER_HEIGHT} fill="none" stroke="#94a3b8" strokeWidth="1" />
                  <g clipPath="url(#interactingPlotClip)">
                    {showVectorField && (() => {
                      const nx = 16;
                      const ny = 12;
                      const segs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
                      const rangeX = viewPhase.xMax - viewPhase.xMin;
                      const rangeY = viewPhase.yMax - viewPhase.yMin;
                      const scale = Math.min(rangeX, rangeY) / 15;
                      for (let i = 0; i <= nx; i++) {
                        for (let j = 0; j <= ny; j++) {
                          const x = viewPhase.xMin + (i / nx) * rangeX;
                          const y = viewPhase.yMin + (j / ny) * rangeY;
                          const [dx, dy] = vectorField(modelType, params, x, y);
                          const mag = Math.sqrt(dx * dx + dy * dy) || 1;
                          const u = (dx / mag) * scale * 0.5;
                          const v = (dy / mag) * scale * 0.5;
                          segs.push({
                            x1: scalePhaseX(x - u),
                            y1: scalePhaseY(y - v),
                            x2: scalePhaseX(x + u),
                            y2: scalePhaseY(y + v),
                          });
                        }
                      }
                      return (
                        <g stroke="#94a3b8" strokeWidth="1" opacity="0.7">
                          {segs.map((s, i) => (
                            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
                          ))}
                        </g>
                      );
                    })()}
                    <path d={pathPhase} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={scalePhaseX(x0)} cy={scalePhaseY(y0)} r="5" fill="#16a34a" stroke="white" strokeWidth="1.5" />
                    <circle cx={scalePhaseX(currentX)} cy={scalePhaseY(currentY)} r="6" fill="#eab308" stroke="white" strokeWidth="2" />
                    {fixedPoints.map((fp, i) => (
                      <circle
                        key={i}
                        cx={scalePhaseX(fp.x)}
                        cy={scalePhaseY(fp.y)}
                        r="4"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />
                    ))}
                  </g>
                  <text x={PADDING.left + INNER_WIDTH / 2} y={PLOT_HEIGHT - 8} textAnchor="middle" fill="#64748b" fontSize="12">x</text>
                  <text x={12} y={PADDING.top + INNER_HEIGHT / 2} textAnchor="middle" fill="#64748b" fontSize="12" transform={`rotate(-90, 12, ${PADDING.top + INNER_HEIGHT / 2})`}>y</text>
                </>
              )}
            </svg>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>Drag to pan • Scroll to zoom</span>
            {viewMode === 'phase' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showVectorField} onChange={(e) => setShowVectorField(e.target.checked)} className="rounded" />
                <span>Vector field</span>
              </label>
            )}
            <button
              type="button"
              onClick={viewMode === 'time' ? resetViewTime : resetViewPhase}
              className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded transition-colors"
            >
              Reset view
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Time:</span>
              <input
                type="range"
                min={0}
                max={tMax}
                step={0.01}
                value={time}
                onChange={(e) => setTime(parseFloat(e.target.value))}
                className="flex-1 min-w-[120px] max-w-[200px]"
              />
              <span className="text-sm tabular-nums text-slate-600 dark:text-slate-400 w-16">{time.toFixed(2)}</span>
            </label>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => {
                setTime(0);
                setIsPlaying(false);
                if (viewMode === 'time') resetViewTime();
                else resetViewPhase();
              }}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium"
            >
              Reset
            </button>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            x({time.toFixed(2)}) = <strong className="text-blue-600">{currentX.toFixed(2)}</strong>
            {' · '}y({time.toFixed(2)}) = <strong className="text-red-600">{currentY.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-72 shrink-0 order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Equations & theory</h3>
          {modelType === 'lotkaVolterra' && (
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>ODEs:</strong> dx/dt = x(α − βy), dy/dt = y(δx − γ)</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Interpretation:</strong> Prey x grow at rate α in the absence of predators; predation reduces prey growth by βxy. Predators y die at rate γ in the absence of prey; they gain from prey at rate δxy. So x is “prey”, y is “predator”.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Equilibria:</strong> (0, 0) (saddle, unstable) and (γ/δ, α/β) in the interior. The interior equilibrium is a <strong>center</strong>: linearization has purely imaginary eigenvalues, so trajectories form closed orbits (periodic oscillations). There is no damping, so amplitudes depend on initial conditions.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Classic result:</strong> Lotka (1925) and Volterra (1926) used this to explain oscillations in fish catches. The model is a useful baseline; adding self-limitation or stochasticity changes the qualitative behavior.
              </p>
            </div>
          )}
          {modelType === 'lotkaVolterraSelfLimit' && (
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>ODEs:</strong> dx/dt = x(α − βy − εx), dy/dt = y(−γ + δx − ηy)</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Interpretation:</strong> Same predator-prey interaction as the basic Lotka-Volterra model, plus self-limitation: −εx² (prey) and −ηy² (predator) represent intraspecific competition (e.g. limited resources or territoriality).
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Equilibria:</strong> (0, 0) and, when it exists in the positive quadrant, a unique coexistence equilibrium (x*, y*). That equilibrium can be a <strong>stable focus</strong> or <strong>stable node</strong>: trajectories spiral or converge to it, so oscillations are damped and the system settles to a fixed level instead of perpetual cycles.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Contrast with basic LV:</strong> The center is destroyed; the Hopf bifurcation (as ε, η increase from 0) replaces the family of closed orbits with a single stable equilibrium.
              </p>
            </div>
          )}
          {modelType === 'lotkaVolterraCompetition' && (
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>ODEs:</strong> dx/dt = r₁x(1 − x/K₁ − α₁₂y/K₁), dy/dt = r₂y(1 − y/K₂ − α₂₁x/K₂)</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Interpretation:</strong> Two species competing for a shared resource. Each grows logistically (carrying capacities K₁, K₂) in isolation. α₁₂ is the competition coefficient of species 2 on species 1 (how much y “uses” of the capacity of x), and α₂₁ the reverse.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Equilibria:</strong> (0, 0) (unstable); (K₁, 0) and (0, K₂) (each stable when the other species is absent); and, when in the positive quadrant, (x*, y*) coexistence. Coexistence is stable if and only if α₁₂ &lt; K₁/K₂ and α₂₁ &lt; K₂/K₁ (weak interspecific competition). Otherwise one species excludes the other (competitive exclusion).
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Classic result:</strong> Gause’s competitive exclusion principle: under this model, two species with identical niches cannot coexist. Coexistence requires niche differentiation (reflected in α₁₂, α₂₁ and K values).
              </p>
            </div>
          )}
          {modelType === 'richardson' && (
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>ODEs:</strong> dx/dt = ky − αx + g, dy/dt = lx − βy + h</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Interpretation:</strong> Richardson’s arms-race model (1939). x and y are the defense/armament levels of two nations. The term +ky says nation 1’s arms increase in response to nation 2’s arms (threat); −αx is “fatigue” or cost that reduces buildup. The constant g is “grievance” (autonomous drive to arm). Similarly for nation 2 with l, β, h.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Equilibrium:</strong> The system is linear. When αβ ≠ kl there is a unique equilibrium (x*, y*) = ((βg + kh)/(αβ − kl), (lg + αh)/(αβ − kl)). If αβ &gt; kl the equilibrium is stable (arms levels converge); if αβ &lt; kl it is unstable (runaway arms race). Eigenvalues of the Jacobian determine whether the equilibrium is a node or spiral.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                <strong>Policy insight:</strong> Reducing threat (k, l) or increasing fatigue (α, β) can move the system from instability to stability, or lower the equilibrium arms levels.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

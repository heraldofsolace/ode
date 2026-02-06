'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PopulationModelType,
  PopulationParams,
  getCurvePoints,
  populationAtTime,
  slopeAt,
} from '@/lib/populationModels';
import {
  getEpidemicCurvePoints,
  epidemicCompartmentAtTime,
} from '@/lib/epidemicModels';

const PLOT_WIDTH = 700;
const PLOT_HEIGHT = 400;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const INNER_WIDTH = PLOT_WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = PLOT_HEIGHT - PADDING.top - PADDING.bottom;

const T_MAX_DEFAULT = 10;

export default function PopulationModelVisualizer() {
  const [modelType, setModelType] = useState<PopulationModelType>('exponential');
  const [params, setParams] = useState<PopulationParams>({
    r: 0.5,
    P0: 10,
    K: 100,
  });
  const [time, setTime] = useState(0);
  const [tMax, setTMax] = useState(T_MAX_DEFAULT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSlopeField, setShowSlopeField] = useState(true);
  const animationRef = useRef<number | undefined>(undefined);
  const svgRef = useRef<SVGSVGElement>(null);

  const isEpidemic = modelType === 'si' || modelType === 'sis' || modelType === 'sir';
  const curvePoints = isEpidemic ? [] : getCurvePoints(modelType, params, tMax);
  const epidemicCurves = isEpidemic
    ? getEpidemicCurvePoints(modelType, {
        beta: params.beta ?? 0.002,
        gamma: params.gamma ?? 0.1,
        N: params.N ?? 100,
        S0: params.S0 ?? Math.max(0, (params.N ?? 100) - (params.I0 ?? 1)),
        I0: params.I0 ?? 1,
        R0: params.R0 ?? 0,
      }, tMax)
    : null;
  const currentP = isEpidemic ? 0 : populationAtTime(modelType, params, time);
  const currentEpidemic = isEpidemic
    ? {
        S: epidemicCompartmentAtTime(modelType, {
          beta: params.beta ?? 0.002,
          gamma: params.gamma ?? 0.1,
          N: params.N ?? 100,
          S0: params.S0 ?? Math.max(0, (params.N ?? 100) - (params.I0 ?? 1)),
          I0: params.I0 ?? 1,
          R0: params.R0 ?? 0,
        }, time, 'S'),
        I: epidemicCompartmentAtTime(modelType, {
          beta: params.beta ?? 0.002,
          gamma: params.gamma ?? 0.1,
          N: params.N ?? 100,
          S0: params.S0 ?? Math.max(0, (params.N ?? 100) - (params.I0 ?? 1)),
          I0: params.I0 ?? 1,
          R0: params.R0 ?? 0,
        }, time, 'I'),
        R: modelType === 'sir'
          ? epidemicCompartmentAtTime(modelType, {
              beta: params.beta ?? 0.002,
              gamma: params.gamma ?? 0.1,
              N: params.N ?? 100,
              S0: params.S0 ?? Math.max(0, (params.N ?? 100) - (params.I0 ?? 1)),
              I0: params.I0 ?? 1,
              R0: params.R0 ?? 0,
            }, time, 'R')
          : undefined,
      }
    : null;

  const tMin = 0;
  const pMin = 0;
  const pMax = isEpidemic && epidemicCurves
    ? Math.max(
        ...epidemicCurves.S.map(([, y]) => y),
        ...epidemicCurves.I.map(([, y]) => y),
        ...(epidemicCurves.R ?? []).map(([, y]) => y),
        (params.N ?? 100) * 1.05
      )
    : Math.max(
        ...curvePoints.map(([, P]) => P),
        params.P0 * 1.1,
        (params.K ?? params.P0 * 2) * 1.1
      );
  const pMaxPlot = pMax * 1.05;

  const [view, setView] = useState(() => ({
    tMin: 0,
    tMax: T_MAX_DEFAULT,
    pMin: 0,
    pMax: 150,
  }));
  const viewRef = useRef(view);
  viewRef.current = view;

  const scaleX = (t: number) =>
    PADDING.left +
    ((t - view.tMin) / (view.tMax - view.tMin || 1)) * INNER_WIDTH;
  const scaleY = (P: number) =>
    PADDING.top +
    INNER_HEIGHT -
    ((P - view.pMin) / (view.pMax - view.pMin || 1)) * INNER_HEIGHT;

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number] | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  const resetView = useCallback(() => {
    setView({ tMin: 0, tMax, pMin: 0, pMax: pMaxPlot });
  }, [tMax, pMaxPlot]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setDragStart([e.clientX, e.clientY]);
    setIsDragging(true);
    setHasDragged(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDragging || !dragStart) return;
      const dx = e.clientX - dragStart[0];
      const dy = e.clientY - dragStart[1];
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setHasDragged(true);
      const v = viewRef.current;
      const rangeT = v.tMax - v.tMin;
      const rangeP = v.pMax - v.pMin;
      const dt = (-dx / INNER_WIDTH) * rangeT;
      const dP = (dy / INNER_HEIGHT) * rangeP;
      setView((prev) => ({
        tMin: Math.max(0, prev.tMin + dt),
        tMax: Math.min(100, prev.tMax + dt),
        pMin: Math.max(0, prev.pMin + dP),
        pMax: Math.min(1e6, prev.pMax + dP),
      }));
      setDragStart([e.clientX, e.clientY]);
    },
    [isDragging, dragStart]
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
      const v = viewRef.current;
      const rect = svg.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const tMouse =
        v.tMin + ((px - PADDING.left) / INNER_WIDTH) * (v.tMax - v.tMin);
      const pMouse =
        v.pMin +
        ((PADDING.top + INNER_HEIGHT - py) / INNER_HEIGHT) * (v.pMax - v.pMin);
      const zoomFactor = e.deltaY > 0 ? 0.85 : 1 / 0.85;
      const newRangeT = (v.tMax - v.tMin) * zoomFactor;
      const newRangeP = (v.pMax - v.pMin) * zoomFactor;
      setView((prev) => {
        const ntMin = Math.max(0, tMouse - (tMouse - prev.tMin) * zoomFactor);
        const ntMax = Math.min(100, ntMin + newRangeT);
        const npMin = Math.max(0, pMouse - (pMouse - prev.pMin) * zoomFactor);
        const npMax = Math.min(1e6, npMin + newRangeP);
        return {
          tMin: ntMin,
          tMax: ntMax,
          pMin: npMin,
          pMax: npMax,
        };
      });
    };
    svg.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () =>
      svg.removeEventListener('wheel', handleWheel, { capture: true });
  }, []);

  const pathD = curvePoints
    .map(([t, P], i) => `${i === 0 ? 'M' : 'L'} ${scaleX(t)} ${scaleY(P)}`)
    .join(' ');

  const epidemicPathD = epidemicCurves
    ? {
        S: epidemicCurves.S.map(([t, P], i) => `${i === 0 ? 'M' : 'L'} ${scaleX(t)} ${scaleY(P)}`).join(' '),
        I: epidemicCurves.I.map(([t, P], i) => `${i === 0 ? 'M' : 'L'} ${scaleX(t)} ${scaleY(P)}`).join(' '),
        R: epidemicCurves.R?.map(([t, P], i) => `${i === 0 ? 'M' : 'L'} ${scaleX(t)} ${scaleY(P)}`).join(' '),
      }
    : null;

  const pointsUpToTime = curvePoints.filter(([t]) => t <= time);
  const areaPathD =
    isEpidemic || pointsUpToTime.length === 0
      ? ''
      : pointsUpToTime
          .map(([t, P], i) => `${i === 0 ? 'M' : 'L'} ${scaleX(t)} ${scaleY(P)}`)
          .join(' ') +
        ` L ${scaleX(time)} ${scaleY(pMaxPlot)} L ${scaleX(0)} ${scaleY(pMaxPlot)} Z`;

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

  const handleReset = () => {
    setTime(0);
    setIsPlaying(false);
  };

  const handleResetGraph = () => {
    setTime(0);
    setIsPlaying(false);
    setView({ tMin: 0, tMax, pMin: 0, pMax: pMaxPlot });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 order-2 lg:order-1">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Model
            </label>
            <select
              value={modelType}
              onChange={(e) => {
                const next = e.target.value as PopulationModelType;
                setModelType(next);
                if (next === 'harvesting' && params.H == null) {
                  setParams((p) => ({ ...p, H: 2, K: p.K ?? 100 }));
                }
                if (next === 'exponentialHarvesting' && params.H == null) {
                  setParams((p) => ({ ...p, H: 2 }));
                }
                if (next === 'allee' && params.A == null) {
                  setParams((p) => ({ ...p, K: p.K ?? 100, A: Math.min(20, (p.K ?? 100) / 5) }));
                }
                if ((next === 'si' || next === 'sis' || next === 'sir') && params.beta == null) {
                  setParams((p) => ({
                    ...p,
                    beta: 0.002,
                    gamma: next === 'si' ? 0 : 0.1,
                    N: 100,
                    S0: 99,
                    I0: 1,
                    R0: next === 'sir' ? 0 : undefined,
                  }));
                }
              }}
              className="w-full max-w-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="exponential">Exponential (Malthusian): dP/dt = rP</option>
              <option value="exponentialHarvesting">Exponential + harvesting: dP/dt = rP − H</option>
              <option value="logistic">Logistic (Verhulst–Pearl): dP/dt = rP(1 − P/K)</option>
              <option value="allee">Allee effect: dP/dt = (r/K)P(1 − P/K)(P − A)</option>
              <option value="harvesting">Logistic + harvesting: dP/dt = rP(1 − P/K) − H</option>
              <option value="si">Epidemic SI (Kermack–McKendrick)</option>
              <option value="sis">Epidemic SIS (Kermack–McKendrick)</option>
              <option value="sir">Epidemic SIR (Kermack–McKendrick)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {isEpidemic ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transmission rate β
                  </label>
                  <input
                    type="number"
                    min={0.0001}
                    max={1}
                    step={0.0001}
                    value={params.beta ?? 0.002}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setParams((p) => ({ ...p, beta: Number.isFinite(v) ? v : 0.002 }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                {(modelType === 'sis' || modelType === 'sir') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Recovery rate γ
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={2}
                      step={0.01}
                      value={params.gamma ?? 0.1}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setParams((p) => ({ ...p, gamma: Number.isFinite(v) ? v : 0.1 }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Total population N
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={params.N ?? 100}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, N: Math.max(1, parseFloat(e.target.value) || 1) }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Initial infected I₀
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    step={1}
                    value={params.I0 ?? 1}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, I0: Math.max(0, parseFloat(e.target.value) || 0) }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                {modelType === 'sir' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Initial susceptible S₀
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={params.S0 ?? 99}
                        onChange={(e) =>
                          setParams((p) => ({ ...p, S0: Math.max(0, parseFloat(e.target.value) || 0) }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Initial recovered R₀
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={params.R0 ?? 0}
                        onChange={(e) =>
                          setParams((p) => ({ ...p, R0: Math.max(0, parseFloat(e.target.value) || 0) }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Growth rate r
              </label>
              <input
                type="number"
                min={-5}
                max={5}
                step={0.1}
                value={params.r}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setParams((p) => ({ ...p, r: Number.isFinite(v) ? v : 0.1 }));
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Initial population P₀
              </label>
              <input
                type="number"
                min={0.1}
                step={1}
                value={params.P0}
                onChange={(e) =>
                  setParams((p) => ({ ...p, P0: parseFloat(e.target.value) || 1 }))
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            {(modelType === 'logistic' || modelType === 'harvesting' || modelType === 'allee') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Carrying capacity K
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={params.K ?? 100}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, K: parseFloat(e.target.value) || 1 }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
            {modelType === 'allee' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Allee threshold A
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={params.A ?? 20}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, A: Math.max(0, parseFloat(e.target.value) || 0) }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
            {(modelType === 'harvesting' || modelType === 'exponentialHarvesting') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Harvest rate H
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={params.H ?? 2}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, H: Math.max(0, parseFloat(e.target.value) || 0) }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Time range (t max)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                step={1}
                value={tMax}
                onChange={(e) =>
                  setTMax(Math.max(1, parseFloat(e.target.value) || 10))
                }
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
                <linearGradient id="curveGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
                <clipPath id="plotClip">
                  <rect
                    x={PADDING.left}
                    y={PADDING.top}
                    width={INNER_WIDTH}
                    height={INNER_HEIGHT}
                  />
                </clipPath>
              </defs>
              {/* Grid */}
              {[1, 2, 3, 4].map((i) => {
                const t = view.tMin + (i / 4) * (view.tMax - view.tMin);
                const p = view.pMin + (i / 4) * (view.pMax - view.pMin);
                return (
                  <g key={i}>
                    <line
                      x1={scaleX(t)}
                      y1={PADDING.top}
                      x2={scaleX(t)}
                      y2={PADDING.top + INNER_HEIGHT}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <line
                      x1={PADDING.left}
                      y1={scaleY(p)}
                      x2={PADDING.left + INNER_WIDTH}
                      y2={scaleY(p)}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
              {/* Plot border */}
              <rect
                x={PADDING.left}
                y={PADDING.top}
                width={INNER_WIDTH}
                height={INNER_HEIGHT}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1"
              />
              {/* Y-axis (t = 0) - draw when in view */}
              {view.tMin <= 0 && view.tMax >= 0 && (
                <line
                  x1={scaleX(0)}
                  y1={PADDING.top}
                  x2={scaleX(0)}
                  y2={PADDING.top + INNER_HEIGHT}
                  stroke="#334155"
                  strokeWidth="2"
                />
              )}
              {/* X-axis (P = 0) - draw when in view */}
              {view.pMin <= 0 && view.pMax >= 0 && (
                <line
                  x1={PADDING.left}
                  y1={scaleY(0)}
                  x2={PADDING.left + INNER_WIDTH}
                  y2={scaleY(0)}
                  stroke="#334155"
                  strokeWidth="2"
                />
              )}
              <g clipPath="url(#plotClip)">
                {/* Slope field (population models only) */}
                {showSlopeField && !isEpidemic && (() => {
                  const rangeT = view.tMax - view.tMin || 1;
                  const rangeP = view.pMax - view.pMin || 1;
                  const nt = 18;
                  const nP = 18;
                  const halfT = rangeT / 25;
                  const maxHalfP = rangeP / 12;
                  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
                  for (let i = 0; i <= nt; i++) {
                    const t = view.tMin + (i / nt) * rangeT;
                    for (let j = 0; j <= nP; j++) {
                      const P = view.pMin + (j / nP) * rangeP;
                      const slope = slopeAt(modelType, params, t, P);
                      const halfP = Math.max(-maxHalfP, Math.min(maxHalfP, slope * halfT));
                      segments.push({
                        x1: scaleX(t - halfT),
                        y1: scaleY(P - halfP),
                        x2: scaleX(t + halfT),
                        y2: scaleY(P + halfP),
                      });
                    }
                  }
                  return (
                    <g stroke="#94a3b8" strokeWidth="1" opacity="0.7">
                      {segments.map((s, i) => (
                        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
                      ))}
                    </g>
                  );
                })()}
                {/* Carrying capacity line (logistic, harvesting, allee) */}
                {(modelType === 'logistic' || modelType === 'harvesting' || modelType === 'allee') &&
                  params.K != null &&
                  view.pMin <= params.K &&
                  params.K <= view.pMax && (
                    <>
                      <line
                        x1={PADDING.left}
                        y1={scaleY(params.K)}
                        x2={PADDING.left + INNER_WIDTH}
                        y2={scaleY(params.K)}
                        stroke="#059669"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                      />
                      <text
                        x={PADDING.left + INNER_WIDTH - 4}
                        y={scaleY(params.K) - 6}
                        textAnchor="end"
                        fill="#059669"
                        fontSize="11"
                        fontWeight="600"
                      >
                        K = {params.K}
                      </text>
                    </>
                  )}
                {/* Allee threshold line (allee only) */}
                {modelType === 'allee' &&
                  params.A != null &&
                  params.A > 0 &&
                  view.pMin <= params.A &&
                  params.A <= view.pMax && (
                    <>
                      <line
                        x1={PADDING.left}
                        y1={scaleY(params.A)}
                        x2={PADDING.left + INNER_WIDTH}
                        y2={scaleY(params.A)}
                        stroke="#b45309"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={PADDING.left + INNER_WIDTH - 4}
                        y={scaleY(params.A) + 14}
                        textAnchor="end"
                        fill="#b45309"
                        fontSize="11"
                        fontWeight="600"
                      >
                        A = {params.A}
                      </text>
                    </>
                  )}
                {/* Area under curve up to current time (population only) */}
                {areaPathD && (
                  <path d={areaPathD} fill="url(#curveGrad)" />
                )}
                {/* Curves: population (single) or epidemic (S, I, R) */}
                {isEpidemic && epidemicPathD ? (
                  <>
                    <path d={epidemicPathD.S} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={epidemicPathD.I} fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {epidemicPathD.R != null && (
                      <path d={epidemicPathD.R} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    {currentEpidemic && (
                      <>
                        <circle cx={scaleX(time)} cy={scaleY(currentEpidemic.S)} r="5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                        <circle cx={scaleX(time)} cy={scaleY(currentEpidemic.I)} r="5" fill="#dc2626" stroke="white" strokeWidth="1.5" />
                        {currentEpidemic.R !== undefined && (
                          <circle cx={scaleX(time)} cy={scaleY(currentEpidemic.R)} r="5" fill="#16a34a" stroke="white" strokeWidth="1.5" />
                        )}
                      </>
                    )}
                    {/* Legend */}
                    <g fontSize="10" fill="#475569">
                      <line x1={PADDING.left + INNER_WIDTH - 90} y1={PADDING.top + 12} x2={PADDING.left + INNER_WIDTH - 75} y2={PADDING.top + 12} stroke="#3b82f6" strokeWidth="2" />
                      <text x={PADDING.left + INNER_WIDTH - 72} y={PADDING.top + 15} fill="#3b82f6">S</text>
                      <line x1={PADDING.left + INNER_WIDTH - 55} y1={PADDING.top + 12} x2={PADDING.left + INNER_WIDTH - 40} y2={PADDING.top + 12} stroke="#dc2626" strokeWidth="2" />
                      <text x={PADDING.left + INNER_WIDTH - 37} y={PADDING.top + 15} fill="#dc2626">I</text>
                      {modelType === 'sir' && (
                        <>
                          <line x1={PADDING.left + INNER_WIDTH - 22} y1={PADDING.top + 12} x2={PADDING.left + INNER_WIDTH - 7} y2={PADDING.top + 12} stroke="#16a34a" strokeWidth="2" />
                          <text x={PADDING.left + INNER_WIDTH - 4} y={PADDING.top + 15} fill="#16a34a">R</text>
                        </>
                      )}
                    </g>
                  </>
                ) : (
                  <>
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx={scaleX(time)} cy={scaleY(currentP)} r="6" fill="#ef4444" stroke="white" strokeWidth="2" />
                  </>
                )}
              </g>
              {/* Axis labels */}
              <text
                x={PADDING.left + INNER_WIDTH / 2}
                y={PLOT_HEIGHT - 8}
                textAnchor="middle"
                fill="#64748b"
                fontSize="12"
              >
                t (time)
              </text>
              <text
                x={12}
                y={PADDING.top + INNER_HEIGHT / 2}
                textAnchor="middle"
                fill="#64748b"
                fontSize="12"
                transform={`rotate(-90, 12, ${PADDING.top + INNER_HEIGHT / 2})`}
              >
                {isEpidemic ? 'S, I, R (compartments)' : 'P (population)'}
              </text>
              <text
                x={PADDING.left}
                y={PADDING.top + INNER_HEIGHT + 20}
                textAnchor="middle"
                fill="#64748b"
                fontSize="11"
              >
                {view.tMin.toFixed(1)}
              </text>
              <text
                x={PADDING.left + INNER_WIDTH}
                y={PADDING.top + INNER_HEIGHT + 20}
                textAnchor="middle"
                fill="#64748b"
                fontSize="11"
              >
                {view.tMax.toFixed(1)}
              </text>
              <text
                x={PADDING.left - 8}
                y={PADDING.top + INNER_HEIGHT}
                textAnchor="end"
                fill="#64748b"
                fontSize="11"
              >
                {view.pMin.toFixed(0)}
              </text>
              <text
                x={PADDING.left - 8}
                y={PADDING.top}
                textAnchor="end"
                fill="#64748b"
                fontSize="11"
              >
                {view.pMax.toFixed(0)}
              </text>
            </svg>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>Drag to pan • Scroll on graph to zoom</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSlopeField}
                onChange={(e) => setShowSlopeField(e.target.checked)}
                className="rounded"
              />
              <span>Slope field</span>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Time:
              </span>
              <input
                type="range"
                min={0}
                max={tMax}
                step={0.01}
                value={time}
                onChange={(e) => setTime(parseFloat(e.target.value))}
                className="flex-1 min-w-[120px] max-w-[200px]"
              />
              <span className="text-sm tabular-nums text-slate-600 dark:text-slate-400 w-16">
                {time.toFixed(2)}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={handleResetGraph}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium"
              >
                Reset graph
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium"
              >
                Reset time
              </button>
              <button
                onClick={resetView}
                className="px-4 py-2 rounded-lg bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 text-sm font-medium"
              >
                Reset view
              </button>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {isEpidemic && currentEpidemic ? (
                <>
                  S({time.toFixed(2)}) = <strong className="text-blue-600">{currentEpidemic.S.toFixed(1)}</strong>
                  {' · '}
                  I({time.toFixed(2)}) = <strong className="text-red-600">{currentEpidemic.I.toFixed(1)}</strong>
                  {currentEpidemic.R !== undefined && (
                    <> · R({time.toFixed(2)}) = <strong className="text-green-600">{currentEpidemic.R.toFixed(1)}</strong></>
                  )}
                </>
              ) : (
                <>P({time.toFixed(2)}) = <strong>{currentP.toFixed(2)}</strong></>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-72 shrink-0 order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Equations
          </h3>
          {modelType === 'exponential' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>ODE:</strong> dP/dt = rP
              </p>
              <p>
                <strong>Solution:</strong> P(t) = P₀ e<sup>rt</sup>
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                Unbounded growth; population grows exponentially with rate r. Also called the <strong>Malthusian</strong> model (Thomas Malthus, 1798).
              </p>
            </div>
          )}
          {modelType === 'logistic' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>ODE:</strong> dP/dt = rP(1 − P/K)
              </p>
              <p>
                <strong>Solution:</strong> P(t) = K / (1 + ((K−P₀)/P₀) e<sup>−rt</sup>)
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                Growth levels off at carrying capacity K. Also called the <strong>Verhulst–Pearl</strong> or logistic equation (Verhulst 1838; Pearl &amp; Reed 1920).
              </p>
            </div>
          )}
          {modelType === 'exponentialHarvesting' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>ODE:</strong> dP/dt = rP − H
              </p>
              <p>
                <strong>Solution:</strong> P(t) = (P₀ − H/r)e<sup>rt</sup> + H/r <span className="text-slate-500">(r ≠ 0)</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                Exponential growth with constant harvest H. If H/r &gt; P₀ the population goes extinct in finite time.
              </p>
            </div>
          )}
          {modelType === 'allee' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>ODE:</strong> dP/dt = (r/K) P (1 − P/K)(P − A)
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                <strong>Allee effect:</strong> at low density (P &lt; A) the population declines to extinction; above the threshold A it grows toward K. Equilibria: P = 0 and P = K (stable), P = A (unstable). No closed-form solution; solved numerically.
              </p>
            </div>
          )}
          {modelType === 'harvesting' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>ODE:</strong> dP/dt = rP(1 − P/K) − H
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                Logistic growth with constant harvest rate H. No closed-form solution; solved numerically. High H can cause extinction (overharvesting).
              </p>
            </div>
          )}
          {modelType === 'si' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>ODEs:</strong> dS/dt = −βSI, dI/dt = βSI
              </p>
              <p>
                <strong>Constraint:</strong> S + I = N (constant). So dI/dt = βI(N − I) (logistic in I).
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                <strong>SI (Kermack–McKendrick):</strong> No recovery; everyone eventually infected. I(t) = N / (1 + ((N−I₀)/I₀)e<sup>−βNt</sup>).
              </p>
            </div>
          )}
          {modelType === 'sis' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>ODEs:</strong> dS/dt = −βSI + γI, dI/dt = βSI − γI
              </p>
              <p>
                <strong>Constraint:</strong> S + I = N. With K = N − γ/β: dI/dt = βI(K − I) when K &gt; 0.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                <strong>SIS:</strong> Recovery with no immunity; infectives return to susceptible. Endemic equilibrium when R₀ = βN/γ &gt; 1.
              </p>
            </div>
          )}
          {modelType === 'sir' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>ODEs:</strong> dS/dt = −βSI, dI/dt = βSI − γI, dR/dt = γI
              </p>
              <p>
                <strong>Constraint:</strong> S + I + R = N. Basic reproduction number R₀ = βN/γ.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                <strong>SIR (Kermack–McKendrick):</strong> Recovery with permanent immunity. No closed-form solution; solved numerically. Epidemic peak and final size depend on R₀ and initial conditions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

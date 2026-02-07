'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getEpidemicCurvePoints,
  epidemicCompartmentAtTime,
  type EpidemicModelType,
  type EpidemicParams,
} from '@/lib/epidemicModels';
import { BifurcationPanel } from '@/components/BifurcationPanel';

const PLOT_WIDTH = 700;
const PLOT_HEIGHT = 400;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const INNER_WIDTH = PLOT_WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = PLOT_HEIGHT - PADDING.top - PADDING.bottom;

const T_MAX_DEFAULT = 10;

const defaultEpidemicParams: EpidemicParams = {
  beta: 0.002,
  gamma: 0.1,
  N: 100,
  S0: 99,
  I0: 1,
  R0: 0,
};

export default function EpidemicModelVisualizer() {
  const [modelType, setModelType] = useState<EpidemicModelType>('sir');
  const [params, setParams] = useState<EpidemicParams>({
    ...defaultEpidemicParams,
    gamma: 0.1,
    R0: 0,
  });
  const [time, setTime] = useState(0);
  const [tMax, setTMax] = useState(T_MAX_DEFAULT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'time' | 'bifurcation'>('time');
  const animationRef = useRef<number | undefined>(undefined);
  const svgRef = useRef<SVGSVGElement>(null);

  const showBifurcationTab = modelType === 'sis' || modelType === 'sir';
  // For SIR, N is derived from S₀ + I₀ + R₀ (no separate N input)
  const effectiveParams =
    modelType === 'sir'
      ? { ...params, N: (params.S0 ?? 0) + (params.I0 ?? 0) + (params.R0 ?? 0) }
      : params;
  const currentR0 =
    effectiveParams.N != null && effectiveParams.N > 0 && effectiveParams.gamma != null && effectiveParams.gamma > 0
      ? (effectiveParams.beta! * effectiveParams.N) / effectiveParams.gamma
      : null;

  const epidemicCurves = getEpidemicCurvePoints(modelType, effectiveParams, tMax);
  const currentEpidemic = {
    S: epidemicCompartmentAtTime(modelType, effectiveParams, time, 'S'),
    I: epidemicCompartmentAtTime(modelType, effectiveParams, time, 'I'),
    R: modelType === 'sir' ? epidemicCompartmentAtTime(modelType, effectiveParams, time, 'R') : undefined,
  };

  const pMax = Math.max(
    ...epidemicCurves.S.map(([, y]) => y),
    ...epidemicCurves.I.map(([, y]) => y),
    ...(epidemicCurves.R ?? []).map(([, y]) => y),
    (effectiveParams.N ?? 100) * 1.05
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
    PADDING.left + ((t - view.tMin) / (view.tMax - view.tMin || 1)) * INNER_WIDTH;
  const scaleY = (P: number) =>
    PADDING.top + INNER_HEIGHT - ((P - view.pMin) / (view.pMax - view.pMin || 1)) * INNER_HEIGHT;

  const epidemicPathD = {
    S: epidemicCurves.S.map(([t, P], i) => `${i === 0 ? 'M' : 'L'} ${scaleX(t)} ${scaleY(P)}`).join(' '),
    I: epidemicCurves.I.map(([t, P], i) => `${i === 0 ? 'M' : 'L'} ${scaleX(t)} ${scaleY(P)}`).join(' '),
    R: epidemicCurves.R?.map(([t, P], i) => `${i === 0 ? 'M' : 'L'} ${scaleX(t)} ${scaleY(P)}`).join(' '),
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number] | null>(null);

  const resetView = useCallback(() => {
    setView({ tMin: 0, tMax, pMin: 0, pMax: pMaxPlot });
  }, [tMax, pMaxPlot]);

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
      const tMouse = v.tMin + ((px - PADDING.left) / INNER_WIDTH) * (v.tMax - v.tMin);
      const pMouse = v.pMin + ((PADDING.top + INNER_HEIGHT - py) / INNER_HEIGHT) * (v.pMax - v.pMin);
      const zoomFactor = e.deltaY > 0 ? 0.85 : 1 / 0.85;
      const newRangeT = (v.tMax - v.tMin) * zoomFactor;
      const newRangeP = (v.pMax - v.pMin) * zoomFactor;
      const npMin = Math.max(0, pMouse - (pMouse - v.pMin) * zoomFactor);
      const npMax = Math.min(1e6, npMin + newRangeP);
      const ntMin = Math.max(0, tMouse - (tMouse - v.tMin) * zoomFactor);
      const ntMax = Math.min(100, ntMin + newRangeT);
      setView({ tMin: ntMin, tMax: ntMax, pMin: npMin, pMax: npMax });
    };
    svg.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => svg.removeEventListener('wheel', handleWheel, { capture: true });
  }, []);

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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 order-2 lg:order-1">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Model</label>
            <select
              value={modelType}
              onChange={(e) => {
                const next = e.target.value as EpidemicModelType;
                setModelType(next);
                if (params.beta == null) {
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
              <option value="si">SI (Kermack–McKendrick)</option>
              <option value="sis">SIS (Kermack–McKendrick)</option>
              <option value="sir">SIR (Kermack–McKendrick)</option>
            </select>
          </div>

          {showBifurcationTab && (
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
                onClick={() => setViewMode('bifurcation')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'bifurcation' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Bifurcation
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Transmission rate β</label>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Recovery rate γ</label>
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
            {modelType !== 'sir' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total population N</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={params.N ?? 100}
                  onChange={(e) => setParams((p) => ({ ...p, N: Math.max(1, parseFloat(e.target.value) || 1) }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
            {modelType === 'sir' && (
              <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                <span className="font-medium text-slate-700 dark:text-slate-300">Total population N</span>
                <span className="ml-2 tabular-nums">= S₀ + I₀ + R₀ = {(effectiveParams.N || 0).toFixed(0)}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial infected I₀</label>
              <input
                type="number"
                min={0}
                step={1}
                value={params.I0 ?? 1}
                onChange={(e) => setParams((p) => ({ ...p, I0: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            {modelType === 'sir' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial susceptible S₀</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={params.S0 ?? 99}
                    onChange={(e) => setParams((p) => ({ ...p, S0: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial recovered R₀</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={params.R0 ?? 0}
                    onChange={(e) => setParams((p) => ({ ...p, R0: Math.max(0, parseFloat(e.target.value) || 0) }))}
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
                max={50}
                step={1}
                value={tMax}
                onChange={(e) => setTMax(Math.max(1, parseFloat(e.target.value) || 10))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {showBifurcationTab && viewMode === 'bifurcation' ? (
            <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
              <BifurcationPanel model={modelType === 'sir' ? 'sir' : 'sis'} currentR0={currentR0} />
            </div>
          ) : (
            <>
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
                    <clipPath id="epidemicPlotClip">
                      <rect x={PADDING.left} y={PADDING.top} width={INNER_WIDTH} height={INNER_HEIGHT} />
                    </clipPath>
                  </defs>
                  {[1, 2, 3, 4].map((i) => (
                    <g key={i}>
                      <line x1={scaleX(view.tMin + (i / 4) * (view.tMax - view.tMin))} y1={PADDING.top} x2={scaleX(view.tMin + (i / 4) * (view.tMax - view.tMin))} y2={PADDING.top + INNER_HEIGHT} stroke="#e2e8f0" strokeWidth="1" />
                      <line x1={PADDING.left} y1={scaleY(view.pMin + (i / 4) * (view.pMax - view.pMin))} x2={PADDING.left + INNER_WIDTH} y2={scaleY(view.pMin + (i / 4) * (view.pMax - view.pMin))} stroke="#e2e8f0" strokeWidth="1" />
                    </g>
                  ))}
                  <rect x={PADDING.left} y={PADDING.top} width={INNER_WIDTH} height={INNER_HEIGHT} fill="none" stroke="#94a3b8" strokeWidth="1" />
                  {view.tMin <= 0 && view.tMax >= 0 && (
                    <line x1={scaleX(0)} y1={PADDING.top} x2={scaleX(0)} y2={PADDING.top + INNER_HEIGHT} stroke="#334155" strokeWidth="2" />
                  )}
                  {view.pMin <= 0 && view.pMax >= 0 && (
                    <line x1={PADDING.left} y1={scaleY(0)} x2={PADDING.left + INNER_WIDTH} y2={scaleY(0)} stroke="#334155" strokeWidth="2" />
                  )}
                  <g clipPath="url(#epidemicPlotClip)">
                    <path d={epidemicPathD.S} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={epidemicPathD.I} fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {epidemicPathD.R != null && (
                      <path d={epidemicPathD.R} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    <circle cx={scaleX(time)} cy={scaleY(currentEpidemic.S)} r="5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                    <circle cx={scaleX(time)} cy={scaleY(currentEpidemic.I)} r="5" fill="#dc2626" stroke="white" strokeWidth="1.5" />
                    {currentEpidemic.R !== undefined && (
                      <circle cx={scaleX(time)} cy={scaleY(currentEpidemic.R)} r="5" fill="#16a34a" stroke="white" strokeWidth="1.5" />
                    )}
                    <g fontSize="10">
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
                  </g>
                  <text x={PADDING.left + INNER_WIDTH / 2} y={PLOT_HEIGHT - 8} textAnchor="middle" fill="#64748b" fontSize="12">t (time)</text>
                  <text x={12} y={PADDING.top + INNER_HEIGHT / 2} textAnchor="middle" fill="#64748b" fontSize="12" transform={`rotate(-90, 12, ${PADDING.top + INNER_HEIGHT / 2})`}>S, I, R</text>
                  <text x={PADDING.left} y={PADDING.top + INNER_HEIGHT + 20} textAnchor="middle" fill="#64748b" fontSize="11">{view.tMin.toFixed(1)}</text>
                  <text x={PADDING.left + INNER_WIDTH} y={PADDING.top + INNER_HEIGHT + 20} textAnchor="middle" fill="#64748b" fontSize="11">{view.tMax.toFixed(1)}</text>
                  <text x={PADDING.left - 8} y={PADDING.top + INNER_HEIGHT} textAnchor="end" fill="#64748b" fontSize="11">{view.pMin.toFixed(0)}</text>
                  <text x={PADDING.left - 8} y={PADDING.top} textAnchor="end" fill="#64748b" fontSize="11">{view.pMax.toFixed(0)}</text>
                </svg>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>Drag to pan • Scroll on graph to zoom</span>
                <button type="button" onClick={resetView} className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded transition-colors">
                  Reset view
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Time:</span>
                  <input type="range" min={0} max={tMax} step={0.01} value={time} onChange={(e) => setTime(parseFloat(e.target.value))} className="flex-1 min-w-[120px] max-w-[200px]" />
                  <span className="text-sm tabular-nums text-slate-600 dark:text-slate-400 w-16">{time.toFixed(2)}</span>
                </label>
                <button onClick={() => setIsPlaying(!isPlaying)} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium">
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button onClick={() => { setTime(0); setIsPlaying(false); setView({ tMin: 0, tMax, pMin: 0, pMax: pMaxPlot }); }} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium">
                  Reset
                </button>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                S({time.toFixed(2)}) = <strong className="text-blue-600">{currentEpidemic.S.toFixed(1)}</strong>
                {' · '}I({time.toFixed(2)}) = <strong className="text-red-600">{currentEpidemic.I.toFixed(1)}</strong>
                {currentEpidemic.R !== undefined && <> · R({time.toFixed(2)}) = <strong className="text-green-600">{currentEpidemic.R.toFixed(1)}</strong></>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="w-full lg:w-72 shrink-0 order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Equations</h3>
          {modelType === 'si' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>ODEs:</strong> dS/dt = −βSI, dI/dt = βSI</p>
              <p><strong>Constraint:</strong> S + I = N. So dI/dt = βI(N − I) (logistic in I).</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2"><strong>SI:</strong> No recovery; everyone eventually infected. I(t) = N / (1 + ((N−I₀)/I₀)e<sup>−βNt</sup>).</p>
            </div>
          )}
          {modelType === 'sis' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>ODEs:</strong> dS/dt = −βSI + γI, dI/dt = βSI − γI</p>
              <p><strong>Constraint:</strong> S + I = N. With K = N − γ/β: dI/dt = βI(K − I) when K &gt; 0.</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2"><strong>SIS:</strong> Recovery with no immunity. Endemic equilibrium when R₀ = βN/γ &gt; 1.</p>
            </div>
          )}
          {modelType === 'sir' && (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>ODEs:</strong> dS/dt = −βSI, dI/dt = βSI − γI, dR/dt = γI</p>
              <p><strong>Constraint:</strong> S + I + R = N. Basic reproduction number R₀ = βN/γ.</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2"><strong>SIR:</strong> Recovery with permanent immunity. No closed-form solution; solved numerically.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

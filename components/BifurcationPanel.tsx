'use client';

import { useMemo } from 'react';
import { getSISBifurcationData, getSIRThresholdData } from '@/lib/epidemicModels';

const R0_MIN = 0.2;
const R0_MAX = 4;
const W = 320;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 28, left: 38 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

interface BifurcationPanelProps {
  /** Which model is selected: show only that bifurcation diagram */
  model: 'sis' | 'sir';
  /** Current R₀ = βN/γ from params; vertical line drawn at this value */
  currentR0: number | null;
}

export function BifurcationPanel({ model, currentR0 }: BifurcationPanelProps) {
  const sisData = useMemo(() => getSISBifurcationData(R0_MIN, R0_MAX), []);
  const sirData = useMemo(
    () => getSIRThresholdData(100, 0.1, R0_MIN, R0_MAX, 50, 300, 120),
    []
  );

  const scaleX = (r0: number) => PAD.left + ((r0 - R0_MIN) / (R0_MAX - R0_MIN)) * INNER_W;
  const scaleYSIS = (y: number) => PAD.top + INNER_H - (y / 1) * INNER_H;
  const scaleYSIR = (y: number) => PAD.top + INNER_H - (y / 1) * INNER_H;

  const path = (points: Array<[number, number]>, scaleYFn: (y: number) => number) =>
    points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${scaleX(x)} ${scaleYFn(y)}`).join(' ');

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        The <strong className="text-amber-600 dark:text-amber-400">yellow line</strong> is your current R₀ from the parameters above.
      </p>
      <div className="rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-700 dark:text-slate-300">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">How to read the graph</h4>
        <ul className="list-disc list-inside space-y-1.5 text-xs">
          <li><strong>Horizontal axis (R₀):</strong> Basic reproduction number. At R₀ = 1 (grey dashed line) the behaviour changes.</li>
          {model === 'sis' && (
            <>
              <li><strong>Vertical axis (I*/N):</strong> Long-run infected fraction at equilibrium. For R₀ &lt; 1 the disease dies out (green). For R₀ &gt; 1 an endemic level appears (blue curve); read the height at the yellow line for your endemic I*/N.</li>
              <li>Green: stable I=0. Red dashed: unstable I=0. Blue: endemic I*=N(1−1/R₀).</li>
            </>
          )}
          {model === 'sir' && (
            <>
              <li><strong>Vertical axis:</strong> Red = peak infected fraction max I(t)/N; green dashed = final epidemic size R(∞)/N. For R₀ &lt; 1 there is no epidemic. For R₀ &gt; 1, read off peak and total size at the yellow line.</li>
              <li>Red: max I(t)/N. Green dashed: final R/N. Threshold at R₀ = 1.</li>
            </>
          )}
        </ul>
      </div>

      {model === 'sis' && (
        <div className="flex-shrink-0">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            SIS — equilibrium (transcritical at R₀ = 1)
          </h4>
          <svg width={W} height={H} className="border border-slate-200 dark:border-slate-600 rounded overflow-hidden bg-white dark:bg-slate-900">
            <rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} fill="none" stroke="#e2e8f0" strokeWidth="1" />
            <line x1={scaleX(1)} y1={PAD.top} x2={scaleX(1)} y2={PAD.top + INNER_H} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
            <path d={path(sisData.stableDF, scaleYSIS)} fill="none" stroke="#16a34a" strokeWidth="2" />
            <path d={path(sisData.unstableDF, scaleYSIS)} fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 2" />
            <path d={path(sisData.endemic, scaleYSIS)} fill="none" stroke="#2563eb" strokeWidth="2" />
            {currentR0 != null && currentR0 >= R0_MIN && currentR0 <= R0_MAX && (
              <line x1={scaleX(currentR0)} y1={PAD.top} x2={scaleX(currentR0)} y2={PAD.top + INNER_H} stroke="#eab308" strokeWidth="2" />
            )}
            <text x={PAD.left + INNER_W / 2} y={H - 6} textAnchor="middle" fill="#64748b" fontSize="10">R₀</text>
            <text x={8} y={PAD.top + INNER_H / 2} textAnchor="middle" fill="#64748b" fontSize="10" transform={`rotate(-90, 8, ${PAD.top + INNER_H / 2})`}>I*/N</text>
          </svg>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Green: stable I=0. Red dashed: unstable I=0. Blue: endemic I*=N(1−1/R₀).
          </p>
        </div>
      )}

      {model === 'sir' && (
        <div className="flex-shrink-0">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            SIR — epidemic threshold (peak I/N, final R/N)
          </h4>
          <svg width={W} height={H} className="border border-slate-200 dark:border-slate-600 rounded overflow-hidden bg-white dark:bg-slate-900">
            <rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} fill="none" stroke="#e2e8f0" strokeWidth="1" />
            <line x1={scaleX(1)} y1={PAD.top} x2={scaleX(1)} y2={PAD.top + INNER_H} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
            <path
              d={sirData.r0.map((r, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(r)} ${scaleYSIR(sirData.peakIN[i])}`).join(' ')}
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
            />
            <path
              d={sirData.r0.map((r, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(r)} ${scaleYSIR(sirData.finalRN[i])}`).join(' ')}
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
            {currentR0 != null && currentR0 >= R0_MIN && currentR0 <= R0_MAX && (
              <line x1={scaleX(currentR0)} y1={PAD.top} x2={scaleX(currentR0)} y2={PAD.top + INNER_H} stroke="#eab308" strokeWidth="2" />
            )}
            <text x={PAD.left + INNER_W / 2} y={H - 6} textAnchor="middle" fill="#64748b" fontSize="10">R₀</text>
            <text x={8} y={PAD.top + INNER_H / 2} textAnchor="middle" fill="#64748b" fontSize="10" transform={`rotate(-90, 8, ${PAD.top + INNER_H / 2})`}>peak I/N, final R/N</text>
          </svg>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Red: max I(t)/N. Green dashed: final R/N. Threshold at R₀ = 1.
          </p>
        </div>
      )}
    </div>
  );
}

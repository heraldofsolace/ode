'use client';

import { useMemo } from 'react';
import {
  getHarvestingBifurcationData,
  getAlleeBifurcationData,
  getExponentialHarvestingBifurcationData,
} from '@/lib/populationModels';
import type { PopulationParams } from '@/lib/populationModels';

const W = 320;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 28, left: 38 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

export type PopulationBifurcationModel = 'harvesting' | 'allee' | 'exponentialHarvesting';

interface PopulationBifurcationPanelProps {
  model: PopulationBifurcationModel;
  params: PopulationParams;
}

export function PopulationBifurcationPanel({ model, params }: PopulationBifurcationPanelProps) {
  const r = params.r;
  const K = params.K ?? 100;
  const H_val = params.H ?? 0;
  const A_val = params.A ?? 0;

  const harvestingData = useMemo(() => {
    if (model !== 'harvesting') return null;
    const HCrit = (r * K) / 4;
    return getHarvestingBifurcationData(r, K, 80);
  }, [model, r, K]);

  const alleeData = useMemo(() => {
    if (model !== 'allee') return null;
    return getAlleeBifurcationData(K, 80);
  }, [model, K]);

  const expHarvestData = useMemo(() => {
    if (model !== 'exponentialHarvesting') return null;
    const HMax = Math.max(r * K, H_val * 2, 1);
    return getExponentialHarvestingBifurcationData(r, HMax, 80);
  }, [model, r, K, H_val]);

  const path = (
    xArr: number[],
    yArr: number[],
    scaleX: (x: number) => number,
    scaleY: (y: number) => number
  ) =>
    xArr
      .map((x, i) => {
        const y = yArr[i];
        if (Number.isNaN(y)) return null;
        const useMove = i === 0 || Number.isNaN(yArr[i - 1]);
        return `${useMove ? 'M' : 'L'} ${scaleX(x)} ${scaleY(y)}`;
      })
      .filter(Boolean)
      .join(' ');

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        The <strong className="text-amber-600 dark:text-amber-400">yellow line</strong> is your current parameter value.
      </p>
      <div className="rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-700 dark:text-slate-300">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">How to read the graph</h4>
        <ul className="list-disc list-inside space-y-1.5 text-xs">
          {model === 'harvesting' && (
            <>
              <li><strong>Horizontal axis (H):</strong> Harvest rate. At H = rK/4 (grey dashed line) a saddle-node bifurcation occurs: the two non-zero equilibria merge and disappear.</li>
              <li><strong>Vertical axis (P*):</strong> Equilibrium population. Green: stable high equilibrium. Red dashed: unstable low equilibrium. Above H = rK/4 only extinction (P = 0) remains.</li>
            </>
          )}
          {model === 'allee' && (
            <>
              <li><strong>Horizontal axis (A):</strong> Allee threshold. Three equilibria: P = 0 and P = K (stable), P = A (unstable).</li>
              <li><strong>Vertical axis (P*):</strong> Equilibrium values. Green: stable (0 and K). Red dashed: unstable (A).</li>
            </>
          )}
          {model === 'exponentialHarvesting' && (
            <>
              <li><strong>Horizontal axis (H):</strong> Harvest rate. Equilibrium P* = H/r (when r &gt; 0).</li>
              <li><strong>Vertical axis (P*):</strong> Equilibrium population. For H &gt; rP₀ the population goes extinct in finite time.</li>
            </>
          )}
        </ul>
      </div>

      {model === 'harvesting' && harvestingData && (
        <div className="flex-shrink-0">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Logistic + harvesting — saddle-node at H = rK/4
          </h4>
          <HarvestingDiagram
            data={harvestingData}
            currentH={H_val}
            r={r}
            K={K}
            path={path}
          />
        </div>
      )}

      {model === 'allee' && alleeData && (
        <div className="flex-shrink-0">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Allee effect — equilibria 0, A, K
          </h4>
          <AlleeDiagram
            data={alleeData}
            currentA={A_val}
            K={K}
            path={path}
          />
        </div>
      )}

      {model === 'exponentialHarvesting' && expHarvestData && (
        <div className="flex-shrink-0">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Exponential + harvesting — equilibrium P* = H/r
          </h4>
          <ExpHarvestDiagram
            data={expHarvestData}
            currentH={H_val}
            path={path}
          />
        </div>
      )}
    </div>
  );
}

function HarvestingDiagram({
  data,
  currentH,
  r,
  K,
  path,
}: {
  data: { H: number[]; PStable: number[]; PUnstable: number[] };
  currentH: number;
  r: number;
  K: number;
  path: (x: number[], y: number[], sx: (x: number) => number, sy: (y: number) => number) => string;
}) {
  const HCrit = (r * K) / 4;
  const HMin = 0;
  const HMax = HCrit * 1.02;
  const scaleX = (x: number) => PAD.left + ((x - HMin) / (HMax - HMin)) * INNER_W;
  const pMax = K * 1.05;
  const scaleY = (y: number) => PAD.top + INNER_H - (y / pMax) * INNER_H;

  return (
    <svg width={W} height={H} className="border border-slate-200 dark:border-slate-600 rounded overflow-hidden bg-white dark:bg-slate-900">
      <rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      <line x1={scaleX(HCrit)} y1={PAD.top} x2={scaleX(HCrit)} y2={PAD.top + INNER_H} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
      <path d={path(data.H, data.PStable, scaleX, scaleY)} fill="none" stroke="#16a34a" strokeWidth="2" />
      <path d={path(data.H, data.PUnstable, scaleX, scaleY)} fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 2" />
      {currentH >= HMin && currentH <= HMax && (
        <line x1={scaleX(currentH)} y1={PAD.top} x2={scaleX(currentH)} y2={PAD.top + INNER_H} stroke="#eab308" strokeWidth="2" />
      )}
      <text x={PAD.left + INNER_W / 2} y={H - 6} textAnchor="middle" fill="#64748b" fontSize="10">H</text>
      <text x={8} y={PAD.top + INNER_H / 2} textAnchor="middle" fill="#64748b" fontSize="10" transform={`rotate(-90, 8, ${PAD.top + INNER_H / 2})`}>P*</text>
    </svg>
  );
}

function AlleeDiagram({
  data,
  currentA,
  K,
  path,
}: {
  data: { A: number[]; PStableZero: number[]; PUnstable: number[]; PStableK: number[] };
  currentA: number;
  K: number;
  path: (x: number[], y: number[], sx: (x: number) => number, sy: (y: number) => number) => string;
}) {
  const scaleX = (x: number) => PAD.left + (x / K) * INNER_W;
  const pMax = K * 1.05;
  const scaleY = (y: number) => PAD.top + INNER_H - (y / pMax) * INNER_H;

  return (
    <svg width={W} height={H} className="border border-slate-200 dark:border-slate-600 rounded overflow-hidden bg-white dark:bg-slate-900">
      <rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      <path d={path(data.A, data.PStableZero, scaleX, scaleY)} fill="none" stroke="#16a34a" strokeWidth="2" />
      <path d={path(data.A, data.PUnstable, scaleX, scaleY)} fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 2" />
      <path d={path(data.A, data.PStableK, scaleX, scaleY)} fill="none" stroke="#16a34a" strokeWidth="2" />
      {currentA >= 0 && currentA <= K && (
        <line x1={scaleX(currentA)} y1={PAD.top} x2={scaleX(currentA)} y2={PAD.top + INNER_H} stroke="#eab308" strokeWidth="2" />
      )}
      <text x={PAD.left + INNER_W / 2} y={H - 6} textAnchor="middle" fill="#64748b" fontSize="10">A</text>
      <text x={8} y={PAD.top + INNER_H / 2} textAnchor="middle" fill="#64748b" fontSize="10" transform={`rotate(-90, 8, ${PAD.top + INNER_H / 2})`}>P*</text>
    </svg>
  );
}

function ExpHarvestDiagram({
  data,
  currentH,
  path,
}: {
  data: { H: number[]; P: number[] };
  currentH: number;
  path: (x: number[], y: number[], sx: (x: number) => number, sy: (y: number) => number) => string;
}) {
  const HMax = data.H[data.H.length - 1] ?? 1;
  const PMax = Math.max(...data.P.filter(Number.isFinite), 1);
  const scaleX = (x: number) => PAD.left + (x / HMax) * INNER_W;
  const scaleY = (y: number) => PAD.top + INNER_H - (y / PMax) * INNER_H;

  return (
    <svg width={W} height={H} className="border border-slate-200 dark:border-slate-600 rounded overflow-hidden bg-white dark:bg-slate-900">
      <rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      <path d={path(data.H, data.P, scaleX, scaleY)} fill="none" stroke="#2563eb" strokeWidth="2" />
      {currentH >= 0 && currentH <= HMax && (
        <line x1={scaleX(currentH)} y1={PAD.top} x2={scaleX(currentH)} y2={PAD.top + INNER_H} stroke="#eab308" strokeWidth="2" />
      )}
      <text x={PAD.left + INNER_W / 2} y={H - 6} textAnchor="middle" fill="#64748b" fontSize="10">H</text>
      <text x={8} y={PAD.top + INNER_H / 2} textAnchor="middle" fill="#64748b" fontSize="10" transform={`rotate(-90, 8, ${PAD.top + INNER_H / 2})`}>P*</text>
    </svg>
  );
}

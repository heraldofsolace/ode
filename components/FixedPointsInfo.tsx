'use client';

import { FixedPoint } from '@/lib/odeSolver';
import { InlineMath, BlockMath } from './MathDisplay';

interface FixedPointsInfoProps {
  fixedPoints: FixedPoint[];
}

const typeLabels: Record<FixedPoint['type'], string> = {
  'stable-node': 'Stable Node',
  'unstable-node': 'Unstable Node',
  'saddle': 'Saddle',
  'stable-spiral': 'Stable Spiral',
  'unstable-spiral': 'Unstable Spiral',
  'center': 'Center',
};

const stabilityColors: Record<FixedPoint['stability'], string> = {
  'stable': 'text-green-600 dark:text-green-400',
  'unstable': 'text-red-600 dark:text-red-400',
  'semi-stable': 'text-yellow-600 dark:text-yellow-400',
};

function formatEigenvalue(eigenvalues: FixedPoint['eigenvalues']): string {
  if (eigenvalues.length === 2) {
    const [lambda1, lambda2] = eigenvalues;
    return `λ₁ = ${lambda1.toFixed(3)}, λ₂ = ${lambda2.toFixed(3)}`;
  } else {
    const [real1, imag1, real2, imag2] = eigenvalues;
    if (Math.abs(imag1) < 0.001) {
      return `λ₁ = ${real1.toFixed(3)}, λ₂ = ${real2.toFixed(3)}`;
    }
    return `λ₁ = ${real1.toFixed(3)} ${imag1 >= 0 ? '+' : ''}${imag1.toFixed(3)}i, λ₂ = ${real2.toFixed(3)} ${imag2 >= 0 ? '+' : ''}${imag2.toFixed(3)}i`;
  }
}

function formatEigenvalueLatex(eigenvalues: FixedPoint['eigenvalues']): string {
  if (eigenvalues.length === 2) {
    const [lambda1, lambda2] = eigenvalues;
    return `\\lambda_1 = ${lambda1.toFixed(3)}, \\quad \\lambda_2 = ${lambda2.toFixed(3)}`;
  } else {
    const [real1, imag1, real2, imag2] = eigenvalues;
    if (Math.abs(imag1) < 0.001) {
      return `\\lambda_1 = ${real1.toFixed(3)}, \\quad \\lambda_2 = ${real2.toFixed(3)}`;
    }
    const sign1 = imag1 >= 0 ? '+' : '';
    const sign2 = imag2 >= 0 ? '+' : '';
    return `\\lambda_1 = ${real1.toFixed(3)} ${sign1}${imag1.toFixed(3)}i, \\quad \\lambda_2 = ${real2.toFixed(3)} ${sign2}${imag2.toFixed(3)}i`;
  }
}

export function FixedPointsInfo({ fixedPoints }: FixedPointsInfoProps) {
  if (fixedPoints.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Fixed Points
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No fixed points found in the search range.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 overflow-hidden">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Fixed Points ({fixedPoints.length})
      </h2>
      <div className="space-y-4 max-h-96 overflow-y-auto overflow-x-hidden">
        {fixedPoints.map((fp, idx) => (
          <div
            key={idx}
            className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2 min-w-0"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Point {idx + 1}
              </h3>
              <span className={`text-sm font-medium ${stabilityColors[fp.stability]}`}>
                {fp.stability}
              </span>
            </div>
            
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <div className="font-medium mb-1">Type: {typeLabels[fp.type]}</div>
              <div className="mb-2 break-words">
                Position: <InlineMath math={`(${fp.x.toFixed(3)}, ${fp.y.toFixed(3)})`} />
              </div>
              <div className="mb-2">
                <div className="font-medium mb-1">Eigenvalues:</div>
                <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-xs overflow-x-auto w-full">
                  <div className="min-w-0">
                    <BlockMath math={formatEigenvalueLatex(fp.eigenvalues)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Legend
        </h3>
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Stable Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Unstable Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Saddle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Stable Spiral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span>Unstable Spiral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Center</span>
          </div>
        </div>
      </div>
    </div>
  );
}


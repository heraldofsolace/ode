'use client';

import { SystemType, getSolutionFunction, getEquationLatex, SystemParameters } from '@/lib/odeSolver';
import { BlockMath } from './MathDisplay';

interface SystemSelectorProps {
  systemType: SystemType;
  onSystemChange: (system: SystemType) => void;
  parameters: SystemParameters;
}

const systems: Array<{ value: SystemType; label: string; description: string }> = [
  {
    value: 'spiral',
    label: 'Spiral Sink',
    description: 'Spiral sink (stable focus)',
  },
  {
    value: 'focus',
    label: 'Spiral Source',
    description: 'Spiral source (unstable focus)',
  },
  {
    value: 'saddle',
    label: 'Saddle Point',
    description: 'Saddle point (unstable)',
  },
  {
    value: 'node',
    label: 'Stable Node',
    description: 'Stable node',
  },
  {
    value: 'center',
    label: 'Center',
    description: 'Harmonic oscillator (neutral)',
  },
  {
    value: 'vanDerPol',
    label: 'Van der Pol',
    description: 'Van der Pol oscillator with limit cycle',
  },
  {
    value: 'lotkaVolterra',
    label: 'Lotka-Volterra',
    description: 'Predator-prey model',
  },
  {
    value: 'duffing',
    label: 'Duffing',
    description: 'Duffing oscillator',
  },
  {
    value: 'pendulum',
    label: 'Pendulum',
    description: 'Damped pendulum',
  },
];

export function SystemSelector({ systemType, onSystemChange, parameters }: SystemSelectorProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Dynamical System
      </h2>
      <div className="space-y-2">
        {systems.map((system) => (
          <label
            key={system.value}
            className={`block p-3 rounded-lg border-2 cursor-pointer transition-colors ${
              systemType === system.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="system"
              value={system.value}
              checked={systemType === system.value}
              onChange={(e) => onSystemChange(e.target.value as SystemType)}
              className="sr-only"
            />
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {system.label}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              {system.description}
            </div>
            {systemType === system.value && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Differential Equation:
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded flex justify-center overflow-x-auto">
                    <BlockMath math={getEquationLatex(system.value, parameters)} />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Analytical Solution:
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded flex justify-center overflow-x-auto">
                    <BlockMath math={getSolutionFunction(system.value, parameters)} />
                  </div>
                </div>
              </div>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

'use client';

import { SystemType, getSystemParameters, SystemParameters, defaultParameters } from '@/lib/odeSolver';

interface ParameterControlsProps {
  systemType: SystemType;
  parameters: SystemParameters;
  onParametersChange: (parameters: SystemParameters) => void;
}

export function ParameterControls({
  systemType,
  parameters,
  onParametersChange,
}: ParameterControlsProps) {
  const paramDefs = getSystemParameters(systemType);

  if (paramDefs.length === 0) {
    return null;
  }

  const handleParameterChange = (key: string, value: number) => {
    const newParams: SystemParameters = { ...parameters };
    
    // Update the appropriate parameter object based on system type
    switch (systemType) {
      case 'vanDerPol': {
        const current = newParams.vanDerPol || defaultParameters.vanDerPol!;
        newParams.vanDerPol = { ...current, [key]: value } as { mu: number };
        break;
      }
      case 'lotkaVolterra': {
        const current = newParams.lotkaVolterra || defaultParameters.lotkaVolterra!;
        newParams.lotkaVolterra = { ...current, [key]: value } as { alpha: number; beta: number; delta: number; gamma: number };
        break;
      }
      case 'duffing': {
        const current = newParams.duffing || defaultParameters.duffing!;
        newParams.duffing = { ...current, [key]: value } as { delta: number };
        break;
      }
      case 'pendulum': {
        const current = newParams.pendulum || defaultParameters.pendulum!;
        newParams.pendulum = { ...current, [key]: value } as { delta: number };
        break;
      }
      case 'spiral': {
        const current = newParams.spiral || defaultParameters.spiral!;
        newParams.spiral = { ...current, [key]: value } as { a: number; b: number };
        break;
      }
      case 'focus': {
        const current = newParams.focus || defaultParameters.focus!;
        newParams.focus = { ...current, [key]: value } as { a: number; b: number };
        break;
      }
    }
    
    onParametersChange(newParams);
  };

  const getParameterValue = (key: string): number => {
    switch (systemType) {
      case 'vanDerPol':
        return parameters.vanDerPol?.[key as keyof typeof parameters.vanDerPol] as number ?? defaultParameters.vanDerPol?.[key as keyof typeof defaultParameters.vanDerPol] as number ?? 0.5;
      case 'lotkaVolterra':
        return parameters.lotkaVolterra?.[key as keyof typeof parameters.lotkaVolterra] as number ?? defaultParameters.lotkaVolterra?.[key as keyof typeof defaultParameters.lotkaVolterra] as number ?? 1.0;
      case 'duffing':
        return parameters.duffing?.delta ?? defaultParameters.duffing?.delta ?? 0.1;
      case 'pendulum':
        return parameters.pendulum?.delta ?? defaultParameters.pendulum?.delta ?? 0.1;
      case 'spiral':
        return parameters.spiral?.[key as keyof typeof parameters.spiral] as number ?? defaultParameters.spiral?.[key as keyof typeof defaultParameters.spiral] as number ?? -1;
      case 'focus':
        return parameters.focus?.[key as keyof typeof parameters.focus] as number ?? defaultParameters.focus?.[key as keyof typeof defaultParameters.focus] as number ?? 1;
      default:
        return 0;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Parameters
      </h2>
      <div className="space-y-4">
        {paramDefs.map((param) => (
          <div key={param.key}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {param.label}: {getParameterValue(param.key).toFixed(2)}
            </label>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={getParameterValue(param.key)}
              onChange={(e) => handleParameterChange(param.key, parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{param.min}</span>
              <span>{param.max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


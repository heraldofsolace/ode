export type PopulationModelType =
  | 'exponential' | 'logistic' | 'harvesting' | 'exponentialHarvesting' | 'allee'
  | 'si' | 'sis' | 'sir';

export interface PopulationParams {
  r: number;   // growth rate
  P0: number;  // initial population
  K?: number;  // carrying capacity (logistic, harvesting, allee)
  H?: number;  // constant harvest rate (harvesting, exponentialHarvesting)
  A?: number;  // Allee threshold (allee only)
  // Epidemic (Kermack–McKendrick): SI, SIS, SIR
  beta?: number;  // transmission rate
  gamma?: number; // recovery rate (SIS, SIR)
  N?: number;    // total population (epidemic)
  S0?: number;   // initial susceptible (SIR)
  I0?: number;   // initial infected (epidemic)
  R0?: number;   // initial recovered (SIR)
}

// Exponential growth: dP/dt = rP  =>  P(t) = P0 * e^(rt)
export function exponentialSolution(P0: number, r: number, t: number): number {
  return P0 * Math.exp(r * t);
}

// Exponential with harvesting: dP/dt = rP - H  =>  P(t) = (P0 - H/r)e^(rt) + H/r  (r ≠ 0)
export function exponentialHarvestingSolution(
  P0: number,
  r: number,
  H: number,
  t: number
): number {
  if (r === 0) {
    return Math.max(0, P0 - H * t);
  }
  const C = P0 - H / r;
  const P = C * Math.exp(r * t) + H / r;
  return Math.max(0, P);
}

// Logistic growth: dP/dt = rP(1 - P/K)  =>  P(t) = K / (1 + ((K-P0)/P0) * e^(-rt))
export function logisticSolution(P0: number, r: number, K: number, t: number): number {
  if (P0 <= 0) return 0;
  if (Math.abs(P0 - K) < 1e-10) return K;
  const coeff = (K - P0) / P0;
  return K / (1 + coeff * Math.exp(-r * t));
}

// dP/dt for harvesting model (logistic minus constant harvest)
function harvestingRhs(P: number, r: number, K: number, H: number): number {
  return r * P * (1 - P / K) - H;
}

// Numerical solution for harvesting: RK4
function harvestingSolution(
  P0: number,
  r: number,
  K: number,
  H: number,
  t: number,
  dt: number = 0.01
): number {
  let P = Math.max(0, P0);
  let time = 0;
  while (time < t) {
    const step = Math.min(dt, t - time);
    const k1 = harvestingRhs(P, r, K, H);
    const k2 = harvestingRhs(P + (step / 2) * k1, r, K, H);
    const k3 = harvestingRhs(P + (step / 2) * k2, r, K, H);
    const k4 = harvestingRhs(P + step * k3, r, K, H);
    P = Math.max(0, P + (step / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
    time += step;
  }
  return P;
}

// Allee effect: dP/dt = (r/K) P (1 − P/K)(P − A); 0 < A < K gives unstable equilibrium at P=A
function alleeRhs(P: number, r: number, K: number, A: number): number {
  if (P <= 0) return 0;
  return (r / K) * P * (1 - P / K) * (P - A);
}

function alleeSolution(
  P0: number,
  r: number,
  K: number,
  A: number,
  t: number,
  dt: number = 0.01
): number {
  let P = Math.max(0, P0);
  let time = 0;
  while (time < t) {
    const step = Math.min(dt, t - time);
    const k1 = alleeRhs(P, r, K, A);
    const k2 = alleeRhs(P + (step / 2) * k1, r, K, A);
    const k3 = alleeRhs(P + (step / 2) * k2, r, K, A);
    const k4 = alleeRhs(P + step * k3, r, K, A);
    P = Math.max(0, P + (step / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
    time += step;
  }
  return P;
}

export function populationAtTime(
  model: PopulationModelType,
  params: PopulationParams,
  t: number
): number {
  const { r, P0, K = 1, H = 0, A = 0 } = params;
  if (model === 'exponential') {
    return exponentialSolution(P0, r, t);
  }
  if (model === 'exponentialHarvesting') {
    return exponentialHarvestingSolution(P0, r, H, t);
  }
  if (model === 'harvesting') {
    return harvestingSolution(P0, r, K, H, t);
  }
  if (model === 'allee') {
    return alleeSolution(P0, r, K, A, t);
  }
  // Epidemic models (si, sis, sir) are handled by epidemicModels.ts in the UI
  if (model === 'si' || model === 'sis' || model === 'sir') {
    return 0;
  }
  return logisticSolution(P0, r, K, t);
}

// Slope dP/dt at (t, P) for drawing the slope field
export function slopeAt(
  model: PopulationModelType,
  params: PopulationParams,
  t: number,
  P: number
): number {
  const { r, K = 1, H = 0, A = 0 } = params;
  if (model === 'exponential') {
    return r * P;
  }
  if (model === 'exponentialHarvesting') {
    return r * P - H;
  }
  if (model === 'harvesting') {
    return r * P * (1 - P / K) - H;
  }
  if (model === 'allee') {
    return alleeRhs(P, r, K, A);
  }
  if (model === 'si' || model === 'sis' || model === 'sir') {
    return 0; // slope field not used for epidemic (multi-compartment)
  }
  return r * P * (1 - P / K);
}

// Generate curve points for plotting
export function getCurvePoints(
  model: PopulationModelType,
  params: PopulationParams,
  tMax: number,
  numPoints: number = 200
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tMax;
    const P = populationAtTime(model, params, t);
    points.push([t, P]);
  }
  return points;
}

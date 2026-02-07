/**
 * Interacting 2D systems: Lotka-Volterra (predator-prey, self-limitation, competition) and Richardson arms race.
 */

export type InteractingModelType =
  | 'lotkaVolterra'
  | 'lotkaVolterraSelfLimit'
  | 'lotkaVolterraCompetition'
  | 'richardson';

export interface InteractingParams {
  // Lotka-Volterra predator-prey: dx = x(α − βy), dy = y(δx − γ)
  alpha?: number;
  beta?: number;
  delta?: number;
  gamma?: number;
  // LV with self-limitation: + εx, ηy
  epsilon?: number;
  eta?: number;
  // LV competition: r1, K1, a12, r2, K2, a21
  r1?: number;
  K1?: number;
  a12?: number;
  r2?: number;
  K2?: number;
  a21?: number;
  // Richardson: dx = ky − αx + g, dy = lx − βy + h (use richardsonK, richardsonL to avoid clash with LV alpha, beta)
  richardsonK?: number;
  richardsonL?: number;
  richardsonAlpha?: number;
  richardsonBeta?: number;
  g?: number;
  h?: number;
}

const DEFAULT = {
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

function getParams(p: InteractingParams, model: InteractingModelType): InteractingParams {
  const base = { ...DEFAULT, ...p };
  return base;
}

/** Vector field: [dx/dt, dy/dt] */
export function vectorField(
  model: InteractingModelType,
  params: InteractingParams,
  x: number,
  y: number
): [number, number] {
  const p = getParams(params, model);
  switch (model) {
    case 'lotkaVolterra': {
      const { alpha, beta, delta, gamma } = p;
      return [x * (alpha! - beta! * y), y * (delta! * x - gamma!)];
    }
    case 'lotkaVolterraSelfLimit': {
      const { alpha, beta, delta, gamma, epsilon, eta } = p;
      return [
        x * (alpha! - beta! * y - epsilon! * x),
        y * (-gamma! + delta! * x - eta! * y),
      ];
    }
    case 'lotkaVolterraCompetition': {
      const { r1, K1, a12, r2, K2, a21 } = p;
      const dx = r1! * x * (1 - x / K1! - (a12! * y) / K1!);
      const dy = r2! * y * (1 - y / K2! - (a21! * x) / K2!);
      return [dx, dy];
    }
    case 'richardson': {
      const { richardsonK: k, richardsonL: l, richardsonAlpha: a, richardsonBeta: b, g, h } = p;
      return [k! * y - a! * x + g!, l! * x - b! * y + h!];
    }
    default:
      return [0, 0];
  }
}

/** RK4 integration from (x0, y0) over [0, tMax], return trajectory as arrays of [t, x, y]. */
export function solveTrajectory(
  model: InteractingModelType,
  params: InteractingParams,
  x0: number,
  y0: number,
  tMax: number,
  dt: number = 0.02
): Array<[number, number, number]> {
  const trajectory: Array<[number, number, number]> = [[0, x0, y0]];
  let t = 0;
  let x = x0;
  let y = y0;
  while (t < tMax) {
    const step = Math.min(dt, tMax - t);
    const [dx1, dy1] = vectorField(model, params, x, y);
    const [dx2, dy2] = vectorField(model, params, x + (step / 2) * dx1, y + (step / 2) * dy1);
    const [dx3, dy3] = vectorField(model, params, x + (step / 2) * dx2, y + (step / 2) * dy2);
    const [dx4, dy4] = vectorField(model, params, x + step * dx3, y + step * dy3);
    x = x + (step / 6) * (dx1 + 2 * dx2 + 2 * dx3 + dx4);
    y = y + (step / 6) * (dy1 + 2 * dy2 + 2 * dy3 + dy4);
    t += step;
    trajectory.push([t, x, y]);
  }
  return trajectory;
}

/** State (x, y) at time t (via RK4). */
export function stateAtTime(
  model: InteractingModelType,
  params: InteractingParams,
  x0: number,
  y0: number,
  t: number,
  dt: number = 0.02
): [number, number] {
  if (t <= 0) return [x0, y0];
  const traj = solveTrajectory(model, params, x0, y0, t, dt);
  const last = traj[traj.length - 1];
  return [last[1], last[2]];
}

/** Curve points for time-series plot: { x: [[t,x],...], y: [[t,y],...] }. */
export function getCurvePoints(
  model: InteractingModelType,
  params: InteractingParams,
  x0: number,
  y0: number,
  tMax: number,
  numPoints: number = 250
): { x: Array<[number, number]>; y: Array<[number, number]> } {
  const traj = solveTrajectory(model, params, x0, y0, tMax, tMax / numPoints);
  return {
    x: traj.map(([t, x]) => [t, x]),
    y: traj.map(([t, , y]) => [t, y]),
  };
}

export interface FixedPointResult {
  x: number;
  y: number;
  label?: string;
}

/** Analytical fixed points where simple (for phase portrait). */
export function getFixedPoints(
  model: InteractingModelType,
  params: InteractingParams
): FixedPointResult[] {
  const p = getParams(params, model);
  const out: FixedPointResult[] = [];
  switch (model) {
    case 'lotkaVolterra': {
      out.push({ x: 0, y: 0, label: 'extinction' });
      const { alpha, beta, delta, gamma } = p;
      if (delta! > 1e-10 && beta! > 1e-10) {
        out.push({ x: gamma! / delta!, y: alpha! / beta!, label: 'coexistence (center)' });
      }
      break;
    }
    case 'lotkaVolterraSelfLimit': {
      out.push({ x: 0, y: 0, label: 'extinction' });
      const { alpha, beta, delta, gamma, epsilon, eta } = p;
      const denom = epsilon! * eta! + beta! * delta!;
      if (Math.abs(denom) > 1e-10) {
        const xStar = (alpha! * eta! + gamma! * beta!) / denom;
        const yStar = (alpha! * delta! - gamma! * epsilon!) / denom;
        if (xStar >= 0 && yStar >= 0) {
          out.push({ x: xStar, y: yStar, label: 'coexistence' });
        }
      }
      break;
    }
    case 'lotkaVolterraCompetition': {
      const { K1, a12, K2, a21 } = p;
      out.push({ x: 0, y: 0, label: 'extinction' });
      out.push({ x: K1!, y: 0, label: 'species 1 only' });
      out.push({ x: 0, y: K2!, label: 'species 2 only' });
      const denom = 1 - a12! * a21!;
      if (Math.abs(denom) > 1e-10) {
        const xStar = (K1! - a12! * K2!) / denom;
        const yStar = (K2! - a21! * K1!) / denom;
        if (xStar >= 0 && yStar >= 0) {
          out.push({ x: xStar, y: yStar, label: 'coexistence' });
        }
      }
      break;
    }
    case 'richardson': {
      const { richardsonK: k, richardsonL: l, richardsonAlpha: a, richardsonBeta: b, g, h } = p;
      const det = a! * b! - k! * l!;
      if (Math.abs(det) > 1e-10) {
        const xStar = (b! * g! + k! * h!) / det;
        const yStar = (l! * g! + a! * h!) / det;
        out.push({ x: xStar, y: yStar, label: 'equilibrium' });
      }
      break;
    }
  }
  return out;
}

/**
 * Kermack–McKendrick epidemic models: SI, SIS, SIR.
 * Compartmental models with S = Susceptible, I = Infected, R = Recovered.
 */

export type EpidemicModelType = 'si' | 'sis' | 'sir';

export interface EpidemicParams {
  beta: number;   // transmission rate
  gamma?: number; // recovery rate (SIS, SIR)
  N: number;      // total population
  S0?: number;    // initial susceptible (SIR; else S0 = N - I0)
  I0: number;     // initial infected
  R0?: number;    // initial recovered (SIR only; default 0)
}

export type CompartmentSeries = Array<[number, number]>;

export interface EpidemicCurves {
  S: CompartmentSeries;
  I: CompartmentSeries;
  R?: CompartmentSeries;
}

// SI: dS/dt = -β S I, dI/dt = β S I. With N = S + I constant, dI/dt = β I (N - I) → logistic in I.
// I(t) = N / (1 + ((N - I0) / I0) e^(-β N t)), S(t) = N - I(t)
export function siSolution(
  t: number,
  beta: number,
  N: number,
  I0: number
): { S: number; I: number } {
  if (N <= 0 || I0 <= 0) return { S: Math.max(0, N - I0), I: Math.max(0, I0) };
  if (I0 >= N) return { S: 0, I: N };
  const denom = 1 + ((N - I0) / I0) * Math.exp(-beta * N * t);
  const I = N / denom;
  return { S: N - I, I };
}

// SIS: dI/dt = β I (N - I) - γ I = β I (N - γ/β - I). Let K = N - γ/β. Then dI/dt = β I (K - I).
// I(t) = K / (1 + ((K - I0) / I0) e^(-β K t)) when K > 0; else I → 0
export function sisSolution(
  t: number,
  beta: number,
  gamma: number,
  N: number,
  I0: number
): { S: number; I: number } {
  const K = N - gamma / beta;
  if (K <= 0 || I0 <= 0) {
    const decay = Math.exp(-(gamma - beta * N) * t);
    const I = I0 * decay;
    return { S: N - I, I: Math.max(0, I) };
  }
  if (I0 >= N) return { S: 0, I: N };
  const denom = 1 + ((K - I0) / I0) * Math.exp(-beta * K * t);
  const I = Math.min(N, K / denom);
  return { S: N - I, I };
}

// SIR: dS/dt = -β S I, dI/dt = β S I - γ I, dR/dt = γ I. No closed form; use RK4.
function sirRhs(S: number, I: number, R: number, beta: number, gamma: number): [number, number, number] {
  const infection = beta * S * I;
  const recovery = gamma * I;
  return [-infection, infection - recovery, recovery];
}

export function sirSolution(
  t: number,
  beta: number,
  gamma: number,
  S0: number,
  I0: number,
  R0: number,
  dt: number = 0.01
): { S: number; I: number; R: number } {
  let S = Math.max(0, S0);
  let I = Math.max(0, I0);
  let R = Math.max(0, R0);
  let time = 0;
  while (time < t) {
    const step = Math.min(dt, t - time);
    const [dS1, dI1, dR1] = sirRhs(S, I, R, beta, gamma);
    const [dS2, dI2, dR2] = sirRhs(S + (step / 2) * dS1, I + (step / 2) * dI1, R + (step / 2) * dR1, beta, gamma);
    const [dS3, dI3, dR3] = sirRhs(S + (step / 2) * dS2, I + (step / 2) * dI2, R + (step / 2) * dR2, beta, gamma);
    const [dS4, dI4, dR4] = sirRhs(S + step * dS3, I + step * dI3, R + step * dR3, beta, gamma);
    S = Math.max(0, S + (step / 6) * (dS1 + 2 * dS2 + 2 * dS3 + dS4));
    I = Math.max(0, I + (step / 6) * (dI1 + 2 * dI2 + 2 * dI3 + dI4));
    R = Math.max(0, R + (step / 6) * (dR1 + 2 * dR2 + 2 * dR3 + dR4));
    time += step;
  }
  return { S, I, R };
}

export function getEpidemicCurvePoints(
  model: EpidemicModelType,
  params: EpidemicParams,
  tMax: number,
  numPoints: number = 200
): EpidemicCurves {
  const points: EpidemicCurves = { S: [], I: [] };
  const { beta, N, I0 } = params;
  const gamma = params.gamma ?? 0.2;
  const S0 = params.S0 ?? Math.max(0, N - I0);
  const R0 = params.R0 ?? 0;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * tMax;
    if (model === 'si') {
      const { S, I } = siSolution(t, beta, N, I0);
      points.S.push([t, S]);
      points.I.push([t, I]);
    } else if (model === 'sis') {
      const { S, I } = sisSolution(t, beta, gamma, N, I0);
      points.S.push([t, S]);
      points.I.push([t, I]);
    } else {
      const { S, I, R } = sirSolution(t, beta, gamma, S0, I0, R0);
      points.S.push([t, S]);
      points.I.push([t, I]);
      if (!points.R) points.R = [];
      points.R.push([t, R]);
    }
  }
  return points;
}

export function epidemicCompartmentAtTime(
  model: EpidemicModelType,
  params: EpidemicParams,
  t: number,
  compartment: 'S' | 'I' | 'R'
): number {
  const { beta, N, I0 } = params;
  const gamma = params.gamma ?? 0.2;
  const S0 = params.S0 ?? Math.max(0, N - I0);
  const R0 = params.R0 ?? 0;

  if (model === 'si') {
    const { S, I } = siSolution(t, beta, N, I0);
    return compartment === 'S' ? S : I;
  }
  if (model === 'sis') {
    const { S, I } = sisSolution(t, beta, gamma, N, I0);
    return compartment === 'S' ? S : I;
  }
  const { S, I, R } = sirSolution(t, beta, gamma, S0, I0, R0);
  return compartment === 'S' ? S : compartment === 'I' ? I : R;
}

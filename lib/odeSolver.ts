export type SystemType = 
  | 'spiral' 
  | 'saddle' 
  | 'center' 
  | 'vanDerPol'
  | 'lotkaVolterra'
  | 'duffing'
  | 'pendulum'
  | 'node'
  | 'focus';

export type Point = [number, number];

export type SystemParameters = {
  vanDerPol?: { mu: number };
  lotkaVolterra?: { alpha: number; beta: number; delta: number; gamma: number };
  duffing?: { delta: number };
  pendulum?: { delta: number };
  spiral?: { a: number; b: number };
  focus?: { a: number; b: number };
};

// Default parameters for each system
export const defaultParameters: SystemParameters = {
  vanDerPol: { mu: 0.5 },
  lotkaVolterra: { alpha: 1.0, beta: 0.5, delta: 0.5, gamma: 0.5 },
  duffing: { delta: 0.1 },
  pendulum: { delta: 0.1 },
  spiral: { a: -1, b: -1 },
  focus: { a: 1, b: 1 },
};

// Get parameter definitions for each system
export function getSystemParameters(systemType: SystemType): Array<{
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}> {
  switch (systemType) {
    case 'vanDerPol':
      return [
        { key: 'mu', label: 'μ (mu)', min: 0, max: 2, step: 0.1, defaultValue: 0.5 },
      ];
    case 'lotkaVolterra':
      return [
        { key: 'alpha', label: 'α (alpha)', min: 0.1, max: 2, step: 0.1, defaultValue: 1.0 },
        { key: 'beta', label: 'β (beta)', min: 0.1, max: 2, step: 0.1, defaultValue: 0.5 },
        { key: 'delta', label: 'δ (delta)', min: 0.1, max: 2, step: 0.1, defaultValue: 0.5 },
        { key: 'gamma', label: 'γ (gamma)', min: 0.1, max: 2, step: 0.1, defaultValue: 0.5 },
      ];
    case 'duffing':
      return [
        { key: 'delta', label: 'δ (damping)', min: 0, max: 1, step: 0.05, defaultValue: 0.1 },
      ];
    case 'pendulum':
      return [
        { key: 'delta', label: 'δ (damping)', min: 0, max: 1, step: 0.05, defaultValue: 0.1 },
      ];
    case 'spiral':
      return [
        { key: 'a', label: 'a (real part)', min: -2, max: 0, step: 0.1, defaultValue: -1 },
        { key: 'b', label: 'b (imaginary part)', min: -2, max: 2, step: 0.1, defaultValue: -1 },
      ];
    case 'focus':
      return [
        { key: 'a', label: 'a (real part)', min: 0, max: 2, step: 0.1, defaultValue: 1 },
        { key: 'b', label: 'b (imaginary part)', min: -2, max: 2, step: 0.1, defaultValue: 1 },
      ];
    default:
      return [];
  }
}

// Vector field function: returns [dx/dt, dy/dt]
export function vectorField(
  systemType: SystemType, 
  x: number, 
  y: number,
  parameters?: SystemParameters
): [number, number] {
  switch (systemType) {
    case 'spiral': {
      // Spiral: dx/dt = ax - by, dy/dt = bx + ay
      const a = parameters?.spiral?.a ?? -1;
      const b = parameters?.spiral?.b ?? -1;
      return [a * x - b * y, b * x + a * y];
    }
    
    case 'saddle':
      // Saddle point: dx/dt = x, dy/dt = -y
      return [x, -y];
    
    case 'center':
      // Center: dx/dt = -y, dy/dt = x (harmonic oscillator)
      return [-y, x];
    
    case 'vanDerPol': {
      // Van der Pol oscillator: dx/dt = y, dy/dt = -x + μ(1 - x²)y
      const mu = parameters?.vanDerPol?.mu ?? 0.5;
      return [y, -x + mu * (1 - x * x) * y];
    }
    
    case 'lotkaVolterra': {
      // Lotka-Volterra (predator-prey): dx/dt = x(α - βy), dy/dt = y(δx - γ)
      const alpha = parameters?.lotkaVolterra?.alpha ?? 1.0;
      const beta = parameters?.lotkaVolterra?.beta ?? 0.5;
      const delta = parameters?.lotkaVolterra?.delta ?? 0.5;
      const gamma = parameters?.lotkaVolterra?.gamma ?? 0.5;
      return [x * (alpha - beta * y), y * (delta * x - gamma)];
    }
    
    case 'duffing': {
      // Duffing oscillator: dx/dt = y, dy/dt = -x - x³ - δy
      const delta = parameters?.duffing?.delta ?? 0.1;
      return [y, -x - x * x * x - delta * y];
    }
    
    case 'pendulum': {
      // Damped pendulum: dx/dt = y, dy/dt = -sin(x) - δy
      const delta = parameters?.pendulum?.delta ?? 0.1;
      return [y, -Math.sin(x) - delta * y];
    }
    
    case 'node':
      // Stable node: dx/dt = -2x, dy/dt = -y
      return [-2 * x, -y];
    
    case 'focus': {
      // Unstable focus: dx/dt = ax - by, dy/dt = bx + ay
      const a = parameters?.focus?.a ?? 1;
      const b = parameters?.focus?.b ?? 1;
      return [a * x - b * y, b * x + a * y];
    }
    
    default:
      return [0, 0];
  }
}

// Runge-Kutta 4th order method for solving ODE
export function solveODE(
  systemType: SystemType,
  initialPoint: Point,
  time: number,
  dt: number = 0.01,
  parameters?: SystemParameters
): Array<Point> {
  const trajectory: Array<Point> = [initialPoint];
  let [x, y] = initialPoint;
  let t = 0;

  while (t < time) {
    const k1 = vectorField(systemType, x, y, parameters);
    const k2 = vectorField(systemType, x + dt * k1[0] / 2, y + dt * k1[1] / 2, parameters);
    const k3 = vectorField(systemType, x + dt * k2[0] / 2, y + dt * k2[1] / 2, parameters);
    const k4 = vectorField(systemType, x + dt * k3[0], y + dt * k3[1], parameters);

    x = x + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    y = y + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);

    trajectory.push([x, y]);
    t += dt;
  }

  return trajectory;
}

// Evolution operator: maps initial point to point at time t
export function evolutionOperator(
  systemType: SystemType,
  initialPoint: Point,
  time: number,
  parameters?: SystemParameters
): Point {
  const trajectory = solveODE(systemType, initialPoint, time, 0.01, parameters);
  return trajectory[trajectory.length - 1] || initialPoint;
}

// Analytical solution functions
export function analyticalSolution(
  systemType: SystemType,
  initialPoint: Point,
  time: number,
  parameters?: SystemParameters
): Point {
  const [x0, y0] = initialPoint;
  const t = time;

  switch (systemType) {
    case 'center':
      // Solution: x(t) = x₀ cos(t) - y₀ sin(t), y(t) = x₀ sin(t) + y₀ cos(t)
      return [
        x0 * Math.cos(t) - y0 * Math.sin(t),
        x0 * Math.sin(t) + y0 * Math.cos(t)
      ];

    case 'spiral': {
      // Solution: x(t) = e^(at)(x₀ cos(bt) - y₀ sin(bt)), y(t) = e^(at)(x₀ sin(bt) + y₀ cos(bt))
      const a = parameters?.spiral?.a ?? -1;
      const b = parameters?.spiral?.b ?? -1;
      const expFactor = Math.exp(a * t);
      return [
        expFactor * (x0 * Math.cos(b * t) - y0 * Math.sin(b * t)),
        expFactor * (x0 * Math.sin(b * t) + y0 * Math.cos(b * t))
      ];
    }

    case 'saddle':
      // Solution: x(t) = x₀ e^t, y(t) = y₀ e^(-t)
      return [
        x0 * Math.exp(t),
        y0 * Math.exp(-t)
      ];

    case 'focus': {
      // Solution: x(t) = e^(at)(x₀ cos(bt) - y₀ sin(bt)), y(t) = e^(at)(x₀ sin(bt) + y₀ cos(bt))
      const a = parameters?.focus?.a ?? 1;
      const b = parameters?.focus?.b ?? 1;
      const expFactor = Math.exp(a * t);
      return [
        expFactor * (x0 * Math.cos(b * t) - y0 * Math.sin(b * t)),
        expFactor * (x0 * Math.sin(b * t) + y0 * Math.cos(b * t))
      ];
    }

    case 'vanDerPol':
    case 'lotkaVolterra':
    case 'duffing':
    case 'pendulum':
    case 'node':
      // These systems don't have simple closed-form solutions
      // Return numerical solution instead
      return evolutionOperator(systemType, initialPoint, time, parameters);

    default:
      return initialPoint;
  }
}

// Get solution function as LaTeX string for display
export function getSolutionFunction(systemType: SystemType, parameters?: SystemParameters): string {
  switch (systemType) {
    case 'center':
      return '\\begin{aligned} x(t) &= x_0 \\cos(t) - y_0 \\sin(t) \\\\ y(t) &= x_0 \\sin(t) + y_0 \\cos(t) \\end{aligned}';
    
    case 'spiral': {
      const a = parameters?.spiral?.a ?? -1;
      const b = parameters?.spiral?.b ?? -1;
      return `\\begin{aligned} x(t) &= e^{${a.toFixed(1)}t}(x_0 \\cos(${b.toFixed(1)}t) - y_0 \\sin(${b.toFixed(1)}t)) \\\\ y(t) &= e^{${a.toFixed(1)}t}(x_0 \\sin(${b.toFixed(1)}t) + y_0 \\cos(${b.toFixed(1)}t)) \\end{aligned}`;
    }
    
    case 'saddle':
      return '\\begin{aligned} x(t) &= x_0 e^{t} \\\\ y(t) &= y_0 e^{-t} \\end{aligned}';
    
    case 'focus': {
      const a = parameters?.focus?.a ?? 1;
      const b = parameters?.focus?.b ?? 1;
      return `\\begin{aligned} x(t) &= e^{${a.toFixed(1)}t}(x_0 \\cos(${b.toFixed(1)}t) - y_0 \\sin(${b.toFixed(1)}t)) \\\\ y(t) &= e^{${a.toFixed(1)}t}(x_0 \\sin(${b.toFixed(1)}t) + y_0 \\cos(${b.toFixed(1)}t)) \\end{aligned}`;
    }
    
    case 'vanDerPol':
    case 'lotkaVolterra':
    case 'duffing':
    case 'pendulum':
    case 'node':
      return '\\text{No closed-form solution} \\\\ \\text{(Solved numerically)}';
    
    default:
      return '';
  }
}

// Get equation as LaTeX string
export function getEquationLatex(systemType: SystemType, parameters?: SystemParameters): string {
  switch (systemType) {
    case 'spiral': {
      const a = parameters?.spiral?.a ?? -1;
      const b = parameters?.spiral?.b ?? -1;
      return `\\begin{aligned} \\dot{x} &= ${a.toFixed(1)}x - ${b.toFixed(1)}y \\\\ \\dot{y} &= ${b.toFixed(1)}x + ${a.toFixed(1)}y \\end{aligned}`;
    }
    
    case 'saddle':
      return '\\begin{aligned} \\dot{x} &= x \\\\ \\dot{y} &= -y \\end{aligned}';
    
    case 'center':
      return '\\begin{aligned} \\dot{x} &= -y \\\\ \\dot{y} &= x \\end{aligned}';
    
    case 'vanDerPol': {
      const mu = parameters?.vanDerPol?.mu ?? 0.5;
      return `\\begin{aligned} \\dot{x} &= y \\\\ \\dot{y} &= -x + ${mu.toFixed(1)}(1-x^2)y \\end{aligned}`;
    }
    
    case 'lotkaVolterra': {
      const alpha = parameters?.lotkaVolterra?.alpha ?? 1.0;
      const beta = parameters?.lotkaVolterra?.beta ?? 0.5;
      const delta = parameters?.lotkaVolterra?.delta ?? 0.5;
      const gamma = parameters?.lotkaVolterra?.gamma ?? 0.5;
      return `\\begin{aligned} \\dot{x} &= x(${alpha.toFixed(1)} - ${beta.toFixed(1)}y) \\\\ \\dot{y} &= y(${delta.toFixed(1)}x - ${gamma.toFixed(1)}) \\end{aligned}`;
    }
    
    case 'duffing': {
      const delta = parameters?.duffing?.delta ?? 0.1;
      return `\\begin{aligned} \\dot{x} &= y \\\\ \\dot{y} &= -x - x^3 - ${delta.toFixed(2)}y \\end{aligned}`;
    }
    
    case 'pendulum': {
      const delta = parameters?.pendulum?.delta ?? 0.1;
      return `\\begin{aligned} \\dot{x} &= y \\\\ \\dot{y} &= -\\sin(x) - ${delta.toFixed(2)}y \\end{aligned}`;
    }
    
    case 'node':
      return '\\begin{aligned} \\dot{x} &= -2x \\\\ \\dot{y} &= -y \\end{aligned}';
    
    case 'focus': {
      const a = parameters?.focus?.a ?? 1;
      const b = parameters?.focus?.b ?? 1;
      return `\\begin{aligned} \\dot{x} &= ${a.toFixed(1)}x - ${b.toFixed(1)}y \\\\ \\dot{y} &= ${b.toFixed(1)}x + ${a.toFixed(1)}y \\end{aligned}`;
    }
    
    default:
      return '';
  }
}

// Fixed point types
export type FixedPointType = 
  | 'stable-node' 
  | 'unstable-node' 
  | 'saddle' 
  | 'stable-spiral' 
  | 'unstable-spiral' 
  | 'center';

export interface FixedPoint {
  x: number;
  y: number;
  type: FixedPointType;
  eigenvalues: [number, number] | [number, number, number, number]; // [real1, imag1, real2, imag2] or [real1, real2] if both real
  stability: 'stable' | 'unstable' | 'semi-stable';
}

// Compute Jacobian matrix at a point
function computeJacobian(
  systemType: SystemType,
  x: number,
  y: number,
  parameters?: SystemParameters
): [[number, number], [number, number]] {
  const eps = 1e-6;
  
  // Compute partial derivatives using finite differences
  const [fx1, fy1] = vectorField(systemType, x + eps, y, parameters);
  const [fx2, fy2] = vectorField(systemType, x - eps, y, parameters);
  const [fx3, fy3] = vectorField(systemType, x, y + eps, parameters);
  const [fx4, fy4] = vectorField(systemType, x, y - eps, parameters);
  
  const dfx_dx = (fx1 - fx2) / (2 * eps);
  const dfx_dy = (fx3 - fx4) / (2 * eps);
  const dfy_dx = (fy1 - fy2) / (2 * eps);
  const dfy_dy = (fy3 - fy4) / (2 * eps);
  
  return [[dfx_dx, dfx_dy], [dfy_dx, dfy_dy]];
}

// Compute eigenvalues of a 2x2 matrix
function computeEigenvalues(jacobian: [[number, number], [number, number]]): [number, number] | [number, number, number, number] {
  const [[a, b], [c, d]] = jacobian;
  
  // Trace and determinant
  const trace = a + d;
  const det = a * d - b * c;
  
  // Discriminant
  const discriminant = trace * trace - 4 * det;
  
  if (discriminant >= 0) {
    // Real eigenvalues
    const sqrtD = Math.sqrt(discriminant);
    const lambda1 = (trace + sqrtD) / 2;
    const lambda2 = (trace - sqrtD) / 2;
    return [lambda1, lambda2];
  } else {
    // Complex eigenvalues
    const real = trace / 2;
    const imag = Math.sqrt(-discriminant) / 2;
    return [real, imag, real, -imag];
  }
}

// Classify fixed point based on eigenvalues
function classifyFixedPoint(eigenvalues: [number, number] | [number, number, number, number]): {
  type: FixedPointType;
  stability: 'stable' | 'unstable' | 'semi-stable';
} {
  if (eigenvalues.length === 2) {
    // Real eigenvalues
    const [lambda1, lambda2] = eigenvalues;
    const eps = 1e-6;
    
    if (Math.abs(lambda1) < eps && Math.abs(lambda2) < eps) {
      return { type: 'center', stability: 'semi-stable' };
    }
    
    if (lambda1 * lambda2 < 0) {
      return { type: 'saddle', stability: 'unstable' };
    }
    
    if (lambda1 < 0 && lambda2 < 0) {
      return { type: 'stable-node', stability: 'stable' };
    }
    
    if (lambda1 > 0 && lambda2 > 0) {
      return { type: 'unstable-node', stability: 'unstable' };
    }
    
    return { type: 'center', stability: 'semi-stable' };
  } else {
    // Complex eigenvalues
    const [real1, imag1, real2, imag2] = eigenvalues;
    const eps = 1e-6;
    
    if (Math.abs(real1) < eps) {
      return { type: 'center', stability: 'semi-stable' };
    }
    
    if (real1 < 0) {
      return { type: 'stable-spiral', stability: 'stable' };
    }
    
    return { type: 'unstable-spiral', stability: 'unstable' };
  }
}

// Check if a point is a fixed point
function isFixedPoint(
  systemType: SystemType,
  x: number,
  y: number,
  parameters: SystemParameters | undefined,
  tolerance: number = 1e-4
): boolean {
  const [fx, fy] = vectorField(systemType, x, y, parameters);
  const magnitude = Math.sqrt(fx * fx + fy * fy);
  return magnitude < tolerance;
}

// Find fixed points using grid search and Newton-Raphson refinement
export function findFixedPoints(
  systemType: SystemType,
  parameters?: SystemParameters,
  searchRange: { minX: number; maxX: number; minY: number; maxY: number } = { minX: -5, maxX: 5, minY: -5, maxY: 5 },
  gridSize: number = 20
): FixedPoint[] {
  const fixedPoints: FixedPoint[] = [];
  const tolerance = 1e-4; // Relaxed tolerance
  const maxIterations = 50;
  const seenPoints = new Set<string>();
  
  // Helper to add a fixed point if it's valid and not seen
  const addFixedPoint = (x: number, y: number) => {
    const [fx, fy] = vectorField(systemType, x, y, parameters);
    const magnitude = Math.sqrt(fx * fx + fy * fy);
    
    // Use a more lenient check - if magnitude is very small, it's a fixed point
    if (magnitude >= tolerance) {
      return;
    }
    
    const key = `${Math.round(x * 1000) / 1000},${Math.round(y * 1000) / 1000}`;
    if (seenPoints.has(key)) return;
    
    seenPoints.add(key);
    
    // Compute Jacobian and classify
    const jacobian = computeJacobian(systemType, x, y, parameters);
    const eigenvalues = computeEigenvalues(jacobian);
    const { type, stability } = classifyFixedPoint(eigenvalues);
    
    fixedPoints.push({
      x,
      y,
      type,
      eigenvalues,
      stability,
    });
  };
  
  // First, check known fixed points explicitly
  // Most systems have a fixed point at the origin - always check it
  // Always check origin regardless of search range (it's the most common fixed point)
  const [fx0, fy0] = vectorField(systemType, 0, 0, parameters);
  const mag0 = Math.sqrt(fx0 * fx0 + fy0 * fy0);
  if (mag0 < tolerance) {
    const key = '0,0';
    if (!seenPoints.has(key)) {
      seenPoints.add(key);
      const jacobian = computeJacobian(systemType, 0, 0, parameters);
      const eigenvalues = computeEigenvalues(jacobian);
      const { type, stability } = classifyFixedPoint(eigenvalues);
      fixedPoints.push({
        x: 0,
        y: 0,
        type,
        eigenvalues,
        stability,
      });
    }
  }
  
  // For Lotka-Volterra, check the non-trivial fixed point
  if (systemType === 'lotkaVolterra' && parameters?.lotkaVolterra) {
    const { alpha, beta, delta, gamma } = parameters.lotkaVolterra;
    if (delta > 1e-6 && beta > 1e-6) {
      const xFP = gamma / delta;
      const yFP = alpha / beta;
      if (xFP >= searchRange.minX && xFP <= searchRange.maxX &&
          yFP >= searchRange.minY && yFP <= searchRange.maxY) {
        addFixedPoint(xFP, yFP);
      }
    }
  }
  
  // For Pendulum, check fixed points at multiples of π
  if (systemType === 'pendulum') {
    for (let n = -3; n <= 3; n++) {
      const xFP = n * Math.PI;
      if (xFP >= searchRange.minX && xFP <= searchRange.maxX) {
        addFixedPoint(xFP, 0);
      }
    }
  }
  
  // Grid search for other fixed points
  const stepX = (searchRange.maxX - searchRange.minX) / gridSize;
  const stepY = (searchRange.maxY - searchRange.minY) / gridSize;
  
  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      let x = searchRange.minX + i * stepX;
      let y = searchRange.minY + j * stepY;
      
      // Skip if we already checked this point
      const key = `${Math.round(x * 1000) / 1000},${Math.round(y * 1000) / 1000}`;
      if (seenPoints.has(key)) continue;
      
      // Newton-Raphson refinement
      for (let iter = 0; iter < maxIterations; iter++) {
        const [fx, fy] = vectorField(systemType, x, y, parameters);
        const magnitude = Math.sqrt(fx * fx + fy * fy);
        
        if (magnitude < tolerance) {
          addFixedPoint(x, y);
          break;
        }
        
        // Newton step
        const jacobian = computeJacobian(systemType, x, y, parameters);
        const [[a, b], [c, d]] = jacobian;
        const det = a * d - b * c;
        
        if (Math.abs(det) < 1e-10) break; // Singular Jacobian
        
        const dx = -(d * fx - b * fy) / det;
        const dy = -(-c * fx + a * fy) / det;
        
        // Limit step size to prevent divergence
        const stepLimit = 0.5;
        const dxLimited = Math.abs(dx) > stepLimit ? (dx > 0 ? stepLimit : -stepLimit) : dx;
        const dyLimited = Math.abs(dy) > stepLimit ? (dy > 0 ? stepLimit : -stepLimit) : dy;
        
        x += dxLimited;
        y += dyLimited;
        
        // Check if we've gone outside reasonable bounds
        if (x < searchRange.minX - 2 || x > searchRange.maxX + 2 ||
            y < searchRange.minY - 2 || y > searchRange.maxY + 2) {
          break;
        }
      }
    }
  }
  
  return fixedPoints;
}

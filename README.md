# Dynamical Systems Visualizer

An interactive web application for visualizing flows and evolution operators in dynamical systems, designed for teaching ODE to 3rd year BSc mathematics students.

## Features

- **Vector Field Visualization**: See the direction and magnitude of the vector field at each point
- **Flow Lines (Trajectories)**: Observe how solutions evolve over time from different initial conditions
- **Evolution Operator**: Visualize how the evolution operator maps initial points to their positions at time t
- **Multiple Systems**: Explore different types of dynamical systems:
  - Linear systems
  - Spiral sinks/sources
  - Saddle points
  - Centers (harmonic oscillators)
  - Van der Pol oscillator
- **Interactive Controls**: 
  - Time slider to control the evolution
  - Play/pause animation
  - Click to add initial points
  - Toggle different visualization elements

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Educational Use

This visualizer helps students understand:

1. **Vector Fields**: The geometric representation of a system of ODEs
2. **Flows**: How solutions evolve in phase space
3. **Evolution Operators**: The mapping φ(t,·): x(0) → x(t) that describes how initial conditions evolve
4. **Phase Portraits**: The overall structure of solutions in phase space

### How to Use

1. **Select a System**: Choose a dynamical system from the right panel
2. **Add Initial Points**: Click anywhere on the canvas to add initial conditions
3. **Control Time**: Use the slider or play button to see how points evolve
4. **Toggle Visualizations**: Show/hide vector fields, flow lines, or evolution operators
5. **Observe**: 
   - Blue arrows show the vector field
   - Red curves show trajectories (flow lines)
   - Green dots are initial points
   - Orange dots are evolved points at the current time
   - Purple dashed lines show the evolution operator mapping

## Technical Details

- Built with **Next.js 16** and **React 19**
- Uses **TypeScript** for type safety
- **Runge-Kutta 4th order** method for numerical integration
- **SVG** for smooth, scalable visualizations
- **Tailwind CSS** for modern styling

## Project Structure

```
ode/
├── app/
│   ├── page.tsx              # Main page
│   └── layout.tsx            # Root layout
├── components/
│   ├── DynamicalSystemVisualizer.tsx  # Main visualizer component
│   ├── VectorField.tsx        # Vector field rendering
│   ├── FlowLines.tsx          # Trajectory rendering
│   ├── EvolutionOperator.tsx  # Evolution operator visualization
│   ├── SystemSelector.tsx    # System selection UI
│   └── ControlPanel.tsx      # Control panel UI
└── lib/
    └── odeSolver.ts          # ODE solving utilities
```

## Mathematical Background

A dynamical system is defined by:
- **Vector Field**: f(x) = (f₁(x), f₂(x), ...) where ẋ = f(x)
- **Flow**: φ(t, x₀) = x(t) where x(0) = x₀
- **Evolution Operator**: The mapping φ(t,·) that takes initial conditions to their state at time t

The visualizer numerically integrates the ODE using the Runge-Kutta method to compute trajectories and visualize the evolution operator.

'use client';

import { useState } from 'react';
import { BlockMath, InlineMath } from './MathDisplay';

export function TheorySection() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left mb-4"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Mathematical Concepts
        </h2>
        <span className="text-2xl text-slate-600 dark:text-slate-400">
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-6 text-slate-700 dark:text-slate-300">
          {/* Flows Section */}
          <section>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span className="text-red-500">●</span>
              Flows
            </h3>
            <div className="pl-6 space-y-2">
              <p>
                A <strong>flow</strong> (or <em>solution flow</em>) is a fundamental concept in dynamical systems that describes how solutions evolve over time.
              </p>
              <p>
                Given a system of ordinary differential equations:
              </p>
              <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg my-3 flex justify-center">
                <BlockMath math="\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}), \quad \mathbf{x} \in \mathbb{R}^n" />
              </div>
              <p>
                The flow <InlineMath math="\phi(t, \mathbf{x})" /> is a function that maps an initial condition <InlineMath math="\mathbf{x}_0" /> to its state at time <InlineMath math="t" />:
              </p>
              <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg my-3 flex justify-center">
                <BlockMath math="\phi(t, \mathbf{x}_0) = \mathbf{x}(t), \quad \text{where } \mathbf{x}(0) = \mathbf{x}_0" />
              </div>
              <p>
                <strong>Key properties:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><InlineMath math="\phi(0, \mathbf{x}) = \mathbf{x}" /> (identity at <InlineMath math="t = 0" />)</li>
                <li><InlineMath math="\phi(s+t, \mathbf{x}) = \phi(s, \phi(t, \mathbf{x}))" /> (group property)</li>
                <li>Flow lines (trajectories) are curves in phase space traced by solutions</li>
              </ul>
              <p className="mt-3">
                In the visualization, <span className="text-red-600 dark:text-red-400 font-semibold">red curves</span> represent flow lines—the paths that solutions follow in phase space.
              </p>
            </div>
          </section>

          {/* Evolution Operator Section */}
          <section>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span className="text-purple-500">●</span>
              Evolution Operators
            </h3>
            <div className="pl-6 space-y-2">
              <p>
                An <strong>evolution operator</strong> (also called a <em>time-t map</em> or <em>solution operator</em>) is the mathematical object that describes how initial conditions evolve forward in time.
              </p>
              <p>
                For a fixed time <InlineMath math="t" />, the evolution operator <InlineMath math="U(t)" /> is defined as:
              </p>
              <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg my-3 flex justify-center">
                <BlockMath math="U(t): \mathbf{x}_0 \mapsto \mathbf{x}(t) = \phi(t, \mathbf{x}_0)" />
              </div>
              <p>
                <strong>Important characteristics:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><InlineMath math="U(0)" /> is the identity operator (no evolution at <InlineMath math="t = 0" />)</li>
                <li><InlineMath math="U(t)" /> maps the entire phase space to itself</li>
                <li>For autonomous systems, <InlineMath math="U(t)" /> forms a one-parameter group</li>
                <li>The evolution operator preserves the structure of the phase space</li>
              </ul>
              <p className="mt-3">
                In the visualization:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><span className="text-green-600 dark:text-green-400 font-semibold">Green dots</span> represent initial points <InlineMath math="\mathbf{x}_0" /></li>
                <li><span className="text-orange-600 dark:text-orange-400 font-semibold">Orange dots</span> represent evolved points <InlineMath math="U(t)(\mathbf{x}_0) = \mathbf{x}(t)" /></li>
                <li><span className="text-purple-600 dark:text-purple-400 font-semibold">Purple dashed lines</span> show the mapping from initial to evolved points</li>
              </ul>
              <p className="mt-3">
                By adjusting the time slider, you can observe how the evolution operator transforms the phase space, showing how different regions evolve under the flow.
              </p>
            </div>
          </section>

          {/* Connection Section */}
          <section className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Relationship Between Flows and Evolution Operators
            </h3>
            <div className="pl-6 space-y-2">
              <p>
                The flow and evolution operator are closely related concepts:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>The <strong>flow</strong> <InlineMath math="\phi(t, \mathbf{x})" /> describes the <em>process</em> of evolution over time</li>
                <li>The <strong>evolution operator</strong> <InlineMath math="U(t)" /> describes the <em>result</em> of that evolution at a specific time</li>
                <li>For each fixed <InlineMath math="t" />, <InlineMath math="U(t)(\mathbf{x}) = \phi(t, \mathbf{x})" /> as a function on phase space</li>
                <li>Flow lines show the continuous evolution, while the evolution operator shows discrete snapshots</li>
              </ul>
              <p className="mt-3 italic text-slate-600 dark:text-slate-400">
                Together, they provide both the continuous and discrete perspectives on how dynamical systems evolve.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

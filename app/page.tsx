'use client';

import DynamicalSystemVisualizer from '@/components/DynamicalSystemVisualizer';
import { TheorySection } from '@/components/TheorySection';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Dynamical Systems Visualizer
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Understanding Flows and Evolution Operators
          </p>
        </header>
        <TheorySection />
        <DynamicalSystemVisualizer />
      </div>
    </div>
  );
}

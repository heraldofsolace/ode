'use client';

import EpidemicModelVisualizer from '@/components/EpidemicModelVisualizer';

export default function EpidemicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Epidemic modelling
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Compartmental models: SI, SIS, and SIR (Kermack–McKendrick)
          </p>
        </header>
        <EpidemicModelVisualizer />
      </div>
    </div>
  );
}

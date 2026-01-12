'use client';

interface ControlPanelProps {
  time: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  showVectorField: boolean;
  onToggleVectorField: () => void;
  showFlowLines: boolean;
  onToggleFlowLines: () => void;
  showEvolution: boolean;
  onToggleEvolution: () => void;
  showFixedPoints: boolean;
  onToggleFixedPoints: () => void;
  onClearPoints: () => void;
}

export function ControlPanel({
  time,
  onTimeChange,
  isPlaying,
  onPlayPause,
  onReset,
  showVectorField,
  onToggleVectorField,
  showFlowLines,
  onToggleFlowLines,
  showEvolution,
  onToggleEvolution,
  showFixedPoints,
  onToggleFixedPoints,
  onClearPoints,
}: ControlPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Controls
      </h2>

      {/* Time control */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Time: {time.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.01"
          value={time}
          onChange={(e) => onTimeChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Play/Pause/Reset buttons */}
      <div className="flex gap-2">
        <button
          onClick={onPlayPause}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          ↺ Reset
        </button>
      </div>

      {/* Visualization toggles */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Visualization Options
        </h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showVectorField}
            onChange={onToggleVectorField}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Vector Field
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showFlowLines}
            onChange={onToggleFlowLines}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Flow Lines (Trajectories)
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showEvolution}
            onChange={onToggleEvolution}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Evolution Operator
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showFixedPoints}
            onChange={onToggleFixedPoints}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Fixed Points
          </span>
        </label>
      </div>

      {/* Clear points button */}
      <button
        onClick={onClearPoints}
        className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
      >
        Clear Points
      </button>

      {/* Educational info */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Understanding the Visualization
        </h3>
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p>
            <strong className="text-blue-600 dark:text-blue-400">Blue arrows:</strong> Vector field showing direction and magnitude
          </p>
          <p>
            <strong className="text-red-600 dark:text-red-400">Red curves:</strong> Flow lines (trajectories) from initial points
          </p>
          <p>
            <strong className="text-green-600 dark:text-green-400">Green dots:</strong> Initial points
          </p>
          <p>
            <strong className="text-orange-600 dark:text-orange-400">Orange dots:</strong> Evolved points at current time
          </p>
          <p>
            <strong className="text-purple-600 dark:text-purple-400">Purple lines:</strong> Evolution operator mapping
          </p>
        </div>
      </div>
    </div>
  );
}


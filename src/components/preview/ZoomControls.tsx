"use client";

const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5] as const;
type ZoomStep = (typeof ZOOM_STEPS)[number];

interface ZoomControlsProps {
  zoom: number;
  onChange: (zoom: number) => void;
}

export default function ZoomControls({ zoom, onChange }: ZoomControlsProps) {
  const currentIndex = ZOOM_STEPS.indexOf(zoom as ZoomStep);
  const canDecrease = currentIndex > 0;
  const canIncrease = currentIndex < ZOOM_STEPS.length - 1;
  const isDefault = zoom === 1.0;

  function decrease() {
    if (canDecrease) onChange(ZOOM_STEPS[currentIndex - 1]);
  }

  function increase() {
    if (canIncrease) onChange(ZOOM_STEPS[currentIndex + 1]);
  }

  const label = currentIndex !== -1 ? `${Math.round(zoom * 100)}%` : `${Math.round(zoom * 100)}%`;

  return (
    <div className="flex items-center gap-0.5 bg-white/90 border border-gray-200 rounded-full shadow-sm px-1.5 py-1 backdrop-blur-sm">
      {/* Zoom out */}
      <button
        type="button"
        onClick={decrease}
        disabled={!canDecrease}
        aria-label="Zoom out"
        className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <MinusIcon />
      </button>

      {/* Level display */}
      <span className="text-xs font-semibold text-gray-600 tabular-nums w-9 text-center select-none">
        {label}
      </span>

      {/* Zoom in */}
      <button
        type="button"
        onClick={increase}
        disabled={!canIncrease}
        aria-label="Zoom in"
        className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <PlusIcon />
      </button>

      {/* Divider */}
      <div className="h-3.5 w-px bg-gray-200 mx-0.5" />

      {/* Reset to 100% (fit) */}
      <button
        type="button"
        onClick={() => onChange(1.0)}
        disabled={isDefault}
        aria-label="Reset zoom to 100%"
        className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Reset to 100%"
      >
        <ResetIcon />
      </button>
    </div>
  );
}

function MinusIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

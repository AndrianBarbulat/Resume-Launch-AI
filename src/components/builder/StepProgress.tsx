"use client";

export interface StepDef {
  label: string;
}

interface StepProgressProps {
  steps: StepDef[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (index: number) => void;
}

export default function StepProgress({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepProgressProps) {
  return (
    <nav aria-label="Resume builder progress">
      {/* ── Desktop ── */}
      <ol className="hidden sm:flex items-start">
        {steps.map((step, i) => {
          const done = completedSteps.has(i);
          const active = i === currentStep;
          const clickable = done || i < currentStep;

          return (
            <li key={i} className="flex items-center flex-1 last:flex-none">
              {/* Circle + label */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => clickable && onStepClick(i)}
                  disabled={!clickable}
                  aria-label={`Go to step ${i + 1}: ${step.label}`}
                  aria-current={active ? "step" : undefined}
                  className={[
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                    done
                      ? "bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                      : active
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950"
                      : "bg-slate-800 text-slate-500 cursor-default",
                  ].join(" ")}
                >
                  {done ? <CheckIcon /> : i + 1}
                </button>
                <span
                  className={[
                    "mt-1.5 text-xs text-center w-16 leading-tight hidden lg:block",
                    active
                      ? "text-indigo-400 font-medium"
                      : done
                      ? "text-slate-300"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line — hidden on last item */}
              {i < steps.length - 1 && (
                <div
                  className={[
                    "flex-1 h-px mx-2 transition-colors",
                    done ? "bg-indigo-600" : "bg-slate-700",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* ── Mobile ── */}
      <div className="sm:hidden space-y-2">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={[
                "flex-1 h-1.5 rounded-full transition-all",
                i < currentStep
                  ? "bg-indigo-600"
                  : i === currentStep
                  ? "bg-indigo-400"
                  : "bg-slate-700",
              ].join(" ")}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center">
          Step {currentStep + 1} / {steps.length} —{" "}
          <span className="text-white font-medium">{steps[currentStep].label}</span>
        </p>
      </div>
    </nav>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

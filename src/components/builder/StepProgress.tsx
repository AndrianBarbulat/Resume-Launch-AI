"use client";

import { CheckIcon } from "./icons";

export interface BuilderStep {
  label: string;
}

interface StepProgressProps {
  steps: BuilderStep[];
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
    <div className="w-full">
      {/* Desktop */}
      <ol className="hidden sm:flex items-start" aria-label="Form progress">
        {steps.map((step, i) => {
          const done = completedSteps.has(i);
          const active = i === currentStep;
          const clickable = done || i <= currentStep;
          return (
            <li key={i} className="flex-1 flex items-center">
              <div className="flex flex-col items-center min-w-0 flex-1">
                <div className="flex items-center w-full">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => clickable && onStepClick(i)}
                      disabled={!clickable}
                      aria-label={`Step ${i + 1}: ${step.label}`}
                      aria-current={active ? "step" : undefined}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                        done
                          ? "bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                          : active
                          ? "bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950"
                          : "bg-slate-800 text-slate-500 cursor-default"
                      }`}
                    >
                      {done ? <CheckIcon /> : i + 1}
                    </button>
                    <span
                      className={`mt-1.5 text-xs text-center hidden lg:block w-20 leading-tight ${
                        active
                          ? "text-indigo-400 font-medium"
                          : done
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-2 transition-colors ${
                        done ? "bg-indigo-600" : "bg-slate-700"
                      }`}
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Mobile */}
      <div className="sm:hidden">
        <div className="flex gap-1 mb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                i < currentStep
                  ? "bg-indigo-600"
                  : i === currentStep
                  ? "bg-indigo-400"
                  : "bg-slate-700"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center">
          Step {currentStep + 1} / {steps.length} —{" "}
          <span className="text-white font-medium">{steps[currentStep].label}</span>
        </p>
      </div>
    </div>
  );
}

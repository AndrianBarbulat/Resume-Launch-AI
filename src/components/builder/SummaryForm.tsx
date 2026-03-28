"use client";

import type { ResumeFormData } from "@/lib/types";

const MAX_CHARS = 500;

interface SummaryFormProps {
  data: string;
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
}

export default function SummaryForm({ data, onUpdate, errors }: SummaryFormProps) {
  const count = data.length;
  const over = count > MAX_CHARS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Professional Summary</h2>
        <p className="text-slate-400 text-sm">
          Write 2–4 sentences highlighting your experience, key skills, and career
          goals.
        </p>
      </div>

      {/* ── Textarea ─────────────────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="summary"
          className="block text-xs font-semibold text-slate-300 mb-1.5"
        >
          Summary
        </label>
        <textarea
          id="summary"
          rows={7}
          value={data}
          onChange={(e) => onUpdate({ summary: e.target.value })}
          placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications. Passionate about clean code, developer experience, and shipping products that users love."
          className={[
            "w-full bg-slate-800 border text-white placeholder-slate-500 text-sm",
            "px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500",
            "transition-colors resize-none leading-relaxed",
            errors.summary || over ? "border-red-500" : "border-slate-700",
          ].join(" ")}
        />

        {/* Counter + error row */}
        <div className="flex items-center justify-between mt-1">
          {errors.summary || over ? (
            <p className="text-red-400 text-xs">
              {errors.summary ||
                `${count - MAX_CHARS} character${count - MAX_CHARS === 1 ? "" : "s"} over the limit`}
            </p>
          ) : (
            <span />
          )}
          <span
            className={[
              "text-xs ml-auto tabular-nums",
              over ? "text-red-400" : "text-slate-500",
            ].join(" ")}
          >
            {count} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {/* ── AI button (disabled placeholder) ─────────────────────────────────── */}
      <div>
        <button
          type="button"
          disabled
          title="Coming soon"
          aria-disabled="true"
          className={[
            "inline-flex items-center gap-2 text-sm font-medium",
            "px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/50",
            "text-slate-500 cursor-not-allowed select-none",
          ].join(" ")}
        >
          <SparklesIcon />
          Improve with AI
          <span className="text-xs bg-slate-700/70 text-slate-400 px-1.5 py-0.5 rounded-md leading-none">
            Coming soon
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Icon ──────────────────────────────────────────────────────────────────────

function SparklesIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
      />
    </svg>
  );
}

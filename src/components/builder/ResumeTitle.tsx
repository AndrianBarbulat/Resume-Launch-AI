"use client";

import type { ResumeFormData } from "@/lib/types";

type Template = "modern" | "classic" | "minimal";

interface ResumeTitleProps {
  data: Pick<ResumeFormData, "title" | "template">;
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
}

const TEMPLATES: { id: Template; label: string; description: string }[] = [
  { id: "modern", label: "Modern", description: "Bold header with accent colors" },
  { id: "classic", label: "Classic", description: "Traditional centered layout" },
  { id: "minimal", label: "Minimal", description: "Clean and typography-led" },
];

export default function ResumeTitle({ data, onUpdate, errors }: ResumeTitleProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Name Your Resume</h2>
        <p className="text-slate-400 text-sm">
          Give your resume a title and pick a template.
        </p>
      </div>

      {/* ── Title input ─────────────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="resume-title"
          className="block text-xs font-semibold text-slate-300 mb-1.5"
        >
          Resume Title <span className="text-red-400">*</span>
        </label>
        <input
          id="resume-title"
          type="text"
          value={data.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="e.g. Software Engineer Resume"
          maxLength={55}
          className={[
            "w-full bg-slate-800 border text-white placeholder-slate-500 text-sm",
            "px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors",
            errors.title ? "border-red-500" : "border-slate-700",
          ].join(" ")}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title ? (
            <p className="text-red-400 text-xs">{errors.title}</p>
          ) : (
            <span />
          )}
          <span className="text-slate-500 text-xs">{data.title.length} / 50</span>
        </div>
      </div>

      {/* ── Template selector ───────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-300 mb-3">Template</p>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map((tmpl) => {
            const selected = data.template === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onUpdate({ template: tmpl.id })}
                aria-pressed={selected}
                className={[
                  "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                  selected
                    ? "border-indigo-500 bg-indigo-950/20"
                    : "border-slate-700 bg-slate-800/40 hover:border-slate-600",
                ].join(" ")}
              >
                {/* Mini document preview */}
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-slate-900 border border-slate-700/50">
                  <TemplatePreview id={tmpl.id} />
                </div>

                <div className="text-center space-y-0.5">
                  <p className="text-xs font-semibold text-white">{tmpl.label}</p>
                  <p className="text-xs text-slate-400 leading-tight">
                    {tmpl.description}
                  </p>
                </div>

                {/* Selected badge */}
                {selected && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Template preview thumbnails ──────────────────────────────────────────────

function TemplatePreview({ id }: { id: Template }) {
  if (id === "modern") {
    return (
      <div className="h-full flex flex-col">
        {/* Colored header */}
        <div className="bg-indigo-700/70 px-2.5 py-2 shrink-0">
          <div className="h-2 w-3/4 rounded-full bg-white/70 mb-1.5" />
          <div className="h-1 w-1/2 rounded-full bg-indigo-200/50" />
        </div>
        {/* Body */}
        <div className="flex-1 px-2.5 py-2 space-y-1.5">
          <div className="h-1 w-1/3 rounded-full bg-indigo-400/50" />
          <div className="h-1 w-full rounded-full bg-slate-600/40" />
          <div className="h-1 w-5/6 rounded-full bg-slate-600/40" />
          <div className="h-1 w-4/5 rounded-full bg-slate-600/40" />
          <div className="pt-1.5 h-1 w-1/3 rounded-full bg-indigo-400/50" />
          <div className="h-1 w-full rounded-full bg-slate-600/40" />
          <div className="h-1 w-2/3 rounded-full bg-slate-600/40" />
        </div>
      </div>
    );
  }

  if (id === "classic") {
    return (
      <div className="h-full px-2.5 py-2.5 space-y-2">
        {/* Centered header */}
        <div className="flex flex-col items-center gap-1 pb-1.5">
          <div className="h-2 w-2/3 rounded-full bg-slate-300/50" />
          <div className="h-1 w-1/2 rounded-full bg-slate-500/40" />
        </div>
        <div className="h-px bg-slate-500/40" />
        {/* Section 1 */}
        <div className="space-y-1 pt-0.5">
          <div className="h-1 w-1/3 rounded-full bg-slate-400/60" />
          <div className="h-1 w-full rounded-full bg-slate-600/35" />
          <div className="h-1 w-5/6 rounded-full bg-slate-600/35" />
        </div>
        <div className="h-px bg-slate-700/30" />
        {/* Section 2 */}
        <div className="space-y-1">
          <div className="h-1 w-1/3 rounded-full bg-slate-400/60" />
          <div className="h-1 w-full rounded-full bg-slate-600/35" />
          <div className="h-1 w-3/4 rounded-full bg-slate-600/35" />
        </div>
      </div>
    );
  }

  // minimal
  return (
    <div className="h-full px-2.5 py-2.5 space-y-2">
      <div className="h-2 w-3/5 rounded-full bg-slate-200/40" />
      <div className="h-px bg-slate-500/30" />
      <div className="space-y-1 pt-0.5">
        <div className="h-0.5 w-1/4 rounded-full bg-slate-400/60" />
        <div className="h-1 w-full rounded-full bg-slate-600/30" />
        <div className="h-1 w-5/6 rounded-full bg-slate-600/30" />
        <div className="h-1 w-4/5 rounded-full bg-slate-600/30" />
      </div>
      <div className="space-y-1">
        <div className="h-0.5 w-1/4 rounded-full bg-slate-400/60" />
        <div className="h-1 w-full rounded-full bg-slate-600/30" />
        <div className="h-1 w-2/3 rounded-full bg-slate-600/30" />
      </div>
    </div>
  );
}

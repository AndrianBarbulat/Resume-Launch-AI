"use client";

import type { ResumeFormData } from "@/lib/types";

type Template = "modern" | "classic" | "minimal";

interface ResumeTitleProps {
  data: Pick<ResumeFormData, "title" | "template">;
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
}

const TEMPLATES: { id: Template; label: string; description: string }[] = [
  { id: "modern",  label: "Modern",  description: "Two-column with coloured sidebar" },
  { id: "classic", label: "Classic", description: "Traditional, corporate-ready layout" },
  { id: "minimal", label: "Minimal", description: "Ultra-clean with generous whitespace" },
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TEMPLATES.map((tmpl) => {
            const selected = data.template === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onUpdate({ template: tmpl.id })}
                aria-pressed={selected}
                className={[
                  "relative flex flex-col items-center gap-3 p-3 rounded-xl border-2",
                  "transition-all duration-150 hover:-translate-y-0.5",
                  selected
                    ? "border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-900/30"
                    : "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:shadow-md hover:shadow-black/20",
                ].join(" ")}
              >
                {/* Thumbnail */}
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-white border border-slate-200/60 shadow-sm">
                  <TemplateThumb id={tmpl.id} />
                </div>

                <div className="text-center space-y-0.5 px-1">
                  <p className="text-xs font-semibold text-white">{tmpl.label}</p>
                  <p className="text-xs text-slate-400 leading-tight">{tmpl.description}</p>
                </div>

                {/* Selected checkmark */}
                {selected && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shadow">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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

// ─── Template thumbnails ───────────────────────────────────────────────────────

function TemplateThumb({ id }: { id: Template }) {
  if (id === "modern") {
    // Two-column: navy sidebar (left ~32%) + white main area (right)
    return (
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-[33%] shrink-0 flex flex-col gap-1 p-1.5" style={{ backgroundColor: "#1e2a4a" }}>
          {/* Name */}
          <div className="h-1.5 w-11/12 rounded-full bg-white/80" />
          <div className="h-0.5 w-3/4 rounded-full bg-white/30" />
          {/* Divider */}
          <div className="h-px w-full bg-white/10 my-0.5" />
          {/* Contact label */}
          <div className="h-0.5 w-2/5 rounded-full" style={{ backgroundColor: "rgba(147,197,253,0.5)" }} />
          <div className="h-0.5 w-full rounded-full bg-white/15" />
          <div className="h-0.5 w-5/6 rounded-full bg-white/15" />
          <div className="h-0.5 w-4/5 rounded-full bg-white/15" />
          {/* Divider */}
          <div className="h-px w-full bg-white/10 my-0.5" />
          {/* Skills label */}
          <div className="h-0.5 w-2/5 rounded-full" style={{ backgroundColor: "rgba(147,197,253,0.5)" }} />
          {/* Skill pills */}
          <div className="h-1 w-full rounded bg-white/12" />
          <div className="h-1 w-4/5 rounded bg-white/12" />
          <div className="h-1 w-3/5 rounded bg-white/12" />
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col gap-0.5 p-1.5 bg-white">
          {/* Section header with underline accent */}
          <div className="flex items-center gap-1 mb-0.5">
            <div className="h-0.5 w-2/5 rounded-full" style={{ backgroundColor: "rgba(99,102,241,0.7)" }} />
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(99,102,241,0.25)" }} />
          </div>
          <div className="h-0.5 w-full rounded-full bg-slate-200" />
          <div className="h-0.5 w-5/6 rounded-full bg-slate-200" />
          <div className="h-0.5 w-4/5 rounded-full bg-slate-200" />
          {/* Second section */}
          <div className="flex items-center gap-1 mt-1 mb-0.5">
            <div className="h-0.5 w-2/5 rounded-full" style={{ backgroundColor: "rgba(99,102,241,0.7)" }} />
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(99,102,241,0.25)" }} />
          </div>
          <div className="h-0.5 w-3/4 rounded-full bg-slate-400/60" />
          <div className="h-0.5 w-full rounded-full bg-slate-200" />
          <div className="h-0.5 w-5/6 rounded-full bg-slate-200" />
          <div className="h-0.5 w-2/3 rounded-full bg-slate-200" />
        </div>
      </div>
    );
  }

  if (id === "classic") {
    // Single column, centered header, serif feel, horizontal dividers
    return (
      <div className="h-full bg-white px-2 py-2.5 flex flex-col gap-1.5">
        {/* Centered name + contact */}
        <div className="flex flex-col items-center gap-0.5 pb-1">
          <div className="h-1.5 w-3/5 rounded-full bg-slate-700" />
          <div className="h-0.5 w-1/2 rounded-full bg-slate-300" />
        </div>
        <div className="h-px bg-slate-300" />

        {/* Section 1 */}
        <div className="flex flex-col gap-0.5 pt-0.5">
          <div className="h-0.5 w-[28%] rounded-full bg-slate-500" />
          <div className="h-0.5 w-full rounded-full bg-slate-200" />
          <div className="h-0.5 w-5/6 rounded-full bg-slate-200" />
          <div className="h-0.5 w-4/5 rounded-full bg-slate-200" />
        </div>
        <div className="h-px bg-slate-200" />

        {/* Section 2 */}
        <div className="flex flex-col gap-0.5">
          <div className="h-0.5 w-[28%] rounded-full bg-slate-500" />
          <div className="h-0.5 w-full rounded-full bg-slate-200" />
          <div className="h-0.5 w-3/4 rounded-full bg-slate-200" />
        </div>
        <div className="h-px bg-slate-200" />

        {/* Section 3 */}
        <div className="flex flex-col gap-0.5">
          <div className="h-0.5 w-[28%] rounded-full bg-slate-500" />
          <div className="h-0.5 w-1/2 rounded-full bg-slate-200" />
        </div>
      </div>
    );
  }

  // minimal — lots of whitespace, light weights, colored section labels
  return (
    <div className="h-full bg-white px-2.5 pt-3 pb-1.5 flex flex-col">
      {/* Large light name */}
      <div className="h-2 w-2/3 rounded-full bg-slate-300 mb-0.5" />
      <div className="h-0.5 w-3/4 rounded-full bg-slate-200 mb-3" />

      {/* Section 1 */}
      <div className="h-0.5 w-1/5 rounded-full mb-1" style={{ backgroundColor: "rgba(79,107,237,0.6)" }} />
      <div className="h-0.5 w-full rounded-full bg-slate-100 mb-0.5" />
      <div className="h-0.5 w-5/6 rounded-full bg-slate-100 mb-0.5" />
      <div className="h-0.5 w-4/5 rounded-full bg-slate-100 mb-2.5" />

      {/* Section 2 */}
      <div className="h-0.5 w-1/5 rounded-full mb-1" style={{ backgroundColor: "rgba(79,107,237,0.6)" }} />
      <div className="h-0.5 w-full rounded-full bg-slate-100 mb-0.5" />
      <div className="h-0.5 w-2/3 rounded-full bg-slate-100 mb-2.5" />

      {/* Section 3 */}
      <div className="h-0.5 w-1/5 rounded-full mb-1" style={{ backgroundColor: "rgba(79,107,237,0.6)" }} />
      <div className="h-0.5 w-1/2 rounded-full bg-slate-100" />
    </div>
  );
}

"use client";

import type { ResumeFormData } from "@/lib/types";

interface ReviewStepProps {
  data: ResumeFormData;
  onEditStep: (step: number) => void;
  onSave: () => void;
  saving: boolean;
}

// Maps template IDs to display labels
const TEMPLATE_LABELS: Record<string, string> = {
  modern: "Modern",
  classic: "Classic",
  minimal: "Minimal",
};

// Formats a "YYYY-MM" month-input string as "Mon YYYY"
function fmt(ym: string): string {
  if (!ym) return "";
  const [year, month] = ym.split("-");
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  const m = parseInt(month, 10);
  return isNaN(m) ? ym : `${months[m - 1]} ${year}`;
}

function dateRange(start: string, end: string, current: boolean): string {
  const s = fmt(start);
  const e = current ? "Present" : fmt(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
}

export default function ReviewStep({
  data,
  onEditStep,
  onSave,
  saving,
}: ReviewStepProps) {
  const { personalInfo: pi } = data;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Review Your Resume</h2>
        <p className="text-slate-400 text-sm">
          Check everything looks right, then save.
        </p>
      </div>

      {/* ── Title & Template ────────────────────────────────────────────────── */}
      <Section title="Title & Template" onEdit={() => onEditStep(0)}>
        <Row label="Title">{data.title || <Empty />}</Row>
        <Row label="Template">{TEMPLATE_LABELS[data.template] ?? data.template}</Row>
      </Section>

      {/* ── Personal Info ───────────────────────────────────────────────────── */}
      <Section title="Personal Info" onEdit={() => onEditStep(1)}>
        <Row label="Name">{pi.fullName || <Empty />}</Row>
        <Row label="Email">{pi.email || <Empty />}</Row>
        {pi.phone && <Row label="Phone">{pi.phone}</Row>}
        {pi.location && <Row label="Location">{pi.location}</Row>}
        {pi.linkedin && (
          <Row label="LinkedIn">
            <a
              href={pi.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline break-all"
            >
              {pi.linkedin}
            </a>
          </Row>
        )}
        {pi.website && (
          <Row label="Website">
            <a
              href={pi.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline break-all"
            >
              {pi.website}
            </a>
          </Row>
        )}
      </Section>

      {/* ── Summary ─────────────────────────────────────────────────────────── */}
      <Section title="Summary" onEdit={() => onEditStep(2)}>
        {data.summary ? (
          <p className="text-sm text-slate-200 leading-relaxed">{data.summary}</p>
        ) : (
          <Empty />
        )}
      </Section>

      {/* ── Experience ──────────────────────────────────────────────────────── */}
      <Section title="Experience" onEdit={() => onEditStep(3)}>
        {data.experience.length === 0 ? (
          <Empty label="No experience added" />
        ) : (
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-white">
                    {exp.role || "—"}
                  </span>
                  {exp.company && (
                    <span className="text-sm text-slate-400">at {exp.company}</span>
                  )}
                </div>
                {(exp.startDate || exp.endDate || exp.current) && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dateRange(exp.startDate, exp.endDate, exp.current)}
                  </p>
                )}
                {exp.description && (
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                    {exp.description}
                  </p>
                )}
                {exp.bullets.some((b) => b.trim()) && (
                  <ul className="mt-1.5 space-y-0.5 list-none">
                    {exp.bullets
                      .filter((b) => b.trim())
                      .map((b, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-300">
                          <span className="text-slate-500 shrink-0">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Education ───────────────────────────────────────────────────────── */}
      <Section title="Education" onEdit={() => onEditStep(4)}>
        {data.education.length === 0 ? (
          <Empty label="No education added" />
        ) : (
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-white">
                    {[edu.degree, edu.field].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
                {edu.institution && (
                  <p className="text-sm text-slate-400">{edu.institution}</p>
                )}
                {(edu.startDate || edu.endDate) && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dateRange(edu.startDate, edu.endDate, false)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Skills ──────────────────────────────────────────────────────────── */}
      <Section title="Skills" onEdit={() => onEditStep(5)}>
        {data.skills.length === 0 ? (
          <Empty label="No skills added" />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="inline-block bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* ── Projects ────────────────────────────────────────────────────────── */}
      <Section title="Projects" onEdit={() => onEditStep(6)}>
        {!data.projectsEnabled ? (
          <p className="text-xs text-slate-500 italic">Section disabled</p>
        ) : data.projects.length === 0 ? (
          <Empty label="No projects added" />
        ) : (
          <div className="space-y-3">
            {data.projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-white">
                    {proj.name || "—"}
                  </span>
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:underline break-all"
                    >
                      {proj.url}
                    </a>
                  )}
                </div>
                {proj.description && (
                  <p className="text-sm text-slate-300 mt-0.5 leading-relaxed">
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Save button ─────────────────────────────────────────────────────── */}
      <div className="pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-900/40"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
              Saving…
            </>
          ) : (
            <>
              <SaveIcon />
              Save Resume
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <PencilIcon />
          Edit
        </button>
      </div>
      <div className="border-t border-slate-800 pt-3">{children}</div>
    </div>
  );
}

// ─── Row (key-value pair) ──────────────────────────────────────────────────────

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-0 items-baseline py-0.5">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-sm text-slate-200 break-words">{children}</span>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function Empty({ label = "Not provided" }: { label?: string }) {
  return <span className="text-sm text-slate-600 italic">{label}</span>;
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.293-6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L12 16H9v-3z" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

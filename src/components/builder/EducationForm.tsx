"use client";

import { useState, useRef, useEffect } from "react";
import type { Education, ResumeFormData } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import AIButton from "@/components/builder/AIButton";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EducationFormProps {
  data: Education[];
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
}

interface EducationAIState {
  loading: boolean;
  previousDescription: string | null;
  showUndo: boolean;
}

interface CardProps {
  entry: Education;
  index: number;
  expanded: boolean;
  confirmingDelete: boolean;
  errors: Record<string, string>;
  entryAI: EducationAIState;
  onToggle: () => void;
  onUpdate: (updates: Partial<Education>) => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onImproveDesc: () => void;
  onUndoDesc: () => void;
}

const DEFAULT_AI: EducationAIState = {
  loading: false,
  previousDescription: null,
  showUndo: false,
};

// ─── Root component ────────────────────────────────────────────────────────────

export default function EducationForm({
  data,
  onUpdate,
  errors,
}: EducationFormProps) {
  const { showToast } = useToast();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [aiState, setAiState] = useState<Record<string, EducationAIState>>({});
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = undoTimers.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
    };
  }, []);

  function addEntry() {
    const id = crypto.randomUUID();
    const blank: Education = {
      id,
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
    };
    onUpdate({ education: [...data, blank] });
    setExpandedIds((prev) => new Set([...prev, id]));
  }

  function removeEntry(id: string) {
    onUpdate({ education: data.filter((e) => e.id !== id) });
    setDeleteConfirm(null);
  }

  function updateEntry(id: string, updates: Partial<Education>) {
    onUpdate({
      education: data.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Improve education description ────────────────────────────────────────

  async function handleImproveDescription(id: string) {
    const entry = data.find((e) => e.id === id);
    if (!entry) return;

    const originalDesc = entry.description ?? "";

    // Clear any existing undo timer for this entry
    const existing = undoTimers.current.get(id);
    if (existing) {
      clearTimeout(existing);
      undoTimers.current.delete(id);
    }

    setAiState((prev) => ({
      ...prev,
      [id]: {
        loading: true,
        previousDescription: originalDesc,
        showUndo: false,
      },
    }));

    try {
      const res = await fetch("/api/ai/improve-education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution: entry.institution,
          degree: entry.degree,
          field: entry.field,
          existingDescription: originalDesc,
        }),
      });

      if (res.status === 429) {
        showToast("You're generating too fast. Please wait a moment.", "error");
        setAiState((prev) => ({
          ...prev,
          [id]: { ...prev[id], loading: false, previousDescription: null, showUndo: false },
        }));
        return;
      }

      if (!res.ok) {
        showToast("Failed to generate description. Try again.", "error");
        setAiState((prev) => ({
          ...prev,
          [id]: { ...prev[id], loading: false, previousDescription: null, showUndo: false },
        }));
        return;
      }

      const json = await res.json();
      const generated: string = json.description ?? "";

      // Update the entry description and ensure it is visible
      onUpdate({
        education: data.map((e) =>
          e.id === id ? { ...e, description: generated } : e
        ),
      });
      setExpandedIds((prev) => new Set([...prev, id]));

      // Show undo button
      setAiState((prev) => ({
        ...prev,
        [id]: {
          loading: false,
          previousDescription: originalDesc,
          showUndo: true,
        },
      }));

      // Auto-hide undo after 10s
      const timer = setTimeout(() => {
        setAiState((prev) => ({
          ...prev,
          [id]: { ...prev[id], showUndo: false, previousDescription: null },
        }));
        undoTimers.current.delete(id);
      }, 10_000);
      undoTimers.current.set(id, timer);

      showToast("Description generated!", "success");
    } catch {
      showToast("Failed to generate description. Try again.", "error");
      setAiState((prev) => ({
        ...prev,
        [id]: { ...prev[id], loading: false, previousDescription: null, showUndo: false },
      }));
    }
  }

  function handleUndoDescription(id: string) {
    const state = aiState[id];
    if (state?.previousDescription === null || state?.previousDescription === undefined) return;

    onUpdate({
      education: data.map((e) =>
        e.id === id ? { ...e, description: state.previousDescription ?? "" } : e
      ),
    });

    const existing = undoTimers.current.get(id);
    if (existing) {
      clearTimeout(existing);
      undoTimers.current.delete(id);
    }

    setAiState((prev) => ({
      ...prev,
      [id]: { ...prev[id], showUndo: false, previousDescription: null },
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Education</h2>
        <p className="text-slate-400 text-sm">
          Add your academic background, most recent first.
        </p>
      </div>

      <div className="space-y-3">
        {data.map((entry, index) => (
          <EducationCard
            key={entry.id}
            entry={entry}
            index={index}
            expanded={expandedIds.has(entry.id)}
            confirmingDelete={deleteConfirm === entry.id}
            errors={errors}
            entryAI={aiState[entry.id] ?? DEFAULT_AI}
            onToggle={() => toggleExpanded(entry.id)}
            onUpdate={(updates) => updateEntry(entry.id, updates)}
            onDeleteRequest={() => setDeleteConfirm(entry.id)}
            onDeleteConfirm={() => removeEntry(entry.id)}
            onDeleteCancel={() => setDeleteConfirm(null)}
            onImproveDesc={() => handleImproveDescription(entry.id)}
            onUndoDesc={() => handleUndoDescription(entry.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-dashed border-indigo-800 hover:border-indigo-600 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
      >
        <PlusIcon />
        Add Education
      </button>
    </div>
  );
}

// ─── Entry card ────────────────────────────────────────────────────────────────

function EducationCard({
  entry,
  index,
  expanded,
  confirmingDelete,
  errors,
  entryAI,
  onToggle,
  onUpdate,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onImproveDesc,
  onUndoDesc,
}: CardProps) {
  const parts = [entry.degree, entry.institution].filter(Boolean);
  const headerLabel =
    parts.length > 0 ? parts.join(" — ") : `Education ${index + 1}`;

  const institutionErr = errors[`edu_${index}_institution`];
  const degreeErr = errors[`edu_${index}_degree`];
  const fieldErr = errors[`edu_${index}_field`];

  const [showDescription, setShowDescription] = useState(
    () => Boolean(entry.description)
  );

  // When AI generates a description, auto-expand the textarea so it's visible
  useEffect(() => {
    if ((entry.description ?? "").trim()) {
      setShowDescription(true);
    }
  }, [entry.description]);

  const hasDescription = (entry.description ?? "").trim().length > 0;
  const descAILabel = hasDescription ? "Improve Description" : "Generate Description";

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/40 shadow-sm hover:border-slate-600 transition-colors overflow-hidden">
      {/* ── Header row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-4 py-3">
        {/* Toggle + label */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
        >
          <ChevronIcon expanded={expanded} />
          <span className="text-sm font-medium text-white truncate">
            {headerLabel}
          </span>
        </button>

        {/* Delete / confirm */}
        {confirmingDelete ? (
          <div className="flex items-center gap-2 shrink-0 pl-1">
            <span className="text-xs text-slate-400">Delete?</span>
            <button
              type="button"
              onClick={onDeleteConfirm}
              className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={onDeleteCancel}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onDeleteRequest}
            aria-label="Delete entry"
            className="p-1.5 shrink-0 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* ── Collapsible body ─────────────────────────────────────────────────── */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-700/60 px-4 pt-4 pb-5 space-y-4">
            {/* Row 1: Institution (full width) */}
            <div>
              <label
                htmlFor={`institution-${entry.id}`}
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Institution <span className="text-red-400">*</span>
              </label>
              <input
                id={`institution-${entry.id}`}
                type="text"
                value={entry.institution}
                onChange={(e) => onUpdate({ institution: e.target.value })}
                placeholder="Massachusetts Institute of Technology"
                className={`w-full bg-slate-800 border text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  institutionErr ? "border-red-500" : "border-slate-700"
                }`}
              />
              {institutionErr && (
                <p className="text-red-400 text-xs mt-1">{institutionErr}</p>
              )}
            </div>

            {/* Row 2: Degree + Field side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`degree-${entry.id}`}
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Degree <span className="text-red-400">*</span>
                </label>
                <input
                  id={`degree-${entry.id}`}
                  type="text"
                  value={entry.degree}
                  onChange={(e) => onUpdate({ degree: e.target.value })}
                  placeholder="Bachelor of Science"
                  className={`w-full bg-slate-800 border text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors ${
                    degreeErr ? "border-red-500" : "border-slate-700"
                  }`}
                />
                {degreeErr && (
                  <p className="text-red-400 text-xs mt-1">{degreeErr}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`field-${entry.id}`}
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Field of Study <span className="text-red-400">*</span>
                </label>
                <input
                  id={`field-${entry.id}`}
                  type="text"
                  value={entry.field}
                  onChange={(e) => onUpdate({ field: e.target.value })}
                  placeholder="Computer Science"
                  className={`w-full bg-slate-800 border text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors ${
                    fieldErr ? "border-red-500" : "border-slate-700"
                  }`}
                />
                {fieldErr && (
                  <p className="text-red-400 text-xs mt-1">{fieldErr}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label
                  htmlFor={`edu-start-${entry.id}`}
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Start Date
                </label>
                <input
                  id={`edu-start-${entry.id}`}
                  type="month"
                  value={entry.startDate}
                  onChange={(e) => onUpdate({ startDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
                />
              </div>

              {/* End Date */}
              <div>
                <label
                  htmlFor={`edu-end-${entry.id}`}
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  End Date{" "}
                  <span className="text-slate-500 font-normal">(or expected)</span>
                </label>
                <input
                  id={`edu-end-${entry.id}`}
                  type="month"
                  value={entry.endDate}
                  onChange={(e) => onUpdate({ endDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* ── Description (optional) ─────────────────────────────────── */}
            {showDescription ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={`edu-desc-${entry.id}`}
                    className="text-xs font-semibold text-slate-300"
                  >
                    Description{" "}
                    <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate({ description: "" });
                      setShowDescription(false);
                    }}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  id={`edu-desc-${entry.id}`}
                  rows={3}
                  value={entry.description ?? ""}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  disabled={entryAI.loading}
                  placeholder="Briefly describe your course of study, key areas, and academic achievements…"
                  className={`w-full bg-slate-800 border text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors resize-none ${
                    entryAI.loading
                      ? "opacity-40 border-slate-700"
                      : "border-slate-700"
                  }`}
                />

                {/* Description AI actions row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                  <AIButton
                    label={descAILabel}
                    onClick={onImproveDesc}
                    loading={entryAI.loading}
                  />

                  {entryAI.showUndo && (
                    <button
                      type="button"
                      onClick={onUndoDesc}
                      className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-2"
                    >
                      ↩ Undo
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={() => setShowDescription(true)}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  + Add description
                </button>

                <AIButton
                  label="Generate Description"
                  onClick={onImproveDesc}
                  loading={entryAI.loading}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
        expanded ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
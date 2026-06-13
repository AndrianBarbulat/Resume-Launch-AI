"use client";

import { useState, useRef, useEffect } from "react";
import type { Experience, ResumeFormData } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import AIButton from "@/components/builder/AIButton";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ExperienceFormProps {
  data: Experience[];
  skills: string[];
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
}

interface EntryAIState {
  loading: boolean;
  previousBullets: string[] | null;
  showUndo: boolean;
  aiEnhanced: boolean;
  descLoading: boolean;
  previousDescription: string | null;
  showDescUndo: boolean;
  descEnhanced: boolean;
}

interface CardProps {
  entry: Experience;
  index: number;
  total: number;
  expanded: boolean;
  confirmingDelete: boolean;
  errors: Record<string, string>;
  entryAI: EntryAIState;
  onToggle: () => void;
  onUpdate: (updates: Partial<Experience>) => void;
  onMove: (dir: -1 | 1) => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onImprove: () => void;
  onUndo: () => void;
  onGenerateDesc: () => void;
  onUndoDesc: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_AI: EntryAIState = {
  loading: false,
  previousBullets: null,
  showUndo: false,
  aiEnhanced: false,
  descLoading: false,
  previousDescription: null,
  showDescUndo: false,
  descEnhanced: false,
};

/**
 * Merge suggested skills into the existing skills array.
 * Deduplicates case-insensitively. Returns the merged array and a count of new skills added.
 */
function mergeSkills(
  existing: string[],
  suggested: string[],
): { merged: string[]; addedCount: number } {
  const existingLower = new Set(existing.map((s) => s.toLowerCase()));
  const newSkills = suggested.filter(
    (s) => !existingLower.has(s.toLowerCase()),
  );
  return {
    merged: [...existing, ...newSkills],
    addedCount: newSkills.length,
  };
}

// ─── Root component ────────────────────────────────────────────────────────────

export default function ExperienceForm({
  data,
  skills,
  onUpdate,
  errors,
}: ExperienceFormProps) {
  const { showToast } = useToast();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [aiState, setAiState] = useState<Record<string, EntryAIState>>({});
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = undoTimers.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
    };
  }, []);

  // ── Entry CRUD ───────────────────────────────────────────────────────────

  function addEntry() {
    const id = crypto.randomUUID();
    const blank: Experience = {
      id,
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [""],
    };
    onUpdate({ experience: [...data, blank] });
    setExpandedIds((prev) => new Set([...prev, id]));
  }

  function removeEntry(id: string) {
    onUpdate({ experience: data.filter((e) => e.id !== id) });
    setDeleteConfirm(null);
  }

  function updateEntry(id: string, updates: Partial<Experience>) {
    onUpdate({
      experience: data.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function moveEntry(index: number, dir: -1 | 1) {
    const t = index + dir;
    if (t < 0 || t >= data.length) return;
    const next = [...data];
    [next[index], next[t]] = [next[t], next[index]];
    onUpdate({ experience: next });
  }

  // ── Improve bullets (existing) ───────────────────────────────────────────

  async function handleImproveBullets(id: string) {
    const entry = data.find((e) => e.id === id);
    if (!entry) return;

    const originalBullets = [...entry.bullets];

    // Clear any existing undo timer for this entry
    const existing = undoTimers.current.get(id);
    if (existing) {
      clearTimeout(existing);
      undoTimers.current.delete(id);
    }

    setAiState((prev) => ({
      ...prev,
      [id]: {
        ...DEFAULT_AI,
        ...prev[id],
        loading: true,
        previousBullets: originalBullets,
        showUndo: false,
        aiEnhanced: prev[id]?.aiEnhanced ?? false,
      },
    }));

    try {
      const res = await fetch("/api/ai/improve-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: entry.role,
          company: entry.company,
          bullets: entry.bullets,
          description: entry.description,
          startDate: entry.startDate || undefined,
          endDate: entry.endDate || undefined,
          current: entry.current,
        }),
      });

      if (res.status === 429) {
        showToast("You're generating too fast. Please wait a moment.", "error");
        setAiState((prev) => ({
          ...prev,
          [id]: { ...prev[id], loading: false, previousBullets: null, showUndo: false },
        }));
        return;
      }

      if (!res.ok) {
        showToast("Failed to improve bullets. Try again.", "error");
        setAiState((prev) => ({
          ...prev,
          [id]: { ...prev[id], loading: false, previousBullets: null, showUndo: false },
        }));
        return;
      }

      const json = await res.json();
      let improved: string[] = json.bullets ?? [];

      const wasEmpty = !originalBullets.some((b) => b.trim());

      if (!wasEmpty) {
        // Improving: preserve original bullet count
        const origLen = originalBullets.length;
        if (improved.length < origLen) {
          improved = [...improved, ...Array<string>(origLen - improved.length).fill("")];
        } else if (improved.length > origLen) {
          improved = improved.slice(0, origLen);
        }
      }
      // When generating from scratch: keep all generated bullets as-is

      // Update the entry and ensure it is visible
      onUpdate({
        experience: data.map((e) =>
          e.id === id ? { ...e, bullets: improved } : e
        ),
      });
      setExpandedIds((prev) => new Set([...prev, id]));

      // Update AI state — show undo button
      setAiState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          loading: false,
          previousBullets: originalBullets,
          showUndo: true,
          aiEnhanced: true,
        },
      }));

      // Auto-hide undo after 10s
      const timer = setTimeout(() => {
        setAiState((prev) => ({
          ...prev,
          [id]: { ...prev[id], showUndo: false, previousBullets: null },
        }));
        undoTimers.current.delete(id);
      }, 10_000);
      undoTimers.current.set(id, timer);

      const label = entry.company || "this entry";
      showToast(`Bullet points improved for ${label}!`, "success");
    } catch {
      showToast("Failed to improve bullets. Try again.", "error");
      setAiState((prev) => ({
        ...prev,
        [id]: { ...prev[id], loading: false, previousBullets: null, showUndo: false },
      }));
    }
  }

  function handleUndo(id: string) {
    const state = aiState[id];
    if (!state?.previousBullets) return;

    onUpdate({
      experience: data.map((e) =>
        e.id === id ? { ...e, bullets: state.previousBullets! } : e
      ),
    });

    const existing = undoTimers.current.get(id);
    if (existing) {
      clearTimeout(existing);
      undoTimers.current.delete(id);
    }

    setAiState((prev) => ({
      ...prev,
      [id]: { ...prev[id], showUndo: false, previousBullets: null },
    }));
  }

  // ── Generate/improve description (NEW) ────────────────────────────────────

  async function handleGenerateDesc(id: string) {
    const entry = data.find((e) => e.id === id);
    if (!entry) return;

    const originalDesc = entry.description ?? "";

    // Clear any existing undo timer for this entry
    const existing = undoTimers.current.get(id + "_desc");
    if (existing) {
      clearTimeout(existing);
      undoTimers.current.delete(id + "_desc");
    }

    setAiState((prev) => ({
      ...prev,
      [id]: {
        ...DEFAULT_AI,
        ...prev[id],
        descLoading: true,
        previousDescription: originalDesc,
        showDescUndo: false,
      },
    }));

    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: entry.role,
          company: entry.company,
          startDate: entry.startDate || undefined,
          endDate: entry.endDate || undefined,
          current: entry.current,
          existingDescription: originalDesc,
          bullets: entry.bullets,
        }),
      });

      if (res.status === 429) {
        showToast("You're generating too fast. Please wait a moment.", "error");
        setAiState((prev) => ({
          ...prev,
          [id]: { ...prev[id], descLoading: false, previousDescription: null, showDescUndo: false },
        }));
        return;
      }

      if (!res.ok) {
        showToast("Failed to generate description. Try again.", "error");
        setAiState((prev) => ({
          ...prev,
          [id]: { ...prev[id], descLoading: false, previousDescription: null, showDescUndo: false },
        }));
        return;
      }

      const json = await res.json();
      const generated: string = json.description ?? "";
      const suggestedSkills: string[] = json.suggestedSkills ?? [];

      // Update the entry description and ensure it is visible
      onUpdate({
        experience: data.map((e) =>
          e.id === id ? { ...e, description: generated } : e
        ),
      });
      setExpandedIds((prev) => new Set([...prev, id]));

      // Auto-insert suggested skills if any
      if (suggestedSkills.length > 0) {
        const { merged, addedCount } = mergeSkills(skills, suggestedSkills);
        if (addedCount > 0) {
          onUpdate({ skills: merged });
          const sample = suggestedSkills.slice(0, 3).join(", ");
          const rest = suggestedSkills.length > 3 ? `, ...` : "";
          showToast(`Added ${addedCount} skill(s): ${sample}${rest}`, "success");
        }
      }

      // Update AI state — show undo button for description
      setAiState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          descLoading: false,
          previousDescription: originalDesc,
          showDescUndo: true,
          descEnhanced: true,
        },
      }));

      // Auto-hide undo after 10s
      const timer = setTimeout(() => {
        setAiState((prev) => ({
          ...prev,
          [id]: { ...prev[id], showDescUndo: false, previousDescription: null },
        }));
        undoTimers.current.delete(id + "_desc");
      }, 10_000);
      undoTimers.current.set(id + "_desc", timer);

      showToast(`Description generated!`, "success");
    } catch {
      showToast("Failed to generate description. Try again.", "error");
      setAiState((prev) => ({
        ...prev,
        [id]: { ...prev[id], descLoading: false, previousDescription: null, showDescUndo: false },
      }));
    }
  }

  function handleUndoDesc(id: string) {
    const state = aiState[id];
    if (state?.previousDescription === null || state?.previousDescription === undefined) return;

    onUpdate({
      experience: data.map((e) =>
        e.id === id ? { ...e, description: state.previousDescription ?? "" } : e
      ),
    });

    const existing = undoTimers.current.get(id + "_desc");
    if (existing) {
      clearTimeout(existing);
      undoTimers.current.delete(id + "_desc");
    }

    setAiState((prev) => ({
      ...prev,
      [id]: { ...prev[id], showDescUndo: false, previousDescription: null },
    }));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Work Experience</h2>
        <p className="text-slate-400 text-sm">
          Add your work history, most recent first.
        </p>
      </div>

      <div className="space-y-3">
        {data.map((entry, index) => (
          <ExperienceCard
            key={entry.id}
            entry={entry}
            index={index}
            total={data.length}
            expanded={expandedIds.has(entry.id)}
            confirmingDelete={deleteConfirm === entry.id}
            errors={errors}
            entryAI={aiState[entry.id] ?? DEFAULT_AI}
            onToggle={() => toggleExpanded(entry.id)}
            onUpdate={(updates) => updateEntry(entry.id, updates)}
            onMove={(dir) => moveEntry(index, dir)}
            onDeleteRequest={() => setDeleteConfirm(entry.id)}
            onDeleteConfirm={() => removeEntry(entry.id)}
            onDeleteCancel={() => setDeleteConfirm(null)}
            onImprove={() => handleImproveBullets(entry.id)}
            onUndo={() => handleUndo(entry.id)}
            onGenerateDesc={() => handleGenerateDesc(entry.id)}
            onUndoDesc={() => handleUndoDesc(entry.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-dashed border-indigo-800 hover:border-indigo-600 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
      >
        <PlusIcon />
        Add Experience
      </button>
    </div>
  );
}

// ─── Entry card ────────────────────────────────────────────────────────────────

function ExperienceCard({
  entry,
  index,
  total,
  expanded,
  confirmingDelete,
  errors,
  entryAI,
  onToggle,
  onUpdate,
  onMove,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onImprove,
  onUndo,
  onGenerateDesc,
  onUndoDesc,
}: CardProps) {
  const parts = [entry.role, entry.company].filter(Boolean);
  const headerLabel =
    parts.length > 0 ? parts.join(" at ") : `Experience ${index + 1}`;

  const companyErr = errors[`exp_${index}_company`];
  const roleErr = errors[`exp_${index}_role`];

  const [showDescription, setShowDescription] = useState(
    () => Boolean(entry.description)
  );

  // When AI generates a description, auto-expand the textarea so it's visible
  useEffect(() => {
    if ((entry.description ?? "").trim()) {
      setShowDescription(true);
    }
  }, [entry.description]);

  const hasBullets = entry.bullets.some((b) => b.trim());
  const hasDescription = (entry.description ?? "").trim().length > 0;
  const descAILabel = hasDescription ? "Improve Description" : "Generate Description";

  function addBullet() {
    onUpdate({ bullets: [...entry.bullets, ""] });
  }

  function updateBullet(i: number, value: string) {
    const next = [...entry.bullets];
    next[i] = value;
    onUpdate({ bullets: next });
  }

  function removeBullet(i: number) {
    onUpdate({ bullets: entry.bullets.filter((_, idx) => idx !== i) });
  }

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
          {entry.current && (
            <span className="shrink-0 text-xs bg-indigo-950 text-indigo-400 border border-indigo-800/60 px-1.5 py-0.5 rounded-md leading-none">
              Current
            </span>
          )}
          {(entryAI.aiEnhanced || entryAI.descEnhanced) && (
            <span className="shrink-0 text-xs text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-1.5 py-0.5 rounded-md leading-none">
              ✨ AI Enhanced
            </span>
          )}
        </button>

        {/* Reorder */}
        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move entry up"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUpIcon />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move entry down"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownIcon />
          </button>
        </div>

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
            {/* Fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company */}
              <div>
                <label
                  htmlFor={`company-${entry.id}`}
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Company <span className="text-red-400">*</span>
                </label>
                <input
                  id={`company-${entry.id}`}
                  type="text"
                  value={entry.company}
                  onChange={(e) => onUpdate({ company: e.target.value })}
                  placeholder="Acme Corp"
                  className={`w-full bg-slate-800 border text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors ${
                    companyErr ? "border-red-500" : "border-slate-700"
                  }`}
                />
                {companyErr && (
                  <p className="text-red-400 text-xs mt-1">{companyErr}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor={`role-${entry.id}`}
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Job Title <span className="text-red-400">*</span>
                </label>
                <input
                  id={`role-${entry.id}`}
                  type="text"
                  value={entry.role}
                  onChange={(e) => onUpdate({ role: e.target.value })}
                  placeholder="Senior Software Engineer"
                  className={`w-full bg-slate-800 border text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors ${
                    roleErr ? "border-red-500" : "border-slate-700"
                  }`}
                />
                {roleErr && (
                  <p className="text-red-400 text-xs mt-1">{roleErr}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label
                  htmlFor={`start-${entry.id}`}
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Start Date
                </label>
                <input
                  id={`start-${entry.id}`}
                  type="month"
                  value={entry.startDate}
                  onChange={(e) => onUpdate({ startDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
                />
              </div>

              {/* End Date */}
              <div>
                <label
                  htmlFor={`end-${entry.id}`}
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  End Date
                </label>
                <input
                  id={`end-${entry.id}`}
                  type="month"
                  value={entry.endDate}
                  onChange={(e) => onUpdate({ endDate: e.target.value })}
                  disabled={entry.current}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Current checkbox */}
            <label className="flex items-center gap-2.5 w-fit cursor-pointer select-none">
              <input
                type="checkbox"
                checked={entry.current}
                onChange={(e) =>
                  onUpdate({
                    current: e.target.checked,
                    endDate: e.target.checked ? "" : entry.endDate,
                  })
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <span className="text-sm text-slate-300">I currently work here</span>
            </label>

            {/* ── Description (optional) ─────────────────────────────────── */}
            {showDescription ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={`desc-${entry.id}`}
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
                  id={`desc-${entry.id}`}
                  rows={3}
                  value={entry.description ?? ""}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  disabled={entryAI.descLoading}
                  placeholder="Briefly describe your role and overall impact in a few sentences…"
                  className={`w-full bg-slate-800 border text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors resize-none ${
                    entryAI.descLoading
                      ? "opacity-40 border-slate-700"
                      : "border-slate-700"
                  }`}
                />

                {/* Description AI actions row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                  <AIButton
                    label={descAILabel}
                    onClick={onGenerateDesc}
                    loading={entryAI.descLoading}
                  />

                  {entryAI.showDescUndo && (
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
                  onClick={onGenerateDesc}
                  loading={entryAI.descLoading}
                />
              </div>
            )}

            {/* ── Bullet points ──────────────────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2">
                Responsibilities / Achievements
              </p>

              {/* Inputs — faded while AI is loading */}
              <div
                className={`space-y-2 transition-opacity duration-150 ${
                  entryAI.loading ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                {entry.bullets.map((bullet, bi) => (
                  <div key={bi} className="flex items-center gap-2">
                    <span
                      className="shrink-0 text-slate-500 text-lg leading-none select-none"
                      aria-hidden="true"
                    >
                      •
                    </span>
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateBullet(bi, e.target.value)}
                      placeholder="Led migration of X, reducing latency by 40%"
                      className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    {entry.bullets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBullet(bi)}
                        aria-label="Remove bullet"
                        className="shrink-0 p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      >
                        <XMarkIcon />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                <button
                  type="button"
                  onClick={addBullet}
                  disabled={entryAI.loading}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  + Add responsibility
                </button>

                <AIButton
                  label={hasBullets ? "Improve" : "Generate"}
                  onClick={onImprove}
                  loading={entryAI.loading}
                />

                {entryAI.showUndo && (
                  <button
                    type="button"
                    onClick={onUndo}
                    className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-2"
                  >
                    ↩ Undo
                  </button>
                )}
              </div>
            </div>
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

function ArrowUpIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function XMarkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
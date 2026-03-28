"use client";

import { useState } from "react";
import type { Project, ResumeFormData } from "@/lib/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProjectsFormProps {
  data: Project[];
  enabled: boolean;
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
}

interface CardProps {
  entry: Project;
  index: number;
  expanded: boolean;
  confirmingDelete: boolean;
  errors: Record<string, string>;
  onToggle: () => void;
  onUpdate: (updates: Partial<Project>) => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

// ─── Root component ────────────────────────────────────────────────────────────

export default function ProjectsForm({
  data,
  enabled,
  onUpdate,
  errors,
}: ProjectsFormProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function addEntry() {
    const id = crypto.randomUUID();
    const blank: Project = { id, name: "", description: "", url: "" };
    onUpdate({ projects: [...data, blank] });
    setExpandedIds((prev) => new Set([...prev, id]));
  }

  function removeEntry(id: string) {
    onUpdate({ projects: data.filter((p) => p.id !== id) });
    setDeleteConfirm(null);
  }

  function updateEntry(id: string, updates: Partial<Project>) {
    onUpdate({
      projects: data.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Projects</h2>
        <p className="text-slate-400 text-sm">
          Showcase personal or professional projects. This section is optional.
        </p>
      </div>

      {/* ── Enable / disable toggle ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <div>
          <p className="text-sm font-medium text-white">Include Projects</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {enabled ? "This section will appear on your resume." : "This section is hidden."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onUpdate({ projectsEnabled: !enabled })}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
            enabled ? "bg-indigo-600" : "bg-slate-600"
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* ── Content (shown only when enabled) ──────────────────────────────── */}
      {enabled && (
        <>
          <div className="space-y-3">
            {data.map((entry, index) => (
              <ProjectCard
                key={entry.id}
                entry={entry}
                index={index}
                expanded={expandedIds.has(entry.id)}
                confirmingDelete={deleteConfirm === entry.id}
                errors={errors}
                onToggle={() => toggleExpanded(entry.id)}
                onUpdate={(updates) => updateEntry(entry.id, updates)}
                onDeleteRequest={() => setDeleteConfirm(entry.id)}
                onDeleteConfirm={() => removeEntry(entry.id)}
                onDeleteCancel={() => setDeleteConfirm(null)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addEntry}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-dashed border-indigo-800 hover:border-indigo-600 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
          >
            <PlusIcon />
            Add Project
          </button>
        </>
      )}
    </div>
  );
}

// ─── Entry card ────────────────────────────────────────────────────────────────

function ProjectCard({
  entry,
  index,
  expanded,
  confirmingDelete,
  errors,
  onToggle,
  onUpdate,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: CardProps) {
  const headerLabel = entry.name.trim() || `Project ${index + 1}`;
  const nameErr = errors[`proj_${index}_name`];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/40 shadow-sm hover:border-slate-600 transition-colors overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-4 py-3">
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
            aria-label="Delete project"
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
            {/* Name */}
            <div>
              <label
                htmlFor={`proj-name-${entry.id}`}
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                id={`proj-name-${entry.id}`}
                type="text"
                value={entry.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="My Awesome App"
                className={`w-full bg-slate-800 border text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  nameErr ? "border-red-500" : "border-slate-700"
                }`}
              />
              {nameErr && (
                <p className="text-red-400 text-xs mt-1">{nameErr}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor={`proj-desc-${entry.id}`}
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Description
              </label>
              <textarea
                id={`proj-desc-${entry.id}`}
                rows={3}
                value={entry.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Built a full-stack application that helps users track their fitness goals using React, Node.js, and PostgreSQL."
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* URL */}
            <div>
              <label
                htmlFor={`proj-url-${entry.id}`}
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                URL{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id={`proj-url-${entry.id}`}
                type="url"
                value={entry.url}
                onChange={(e) => onUpdate({ url: e.target.value })}
                placeholder="https://github.com/you/project"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
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

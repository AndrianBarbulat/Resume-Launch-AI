"use client";

import { useState } from "react";
import type { ResumeFormData } from "@/lib/types";

const MAX_SKILLS = 20;

interface SkillsFormProps {
  data: string[];
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
}

export default function SkillsForm({ data, onUpdate, errors }: SkillsFormProps) {
  const [input, setInput] = useState("");

  function addSkill() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (data.length >= MAX_SKILLS) return;
    // Case-insensitive duplicate guard
    if (data.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setInput("");
      return;
    }
    onUpdate({ skills: [...data, trimmed] });
    setInput("");
  }

  function removeSkill(skill: string) {
    onUpdate({ skills: data.filter((s) => s !== skill) });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // Stop propagation so the builder page's Enter-prevention handler
      // does not interfere with this intentional add-on-Enter behaviour.
      e.stopPropagation();
      addSkill();
    }
  }

  const atMax = data.length >= MAX_SKILLS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Skills</h2>
        <p className="text-slate-400 text-sm">
          Add your technical and professional skills. Press Enter or click Add.
        </p>
      </div>

      {/* ── Input row ────────────────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="skill-input"
          className="block text-xs font-semibold text-slate-300 mb-1.5"
        >
          Add a skill
        </label>
        <div className="flex gap-2">
          <input
            id="skill-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. TypeScript, React, Node.js"
            disabled={atMax}
            maxLength={50}
            className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={addSkill}
            disabled={!input.trim() || atMax}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            Add
          </button>
        </div>

        {/* Counter + error */}
        <div className="flex items-center justify-between mt-2">
          {errors.skills ? (
            <p className="text-red-400 text-xs">{errors.skills}</p>
          ) : (
            <span />
          )}
          <span
            className={`text-xs ml-auto tabular-nums ${
              atMax ? "text-amber-400" : "text-slate-500"
            }`}
          >
            {data.length} / {MAX_SKILLS} skills
          </span>
        </div>
      </div>

      {/* ── Skill pills ──────────────────────────────────────────────────────── */}
      {data.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Added skills"
        >
          {data.map((skill) => (
            <span
              key={skill}
              role="listitem"
              className="inline-flex items-center gap-1.5 bg-indigo-600/20 border border-indigo-700/50 text-indigo-300 text-sm px-3 py-1 rounded-full"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill}`}
                className="text-indigo-400 hover:text-white transition-colors leading-none"
              >
                <XMarkIcon />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── AI button (disabled placeholder) ─────────────────────────────────── */}
      <div>
        <button
          type="button"
          disabled
          title="Coming soon"
          aria-disabled="true"
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed select-none"
        >
          <SparklesIcon />
          Suggest skills with AI
          <span className="text-xs bg-slate-700/70 text-slate-400 px-1.5 py-0.5 rounded-md leading-none">
            Coming soon
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function XMarkIcon() {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

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

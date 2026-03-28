"use client";

import { useState, useEffect } from "react";
import type { ResumeFormData, Experience } from "@/lib/types";
import { useAI } from "@/hooks/useAI";
import { useToast } from "@/context/ToastContext";
import AIButton from "@/components/builder/AIButton";

const MAX_SKILLS = 20;

interface SkillsFormProps {
  data: string[];
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
  resumeTitle: string;
  experience: Experience[];
}

function formatExperience(experience: Experience[]): string {
  return experience.map((e) => `${e.role} at ${e.company}`).join(", ");
}

export default function SkillsForm({
  data,
  onUpdate,
  errors,
  resumeTitle,
  experience,
}: SkillsFormProps) {
  const { showToast } = useToast();
  const suggestAI = useAI<{ skills: string[] }>();

  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[] | null>(null);

  useEffect(() => {
    if (suggestAI.error) showToast(suggestAI.error, "error");
  }, [suggestAI.error, showToast]);

  function addSkill(skill?: string) {
    const trimmed = (skill ?? input).trim();
    if (!trimmed) return;
    if (data.length >= MAX_SKILLS) return;
    if (data.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      if (!skill) setInput("");
      return;
    }
    onUpdate({ skills: [...data, trimmed] });
    if (!skill) setInput("");
  }

  function removeSkill(skill: string) {
    onUpdate({ skills: data.filter((s) => s !== skill) });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.stopPropagation();
      addSkill();
    }
  }

  async function handleSuggest() {
    const result = await suggestAI.callAI("/api/ai/suggest-skills", {
      jobTitle: resumeTitle,
      currentSkills: data,
      experience: formatExperience(experience),
    });
    if (result) {
      setSuggestions(result.skills);
      showToast(`${result.skills.length} skills suggested!`, "success");
    }
  }

  function addSuggestion(skill: string) {
    if (data.length >= MAX_SKILLS) return;
    if (data.some((s) => s.toLowerCase() === skill.toLowerCase())) return;
    onUpdate({ skills: [...data, skill] });
  }

  function addAllSuggestions() {
    if (!suggestions) return;
    const toAdd = suggestions.filter(
      (s) => !data.some((d) => d.toLowerCase() === s.toLowerCase())
    );
    const adding = toAdd.slice(0, MAX_SKILLS - data.length);
    if (adding.length > 0) onUpdate({ skills: [...data, ...adding] });
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
            onClick={() => addSkill()}
            disabled={!input.trim() || atMax}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            Add
          </button>
        </div>

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
        <div className="flex flex-wrap gap-2" role="list" aria-label="Added skills">
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

      {/* ── AI suggest button ─────────────────────────────────────────────────── */}
      <div>
        <AIButton
          label="Suggest Skills with AI"
          onClick={handleSuggest}
          loading={suggestAI.loading}
        />
      </div>

      {/* ── AI suggestions panel ─────────────────────────────────────────────── */}
      {suggestions && suggestions.length > 0 && (
        <div className="border border-indigo-800/40 bg-indigo-950/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300">
              ✨ AI Suggestions
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={addAllSuggestions}
                disabled={atMax}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add All
              </button>
              <button
                type="button"
                onClick={() => setSuggestions(null)}
                aria-label="Dismiss suggestions"
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <XMarkIcon />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((skill) => {
              const alreadyAdded = data.some(
                (s) => s.toLowerCase() === skill.toLowerCase()
              );
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSuggestion(skill)}
                  disabled={alreadyAdded || atMax}
                  title={alreadyAdded ? "Already added" : `Add "${skill}"`}
                  className={[
                    "inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-colors",
                    alreadyAdded
                      ? "border-slate-700 text-slate-600 bg-slate-800/30 cursor-default"
                      : atMax
                      ? "border-indigo-700/60 text-indigo-400/50 cursor-not-allowed"
                      : "border-indigo-700/60 text-indigo-300 hover:border-indigo-500 hover:text-indigo-200 hover:bg-indigo-900/30 cursor-pointer",
                  ].join(" ")}
                >
                  {!alreadyAdded && (
                    <span className={atMax ? "text-indigo-600" : "text-indigo-400"}>
                      +
                    </span>
                  )}
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      )}
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

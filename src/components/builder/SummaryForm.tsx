"use client";

import { useState, useRef, useEffect } from "react";
import type { ResumeFormData, Experience } from "@/lib/types";
import { useAI } from "@/hooks/useAI";
import { useToast } from "@/context/ToastContext";
import AIButton from "@/components/builder/AIButton";

const MAX_CHARS = 500;

interface SummaryFormProps {
  data: string;
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
  resumeTitle: string;
  experience: Experience[];
  skills: string[];
}

function formatExperience(experience: Experience[]): string {
  return experience
    .map((e) => {
      let s = `${e.role} at ${e.company}`;
      if (e.description) s += `: ${e.description}`;
      const bullets = e.bullets.filter((b) => b.trim());
      if (bullets.length > 0) s += ` (${bullets.slice(0, 2).join("; ")})`;
      return s;
    })
    .join(". ");
}

export default function SummaryForm({
  data,
  onUpdate,
  errors,
  resumeTitle,
  experience,
  skills,
}: SummaryFormProps) {
  const { showToast } = useToast();
  const generateAI = useAI<{ summary: string }>();
  const improveAI = useAI<{ summary: string }>();

  const [aiGenerated, setAiGenerated] = useState(false);
  const [previousSummary, setPreviousSummary] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Show error toasts when AI state updates
  useEffect(() => {
    if (generateAI.error) showToast(generateAI.error, "error");
  }, [generateAI.error, showToast]);

  useEffect(() => {
    if (improveAI.error) showToast(improveAI.error, "error");
  }, [improveAI.error, showToast]);

  function startUndo(prev: string) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setPreviousSummary(prev);
    undoTimerRef.current = setTimeout(() => setPreviousSummary(null), 10_000);
  }

  function handleUndo() {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (previousSummary !== null) {
      onUpdate({ summary: previousSummary });
      setPreviousSummary(null);
    }
  }

  async function handleGenerate() {
    if (
      data.trim() &&
      !window.confirm("This will replace your current summary. Continue?")
    ) {
      return;
    }
    const result = await generateAI.callAI("/api/ai/summary", {
      jobTitle: resumeTitle,
      experience: formatExperience(experience),
      skills,
    });
    if (result) {
      startUndo(data);
      onUpdate({ summary: result.summary });
      setAiGenerated(true);
      showToast("Summary generated!", "success");
    }
  }

  async function handleImprove() {
    const result = await improveAI.callAI("/api/ai/improve-summary", {
      currentSummary: data,
      jobTitle: resumeTitle,
    });
    if (result) {
      startUndo(data);
      onUpdate({ summary: result.summary });
      setAiGenerated(true);
      showToast("Summary improved!", "success");
    }
  }

  const count = data.length;
  const over = count > MAX_CHARS;
  const canImprove = data.trim().length >= 20;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Professional Summary</h2>
        <p className="text-slate-400 text-sm">
          Write 2–4 sentences highlighting your experience, key skills, and career goals.
        </p>
      </div>

      {/* ── Textarea ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label htmlFor="summary" className="text-xs font-semibold text-slate-300">
            Summary
          </label>
          {aiGenerated && (
            <span className="inline-flex items-center gap-1 text-xs text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-full">
              ✨ AI Enhanced
            </span>
          )}
        </div>
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

        {/* Counter + error/undo row */}
        <div className="flex items-center justify-between mt-1">
          {errors.summary || over ? (
            <p className="text-red-400 text-xs">
              {errors.summary ||
                `${count - MAX_CHARS} character${count - MAX_CHARS === 1 ? "" : "s"} over the limit`}
            </p>
          ) : previousSummary !== null ? (
            <button
              type="button"
              onClick={handleUndo}
              className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-2"
            >
              ↩ Undo AI change
            </button>
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

      {/* ── AI buttons ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <AIButton
          label="Generate Summary"
          onClick={handleGenerate}
          loading={generateAI.loading}
          disabled={improveAI.loading}
        />
        <AIButton
          label="Improve Summary"
          onClick={handleImprove}
          loading={improveAI.loading}
          disabled={!canImprove || generateAI.loading}
        />
      </div>
    </div>
  );
}

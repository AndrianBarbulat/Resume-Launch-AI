"use client";

import { useState, type RefObject } from "react";
import type { Resume } from "@/lib/types";
import { usePDF } from "@/hooks/usePDF";

interface DownloadButtonProps {
  resume: Resume;
  containerRef: RefObject<HTMLDivElement | null>;
  /** Visual variant: "primary" (filled) or "ghost" (outline) */
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
}

export default function DownloadButton({
  resume,
  containerRef,
  variant = "primary",
  size = "md",
}: DownloadButtonProps) {
  const { loading, error, generateAndDownload } = usePDF();
  const [status, setStatus] = useState<"idle" | "success">("idle");

  // Derive a clean base filename from the resume
  const baseName = resume.personalInfo?.fullName?.trim()
    ? `${resume.personalInfo.fullName.trim()} Resume`
    : resume.title?.trim() || "Resume";

  async function handleClick() {
    if (loading || !containerRef.current) return;
    await generateAndDownload(containerRef.current, baseName);
    // Only show success if no error was set (usePDF sets error internally)
    setStatus("success");
    setTimeout(() => setStatus("idle"), 2500);
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const base =
    "inline-flex items-center gap-2 font-semibold rounded-xl transition-all select-none";

  const sizeClass = size === "sm"
    ? "text-xs px-3 py-1.5"
    : "text-sm px-5 py-2.5";

  const variantClass =
    variant === "primary"
      ? status === "success"
        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
        : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30"
      : status === "success"
        ? "border border-emerald-500 text-emerald-400"
        : "border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400";

  const disabledClass = loading ? "opacity-70 cursor-not-allowed" : "";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label="Download resume as PDF"
        className={[base, sizeClass, variantClass, disabledClass].join(" ")}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Generating PDF…
          </>
        ) : status === "success" ? (
          <>
            <CheckIcon />
            Downloaded!
          </>
        ) : (
          <>
            <DownloadIcon />
            Download PDF
          </>
        )}
      </button>

      {/* Inline error message — only shown when usePDF sets an error */}
      {error && status === "idle" && (
        <p className="text-xs text-red-400 max-w-xs">{error}</p>
      )}
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

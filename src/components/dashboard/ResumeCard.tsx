"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Resume } from "@/lib/types";
import { templates } from "@/lib/templates";
import { timeAgo, fromTimestamp } from "@/lib/utils";

interface ResumeCardProps {
  resume: Resume;
  duplicating?: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

// Thumbnail dimensions — fixed so the scale calculation is static
const PAPER_W = 816;
const PAPER_H = 1056;
const THUMB_W = 200;
const THUMB_H = 260;
const THUMB_SCALE = THUMB_W / PAPER_W; // ≈ 0.245

export default function ResumeCard({
  resume,
  duplicating = false,
  onDelete,
  onDuplicate,
}: ResumeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatedDate = fromTimestamp(resume.updatedAt);
  const relativeTime = updatedDate ? timeAgo(updatedDate) : null;

  const templateDef = templates[resume.template] ?? templates.modern;
  const TemplateComponent = templateDef.component;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [menuOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  async function handleCopyLink() {
    const url = `${window.location.origin}/resume/${resume.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.cssText = "position:fixed;left:-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopyFeedback(true);
    setMenuOpen(false);
    setTimeout(() => setCopyFeedback(false), 2000);
  }

  const templateBadge: Record<Resume["template"], string> = {
    modern: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    classic: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    minimal: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const statusBadge: Record<Resume["status"], string> = {
    completed: "bg-emerald-500/15 text-emerald-300",
    draft: "bg-yellow-500/15 text-yellow-300",
  };

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-slate-700 transition-colors">

      {/* ── Thumbnail ────────────────────────────────────────────────────── */}
      <div className="bg-slate-800/40 border-b border-slate-800 flex items-center justify-center py-5">
        <div
          style={{
            width: THUMB_W,
            height: THUMB_H,
            overflow: "hidden",
            borderRadius: "6px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            flexShrink: 0,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: PAPER_W,
              height: PAPER_H,
              transform: `scale(${THUMB_SCALE})`,
              transformOrigin: "top left",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <TemplateComponent resume={resume} />
          </div>
        </div>
      </div>

      {/* ── Card body ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-4 flex-1">

        {/* Title row */}
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 flex-1">
            {resume.title?.trim() || "Untitled Resume"}
          </h3>
          {resume.isPublic && (
            <span title="Publicly shared" className="shrink-0 mt-0.5 text-emerald-400">
              <GlobeIcon />
            </span>
          )}
        </div>

        {/* Badges + time */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={[
            "text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
            templateBadge[resume.template] ?? "bg-slate-700 text-slate-300 border-slate-600",
          ].join(" ")}>
            {templateDef.name}
          </span>
          <span className={[
            "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
            statusBadge[resume.status] ?? "bg-slate-700 text-slate-300",
          ].join(" ")}>
            {resume.status}
          </span>
          {relativeTime && (
            <span className="text-xs text-slate-500 ml-auto">{relativeTime}</span>
          )}
        </div>
      </div>

      {/* ── Action row ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 pb-4">

        {/* Edit */}
        <Link
          href={`/builder/${resume.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <PencilIcon />
          Edit
        </Link>

        {/* Preview */}
        <Link
          href={`/builder/${resume.id}/preview`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <EyeIcon />
          Preview
        </Link>

        {/* Download PDF */}
        {resume.pdfUrl ? (
          <a
            href={resume.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <DownloadIcon />
            PDF
          </a>
        ) : (
          <span
            title="Export from preview first"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 px-2.5 py-1.5 cursor-not-allowed"
          >
            <DownloadIcon />
            PDF
          </span>
        )}

        {/* Copy-link feedback pill */}
        {copyFeedback && (
          <span className="ml-auto text-xs font-medium text-emerald-400 flex items-center gap-1">
            <CheckIcon />
            Copied!
          </span>
        )}

        {/* More menu — pushed to right when no feedback */}
        <div ref={menuRef} className={["relative", copyFeedback ? "" : "ml-auto"].join(" ")}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={duplicating}
            title="More options"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            {duplicating ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
            ) : (
              <DotsIcon />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20">
              {/* Duplicate */}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDuplicate(resume.id); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <DuplicateIcon />
                Duplicate
              </button>

              {/* Copy share link — only when public */}
              {resume.isPublic ? (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <LinkIcon />
                  Copy Share Link
                </button>
              ) : (
                <span className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 cursor-not-allowed">
                  <LinkIcon />
                  Copy Share Link
                </span>
              )}

              <div className="border-t border-slate-700" />

              {/* Delete */}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete(resume.id); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
              >
                <TrashIcon />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.293-6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L12 16H9v-3z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Resume } from "@/lib/types";
import { templates } from "@/lib/templates";
import { timeAgo, fromTimestamp } from "@/lib/utils";

interface ResumeListItemProps {
  resume: Resume;
  duplicating?: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const TEMPLATE_DOT: Record<Resume["template"], string> = {
  modern: "bg-indigo-500",
  classic: "bg-amber-500",
  minimal: "bg-emerald-500",
};

const TEMPLATE_BADGE: Record<Resume["template"], string> = {
  modern: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  classic: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  minimal: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const STATUS_BADGE: Record<Resume["status"], string> = {
  completed: "bg-emerald-500/15 text-emerald-300",
  draft: "bg-yellow-500/15 text-yellow-300",
};

export default function ResumeListItem({
  resume,
  duplicating = false,
  onDelete,
  onDuplicate,
}: ResumeListItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const templateDef = templates[resume.template] ?? templates.modern;
  const updatedDate = fromTimestamp(resume.updatedAt);
  const relativeTime = updatedDate ? timeAgo(updatedDate) : "—";

  // Close dropdown on outside click
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

  // Close on Escape
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

  return (
    <div className="group rounded-xl border border-transparent hover:border-slate-700 hover:bg-slate-800/40 transition-colors">

      {/* ── Desktop row (sm+) ─────────────────────────────────────────────── */}
      <div className="hidden sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] sm:gap-x-4 sm:items-center sm:px-4 sm:py-3">

        {/* Template dot */}
        <span
          className={["h-2.5 w-2.5 rounded-full shrink-0", TEMPLATE_DOT[resume.template]].join(" ")}
          title={templateDef.name}
        />

        {/* Title + public badge */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm text-white truncate">
            {resume.title?.trim() || "Untitled Resume"}
          </span>
          {resume.isPublic && (
            <span title="Publicly shared" className="shrink-0 text-emerald-400">
              <GlobeIcon />
            </span>
          )}
        </div>

        {/* Template badge */}
        <span className={[
          "text-xs font-medium px-2 py-0.5 rounded-full border capitalize shrink-0",
          TEMPLATE_BADGE[resume.template] ?? "bg-slate-700 text-slate-300 border-slate-600",
        ].join(" ")}>
          {templateDef.name}
        </span>

        {/* Status badge */}
        <span className={[
          "text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0",
          STATUS_BADGE[resume.status] ?? "bg-slate-700 text-slate-300",
        ].join(" ")}>
          {resume.status}
        </span>

        {/* Last updated */}
        <span className="text-xs text-slate-500 shrink-0 w-28 text-right">
          {relativeTime}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <ActionButtons
            resume={resume}
            duplicating={duplicating}
            copyFeedback={copyFeedback}
            menuOpen={menuOpen}
            menuRef={menuRef}
            onMenuToggle={() => setMenuOpen((v) => !v)}
            onCopyLink={handleCopyLink}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        </div>
      </div>

      {/* ── Mobile card (< sm) ────────────────────────────────────────────── */}
      <div className="flex sm:hidden items-start gap-3 px-4 py-3">
        {/* Template dot */}
        <span className={["mt-1 h-2.5 w-2.5 rounded-full shrink-0", TEMPLATE_DOT[resume.template]].join(" ")} />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="font-medium text-sm text-white truncate">
              {resume.title?.trim() || "Untitled Resume"}
            </span>
            {resume.isPublic && (
              <span className="shrink-0 text-emerald-400"><GlobeIcon /></span>
            )}
          </div>
          {/* Badges + time */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={[
              "text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
              TEMPLATE_BADGE[resume.template] ?? "bg-slate-700 text-slate-300 border-slate-600",
            ].join(" ")}>
              {templateDef.name}
            </span>
            <span className={[
              "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
              STATUS_BADGE[resume.status] ?? "bg-slate-700 text-slate-300",
            ].join(" ")}>
              {resume.status}
            </span>
            <span className="text-xs text-slate-500">{relativeTime}</span>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1">
            <ActionButtons
              resume={resume}
              duplicating={duplicating}
              copyFeedback={copyFeedback}
              menuOpen={menuOpen}
              menuRef={menuRef}
              onMenuToggle={() => setMenuOpen((v) => !v)}
              onCopyLink={handleCopyLink}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared action buttons (used in both desktop row and mobile card) ──────────

interface ActionButtonsProps {
  resume: Resume;
  duplicating: boolean;
  copyFeedback: boolean;
  menuOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onMenuToggle: () => void;
  onCopyLink: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function ActionButtons({
  resume,
  duplicating,
  copyFeedback,
  menuOpen,
  menuRef,
  onMenuToggle,
  onCopyLink,
  onDelete,
  onDuplicate,
}: ActionButtonsProps) {
  return (
    <>
      <Link
        href={`/builder/${resume.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
      >
        <PencilIcon />
        Edit
      </Link>
      <Link
        href={`/builder/${resume.id}/preview`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
      >
        <EyeIcon />
        Preview
      </Link>

      {copyFeedback && (
        <span className="text-xs text-emerald-400 flex items-center gap-1 px-1.5">
          <CheckIcon />
          Copied!
        </span>
      )}

      {/* More dropdown */}
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={onMenuToggle}
          disabled={duplicating}
          title="More options"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          {duplicating ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          ) : (
            <DotsIcon />
          )}
        </button>

        {menuOpen && (
          <div className="absolute right-0 bottom-full mb-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20">
            <button
              type="button"
              onClick={() => { onDuplicate(resume.id); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <DuplicateIcon />
              Duplicate
            </button>

            {resume.isPublic ? (
              <button
                type="button"
                onClick={onCopyLink}
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

            <button
              type="button"
              onClick={() => onDelete(resume.id)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
            >
              <TrashIcon />
              Delete
            </button>
          </div>
        )}
      </div>
    </>
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

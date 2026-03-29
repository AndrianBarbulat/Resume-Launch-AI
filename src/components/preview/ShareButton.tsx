"use client";

import { useState } from "react";
import { toggleResumePublic } from "@/lib/firestore";

interface ShareButtonProps {
  resumeId: string;
  isPublic: boolean;
  /** Called after the public status is successfully changed */
  onToggle: (isPublic: boolean) => void;
  /** Surfaces toast messages in the parent page */
  showToast: (message: string, type: "success" | "error") => void;
}

export default function ShareButton({
  resumeId,
  isPublic,
  onToggle,
  showToast,
}: ShareButtonProps) {
  const [toggling, setToggling] = useState(false);

  function buildShareUrl() {
    return `${window.location.origin}/resume/${resumeId}`;
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers that block clipboard without user gesture context
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }

  async function handleShareClick() {
    if (toggling) return;

    if (!isPublic) {
      // Make public, then copy link
      setToggling(true);
      try {
        await toggleResumePublic(resumeId, true);
        onToggle(true);
        await copyToClipboard(buildShareUrl());
        showToast(
          "Link copied! Anyone with this link can view your resume.",
          "success"
        );
      } catch {
        showToast("Failed to create share link. Please try again.", "error");
      } finally {
        setToggling(false);
      }
    } else {
      // Already public — just copy link
      try {
        await copyToClipboard(buildShareUrl());
        showToast("Link copied!", "success");
      } catch {
        showToast("Could not copy link.", "error");
      }
    }
  }

  async function handleMakePrivate() {
    if (toggling) return;
    setToggling(true);
    try {
      await toggleResumePublic(resumeId, false);
      onToggle(false);
      showToast("Resume is now private.", "success");
    } catch {
      showToast("Failed to update visibility. Please try again.", "error");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Main share / make-public button */}
      <button
        type="button"
        onClick={handleShareClick}
        disabled={toggling}
        className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {toggling ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {isPublic ? "Copying…" : "Sharing…"}
          </>
        ) : isPublic ? (
          <>
            <LinkIcon />
            Share Link
          </>
        ) : (
          <>
            <LockIcon />
            Make Public to Share
          </>
        )}
      </button>

      {/* Revoke access — shown only when public */}
      {isPublic && !toggling && (
        <button
          type="button"
          onClick={handleMakePrivate}
          title="Remove public link"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors no-print"
        >
          <LockIcon size="sm" />
          Make Private
        </button>
      )}
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function LinkIcon() {
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
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function LockIcon({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <svg
      className={size === "sm" ? "w-3 h-3" : "w-4 h-4"}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

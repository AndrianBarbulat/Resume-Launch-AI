"use client";

import { useEffect, useRef, useState } from "react";
import type { Resume } from "@/lib/types";

interface DeleteModalProps {
  resume: Resume;
  onClose: () => void;
  /** Caller is responsible for the actual delete + list update */
  onConfirm: () => Promise<void>;
}

export default function DeleteModal({
  resume,
  onClose,
  onConfirm,
}: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Focus "Cancel" on open
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !deleting) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deleting, onClose]);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current && !deleting) onClose();
  }

  const title = resume.title?.trim() || "Untitled Resume";

  return (
    /* Backdrop */
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="delete-modal-heading"
    >
      {/* Modal card */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">

        {/* Warning icon */}
        <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <WarningIcon />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2
            id="delete-modal-heading"
            className="text-lg font-bold text-white mb-1"
          >
            Delete Resume?
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="text-white font-medium">&ldquo;{title}&rdquo;</span>?
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg
      className="h-6 w-6 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

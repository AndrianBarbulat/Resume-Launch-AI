"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserResumes,
  getResume,
  deleteResume,
  duplicateResume,
} from "@/lib/firestore";
import { deleteResumePDF } from "@/lib/storage";
import type { Resume } from "@/lib/types";
import ResumeCard from "@/components/dashboard/ResumeCard";
import DeleteModal from "@/components/dashboard/DeleteModal";
import EmptyState from "@/components/dashboard/EmptyState";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  message: string;
  type: "success" | "error";
}

// ─── Main content ─────────────────────────────────────────────────────────────

function DashboardContent() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Resume | null>(null);

  // Per-card loading states
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<Toast | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    getUserResumes(user.uid)
      .then(setResumes)
      .catch(() => setResumes([]))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function showToast(message: string, type: Toast["type"]) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Duplicate ────────────────────────────────────────────────────────────────

  async function handleDuplicate(resumeId: string) {
    if (!user || duplicatingId) return;
    setDuplicatingId(resumeId);
    try {
      const newId = await duplicateResume(resumeId, user.uid);
      const newResume = await getResume(newId);
      if (newResume) {
        setResumes((prev) => [newResume, ...prev]);
      }
      showToast("Resume duplicated.", "success");
    } catch {
      showToast("Failed to duplicate resume.", "error");
    } finally {
      setDuplicatingId(null);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { id, pdfUrl, userId } = deleteTarget;

    await deleteResume(id);

    // Best-effort PDF cleanup — don't fail the delete if Storage errors
    if (pdfUrl && userId) {
      deleteResumePDF(userId, id).catch(() => null);
    }

    setResumes((prev) => prev.filter((r) => r.id !== id));
    setDeleteTarget(null);
    showToast("Resume deleted.", "success");
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white">
            Welcome back{user?.displayName ? `, ${user.displayName}` : ""}!
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage and create your professional resumes.
          </p>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Your Resumes
            {!loading && resumes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({resumes.length})
              </span>
            )}
          </h2>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <PlusIcon />
            Create New Resume
          </Link>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-[310px] bg-slate-800/60" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-slate-800 rounded-full w-16" />
                    <div className="h-5 bg-slate-800 rounded-full w-14" />
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <div className="h-7 bg-slate-800 rounded-lg w-14" />
                  <div className="h-7 bg-slate-800 rounded-lg w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && resumes.length === 0 && <EmptyState />}

        {/* Resume grid */}
        {!loading && resumes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                duplicating={duplicatingId === resume.id}
                onDelete={(id) => {
                  const target = resumes.find((r) => r.id === id) ?? null;
                  setDeleteTarget(target);
                }}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          resume={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl",
            "text-sm font-medium flex items-center gap-2",
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white",
          ].join(" ")}
        >
          {toast.type === "success" ? <CheckIcon /> : <AlertIcon />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

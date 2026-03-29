"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { getUserResumes, deleteResume } from "@/lib/firestore";
import type { Resume } from "@/lib/types";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserResumes(user.uid)
      .then(setResumes)
      .catch(() => setResumes([]))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleDelete(resumeId: string) {
    if (!confirm("Delete this resume? This cannot be undone.")) return;
    setDeletingId(resumeId);
    try {
      await deleteResume(resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    } finally {
      setDeletingId(null);
    }
  }

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
          <h2 className="text-lg font-semibold text-white">Your Resumes</h2>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <PlusIcon />
            Create New Resume
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        )}

        {/* Empty state */}
        {!loading && resumes.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl px-8 py-24 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <DocumentIcon />
            </div>
            <p className="text-white font-medium mb-1">
              You haven&apos;t created any resumes yet.
            </p>
            <p className="text-slate-400 text-sm mb-6">
              Get started by creating your first resume.
            </p>
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Create New Resume
            </Link>
          </div>
        )}

        {/* Resume cards */}
        {!loading && resumes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                deleting={deletingId === resume.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Resume card ───────────────────────────────────────────────────────────────

interface ResumeCardProps {
  resume: Resume;
  deleting: boolean;
  onDelete: (id: string) => void;
}

function ResumeCard({ resume, deleting, onDelete }: ResumeCardProps) {
  const updatedAt = formatTimestamp(resume.updatedAt);

  const templateColors: Record<Resume["template"], string> = {
    modern: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    classic: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    minimal: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const statusColors: Record<Resume["status"], string> = {
    completed: "bg-emerald-500/20 text-emerald-300",
    draft: "bg-yellow-500/20 text-yellow-300",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-700 transition-colors">

      {/* Top row: title + badges */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
            {resume.title || "Untitled Resume"}
          </h3>
          <span
            className={[
              "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
              templateColors[resume.template] ?? "bg-slate-700 text-slate-300",
            ].join(" ")}
          >
            {resume.template}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={[
              "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
              statusColors[resume.status] ?? "bg-slate-700 text-slate-300",
            ].join(" ")}
          >
            {resume.status}
          </span>
          {updatedAt && (
            <span className="text-xs text-slate-500">{updatedAt}</span>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">

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

        {/* Download PDF — only if a cloud PDF has been saved */}
        {resume.pdfUrl && (
          <a
            href={resume.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Download saved PDF"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <DownloadIcon />
            PDF
          </a>
        )}

        {/* Delete — pushed to right */}
        <button
          type="button"
          onClick={() => onDelete(resume.id)}
          disabled={deleting}
          title="Delete resume"
          className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-600 hover:text-red-400 hover:bg-slate-800 disabled:opacity-40 transition-colors"
        >
          {deleting ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          ) : (
            <TrashIcon />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Timestamp formatter ───────────────────────────────────────────────────────

function formatTimestamp(ts: unknown): string {
  if (!ts) return "";
  try {
    // Firestore Timestamp has a .toDate() method
    const date =
      typeof (ts as { toDate?: () => Date }).toDate === "function"
        ? (ts as { toDate: () => Date }).toDate()
        : new Date(ts as string | number);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

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

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

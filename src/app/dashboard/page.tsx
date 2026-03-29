"use client";

import { useState, useEffect, useMemo } from "react";
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
import { fromTimestamp } from "@/lib/utils";
import type { Resume } from "@/lib/types";
import ResumeCard from "@/components/dashboard/ResumeCard";
import ResumeListItem from "@/components/dashboard/ResumeListItem";
import SkeletonCard from "@/components/dashboard/SkeletonCard";
import DeleteModal from "@/components/dashboard/DeleteModal";
import EmptyState from "@/components/dashboard/EmptyState";
import DashboardControls, {
  type SortKey,
  type FilterKey,
} from "@/components/dashboard/DashboardControls";

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

  // Data
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  // Controls — search is split into raw (input display) and debounced (filter)
  const [rawSearch, setRawSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updatedAt");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Modal + per-card state
  const [deleteTarget, setDeleteTarget] = useState<Resume | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<Toast | null>(null);

  // ── Debounce search ─────────────────────────────────────────────────────────

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(rawSearch), 300);
    return () => clearTimeout(id);
  }, [rawSearch]);

  // ── Persist view preference ─────────────────────────────────────────────────

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rla-dashboard-view");
      if (saved === "list" || saved === "grid") setView(saved);
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("rla-dashboard-view", view);
    } catch {
      // ignore
    }
  }, [view]);

  // ── Load resumes ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    getUserResumes(user.uid)
      .then(setResumes)
      .catch(() => setResumes([]))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Derived: filtered + sorted list ────────────────────────────────────────

  const displayed = useMemo(() => {
    let result = [...resumes];

    // Text search: title, template name, owner full name
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.template?.toLowerCase().includes(q) ||
          r.personalInfo?.fullName?.toLowerCase().includes(q)
      );
    }

    // Status / visibility filter
    switch (filter) {
      case "completed":
        result = result.filter((r) => r.status === "completed");
        break;
      case "draft":
        result = result.filter((r) => r.status === "draft");
        break;
      case "public":
        result = result.filter((r) => r.isPublic);
        break;
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case "updatedAt":
          return tsMs(b.updatedAt) - tsMs(a.updatedAt);
        case "createdAt":
          return tsMs(b.createdAt) - tsMs(a.createdAt);
        case "titleAZ":
          return (a.title ?? "").localeCompare(b.title ?? "");
        case "titleZA":
          return (b.title ?? "").localeCompare(a.title ?? "");
        default:
          return 0;
      }
    });

    return result;
  }, [resumes, debouncedSearch, filter, sort]);

  const hasActiveFilters =
    rawSearch.trim() !== "" || filter !== "all";

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function showToast(message: string, type: Toast["type"]) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function clearFilters() {
    setRawSearch("");
    setDebouncedSearch("");
    setFilter("all");
  }

  function handleSearch(v: string) {
    setRawSearch(v);
    // If clearing, also flush debounce immediately so the list updates at once
    if (v === "") setDebouncedSearch("");
  }

  // ── Duplicate ───────────────────────────────────────────────────────────────

  async function handleDuplicate(resumeId: string) {
    if (!user || duplicatingId) return;
    setDuplicatingId(resumeId);
    try {
      const newId = await duplicateResume(resumeId, user.uid);
      const newResume = await getResume(newId);
      if (newResume) setResumes((prev) => [newResume, ...prev]);
      showToast("Resume duplicated.", "success");
    } catch {
      showToast("Failed to duplicate resume.", "error");
    } finally {
      setDuplicatingId(null);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { id, pdfUrl, userId } = deleteTarget;
    await deleteResume(id);
    if (pdfUrl && userId) deleteResumePDF(userId, id).catch(() => null);
    setResumes((prev) => prev.filter((r) => r.id !== id));
    setDeleteTarget(null);
    showToast("Resume deleted.", "success");
  }

  function openDeleteModal(resumeId: string) {
    const target = resumes.find((r) => r.id === resumeId) ?? null;
    setDeleteTarget(target);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back{user?.displayName ? `, ${user.displayName}` : ""}!
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Manage and create your professional resumes.
            </p>
          </div>

          <Link
            href="/builder"
            className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-900/30 transition-colors"
          >
            <PlusIcon />
            <span className="hidden sm:inline">Create New Resume</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {/* ── Section label ───────────────────────────────────────────────── */}
        <h2 className="text-lg font-semibold text-white mb-6">
          Your Resumes
        </h2>

        {/* ── Loading skeletons ────────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── No resumes at all ────────────────────────────────────────────── */}
        {!loading && resumes.length === 0 && <EmptyState />}

        {/* ── Resumes exist — show controls + grid/list ─────────────────────── */}
        {!loading && resumes.length > 0 && (
          <>
            <DashboardControls
              search={rawSearch}
              onSearch={handleSearch}
              sort={sort}
              onSort={setSort}
              filter={filter}
              onFilter={setFilter}
              view={view}
              onView={setView}
              total={resumes.length}
              showing={displayed.length}
            />

            {/* Filtered empty state */}
            {displayed.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <SearchEmptyIcon />
                </div>
                <p className="text-white font-medium mb-1">
                  No resumes match your search
                </p>
                <p className="text-slate-400 text-sm mb-6">
                  Try a different search term or clear your filters.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 px-4 py-2 rounded-lg transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Grid view */}
            {displayed.length > 0 && view === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayed.map((resume) => (
                  <ResumeCard
                    key={resume.id}
                    resume={resume}
                    duplicating={duplicatingId === resume.id}
                    onDelete={openDeleteModal}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            )}

            {/* List view */}
            {displayed.length > 0 && view === "list" && (
              <div className="flex flex-col gap-0.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                {displayed.map((resume) => (
                  <ResumeListItem
                    key={resume.id}
                    resume={resume}
                    duplicating={duplicatingId === resume.id}
                    onDelete={openDeleteModal}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete modal ────────────────────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteModal
          resume={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
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

// ─── Timestamp helper ─────────────────────────────────────────────────────────

function tsMs(ts: unknown): number {
  return fromTimestamp(ts)?.getTime() ?? 0;
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SearchEmptyIcon() {
  return (
    <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

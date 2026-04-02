"use client";

import { useState, useEffect, useMemo } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserResumes,
  getResume,
  deleteResume,
  duplicateResume,
} from "@/lib/firestore";
import { deleteResumePDF } from "@/lib/storage";
import { fromTimestamp, timeAgo } from "@/lib/utils";
import type { Resume } from "@/lib/types";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import StatsCards from "@/components/dashboard/StatsCards";
import ResumeCard from "@/components/dashboard/ResumeCard";
import ResumeListItem from "@/components/dashboard/ResumeListItem";
import SkeletonCard from "@/components/dashboard/SkeletonCard";
import DeleteModal from "@/components/dashboard/DeleteModal";
import EmptyState from "@/components/dashboard/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
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
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Controls — raw search drives the input; debounced search drives filtering
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
      // unavailable in some environments
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
    setFetchError(null);
    getUserResumes(user.uid)
      .then(setResumes)
      .catch((err) => {
        console.error("getUserResumes failed:", err);
        setFetchError(err?.message ?? "Unknown error");
      })
      .finally(() => setLoading(false));
  }, [user]);

  // ── Derived: filtered + sorted list ────────────────────────────────────────

  const displayed = useMemo(() => {
    let result = [...resumes];

    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.template?.toLowerCase().includes(q) ||
          r.personalInfo?.fullName?.toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case "completed": result = result.filter((r) => r.status === "completed"); break;
      case "draft":     result = result.filter((r) => r.status === "draft");     break;
      case "public":    result = result.filter((r) => r.isPublic);               break;
    }

    result.sort((a, b) => {
      switch (sort) {
        case "updatedAt": return tsMs(b.updatedAt) - tsMs(a.updatedAt);
        case "createdAt": return tsMs(b.createdAt) - tsMs(a.createdAt);
        case "titleAZ":   return (a.title ?? "").localeCompare(b.title ?? "");
        case "titleZA":   return (b.title ?? "").localeCompare(a.title ?? "");
        default:          return 0;
      }
    });

    return result;
  }, [resumes, debouncedSearch, filter, sort]);

  const hasActiveFilters = rawSearch.trim() !== "" || filter !== "all";

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
    setDeleteTarget(resumes.find((r) => r.id === resumeId) ?? null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Welcome ──────────────────────────────────────────────────────── */}
        {user && <WelcomeSection user={user} />}

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-800 mb-8" />

        {/* ── Loading: skeletons ───────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Fetch error ──────────────────────────────────────────────────── */}
        {!loading && fetchError && (
          <ErrorMessage
            title="Failed to load resumes"
            message={fetchError ?? "We couldn't load your resumes. Please check your connection and try again."}
            onRetry={() => {
              if (!user) return;
              setLoading(true);
              setFetchError(null);
              getUserResumes(user.uid)
                .then(setResumes)
                .catch((err) => {
                  console.error("getUserResumes failed:", err);
                  setFetchError(err?.message ?? "Unknown error");
                })
                .finally(() => setLoading(false));
            }}
          />
        )}

        {/* ── Loaded: empty state (no resumes at all) ──────────────────────── */}
        {!loading && !fetchError && resumes.length === 0 && <EmptyState />}

        {/* ── Loaded: resumes exist ────────────────────────────────────────── */}
        {!loading && !fetchError && resumes.length > 0 && (
          <>
            {/* Stats */}
            <StatsCards resumes={resumes} />

            {/* Recent activity */}
            <RecentActivity resumes={resumes} />

            {/* Controls */}
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
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 px-4 py-2 rounded-lg transition-colors"
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
              <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
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

      {/* ── Delete modal ──────────────────────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteModal
          resume={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl",
            "text-sm font-medium flex items-center gap-2",
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
          ].join(" ")}
        >
          {toast.type === "success" ? <CheckIcon /> : <AlertIcon />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── Recent activity ──────────────────────────────────────────────────────────

type ActivityAction = "created" | "updated" | "exported";

interface ActivityEvent {
  resumeId: string;
  title: string;
  action: ActivityAction;
  timestamp: Date;
}

function deriveActivity(resumes: Resume[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const r of resumes) {
    const title = r.title?.trim() || "Untitled Resume";
    const created  = fromTimestamp(r.createdAt);
    const updated  = fromTimestamp(r.updatedAt);
    const exported = fromTimestamp(r.lastExportedAt);

    // Pick the most meaningful / most recent event for this resume
    if (exported) {
      events.push({ resumeId: r.id, title, action: "exported", timestamp: exported });
    } else if (updated && created) {
      // If updatedAt is within 45s of createdAt, treat it as the creation event
      const sameTime = Math.abs(updated.getTime() - created.getTime()) < 45_000;
      events.push({
        resumeId: r.id,
        title,
        action: sameTime ? "created" : "updated",
        timestamp: sameTime ? created : updated,
      });
    } else if (created) {
      events.push({ resumeId: r.id, title, action: "created", timestamp: created });
    }
  }

  return events
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 3);
}

const ACTION_META: Record<ActivityAction, { label: string; icon: React.ReactNode; color: string }> = {
  created:  { label: "Created",      icon: <SparkleIcon />, color: "text-indigo-400" },
  updated:  { label: "Updated",      icon: <PencilSmIcon />, color: "text-slate-400"  },
  exported: { label: "Exported PDF", icon: <DownloadSmIcon />, color: "text-emerald-400" },
};

function RecentActivity({ resumes }: { resumes: Resume[] }) {
  const events = useMemo(() => deriveActivity(resumes), [resumes]);
  if (events.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Recent Activity
      </h3>
      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        {events.map((event, i) => {
          const meta = ACTION_META[event.action];
          return (
            <div key={`${event.resumeId}-${i}`} className="flex items-center gap-3 px-4 py-3">
              <span className={["shrink-0", meta.color].join(" ")}>{meta.icon}</span>
              <p className="text-sm text-slate-300 flex-1 min-w-0">
                <span className="text-slate-500">{meta.label} </span>
                <span className="font-medium text-white truncate">&ldquo;{event.title}&rdquo;</span>
              </p>
              <span className="shrink-0 text-xs text-slate-500">
                {timeAgo(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function tsMs(ts: unknown): number {
  return fromTimestamp(ts)?.getTime() ?? 0;
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

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

function SparkleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function PencilSmIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536M9 13l6.293-6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L12 16H9v-3z" />
    </svg>
  );
}

function DownloadSmIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

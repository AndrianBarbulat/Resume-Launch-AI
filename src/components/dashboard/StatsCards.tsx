"use client";

import type { Resume } from "@/lib/types";

interface StatsCardsProps {
  resumes: Resume[];
}

export default function StatsCards({ resumes }: StatsCardsProps) {
  const total     = resumes.length;
  const completed = resumes.filter((r) => r.status === "completed").length;
  const drafts    = resumes.filter((r) => r.status === "draft").length;
  const publicCount = resumes.filter((r) => r.isPublic).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      <StatCard
        value={total}
        label="Total Resumes"
        icon={<DocumentIcon />}
        iconBg="bg-indigo-500/15"
        iconColor="text-indigo-400"
      />
      <StatCard
        value={completed}
        label="Completed"
        icon={<CheckCircleIcon />}
        iconBg="bg-emerald-500/15"
        iconColor="text-emerald-400"
      />
      <StatCard
        value={drafts}
        label="Drafts"
        icon={<PencilIcon />}
        iconBg="bg-yellow-500/15"
        iconColor="text-yellow-400"
      />
      <StatCard
        value={publicCount}
        label="Public"
        icon={<GlobeIcon />}
        iconBg="bg-purple-500/15"
        iconColor="text-purple-400"
      />
    </div>
  );
}

// ─── Single stat card ─────────────────────────────────────────────────────────

interface StatCardProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function StatCard({ value, label, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
      <div className={["h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconBg, iconColor].join(" ")}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function DocumentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536M9 13l6.293-6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L12 16H9v-3z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

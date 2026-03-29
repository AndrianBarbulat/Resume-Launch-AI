"use client";

import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="mb-6 relative">
        <div className="h-20 w-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <RocketIcon />
        </div>
        {/* Decorative dot */}
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </div>

      <h2 className="text-xl font-bold text-white mb-2">No resumes yet</h2>
      <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
        Create your first AI-powered resume in minutes and land your next role faster.
      </p>

      <Link
        href="/builder"
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-900/30 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create New Resume
      </Link>
    </div>
  );
}

function RocketIcon() {
  return (
    <svg
      className="h-9 w-9 text-indigo-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.82m2.56-5.84a14.98 14.98 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
      />
    </svg>
  );
}

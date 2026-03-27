"use client";

import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="flex-1 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.displayName}!
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage and create your professional resumes.
          </p>
        </div>

        {/* Resumes section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Your Resumes</h2>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Resume
          </Link>
        </div>

        {/* Empty state */}
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl px-8 py-24 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <svg
              className="h-6 w-6 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
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
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPublicResume } from "@/lib/firestore";
import type { Resume } from "@/lib/types";
import ResumePreview from "@/components/preview/ResumePreview";

export default function PublicResumePage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAvailable, setNotAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getPublicResume(resumeId);
        if (cancelled) return;
        if (!data) {
          setNotAvailable(true);
        } else {
          setResume(data);
        }
      } catch {
        if (!cancelled) setNotAvailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // ── Not available ────────────────────────────────────────────────────────────

  if (notAvailable || !resume) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 min-h-screen px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
            <LockIcon />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            This resume is not available
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            This link may have expired, or the owner has made their resume
            private.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Build your own resume
          </Link>
        </div>
      </div>
    );
  }

  // ── Resume view ──────────────────────────────────────────────────────────────

  const ownerName = resume.personalInfo?.fullName?.trim() || resume.title || "Resume";

  return (
    <div className="flex-1 bg-gray-100 py-8 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto">

        {/* Resume preview — print-area ensures only this renders on print */}
        <div className="print-area">
          <ResumePreview resume={resume} zoom={1} />
        </div>

        {/* Attribution footer — hidden during print via .no-print */}
        <div className="no-print mt-6 text-center">
          <p className="text-slate-500 text-xs">
            {ownerName}&apos;s resume · Built with{" "}
            <Link
              href="/"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ResuLaunchAI
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      className="h-8 w-8 text-slate-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

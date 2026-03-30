"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-32 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(239,68,68,0.05),transparent)] pointer-events-none" />

      <div className="relative max-w-md w-full">
        {/* Icon */}
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ErrorIcon />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          We&apos;re sorry — an unexpected error occurred. You can try again or
          go back home.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
          >
            <RetryIcon />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
          >
            Go Home
          </Link>
        </div>

        {/* Collapsible technical details */}
        <div className="text-left">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 transition-colors mx-auto"
          >
            <ChevronIcon expanded={expanded} />
            Technical details
          </button>

          {expanded && (
            <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl p-4 text-left">
              <p className="text-xs font-mono text-red-400 break-all leading-relaxed">
                {error.message || "Unknown error"}
              </p>
              {error.digest && (
                <p className="text-xs text-slate-600 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="h-8 w-8 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

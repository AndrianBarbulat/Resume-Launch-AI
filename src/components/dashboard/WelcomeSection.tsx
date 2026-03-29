"use client";

import Link from "next/link";
import type { User } from "firebase/auth";

interface WelcomeSectionProps {
  user: User;
}

export default function WelcomeSection({ user }: WelcomeSectionProps) {
  const firstName = user.displayName?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="flex items-center justify-between gap-4 mb-8">
      {/* Left: avatar + greeting */}
      <div className="flex items-center gap-4 min-w-0">
        <Avatar user={user} />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">
            Welcome back, {firstName}!
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Here&apos;s an overview of your resumes.
          </p>
        </div>
      </div>

      {/* Right: create button */}
      <Link
        href="/builder"
        className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-900/30 transition-colors"
      >
        <PlusIcon />
        <span className="hidden sm:inline">Create New Resume</span>
        <span className="sm:hidden">New</span>
      </Link>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user }: { user: User }) {
  const initials = getInitials(user);

  if (user.photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.photoURL}
        alt={user.displayName ?? "Profile picture"}
        referrerPolicy="no-referrer"
        className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-700 shrink-0"
      />
    );
  }

  return (
    <div className="h-12 w-12 rounded-full bg-indigo-600 ring-2 ring-slate-700 flex items-center justify-center shrink-0">
      <span className="text-white font-bold text-sm select-none">{initials}</span>
    </div>
  );
}

function getInitials(user: User): string {
  if (user.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  if (user.email) return user.email[0].toUpperCase();
  return "U";
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

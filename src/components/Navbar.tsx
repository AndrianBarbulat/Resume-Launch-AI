"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, authReady, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-white font-bold text-xl tracking-tight">
              ResuLaunch<span className="text-indigo-400">AI</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Home
            </Link>
            {authReady && user && (
              <Link
                href="/dashboard"
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {!authReady ? (
              <div className="h-4 w-20 rounded bg-slate-800 animate-pulse" />
            ) : user ? (
              <>
                {user.photoURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? "User avatar"}
                    className="h-8 w-8 rounded-full ring-2 ring-slate-700"
                  />
                )}
                <span className="text-slate-300 text-sm">{user.displayName}</span>
                <button
                  onClick={signOut}
                  className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="block text-slate-300 hover:text-white text-sm font-medium transition-colors py-1"
          >
            Home
          </Link>
          {authReady && user && (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block text-slate-300 hover:text-white text-sm font-medium transition-colors py-1"
            >
              Dashboard
            </Link>
          )}
          <div className="pt-3 border-t border-slate-800">
            {authReady && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? "User avatar"}
                      className="h-7 w-7 rounded-full"
                    />
                  )}
                  <span className="text-slate-300 text-sm">{user.displayName}</span>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg text-center transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

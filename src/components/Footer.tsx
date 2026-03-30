import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="text-white font-bold text-lg tracking-tight">
              ResuLaunch<span className="text-indigo-400">AI</span>
            </span>
            <p className="text-slate-500 text-xs">
              Built with Next.js, Firebase &amp; Gemini AI
            </p>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/sign-in"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-xs">
            © 2026 ResuLaunchAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

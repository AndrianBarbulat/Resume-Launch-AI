import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-32 text-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(99,102,241,0.08),transparent)] pointer-events-none" />

      <div className="relative">
        {/* Large 404 */}
        <p className="text-[120px] sm:text-[160px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-indigo-400/80 to-indigo-600/20 select-none">
          404
        </p>

        <div className="-mt-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Page not found
          </h1>
          <p className="text-slate-400 max-w-sm mx-auto mb-10 text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
            >
              <HomeIcon />
              Go Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeIcon() {
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
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

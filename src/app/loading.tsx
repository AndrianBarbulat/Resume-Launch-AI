export default function GlobalLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Spinner */}
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
      </div>

      {/* Brand name with pulse */}
      <p className="text-slate-400 text-sm font-medium animate-pulse tracking-wide">
        ResuLaunch<span className="text-indigo-400">AI</span>
      </p>
    </div>
  );
}

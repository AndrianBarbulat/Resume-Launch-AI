export default function BuilderLoading() {
  return (
    <div className="flex flex-1 min-h-0 animate-pulse">
      {/* ── Left: form panel ───────────────────────────────────────────────────── */}
      <div className="w-full max-w-[480px] border-r border-slate-800 bg-slate-900 flex flex-col">
        {/* Step progress bar */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-slate-800 shrink-0" />
                {i < 4 && <div className="flex-1 h-px bg-slate-800" />}
              </div>
            ))}
          </div>
          <div className="h-4 bg-slate-800 rounded w-40" />
          <div className="h-3 bg-slate-800/60 rounded w-64 mt-1.5" />
        </div>

        {/* Form fields */}
        <div className="flex-1 overflow-hidden px-6 py-6 space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-slate-800 rounded w-24" />
              <div className="h-10 bg-slate-800 rounded-xl w-full" />
            </div>
          ))}
          <div className="space-y-1.5">
            <div className="h-3 bg-slate-800 rounded w-20" />
            <div className="h-28 bg-slate-800 rounded-xl w-full" />
          </div>
          {/* AI button */}
          <div className="h-10 bg-indigo-600/20 border border-indigo-700/30 rounded-xl w-full" />
        </div>

        {/* Footer nav buttons */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-between">
          <div className="h-9 w-24 bg-slate-800 rounded-xl" />
          <div className="h-9 w-28 bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* ── Right: preview panel ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 flex-col bg-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="h-4 bg-slate-800 rounded w-24" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-28 bg-slate-800 rounded-lg" />
            <div className="h-8 w-24 bg-slate-800 rounded-lg" />
          </div>
        </div>

        {/* Paper sheet */}
        <div className="flex-1 flex items-start justify-center overflow-hidden p-8">
          <div className="w-full max-w-[600px] bg-white/5 border border-slate-800 rounded-lg aspect-[1/1.414] space-y-4 p-8">
            {/* Name header */}
            <div className="pb-4 border-b border-slate-700 space-y-2">
              <div className="h-6 bg-slate-700 rounded w-52" />
              <div className="h-3.5 bg-slate-800 rounded w-36" />
              <div className="h-3 bg-slate-800/60 rounded w-80" />
            </div>
            {/* Section */}
            <div className="space-y-2">
              <div className="h-3.5 bg-slate-700 rounded w-24" />
              <div className="h-2.5 bg-slate-800 rounded w-full" />
              <div className="h-2.5 bg-slate-800 rounded w-5/6" />
              <div className="h-2.5 bg-slate-800 rounded w-4/5" />
            </div>
            {/* Section */}
            <div className="space-y-2 pt-2">
              <div className="h-3.5 bg-slate-700 rounded w-32" />
              <div className="h-2.5 bg-slate-800 rounded w-full" />
              <div className="h-2.5 bg-slate-800 rounded w-3/4" />
              <div className="h-2.5 bg-slate-800 rounded w-5/6" />
              <div className="h-2.5 bg-slate-800 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex-1 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Welcome skeleton */}
        <div className="flex items-center justify-between gap-4 mb-8 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-800 shrink-0" />
            <div className="space-y-2">
              <div className="h-5 bg-slate-800 rounded w-44" />
              <div className="h-3.5 bg-slate-800/60 rounded w-52" />
            </div>
          </div>
          <div className="h-9 w-36 bg-slate-800 rounded-xl shrink-0" />
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 mb-8" />

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2"
            >
              <div className="h-3 bg-slate-800 rounded w-16" />
              <div className="h-7 bg-slate-800 rounded w-10" />
            </div>
          ))}
        </div>

        {/* Recent activity skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-3 bg-slate-800 rounded w-28 mb-3" />
          <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-4 w-4 bg-slate-800 rounded shrink-0" />
                <div className="h-3.5 bg-slate-800 rounded flex-1 max-w-xs" />
                <div className="h-3 bg-slate-800/60 rounded w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Controls skeleton */}
        <div className="flex items-center gap-3 mb-6 animate-pulse">
          <div className="h-9 flex-1 max-w-xs bg-slate-800 rounded-xl" />
          <div className="h-9 w-32 bg-slate-800 rounded-xl" />
          <div className="h-9 w-24 bg-slate-800 rounded-xl" />
          <div className="ml-auto h-9 w-20 bg-slate-800 rounded-xl" />
        </div>

        {/* Resume card skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="bg-slate-800/50 border-b border-slate-800 flex items-center justify-center py-5">
                <div className="w-[200px] h-[260px] rounded-md bg-slate-800" />
              </div>
              {/* Body */}
              <div className="p-4 flex flex-col gap-3">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-slate-800 rounded-full w-16" />
                  <div className="h-5 bg-slate-800 rounded-full w-14" />
                  <div className="h-3 bg-slate-800/60 rounded w-20 ml-auto" />
                </div>
              </div>
              {/* Actions */}
              <div className="px-4 pb-4 flex items-center gap-2">
                <div className="h-7 bg-slate-800 rounded-lg w-12" />
                <div className="h-7 bg-slate-800 rounded-lg w-16" />
                <div className="h-7 bg-slate-800/60 rounded-lg w-10 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

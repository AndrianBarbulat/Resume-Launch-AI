"use client";

export default function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
      {/* Thumbnail area */}
      <div className="bg-slate-800/50 border-b border-slate-800 flex items-center justify-center py-5">
        <div className="w-[200px] h-[260px] rounded-md bg-slate-800" />
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Title */}
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        {/* Badges row */}
        <div className="flex items-center gap-2">
          <div className="h-5 bg-slate-800 rounded-full w-16" />
          <div className="h-5 bg-slate-800 rounded-full w-14" />
          <div className="h-3 bg-slate-800/60 rounded w-20 ml-auto" />
        </div>
      </div>

      {/* Action row */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <div className="h-7 bg-slate-800 rounded-lg w-12" />
        <div className="h-7 bg-slate-800 rounded-lg w-16" />
        <div className="h-7 bg-slate-800/60 rounded-lg w-10 ml-auto" />
      </div>
    </div>
  );
}

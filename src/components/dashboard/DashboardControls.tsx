"use client";

export type SortKey = "updatedAt" | "createdAt" | "titleAZ" | "titleZA";
export type FilterKey = "all" | "completed" | "draft" | "public";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updatedAt", label: "Last Updated" },
  { value: "createdAt", label: "Date Created" },
  { value: "titleAZ", label: "Title A–Z" },
  { value: "titleZA", label: "Title Z–A" },
];

const FILTER_CHIPS: { value: FilterKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Drafts" },
  { value: "public", label: "Public" },
];

export interface DashboardControlsProps {
  /** Raw (undbounced) value shown in the input */
  search: string;
  onSearch: (v: string) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  filter: FilterKey;
  onFilter: (v: FilterKey) => void;
  view: "grid" | "list";
  onView: (v: "grid" | "list") => void;
  /** Total resumes before any filtering */
  total: number;
  /** Resumes visible after search + filter */
  showing: number;
}

export default function DashboardControls({
  search,
  onSearch,
  sort,
  onSort,
  filter,
  onFilter,
  view,
  onView,
  total,
  showing,
}: DashboardControlsProps) {
  const hasFilters = search.trim() !== "" || filter !== "all";

  return (
    <div className="flex flex-col gap-3 mb-6">

      {/* ── Row 1: search · sort · view toggle ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search resumes…"
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <XIcon />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortKey)}
            className="appearance-none bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2 cursor-pointer hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {/* Chevron */}
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
            <ChevronIcon />
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-slate-700 overflow-hidden">
          <button
            type="button"
            onClick={() => onView("grid")}
            title="Grid view"
            className={[
              "flex items-center justify-center w-9 h-9 transition-colors",
              view === "grid"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800",
            ].join(" ")}
          >
            <GridIcon />
          </button>
          <button
            type="button"
            onClick={() => onView("list")}
            title="List view"
            className={[
              "flex items-center justify-center w-9 h-9 transition-colors",
              view === "list"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800",
            ].join(" ")}
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {/* ── Row 2: filter chips · showing count ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => onFilter(chip.value)}
            className={[
              "text-xs font-medium px-3 py-1.5 rounded-full transition-colors",
              filter === chip.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700",
            ].join(" ")}
          >
            {chip.label}
          </button>
        ))}

        {/* Resume count */}
        <span className="ml-auto text-xs text-slate-500">
          {hasFilters
            ? `Showing ${showing} of ${total} resume${total !== 1 ? "s" : ""}`
            : `${total} resume${total !== 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

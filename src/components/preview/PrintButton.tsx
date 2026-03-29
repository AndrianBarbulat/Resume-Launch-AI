"use client";

interface PrintButtonProps {
  /** Visual variant: "primary" (filled) or "ghost" (outline) */
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
}

export default function PrintButton({
  variant = "ghost",
  size = "md",
}: PrintButtonProps) {
  const base =
    "inline-flex items-center gap-2 font-semibold rounded-xl transition-colors select-none";

  const sizeClass = size === "sm" ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2";

  const variantClass =
    variant === "primary"
      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30"
      : "border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400";

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={[base, sizeClass, variantClass].join(" ")}
    >
      <PrinterIcon />
      Print
    </button>
  );
}

function PrinterIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
      />
    </svg>
  );
}

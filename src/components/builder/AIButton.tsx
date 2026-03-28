"use client";

interface AIButtonProps {
  label: string;
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

export default function AIButton({
  label,
  onClick,
  loading,
  disabled = false,
  variant = "secondary",
}: AIButtonProps) {
  const isDisabled = disabled || loading;

  const base =
    "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
      : "border border-indigo-500/50 text-indigo-400 hover:border-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`${base} ${styles}`}
    >
      {loading ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          Generating…
        </>
      ) : (
        <>
          <SparkleIcon />
          {label}
        </>
      )}
    </button>
  );
}

function SparkleIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
    </svg>
  );
}

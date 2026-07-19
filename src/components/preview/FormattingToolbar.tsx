"use client";

import { useState, useEffect, useRef } from "react";
import type { ResumeFormatting } from "@/lib/types";

interface FormattingToolbarProps {
  formatting: ResumeFormatting;
  onChange: (formatting: ResumeFormatting) => void;
}

const FONT_SIZES = [
  { label: "XS", value: 0.8 },
  { label: "S", value: 0.9 },
  { label: "M", value: 1.0 },
  { label: "L", value: 1.1 },
  { label: "XL", value: 1.2 },
] as const;

type Alignment = "left" | "center" | "right";

export default function FormattingToolbar({
  formatting,
  onChange,
}: FormattingToolbarProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function update(partial: Partial<ResumeFormatting>) {
    onChange({ ...formatting, ...partial });
  }

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-gray-500 hover:text-gray-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
      >
        <FormatIcon />
        Format
      </button>

      {/* Popover panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl shadow-black/10 z-50 p-4 space-y-4"
        >
          {/* ── Font Size ──────────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Font Size</p>
            <div className="flex gap-1">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.label}
                  type="button"
                  onClick={() => update({ fontSize: fs.value })}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors ${
                    formatting.fontSize === fs.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Header Alignment ───────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Name & Contact
            </p>
            <AlignmentButtons
              active={formatting.headerAlign}
              onChange={(a) => update({ headerAlign: a })}
            />
          </div>

          {/* ── Section Headings Alignment ─────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Section Headings
            </p>
            <AlignmentButtons
              active={formatting.sectionAlign}
              onChange={(a) => update({ sectionAlign: a })}
            />
          </div>

          {/* ── Body Text Alignment ────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Body & Bullets
            </p>
            <AlignmentButtons
              active={formatting.bodyAlign}
              onChange={(a) => update({ bodyAlign: a })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Alignment button group (left / center / right) ──────────────────────

function AlignmentButtons({
  active,
  onChange,
}: {
  active: Alignment;
  onChange: (a: Alignment) => void;
}) {
  return (
    <div className="flex gap-1">
      <AlignButton
        active={active === "left"}
        onClick={() => onChange("left")}
        ariaLabel="Align left"
      >
        <AlignLeftIcon />
      </AlignButton>
      <AlignButton
        active={active === "center"}
        onClick={() => onChange("center")}
        ariaLabel="Align center"
      >
        <AlignCenterIcon />
      </AlignButton>
      <AlignButton
        active={active === "right"}
        onClick={() => onChange("right")}
        ariaLabel="Align right"
      >
        <AlignRightIcon />
      </AlignButton>
    </div>
  );
}

function AlignButton({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-colors ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-400 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
      }`}
    >
      {children}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────

function FormatIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h10M4 18h6"
      />
    </svg>
  );
}

function AlignLeftIcon() {
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
        d="M4 6h12M4 12h8M4 18h14"
      />
    </svg>
  );
}

function AlignCenterIcon() {
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
        d="M6 6h12M8 12h8M5 18h14"
      />
    </svg>
  );
}

function AlignRightIcon() {
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
        d="M8 6h12M12 12h8M5 18h14"
      />
    </svg>
  );
}
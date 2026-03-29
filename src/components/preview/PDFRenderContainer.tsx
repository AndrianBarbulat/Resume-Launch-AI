"use client";

import type { RefObject } from "react";
import type { Resume } from "@/lib/types";
import { templates } from "@/lib/templates";

interface PDFRenderContainerProps {
  resume: Resume;
  /**
   * Ref attached to the capture root — pass this directly to
   * `generateAndDownload` / `generateBlob` from `usePDF`.
   */
  containerRef: RefObject<HTMLDivElement | null>;
}

// A4 width at 96 DPI: 210mm ÷ 25.4mm/in × 96px/in ≈ 794px
// Height is intentionally unconstrained — the template expands naturally
// and the PDF generator slices overflow into additional pages.
const A4_WIDTH_PX = 794;

export default function PDFRenderContainer({
  resume,
  containerRef,
}: PDFRenderContainerProps) {
  const templateKey = resume.template ?? "modern";
  const TemplateComponent =
    templates[templateKey]?.component ?? templates.modern.component;

  return (
    /*
     * Outer shell: fixed-positioned far off the left edge of the viewport.
     * - `position: fixed` means it's always relative to the viewport (never
     *   accidentally scrolled into view by a positioned ancestor).
     * - `z-index: -1` keeps it beneath everything.
     * - `pointer-events: none` prevents any accidental interaction.
     * - NOT `visibility: hidden` or `display: none` — both would prevent
     *   html2canvas from capturing the element.
     */
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      {/*
       * containerRef targets this div.
       * Width is pinned to exactly A4_WIDTH_PX so every template renders at
       * the correct A4 proportion — identical to the on-screen preview but
       * without any scaling transform applied.
       * Height: unconstrained (min-height comes from the template's own
       * `minHeight: 1056px` rule; long resumes grow beyond that naturally).
       */}
      <div ref={containerRef} style={{ width: A4_WIDTH_PX }}>
        <TemplateComponent resume={resume} />
      </div>
    </div>
  );
}

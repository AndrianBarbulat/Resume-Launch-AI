"use client";

import { useEffect, useRef, useState } from "react";
import type { Resume, ResumeFormData } from "@/lib/types";
import { templates } from "@/lib/templates";

interface ResumePreviewProps {
  resume: ResumeFormData;
  /**
   * Zoom multiplier relative to the auto-fit scale.
   * 1.0 (default) = fill the available panel width exactly.
   * 0.5 = half the fit size.  1.5 = 50% larger than fit (triggers scroll).
   */
  zoom?: number;
}

// US Letter at 96 dpi — matches `min-height: 1056px` used by all templates
const PAPER_W = 816;
const PAPER_H = 1056;

export default function ResumePreview({ resume, zoom = 1 }: ResumePreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [autoFitScale, setAutoFitScale] = useState(0.75);

  // Measure the panel width and derive the base scale that fills it exactly
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setAutoFitScale(w / PAPER_W);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const effectiveScale = autoFitScale * zoom;

  // Build a full Resume object for the template (preview only needs form data fields)
  const fullResume: Resume = {
    id: "preview",
    userId: "preview",
    createdAt: null,
    updatedAt: null,
    ...resume,
  };

  const templateKey = fullResume.template ?? "modern";
  const TemplateComponent =
    templates[templateKey]?.component ?? templates.modern.component;

  // Visual dimensions of the scaled paper
  const renderedW = PAPER_W * effectiveScale;
  const renderedH = PAPER_H * effectiveScale;

  return (
    /*
     * wrapperRef: measures available width for auto-fit.
     * overflow-auto: shows scrollbars when zoom > 1 makes the paper wider/taller
     *   than the preview panel.
     */
    <div ref={wrapperRef} className="w-full overflow-auto">
      {/*
       * Flow sizer: a block-level element with the visual dimensions of the
       * scaled paper. This sets the wrapper's scroll area correctly, so the
       * browser knows the actual scrollable extent.
       */}
      <div style={{ width: renderedW, height: renderedH, position: "relative" }}>
        {/*
         * Paper: absolutely positioned so it doesn't double-count layout space.
         * Rendered at natural PAPER_W × PAPER_H, then CSS-transformed to
         * effectiveScale. transform-origin: top left keeps it anchored at (0, 0)
         * of the sizer, perfectly overlaying it.
         */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: PAPER_W,
            height: PAPER_H,
            transform: `scale(${effectiveScale})`,
            transformOrigin: "top left",
            boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <TemplateComponent resume={fullResume} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Resume, ResumeFormData } from "@/lib/types";
import { templates } from "@/lib/templates";

interface ResumePreviewProps {
  resume: ResumeFormData;
}

// US Letter at 96 dpi — matches the `min-height: 1056px` used by all templates
const PAPER_W = 816;
const PAPER_H = 1056;

export default function ResumePreview({ resume }: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Measure the container width and derive the scale factor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width;
      setScale(available / PAPER_W);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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

  return (
    // Outer div: measures available width, sets height to match the scaled paper
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: PAPER_H * scale }}
    >
      {/* Inner paper at natural size, scaled to fit */}
      <div
        style={{
          width: PAPER_W,
          height: PAPER_H,
          transform: `scale(${scale})`,
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
  );
}

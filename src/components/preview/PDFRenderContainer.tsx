"use client";

import { useRef } from "react";
import type { Resume, ResumeFormatting } from "@/lib/types";
import { DEFAULT_FORMATTING } from "@/lib/types";
import { templates } from "@/lib/templates";

interface PDFRenderContainerProps {
  resume: Resume;
  containerRef: React.RefObject<HTMLDivElement | null>;
  formatting?: ResumeFormatting;
}

// US Letter at 96 dpi
const PAPER_W = 816;
const PAPER_H = 1056;

export default function PDFRenderContainer({
  resume,
  containerRef,
  formatting = DEFAULT_FORMATTING,
}: PDFRenderContainerProps) {
  const templateKey = resume.template ?? "modern";
  const TemplateComponent =
    templates[templateKey]?.component ?? templates.modern.component;

  const fullResume: Resume = {
    ...resume,
    formatting,
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: PAPER_W,
        height: PAPER_H,
        backgroundColor: "#ffffff",
        zoom: formatting.fontSize,
      }}
    >
      <TemplateComponent resume={fullResume} formatting={formatting} />
    </div>
  );
}
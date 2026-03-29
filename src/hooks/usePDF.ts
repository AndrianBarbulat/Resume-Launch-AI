"use client";

import { useState } from "react";
import type { PDFResult } from "@/lib/pdfGenerator";

export interface UsePDFReturn {
  loading: boolean;
  error: string | null;
  /** Generate PDF and trigger an immediate browser download */
  generateAndDownload: (element: HTMLElement, filename: string) => Promise<void>;
  /** Generate PDF and return the Blob (e.g. for Firebase upload in a later step) */
  generateBlob: (element: HTMLElement, filename: string) => Promise<Blob | null>;
}

export function usePDF(): UsePDFReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Shared generation core ────────────────────────────────────────────────

  async function run(
    element: HTMLElement,
    filename: string
  ): Promise<PDFResult | null> {
    setLoading(true);
    setError(null);

    try {
      // Dynamic import keeps pdfGenerator (and html2canvas/jsPDF) out of the
      // initial bundle — only loaded when the user actually clicks Download.
      const { generatePDF } = await import("@/lib/pdfGenerator");
      return await generatePDF(element, filename);
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : "Unknown error";
      setError(
        `Could not generate PDF (${detail}). Please try again.`
      );
      return null;
    } finally {
      setLoading(false);
    }
  }

  // ── Public methods ────────────────────────────────────────────────────────

  async function generateAndDownload(
    element: HTMLElement,
    filename: string
  ): Promise<void> {
    const result = await run(element, filename);
    if (!result) return;

    // Create a hidden <a> tag, click it, then remove it
    const a = document.createElement("a");
    a.href = result.url;
    a.download = sanitizeFilename(filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke the object URL after enough time for the download to start
    setTimeout(() => URL.revokeObjectURL(result.url), 60_000);
  }

  async function generateBlob(
    element: HTMLElement,
    filename: string
  ): Promise<Blob | null> {
    const result = await run(element, filename);
    if (!result) return null;

    // Caller gets the Blob; we don't need the object URL here
    URL.revokeObjectURL(result.url);
    return result.blob;
  }

  return { loading, error, generateAndDownload, generateBlob };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Turns a raw resume title / full name into a safe PDF filename.
 * e.g. "John Doe Resume" → "John_Doe_Resume.pdf"
 */
export function sanitizeFilename(name: string): string {
  const base = name
    .trim()
    .replace(/[^a-zA-Z0-9 _\-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return base ? `${base}.pdf` : "Resume.pdf";
}

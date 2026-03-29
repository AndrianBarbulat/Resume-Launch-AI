"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { getResume, updateResumePDFUrl } from "@/lib/firestore";
import { uploadResumePDF } from "@/lib/storage";
import { usePDF } from "@/hooks/usePDF";
import type { Resume } from "@/lib/types";
import { templates } from "@/lib/templates";
import PDFRenderContainer from "@/components/preview/PDFRenderContainer";
import ResumePreview from "@/components/preview/ResumePreview";
import ZoomControls from "@/components/preview/ZoomControls";

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  return (
    <AuthGuard>
      <PreviewContent resumeId={resumeId} />
    </AuthGuard>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  message: string;
  type: "success" | "error";
}

// ─── Main content ─────────────────────────────────────────────────────────────

function PreviewContent({ resumeId }: { resumeId: string }) {
  const { user } = useAuth();
  const router = useRouter();

  const [resume, setResume] = useState<Resume | null>(null);
  const [notFound, setNotFound] = useState(false);
  // Local template override — allows switching without saving
  const [activeTemplate, setActiveTemplate] =
    useState<Resume["template"]>("modern");
  const [zoom, setZoom] = useState(1.0);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { loading: pdfLoading, generateAndDownload, generateBlob } = usePDF();

  // ── Load resume ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getResume(resumeId);
        if (cancelled) return;
        if (!data || data.userId !== user!.uid) {
          setNotFound(true);
          return;
        }
        setResume(data);
        setActiveTemplate(data.template);
      } catch {
        if (!cancelled) setNotFound(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [resumeId, user]);

  useEffect(() => {
    if (notFound) router.replace("/dashboard");
  }, [notFound, router]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function showToast(message: string, type: Toast["type"]) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function buildFilename(): string {
    const fullName = resume?.personalInfo?.fullName?.trim();
    if (fullName) return `${fullName} Resume`;
    return resume?.title?.trim() || "Resume";
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleDownload() {
    if (!containerRef.current || pdfLoading || cloudSaving) return;
    await generateAndDownload(containerRef.current, buildFilename());
    showToast("Resume downloaded!", "success");
  }

  async function handleSaveToCloud() {
    if (!containerRef.current || !user || !resume || pdfLoading || cloudSaving) return;
    setCloudSaving(true);
    try {
      const blob = await generateBlob(containerRef.current, buildFilename());
      if (!blob) {
        showToast("PDF generation failed. Please try again.", "error");
        return;
      }
      const filename = buildFilename().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "") + ".pdf";
      const url = await uploadResumePDF(user.uid, resumeId, blob, filename);
      await updateResumePDFUrl(resumeId, url);
      setResume((prev) => (prev ? { ...prev, pdfUrl: url } : prev));
      showToast("PDF saved to cloud!", "success");
    } catch {
      showToast("Failed to save to cloud. Please try again.", "error");
    } finally {
      setCloudSaving(false);
    }
  }

  // ── Loading / not-found ──────────────────────────────────────────────────────

  if (!resume) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const resumeForPreview: Resume = { ...resume, template: activeTemplate };
  const busy = pdfLoading || cloudSaving;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 min-h-screen">

      {/* ── Action bar ────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">

          {/* Back link */}
          <Link
            href={`/builder/${resumeId}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mr-auto"
          >
            <ArrowLeftIcon />
            Back to Editor
          </Link>

          {/* Template switcher */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 hidden sm:block">Template</label>
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              {(Object.keys(templates) as Resume["template"][]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTemplate(key)}
                  className={[
                    "px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    activeTemplate === key
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800",
                  ].join(" ")}
                >
                  {templates[key].name}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom — desktop only */}
          <div className="hidden sm:block">
            <ZoomControls zoom={zoom} onChange={setZoom} />
          </div>

          {/* Save to Cloud */}
          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={busy}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cloudSaving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving…
              </>
            ) : (
              <>
                <CloudIcon />
                Save to Cloud
              </>
            )}
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy}
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-900/30 transition-colors"
          >
            {pdfLoading && !cloudSaving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200 border-t-transparent" />
                Generating…
              </>
            ) : (
              <>
                <DownloadIcon />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Preview area ──────────────────────────────────────────────────── */}
      <div className="flex-1 bg-gray-100 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <ResumePreview resume={resumeForPreview} zoom={zoom} />
        </div>
      </div>

      {/* ── Hidden render container for PDF capture ───────────────────────── */}
      <PDFRenderContainer resume={resumeForPreview} containerRef={containerRef} />

      {/* ── Toast notification ────────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl",
            "text-sm font-medium flex items-center gap-2 transition-all",
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white",
          ].join(" ")}
        >
          {toast.type === "success" ? <CheckIcon /> : <ErrorIcon />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

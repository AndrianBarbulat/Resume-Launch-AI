"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createResume, updateResume } from "@/lib/firestore";
import type { ResumeFormData } from "@/lib/types";
import StepProgress from "@/components/builder/StepProgress";
import ResumeTitle from "@/components/builder/ResumeTitle";
import PersonalInfoForm from "@/components/builder/PersonalInfoForm";
import SummaryForm from "@/components/builder/SummaryForm";
import ExperienceForm from "@/components/builder/ExperienceForm";
import EducationForm from "@/components/builder/EducationForm";
import SkillsForm from "@/components/builder/SkillsForm";
import ProjectsForm from "@/components/builder/ProjectsForm";
import ReviewStep from "@/components/builder/ReviewStep";
import ResumePreview from "@/components/preview/ResumePreview";
import ZoomControls from "@/components/preview/ZoomControls";

// ─── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { label: "Title" },
  { label: "Personal Info" },
  { label: "Experience" },
  { label: "Education" },
  { label: "Skills" },
  { label: "Projects" },
  { label: "Summary" },
  { label: "Review" },
];

// ─── Default state ─────────────────────────────────────────────────────────────

export const DEFAULT_FORM_DATA: ResumeFormData = {
  title: "",
  template: "modern",
  status: "draft",
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  projectsEnabled: false,
};

// ─── Validation ────────────────────────────────────────────────────────────────

function validateStep(
  step: number,
  data: ResumeFormData
): Record<string, string> {
  const errs: Record<string, string> = {};

  switch (step) {
    case 0:
      if (!data.title.trim()) errs.title = "Resume title is required";
      else if (data.title.trim().length > 50)
        errs.title = "Title must be 50 characters or less";
      break;

    case 1: {
      const { fullName, email } = data.personalInfo;
      if (!fullName.trim()) errs.fullName = "Full name is required";
      if (!email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errs.email = "Enter a valid email address";
      break;
    }

    case 2:
      data.experience.forEach((exp, i) => {
        if (!exp.company.trim())
          errs[`exp_${i}_company`] = "Company is required";
        if (!exp.role.trim()) errs[`exp_${i}_role`] = "Job title is required";
      });
      break;

    case 3:
      data.education.forEach((edu, i) => {
        if (!edu.institution.trim())
          errs[`edu_${i}_institution`] = "Institution is required";
        if (!edu.degree.trim()) errs[`edu_${i}_degree`] = "Degree is required";
        if (!edu.field.trim())
          errs[`edu_${i}_field`] = "Field of study is required";
      });
      break;

    case 4:
      if (data.skills.length === 0)
        errs.skills = "Add at least one skill";
      break;

    case 5:
      if (data.projectsEnabled) {
        data.projects.forEach((proj, i) => {
          if (!proj.name.trim())
            errs[`proj_${i}_name`] = "Project name is required";
        });
      }
      break;

    case 6:
      if (data.summary.length > 1000)
        errs.summary = "Summary must be 1000 characters or less";
      break;
  }

  return errs;
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface BuilderShellProps {
  mode: "create" | "edit";
  /** Firestore doc ID — required when mode is "edit", used to update on save */
  resumeId?: string;
  /** Pre-filled form data; defaults to empty state for create mode */
  initialData?: ResumeFormData;
}

export default function BuilderShell({
  mode,
  resumeId,
  initialData = DEFAULT_FORM_DATA,
}: BuilderShellProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<ResumeFormData>(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  // Mobile: toggle between form and preview
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  // Preview zoom: multiplier on the auto-fit scale (1.0 = fill panel)
  const [zoom, setZoom] = useState(1.0);

  // Refs for stable access inside the interval callback
  const dirtyRef = useRef(false);
  const formDataRef = useRef(formData);
  const savingRef = useRef(false);
  const autoSavingRef = useRef(false);
  // In edit mode, we always have an ID. In create mode, set after first auto-save.
  const autoSaveIdRef = useRef<string | null>(
    mode === "edit" && resumeId ? resumeId : null
  );
  // Skip marking dirty on the very first render
  const mountedRef = useRef(false);

  // Keep formDataRef up to date every render
  formDataRef.current = formData;

  // Mark form as dirty whenever data changes (skip initial mount)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    dirtyRef.current = true;
  }, [formData]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!user) return;

    const timer = setInterval(async () => {
      if (!dirtyRef.current || savingRef.current || autoSavingRef.current) return;

      autoSavingRef.current = true;
      setAutoSaving(true);
      try {
        if (autoSaveIdRef.current) {
          await updateResume(autoSaveIdRef.current, {
            ...formDataRef.current,
            status: "draft",
          });
        } else {
          const newId = await createResume(user.uid, {
            ...formDataRef.current,
            status: "draft",
          });
          autoSaveIdRef.current = newId;
        }
        dirtyRef.current = false;
        setDraftSavedAt(new Date());
      } catch {
        // Auto-save failures are silent — user can still manually save
      } finally {
        autoSavingRef.current = false;
        setAutoSaving(false);
      }
    }, 30_000);

    return () => clearInterval(timer);
  }, [user]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function updateFormData(updates: Partial<ResumeFormData>) {
    setFormData((prev) => ({ ...prev, ...updates }));
  }

  function handleNext() {
    const errs = validateStep(currentStep, formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setErrors({});
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleStepClick(index: number) {
    setErrors({});
    setCurrentStep(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    if (!user || saving) return;
    setSaving(true);
    savingRef.current = true;
    try {
      if (autoSaveIdRef.current) {
        await updateResume(autoSaveIdRef.current, {
          ...formData,
          status: "completed",
        });
      } else {
        await createResume(user.uid, { ...formData, status: "completed" });
      }
      router.push("/dashboard");
    } catch {
      setSaving(false);
      savingRef.current = false;
    }
  }

  // ─── Step rendering ──────────────────────────────────────────────────────────

  const isLastStep = currentStep === STEPS.length - 1;

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <ResumeTitle
            data={{ title: formData.title, template: formData.template }}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      case 1:
        return (
          <PersonalInfoForm
            data={formData.personalInfo}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <ExperienceForm
            data={formData.experience}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <EducationForm
            data={formData.education}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      case 4:
        return (
          <SkillsForm
            data={formData.skills}
            onUpdate={updateFormData}
            errors={errors}
            resumeTitle={formData.title}
            experience={formData.experience}
          />
        );
      case 5:
        return (
          <ProjectsForm
            data={formData.projects}
            enabled={formData.projectsEnabled}
            onUpdate={updateFormData}
            errors={errors}
          />
        );
      case 6:
        return (
          <SummaryForm
            data={formData.summary}
            onUpdate={updateFormData}
            errors={errors}
            resumeTitle={formData.title}
            experience={formData.experience}
            skills={formData.skills}
          />
        );
      case 7:
        return (
          <ReviewStep
            data={formData}
            onEditStep={handleStepClick}
            onSave={handleSave}
            saving={saving}
          />
        );
      default:
        return null;
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const draftLabel = draftSavedAt
    ? `Draft saved · ${draftSavedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : null;

  return (
    // Intercept Enter on single-line inputs to prevent accidental navigation
    <div
      className="flex-1 bg-slate-950"
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
        }
      }}
    >
      <div className="lg:flex lg:items-start">

        {/* ── Left panel: form ─────────────────────────────────────────────── */}
        <div
          className={[
            "lg:w-1/2 lg:block py-10",
            // On mobile: show only when in form view; add bottom padding for the toggle button
            mobileView === "preview" ? "hidden" : "block",
            "pb-24 lg:pb-10",
          ].join(" ")}
        >
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">
                {mode === "edit" ? "Edit Resume" : "Build Your Resume"}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {mode === "edit"
                  ? "Update your resume details, then save."
                  : "Complete each step to create your resume."}
              </p>
            </div>

            {/* Step progress */}
            <StepProgress
              steps={STEPS}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
            />

            {/* Draft save indicator — fixed height prevents layout shift */}
            <div className="flex justify-end items-center mt-1.5 h-5">
              {autoSaving ? (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-3 w-3 animate-spin rounded-full border border-slate-500 border-t-transparent" />
                  Saving draft…
                </span>
              ) : draftLabel ? (
                <span className="text-xs text-slate-600">{draftLabel}</span>
              ) : null}
            </div>

            {/* Step card */}
            <div className="mt-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/30 min-h-64">
              {renderStep()}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-0 disabled:pointer-events-none transition-colors"
              >
                <ArrowLeftIcon />
                Back
              </button>

              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-900/40"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
                      Saving…
                    </>
                  ) : (
                    "Save Resume"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-900/40"
                >
                  Continue
                  <ArrowRightIcon />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right panel: preview ─────────────────────────────────────────── */}
        <div
          className={[
            // Desktop: sticky sidebar, full viewport height minus navbar (h-16 = 4rem)
            "lg:w-1/2 lg:block lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto",
            // Background
            "bg-gray-100",
            // Mobile: show only when in preview view, full height
            mobileView === "form" ? "hidden" : "block min-h-screen",
            // Mobile top padding for the toggle button clearance (bottom)
            "pb-24 lg:pb-0",
          ].join(" ")}
        >
          {/* Inner: centre the paper with padding */}
          <div className="p-6 lg:p-8">
            {/* Preview header — desktop only */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Live Preview
                </span>
                <span className="text-xs text-gray-400 capitalize">
                  · {formData.template}
                </span>
              </div>
              <ZoomControls zoom={zoom} onChange={setZoom} />
            </div>

            <ResumePreview resume={formData} zoom={zoom} />
          </div>
        </div>
      </div>

      {/* ── Mobile toggle button ─────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          type="button"
          onClick={() =>
            setMobileView((v) => (v === "form" ? "preview" : "form"))
          }
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg shadow-indigo-900/50 transition-colors"
        >
          {mobileView === "form" ? (
            <>
              <EyeIcon />
              Preview
            </>
          ) : (
            <>
              <PencilIcon />
              Edit
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
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
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function ArrowRightIcon() {
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
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function EyeIcon() {
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
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function PencilIcon() {
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
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

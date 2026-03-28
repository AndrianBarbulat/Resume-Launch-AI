"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { createResume } from "@/lib/firestore";
import type { ResumeFormData } from "@/lib/types";
import StepProgress from "@/components/builder/StepProgress";
import ResumeTitle from "@/components/builder/ResumeTitle";
import PersonalInfoForm from "@/components/builder/PersonalInfoForm";
import SummaryForm from "@/components/builder/SummaryForm";
import ExperienceForm from "@/components/builder/ExperienceForm";
import EducationForm from "@/components/builder/EducationForm";

// ─── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { label: "Title" },
  { label: "Personal Info" },
  { label: "Summary" },
  { label: "Experience" },
  { label: "Education" },
  { label: "Skills" },
  { label: "Projects" },
  { label: "Review" },
];

// ─── Default state ─────────────────────────────────────────────────────────────

const DEFAULT_DATA: ResumeFormData = {
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

// ─── Page (AuthGuard wrapper) ──────────────────────────────────────────────────

export default function BuilderPage() {
  return (
    <AuthGuard>
      <BuilderContent />
    </AuthGuard>
  );
}

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
      if (data.summary.length > 500)
        errs.summary = "Summary must be 500 characters or less";
      break;

    case 3:
      data.experience.forEach((exp, i) => {
        if (!exp.company.trim())
          errs[`exp_${i}_company`] = "Company is required";
        if (!exp.role.trim()) errs[`exp_${i}_role`] = "Job title is required";
      });
      break;

    case 4:
      data.education.forEach((edu, i) => {
        if (!edu.institution.trim())
          errs[`edu_${i}_institution`] = "Institution is required";
        if (!edu.degree.trim()) errs[`edu_${i}_degree`] = "Degree is required";
        if (!edu.field.trim())
          errs[`edu_${i}_field`] = "Field of study is required";
      });
      break;

    case 5:
      if (data.skills.length === 0)
        errs.skills = "Add at least one skill";
      break;

    case 6:
      if (data.projectsEnabled) {
        data.projects.forEach((proj, i) => {
          if (!proj.name.trim())
            errs[`proj_${i}_name`] = "Project name is required";
        });
      }
      break;
  }

  return errs;
}

// ─── Main content ──────────────────────────────────────────────────────────────

function BuilderContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<ResumeFormData>(DEFAULT_DATA);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
    try {
      await createResume(user.uid, { ...formData, status: "completed" });
      router.push("/dashboard");
    } catch {
      setSaving(false);
    }
  }

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    // Intercept Enter on single-line inputs to prevent accidental navigation
    <div
      className="flex-1 bg-slate-950 py-10"
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
        }
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Build Your Resume</h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete each step to create your resume.
          </p>
        </div>

        {/* Step progress */}
        <StepProgress
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        {/* Step card */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/30 min-h-64">
          <StepPlaceholder
            step={currentStep}
            label={STEPS[currentStep].label}
            formData={formData}
            onUpdate={updateFormData}
            errors={errors}
          />
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
  );
}

// ─── Step placeholder (replaced per-step in later prompts) ────────────────────

interface StepPlaceholderProps {
  step: number;
  label: string;
  formData: ResumeFormData;
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
}

function StepPlaceholder({
  step,
  label,
  formData,
  onUpdate,
  errors,
}: StepPlaceholderProps) {
  if (step === 0) {
    return (
      <ResumeTitle
        data={{ title: formData.title, template: formData.template }}
        onUpdate={onUpdate}
        errors={errors}
      />
    );
  }

  if (step === 1) {
    return (
      <PersonalInfoForm
        data={formData.personalInfo}
        onUpdate={onUpdate}
        errors={errors}
      />
    );
  }

  if (step === 2) {
    return (
      <SummaryForm
        data={formData.summary}
        onUpdate={onUpdate}
        errors={errors}
      />
    );
  }

  if (step === 3) {
    return (
      <ExperienceForm
        data={formData.experience}
        onUpdate={onUpdate}
        errors={errors}
      />
    );
  }

  if (step === 4) {
    return (
      <EducationForm
        data={formData.education}
        onUpdate={onUpdate}
        errors={errors}
      />
    );
  }

  // Steps 5–7 — placeholder cards (built in subsequent prompts)
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-lg font-bold text-indigo-400">
        {step + 1}
      </div>
      <p className="text-white font-semibold text-lg">{label}</p>
      <p className="text-slate-500 text-sm mt-1">
        This step&apos;s form will be built in the next prompt.
      </p>
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

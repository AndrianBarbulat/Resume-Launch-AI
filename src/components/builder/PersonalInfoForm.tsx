"use client";

import type { PersonalInfo, ResumeFormData } from "@/lib/types";

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onUpdate: (updates: Partial<ResumeFormData>) => void;
  errors: Record<string, string>;
}

export default function PersonalInfoForm({
  data,
  onUpdate,
  errors,
}: PersonalInfoFormProps) {
  function updateField(field: keyof PersonalInfo, value: string) {
    onUpdate({ personalInfo: { ...data, [field]: value } });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Personal Information</h2>
        <p className="text-slate-400 text-sm">
          Add your contact details so employers can reach you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          id="fullName"
          label="Full Name"
          required
          type="text"
          autoComplete="name"
          placeholder="Jane Smith"
          value={data.fullName}
          onChange={(v) => updateField("fullName", v)}
          error={errors.fullName}
        />
        <Field
          id="email"
          label="Email Address"
          required
          type="email"
          autoComplete="email"
          placeholder="jane@example.com"
          value={data.email}
          onChange={(v) => updateField("email", v)}
          error={errors.email}
        />
        <Field
          id="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1 (555) 000-0000"
          value={data.phone}
          onChange={(v) => updateField("phone", v)}
        />
        <Field
          id="location"
          label="Location"
          type="text"
          autoComplete="address-level2"
          placeholder="City, State or Remote"
          value={data.location}
          onChange={(v) => updateField("location", v)}
        />
        <Field
          id="linkedin"
          label="LinkedIn URL"
          optional
          type="url"
          placeholder="https://linkedin.com/in/username"
          value={data.linkedin}
          onChange={(v) => updateField("linkedin", v)}
        />
        <Field
          id="website"
          label="Website / Portfolio"
          optional
          type="url"
          placeholder="https://yoursite.com"
          value={data.website}
          onChange={(v) => updateField("website", v)}
        />
      </div>
    </div>
  );
}

// ─── Reusable field ────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  error?: string;
  autoComplete?: string;
}

function Field({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
  optional,
  error,
  autoComplete,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-300 mb-1.5"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {optional && (
          <span className="text-slate-500 font-normal ml-1">(optional)</span>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={[
          "w-full bg-slate-800 border text-white placeholder-slate-500 text-sm",
          "px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors",
          error ? "border-red-500" : "border-slate-700",
        ].join(" ")}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

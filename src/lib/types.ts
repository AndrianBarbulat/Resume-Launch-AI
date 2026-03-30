import type { Timestamp } from "firebase/firestore";

export interface Resume {
  id: string;
  userId: string;
  title: string;
  template: "modern" | "classic" | "minimal";
  status: "draft" | "completed";
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  projectsEnabled: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  /** Firebase Storage download URL — set after first cloud export */
  pdfUrl?: string;
  /** Timestamp of the most recent PDF export */
  lastExportedAt?: Timestamp | null;
  /** Whether this resume is publicly viewable via a share link */
  isPublic?: boolean;
}

export type ResumeFormData = Omit<Resume, "id" | "userId" | "createdAt" | "updatedAt">;

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description?: string;
  bullets: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
}

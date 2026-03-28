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
  createdAt: any;
  updatedAt: any;
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

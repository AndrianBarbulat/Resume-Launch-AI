import { ModernTemplate } from "@/components/preview/templates/ModernTemplate";
import { ClassicTemplate } from "@/components/preview/templates/ClassicTemplate";
import { MinimalTemplate } from "@/components/preview/templates/MinimalTemplate";
import type { Resume } from "@/lib/types";
import type { ComponentType } from "react";

export interface TemplateDefinition {
  name: string;
  description: string;
  component: ComponentType<{ resume: Resume }>;
}

export const templates: Record<Resume["template"], TemplateDefinition> = {
  modern: {
    name: "Modern",
    description: "Clean two-column layout with a coloured sidebar",
    component: ModernTemplate,
  },
  classic: {
    name: "Classic",
    description: "Traditional single-column professional layout",
    component: ClassicTemplate,
  },
  minimal: {
    name: "Minimal",
    description: "Ultra-clean minimalist design with generous whitespace",
    component: MinimalTemplate,
  },
};

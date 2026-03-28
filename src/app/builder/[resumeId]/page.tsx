"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { getResume } from "@/lib/firestore";
import type { ResumeFormData } from "@/lib/types";
import BuilderShell from "@/components/builder/BuilderShell";

// ─── Page (AuthGuard wrapper) ──────────────────────────────────────────────────

export default function EditPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  return (
    <AuthGuard>
      <EditContent resumeId={resumeId} />
    </AuthGuard>
  );
}

// ─── Edit content (loads resume, then renders builder) ─────────────────────────

function EditContent({ resumeId }: { resumeId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [initialData, setInitialData] = useState<ResumeFormData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const resume = await getResume(resumeId);
      if (cancelled) return;

      // Redirect if not found or belongs to a different user
      if (!resume || resume.userId !== user!.uid) {
        router.replace("/dashboard");
        return;
      }

      // Strip server-only fields before passing to the form
      const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...data } =
        resume;
      setInitialData(data as ResumeFormData);
    }

    load().catch(() => {
      if (!cancelled) router.replace("/dashboard");
    });

    return () => {
      cancelled = true;
    };
  }, [resumeId, user, router]);

  if (!initialData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <BuilderShell mode="edit" resumeId={resumeId} initialData={initialData} />
  );
}

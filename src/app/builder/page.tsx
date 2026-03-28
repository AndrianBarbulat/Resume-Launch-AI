"use client";

import AuthGuard from "@/components/AuthGuard";
import BuilderShell from "@/components/builder/BuilderShell";

export default function BuilderPage() {
  return (
    <AuthGuard>
      <BuilderShell mode="create" />
    </AuthGuard>
  );
}

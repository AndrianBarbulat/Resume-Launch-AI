"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/** Spinner shown while auth is initializing or while redirecting unauthenticated users. */
function AuthSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  );
}

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !user) {
      router.replace("/sign-in");
    }
  }, [authReady, user, router]);

  // Still waiting for Firebase to initialise
  if (!authReady) {
    return <AuthSpinner />;
  }

  // User is not authenticated — show spinner until useRouter redirect fires.
  // This prevents a flash of blank content (return null) while routing.
  if (!user) {
    return <AuthSpinner />;
  }

  return <>{children}</>;
}

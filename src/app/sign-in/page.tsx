"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/hooks/useAuth";

type Mode = "signin" | "signup";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/popup-blocked": "Popup was blocked. Please allow popups for this site.",
  "auth/popup-closed-by-user": "", // silent
};

export default function SignInPage() {
  const { user, authReady, signInWithGoogle, signInWithEmail, signUpWithEmail } =
    useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googlePending, setGooglePending] = useState(false);
  const [emailPending, setEmailPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authReady && user) {
      router.replace("/dashboard");
    }
  }, [authReady, user, router]);

  if (!authReady) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[80vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const pending = googlePending || emailPending;

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  }

  async function handleGoogleSignIn() {
    if (pending) return;
    setError("");
    setGooglePending(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err instanceof FirebaseError) {
        const msg =
          FIREBASE_ERRORS[err.code] ?? "Something went wrong. Please try again.";
        if (msg) setError(msg);
      }
      setGooglePending(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError("");
    setEmailPending(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(name.trim(), email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      // success — useEffect above handles redirect
    } catch (err) {
      if (err instanceof FirebaseError) {
        const msg =
          FIREBASE_ERRORS[err.code] ?? "Something went wrong. Please try again.";
        if (msg) setError(msg);
      }
      setEmailPending(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-[80vh] px-4 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-8 py-10 shadow-2xl shadow-black/40">
          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">
              Welcome to ResuLaunch<span className="text-indigo-400">AI</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              {mode === "signin"
                ? "Sign in to continue building your resume"
                : "Create an account to get started"}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-lg bg-slate-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                mode === "signin"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                mode === "signup"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={pending}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors shadow-sm"
          >
            {googlePending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-gray-800" />
            ) : (
              <GoogleIcon />
            )}
            {googlePending ? "Signing in…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500">or continue with email</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} noValidate className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
            />

            {error && <p className="text-red-400 text-xs pt-1">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {emailPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
                  {mode === "signup" ? "Creating account…" : "Signing in…"}
                </>
              ) : mode === "signup" ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-6">
            By continuing you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

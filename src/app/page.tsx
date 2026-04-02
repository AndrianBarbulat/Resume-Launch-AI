"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: "✦",
    title: "AI-Powered Content",
    description:
      "Stuck on what to write? Hit the AI button and Gemini will generate a professional summary, improve your bullet points, or suggest skills relevant to your role. It's not perfect every time, but it gives you a solid starting point.",
  },
  {
    icon: "▤",
    title: "3 Professional Templates",
    description:
      "Pick from Modern (two-column sidebar), Classic (traditional single-column), or Minimal (clean whitespace). The live preview updates as you type so you can see exactly how your resume will look.",
  },
  {
    icon: "⬇",
    title: "Export & Share",
    description:
      "Download your resume as a high-quality PDF, save it to the cloud, or generate a public link you can share with anyone. Your data stays in your Firebase account.",
  },
  {
    icon: "◈",
    title: "Free & Open Source",
    description:
      "This project was built as a learning exercise and portfolio piece. There are no hidden costs, no premium plans, and no data selling. It's free to use and the code is available on GitHub.",
  },
];

const steps = [
  {
    number: "01",
    title: "Fill in your details",
    description:
      "Walk through a guided form — personal info, experience, education, skills.",
  },
  {
    number: "02",
    title: "Let AI help",
    description:
      "Click the AI buttons to generate summaries, improve bullet points, and get skill suggestions.",
  },
  {
    number: "03",
    title: "Export your resume",
    description:
      "Pick a template, preview it live, then download as PDF or share a link.",
  },
];

const techStack = [
  {
    name: "Next.js + TypeScript",
    description: "Built with the framework companies are hiring for",
  },
  {
    name: "Google Gemini AI",
    description: "Free AI that writes and improves your content",
  },
  {
    name: "Firebase",
    description: "Secure auth, real-time database, and cloud storage",
  },
  {
    name: "100% Free",
    description: "No paywalls, no premium tiers, no catch",
  },
];

export default function HomePage() {
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && user) {
      router.replace("/dashboard");
    }
  }, [authReady, user, router]);

  if (!authReady || (authReady && user)) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[80vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-28 sm:py-40">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),transparent)]" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left — copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-800/60 bg-indigo-950/50 text-indigo-400 text-xs font-medium mb-8 tracking-wide uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                AI-Powered Resume Builder
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                Build Your Perfect
                <br />
                Resume{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                  with AI
                </span>
              </h1>

              <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                ResuLaunchAI helps you create professional, ATS-friendly resumes
                in minutes — powered by AI, completely free.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60 hover:-translate-y-0.5"
                >
                  Get Started Free
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium px-8 py-3.5 rounded-xl text-base transition-all hover:-translate-y-0.5"
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* Right — resume builder mockup */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="relative mx-auto max-w-md lg:max-w-full">
                <div className="absolute -inset-4 bg-indigo-600/10 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                    <div className="mx-auto flex-1 max-w-[180px] bg-slate-700/60 rounded px-3 py-0.5 text-slate-500 text-[10px] text-center">
                      resulaunchai.vercel.app/builder
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-800 min-h-[260px]">
                    <div className="flex-1 p-4 space-y-3">
                      <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                        Your Details
                      </p>
                      {[
                        { label: "Full Name", val: "Alex Johnson" },
                        { label: "Job Title", val: "Software Engineer" },
                        { label: "Summary", val: "", multiline: true },
                      ].map((field) => (
                        <div key={field.label}>
                          <p className="text-[9px] text-slate-500 mb-1">
                            {field.label}
                          </p>
                          {field.multiline ? (
                            <div className="h-12 bg-slate-800 rounded-md border border-slate-700/60 p-1.5 space-y-1">
                              <div className="h-1.5 bg-indigo-500/40 rounded w-full" />
                              <div className="h-1.5 bg-slate-700 rounded w-4/5" />
                              <div className="h-1.5 bg-slate-700 rounded w-2/3" />
                            </div>
                          ) : (
                            <div className="bg-slate-800 rounded-md border border-slate-700/60 px-2 py-1.5">
                              <p className="text-[10px] text-slate-300">
                                {field.val}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex-1 h-6 bg-indigo-600/80 rounded text-[9px] text-white flex items-center justify-center font-medium">
                          ✦ Enhance with AI
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-4 bg-white/[0.02]">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Preview
                      </p>
                      <div className="bg-white rounded-md p-3 shadow-sm space-y-2">
                        <div className="border-b border-slate-200 pb-2">
                          <div className="h-2.5 bg-slate-800 rounded w-24 mb-1" />
                          <div className="h-1.5 bg-indigo-500 rounded w-16" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 bg-slate-300 rounded w-full" />
                          <div className="h-1.5 bg-slate-300 rounded w-5/6" />
                          <div className="h-1.5 bg-slate-300 rounded w-4/5" />
                        </div>
                        <div className="pt-1 space-y-1">
                          <div className="h-1.5 bg-slate-200 rounded w-16 mb-1.5" />
                          <div className="h-1.5 bg-slate-300 rounded w-full" />
                          <div className="h-1.5 bg-slate-300 rounded w-5/6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Everything you need to land the job
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Stop spending hours on formatting. Let AI handle the heavy lifting
              while you focus on what matters.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-slate-900 border border-slate-800 rounded-2xl p-7 hover:border-indigo-800/60 hover:bg-slate-900/80 transition-all hover:-translate-y-1"
              >
                <div className="text-2xl text-indigo-400 mb-4 group-hover:scale-110 transition-transform inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold text-base mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Up and running in minutes
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Three simple steps to a resume that gets you noticed.
            </p>
          </div>

          <div className="relative flex flex-col lg:flex-row gap-8 lg:gap-0">
            {steps.map((step, i) => (
              <div key={step.number} className="flex-1 flex flex-col lg:items-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] h-px bg-gradient-to-r from-indigo-800/60 to-indigo-800/20" />
                )}
                {i < steps.length - 1 && (
                  <div className="lg:hidden absolute left-7 top-14 bottom-0 w-px bg-gradient-to-b from-indigo-800/60 to-transparent h-8" />
                )}
                <div className="flex lg:flex-col items-start lg:items-center gap-5 lg:gap-4 lg:text-center">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-600/30 flex items-center justify-center">
                    <span className="text-indigo-400 font-bold text-lg">
                      {step.number}
                    </span>
                  </div>
                  <div className="lg:max-w-[200px]">
                    <h3 className="text-white font-semibold mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Tech Stack */}
      <section className="py-20 px-4 bg-slate-950 border-y border-slate-800/60">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-5">
            A Personal Project, Built to Impress
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            ResuLaunchAI started as a portfolio project to explore the power of AI
            in everyday tools. It&apos;s fully open source, completely free, and built
            with a modern tech stack. Whether you&apos;re a job seeker who needs a quick
            resume or a developer curious about AI integration — feel free to use it,
            fork it, or build on top of it.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map((item) => (
              <div
                key={item.name}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left"
              >
                <p className="text-white font-semibold text-sm mb-1">{item.name}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-4 bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
            Want to give it a try?
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            It takes about 5 minutes to build a resume. No account setup beyond
            Google Sign-In.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-10 py-4 rounded-xl text-base transition-all shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60 hover:-translate-y-0.5"
          >
            Get Started Free
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
          <p className="mt-4 text-slate-600 text-sm">
            No credit card required. Free forever.
          </p>
        </div>
      </section>
    </div>
  );
}

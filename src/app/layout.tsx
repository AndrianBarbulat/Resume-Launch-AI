import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "ResuLaunchAI — Free AI Resume Builder",
    template: "%s | ResuLaunchAI",
  },
  description:
    "Build professional, ATS-friendly resumes in minutes with AI. Free forever. Choose from 3 templates, get AI-powered content suggestions, and export as PDF.",
  keywords: [
    "resume builder",
    "AI resume",
    "free resume maker",
    "ATS resume",
    "professional resume",
  ],
  authors: [{ name: "ResuLaunchAI" }],
  openGraph: {
    title: "ResuLaunchAI — Free AI Resume Builder",
    description: "Create professional resumes with AI. Free forever.",
    url: "https://resulaunchai.vercel.app",
    siteName: "ResuLaunchAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResuLaunchAI — Free AI Resume Builder",
    description: "Create professional resumes with AI. Free forever.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            {children}
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

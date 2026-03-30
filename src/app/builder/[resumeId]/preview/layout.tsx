import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preview Resume",
  description: "Preview and export your resume as a high-quality PDF.",
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

"use client";

import type { Resume } from "@/lib/types";

interface TemplateProps {
  resume: Resume;
}

export function MinimalTemplate({ resume }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, projectsEnabled } = resume;

  const name = personalInfo?.fullName || "Your Name";
  const email = personalInfo?.email || "";
  const phone = personalInfo?.phone || "";
  const location = personalInfo?.location || "";
  const linkedin = personalInfo?.linkedin || "";
  const website = personalInfo?.website || "";

  const contactParts = [email, phone, location, linkedin, website].filter(Boolean);

  function formatDate(date: string, current?: boolean): string {
    if (current) return "Present";
    if (!date) return "";
    const [year, month] = date.split("-");
    if (!year) return date;
    if (month) {
      const d = new Date(Number(year), Number(month) - 1);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    return year;
  }

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        width: "100%",
        minHeight: "1056px",
        backgroundColor: "#ffffff",
        padding: "52px 60px",
        boxSizing: "border-box",
        fontSize: "11pt",
        lineHeight: "1.7",
        color: "#2d3748",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "30pt", fontWeight: "300", margin: "0 0 8px 0", color: "#374151", letterSpacing: "-0.03em", lineHeight: "1.1" }}>
          {name}
        </h1>
        {contactParts.length > 0 && (
          <p style={{ fontSize: "9pt", margin: "0", color: "#9ca3af", letterSpacing: "0.02em", lineHeight: "1.8" }}>
            {contactParts.join("   ·   ")}
          </p>
        )}
      </div>

      {/* Summary */}
      <div style={{ marginBottom: "36px" }}>
        <h2 style={sectionHeading}>Summary</h2>
        <p style={{ margin: "10px 0 0 0", fontSize: "10.5pt", color: summary ? "#4b5563" : "#d1d5db", lineHeight: "1.75", fontWeight: "300" }}>
          {summary || "Professional summary will appear here."}
        </p>
      </div>

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div style={{ marginBottom: "36px" }}>
          <h2 style={sectionHeading}>Experience</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "10px" }}>
            {experience.map((exp) => (
              <div key={exp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                  <div>
                    <span style={{ fontWeight: "600", fontSize: "10.5pt", color: "#374151" }}>
                      {exp.role || "Role"}
                    </span>
                    {exp.company && (
                      <span style={{ fontSize: "10pt", color: "#6b7280", fontWeight: "300" }}>
                        {"  "}·{"  "}{exp.company}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "9pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "16px", fontWeight: "300" }}>
                    {formatDate(exp.startDate)}{(exp.startDate || exp.endDate || exp.current) ? " – " : ""}{formatDate(exp.endDate, exp.current)}
                  </span>
                </div>
                {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                  <ul style={{ margin: "6px 0 0 0", paddingLeft: "0", listStyle: "none" }}>
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} style={{ fontSize: "10pt", color: "#4b5563", marginBottom: "4px", lineHeight: "1.65", fontWeight: "300", paddingLeft: "12px", position: "relative" }}>
                        <span style={{ position: "absolute", left: "0", color: "#9ca3af" }}>–</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {exp.description && (!exp.bullets || exp.bullets.filter(Boolean).length === 0) && (
                  <p style={{ margin: "6px 0 0 0", fontSize: "10pt", color: "#4b5563", lineHeight: "1.65", fontWeight: "300" }}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div style={{ marginBottom: "36px" }}>
          <h2 style={sectionHeading}>Education</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "10px" }}>
            {education.map((edu) => (
              <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <span style={{ fontWeight: "600", fontSize: "10.5pt", color: "#374151" }}>
                    {edu.institution || "Institution"}
                  </span>
                  {(edu.degree || edu.field) && (
                    <span style={{ fontSize: "10pt", color: "#6b7280", fontWeight: "300" }}>
                      {"  "}·{"  "}{[edu.degree, edu.field].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
                {(edu.startDate || edu.endDate) && (
                  <span style={{ fontSize: "9pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "16px", fontWeight: "300" }}>
                    {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div style={{ marginBottom: "36px" }}>
          <h2 style={sectionHeading}>Skills</h2>
          <p style={{ margin: "10px 0 0 0", fontSize: "10pt", color: "#4b5563", fontWeight: "300", lineHeight: "1.7" }}>
            {skills.join(", ")}
          </p>
        </div>
      )}

      {/* Projects */}
      {projectsEnabled && projects && projects.length > 0 && (
        <div>
          <h2 style={sectionHeading}>Projects</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
            {projects.map((proj) => (
              <div key={proj.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                  <span style={{ fontWeight: "600", fontSize: "10.5pt", color: "#374151" }}>
                    {proj.name || "Project Name"}
                  </span>
                  {proj.url && (
                    <span style={{ fontSize: "9pt", color: "#9ca3af", fontWeight: "300" }}>
                      {proj.url}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <p style={{ margin: "0", fontSize: "10pt", color: "#4b5563", lineHeight: "1.65", fontWeight: "300" }}>
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { margin: 0; }
        }
      `}</style>
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: "8pt",
  fontWeight: "600",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#4f6bed",
  margin: "0",
};

"use client";

import type { Resume } from "@/lib/types";

interface TemplateProps {
  resume: Resume;
}

export function ModernTemplate({ resume }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, projectsEnabled } = resume;

  const name = personalInfo?.fullName || "Your Name";
  const email = personalInfo?.email || "";
  const phone = personalInfo?.phone || "";
  const location = personalInfo?.location || "";
  const linkedin = personalInfo?.linkedin || "";
  const website = personalInfo?.website || "";

  const contactItems = [email, phone, location, linkedin, website].filter(Boolean);

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
        display: "flex",
        width: "100%",
        minHeight: "1056px",
        backgroundColor: "#ffffff",
        fontSize: "11pt",
        lineHeight: "1.5",
        color: "#1a1a2e",
      }}
    >
      {/* Left Sidebar */}
      <div
        style={{
          width: "30%",
          backgroundColor: "#1e2a4a",
          color: "#ffffff",
          padding: "32px 20px",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        {/* Name */}
        <div style={{ marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "20px" }}>
          <h1 style={{ fontSize: "20pt", fontWeight: "700", margin: "0 0 4px 0", lineHeight: "1.2", color: "#ffffff" }}>
            {name}
          </h1>
          {resume.title && (
            <p style={{ fontSize: "10pt", color: "#94a3b8", margin: "0", fontWeight: "400" }}>
              {resume.title}
            </p>
          )}
        </div>

        {/* Contact */}
        {contactItems.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h2 style={sidebarHeading}>Contact</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {email && (
                <div style={contactRow}>
                  <span style={contactIcon}>✉</span>
                  <span style={{ wordBreak: "break-all", fontSize: "9.5pt" }}>{email}</span>
                </div>
              )}
              {phone && (
                <div style={contactRow}>
                  <span style={contactIcon}>✆</span>
                  <span style={{ fontSize: "9.5pt" }}>{phone}</span>
                </div>
              )}
              {location && (
                <div style={contactRow}>
                  <span style={contactIcon}>⌖</span>
                  <span style={{ fontSize: "9.5pt" }}>{location}</span>
                </div>
              )}
              {linkedin && (
                <div style={contactRow}>
                  <span style={contactIcon}>in</span>
                  <span style={{ wordBreak: "break-all", fontSize: "9.5pt" }}>{linkedin}</span>
                </div>
              )}
              {website && (
                <div style={contactRow}>
                  <span style={contactIcon}>⌂</span>
                  <span style={{ wordBreak: "break-all", fontSize: "9.5pt" }}>{website}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h2 style={sidebarHeading}>Skills</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    color: "#e2e8f0",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "9pt",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <div>
            <h2 style={sidebarHeading}>Education</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ fontWeight: "600", fontSize: "10pt", color: "#ffffff", marginBottom: "2px" }}>
                    {edu.institution || "Institution"}
                  </div>
                  {(edu.degree || edu.field) && (
                    <div style={{ fontSize: "9.5pt", color: "#cbd5e1", marginBottom: "2px" }}>
                      {[edu.degree, edu.field].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {(edu.startDate || edu.endDate) && (
                    <div style={{ fontSize: "9pt", color: "#94a3b8" }}>
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Main */}
      <div style={{ flex: 1, padding: "32px 28px", boxSizing: "border-box" }}>

        {/* Summary */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={mainHeading}>Professional Summary</h2>
          <p style={{ margin: "8px 0 0 0", fontSize: "10.5pt", color: summary ? "#374151" : "#9ca3af", lineHeight: "1.6" }}>
            {summary || "Professional summary will appear here."}
          </p>
        </div>

        {/* Experience */}
        {experience && experience.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h2 style={mainHeading}>Work Experience</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "10px" }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
                    <div>
                      <span style={{ fontWeight: "700", fontSize: "11pt", color: "#1e293b" }}>
                        {exp.role || "Role"}
                      </span>
                      {exp.company && (
                        <span style={{ fontSize: "10.5pt", color: "#475569" }}>
                          {" · "}{exp.company}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "9.5pt", color: "#94a3b8", whiteSpace: "nowrap", marginLeft: "12px", marginTop: "2px" }}>
                      {formatDate(exp.startDate)} – {formatDate(exp.endDate, exp.current)}
                    </span>
                  </div>
                  {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                    <ul style={{ margin: "6px 0 0 0", paddingLeft: "18px" }}>
                      {exp.bullets.filter(Boolean).map((b, i) => (
                        <li key={i} style={{ fontSize: "10pt", color: "#374151", marginBottom: "3px", lineHeight: "1.5" }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  {exp.description && (!exp.bullets || exp.bullets.filter(Boolean).length === 0) && (
                    <p style={{ margin: "6px 0 0 0", fontSize: "10pt", color: "#374151", lineHeight: "1.5" }}>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projectsEnabled && projects && projects.length > 0 && (
          <div>
            <h2 style={mainHeading}>Projects</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "10px" }}>
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                    <span style={{ fontWeight: "700", fontSize: "10.5pt", color: "#1e293b" }}>
                      {proj.name || "Project Name"}
                    </span>
                    {proj.url && (
                      <span style={{ fontSize: "9pt", color: "#6366f1" }}>{proj.url}</span>
                    )}
                  </div>
                  {proj.description && (
                    <p style={{ margin: "0", fontSize: "10pt", color: "#374151", lineHeight: "1.5" }}>
                      {proj.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

const sidebarHeading: React.CSSProperties = {
  fontSize: "8.5pt",
  fontWeight: "700",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#94a3b8",
  margin: "0 0 10px 0",
  paddingBottom: "4px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const contactRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  color: "#cbd5e1",
};

const contactIcon: React.CSSProperties = {
  fontSize: "10pt",
  flexShrink: 0,
  width: "14px",
  marginTop: "1px",
  color: "#94a3b8",
};

const mainHeading: React.CSSProperties = {
  fontSize: "10pt",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#1e2a4a",
  margin: "0",
  paddingBottom: "6px",
  borderBottom: "2px solid #6366f1",
};

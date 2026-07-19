"use client";

import type { Resume, ResumeFormatting } from "@/lib/types";
import { DEFAULT_FORMATTING } from "@/lib/types";

interface TemplateProps {
  resume: Resume;
  formatting?: ResumeFormatting;
}

export function ClassicTemplate({ resume, formatting = DEFAULT_FORMATTING }: TemplateProps) {
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

  const headerAlign = formatting.headerAlign;
  const headerJustify: React.CSSProperties["justifyContent"] =
    headerAlign === "center" ? "center" : headerAlign === "right" ? "flex-end" : "flex-start";

  return (
    <div
      style={{
        fontFamily: "Georgia, 'Times New Roman', Times, serif",
        width: "100%",
        minHeight: "1056px",
        backgroundColor: "#ffffff",
        padding: "48px 56px",
        boxSizing: "border-box",
        fontSize: "11pt",
        lineHeight: "1.5",
        color: "#111111",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: formatting.headerAlign as React.CSSProperties["textAlign"], marginBottom: "20px" }}>
        <h1 style={{ fontSize: "26pt", fontWeight: "700", margin: "0 0 6px 0", fontFamily: "'Segoe UI', Arial, sans-serif", letterSpacing: "-0.02em", color: "#111111" }}>
          {name}
        </h1>
        {contactParts.length > 0 && (
          <p style={{ fontSize: "9.5pt", margin: "0", color: "#444444", letterSpacing: "0.01em", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            {contactParts.join("  |  ")}
          </p>
        )}
      </div>

      <hr style={divider} />

      {/* Summary */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ ...sectionHeading, textAlign: formatting.sectionAlign }}>Professional Summary</h2>
        <p style={{ margin: "6px 0 0 0", fontSize: "10.5pt", color: summary ? "#222222" : "#aaaaaa", lineHeight: "1.65", textAlign: formatting.bodyAlign as React.CSSProperties["textAlign"] }}>
          {summary || "Professional summary will appear here."}
        </p>
      </div>

      <hr style={divider} />

      {/* Experience */}
      {experience && experience.length > 0 && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ ...sectionHeading, textAlign: formatting.sectionAlign }}>Experience</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "8px" }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <span style={{ fontWeight: "700", fontSize: "11pt", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#111111" }}>
                        {exp.role || "Role"}
                      </span>
                      {exp.company && (
                        <span style={{ fontSize: "10.5pt", color: "#333333", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                          {" — "}{exp.company}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "9.5pt", color: "#555555", whiteSpace: "nowrap", marginLeft: "16px", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                      {formatDate(exp.startDate)} – {formatDate(exp.endDate, exp.current)}
                    </span>
                  </div>
                  {exp.description && (
                    <p style={{ margin: "5px 0 0 0", fontSize: "10.5pt", color: "#222222", lineHeight: "1.55", textAlign: formatting.bodyAlign as React.CSSProperties["textAlign"] }}>
                      {exp.description}
                    </p>
                  )}
                  {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                    <ul style={{ margin: "5px 0 0 0", paddingLeft: "22px" }}>
                      {exp.bullets.filter(Boolean).map((b, i) => (
                        <li key={i} style={{ fontSize: "10.5pt", color: "#222222", marginBottom: "3px", lineHeight: "1.55", textAlign: formatting.bodyAlign as React.CSSProperties["textAlign"] }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          <hr style={divider} />
        </>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ ...sectionHeading, textAlign: formatting.sectionAlign }}>Education</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
              {education.map((edu) => (
                <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <span style={{ fontWeight: "700", fontSize: "10.5pt", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#111111" }}>
                      {edu.institution || "Institution"}
                    </span>
                    {(edu.degree || edu.field) && (
                      <span style={{ fontSize: "10.5pt", color: "#333333", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                        {" — "}{[edu.degree, edu.field].filter(Boolean).join(" in ")}
                      </span>
                    )}
                  </div>
                  {(edu.startDate || edu.endDate) && (
                    <span style={{ fontSize: "9.5pt", color: "#555555", whiteSpace: "nowrap", marginLeft: "16px", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <hr style={divider} />
        </>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ ...sectionHeading, textAlign: formatting.sectionAlign }}>Skills</h2>
            <p style={{ margin: "6px 0 0 0", fontSize: "10.5pt", color: "#222222", lineHeight: "1.6", textAlign: formatting.bodyAlign as React.CSSProperties["textAlign"] }}>
              {skills.join("  ·  ")}
            </p>
          </div>
          {projectsEnabled && projects && projects.length > 0 && <hr style={divider} />}
        </>
      )}

      {/* Projects */}
      {projectsEnabled && projects && projects.length > 0 && (
        <div>
          <h2 style={{ ...sectionHeading, textAlign: formatting.sectionAlign }}>Projects</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
            {projects.map((proj) => (
              <div key={proj.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: "700", fontSize: "10.5pt", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#111111" }}>
                    {proj.name || "Project Name"}
                  </span>
                  {proj.url && (
                    <span style={{ fontSize: "9.5pt", color: "#555555", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                      {proj.url}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <p style={{ margin: "3px 0 0 0", fontSize: "10.5pt", color: "#222222", lineHeight: "1.55", textAlign: formatting.bodyAlign as React.CSSProperties["textAlign"] }}>
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

const divider: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #cccccc",
  margin: "0 0 18px 0",
};

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Segoe UI', Arial, sans-serif",
  fontSize: "11pt",
  fontWeight: "700",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#111111",
  margin: "0 0 2px 0",
};
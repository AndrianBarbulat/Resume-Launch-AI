import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";

interface GenerateDescriptionBody {
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  existingDescription?: string;
  bullets?: string[];
}

/** Compute years worked from YYYY-MM dates. Returns a human-readable string or null. */
function computeYearsWorked(
  startDate?: string,
  endDate?: string,
  current?: boolean,
): string | null {
  if (!startDate) return null;

  const start = new Date(startDate + "-01"); // YYYY-MM → YYYY-MM-DD
  if (isNaN(start.getTime())) return null;

  let end: Date;
  if (current) {
    end = new Date();
  } else if (endDate) {
    end = new Date(endDate + "-01");
    if (isNaN(end.getTime())) return null;
  } else {
    return null;
  }

  const ms = end.getTime() - start.getTime();
  const years = ms / (365.25 * 24 * 60 * 60 * 1000);

  if (years <= 0) return null;

  // Round to 1 decimal place
  const rounded = Math.round(years * 10) / 10;

  if (rounded < 1) {
    // Show months instead
    const months = Math.round(years * 12);
    if (months === 0) return null;
    return months === 1 ? "1 month" : `${months} months`;
  }

  return `${rounded} year${rounded !== 1 ? "s" : ""}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip).allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body: GenerateDescriptionBody = await req.json();
    const {
      role,
      company,
      startDate,
      endDate,
      current = false,
      existingDescription = "",
      bullets = [],
    } = body;

    if (!role?.trim() || !company?.trim()) {
      return NextResponse.json(
        { error: "role and company are required" },
        { status: 400 },
      );
    }

    const yearsWorked = computeYearsWorked(startDate, endDate, current);
    const hasExisting = existingDescription.trim().length > 0;

    // ── 1. Generate/improve description ──────────────────────────────

    let descSystemPrompt: string;
    let descUserParts: string[] = [
      `Role: ${role.trim()}`,
      `Company: ${company.trim()}`,
    ];

    if (yearsWorked) {
      descUserParts.push(`Years in role: ${yearsWorked}`);
    }

    if (hasExisting) {
      // Improve existing description
      descSystemPrompt =
        "You are a professional resume writer. Rewrite and improve the following job description to enhance clarity, flow, and professional impact. Use precise, active language and eliminate vague phrases. Focus on what the person actually accomplished and the scope of their responsibility — draw from the achievements listed below as evidence. Remove filler words and make every sentence count. Never invent specific metrics or numbers. Keep approximately the same length as the original. Return only the improved description text — no JSON, no bullet points, no extra commentary.";
      descUserParts.push(`Current description: ${existingDescription.trim()}`);
    } else {
      // Generate from scratch
      descSystemPrompt =
        "You are a professional resume writer. Write a concise 2-3 sentence role description for a resume. Use strong action verbs and precise language. Describe the core responsibilities, scope of the role, and the nature of the work — what this person owned, led, or contributed to daily. Ground the description in the achievements listed below when available — use them as concrete evidence rather than repeating them. Do NOT invent specific metrics, percentages, or numbers. Keep language direct and professional. If tenure is provided, match the seniority level implied by the years worked (e.g., short tenure = contributor/learner framing, long tenure = leadership/ownership framing). Return only the description text — no JSON, no bullet points, no extra commentary.";
    }

    // Include bullet points as additional context if available
    const meaningfulBullets = bullets.filter((b) => b.trim());
    if (meaningfulBullets.length > 0) {
      descUserParts.push(
        `Key achievements:\n${meaningfulBullets.map((b) => `- ${b}`).join("\n")}`,
      );
    }

    const descUserMessage = descUserParts.join("\n");
    const description = await askAI(descSystemPrompt, descUserMessage, 2048);

    // ── 2. Generate skill suggestions ────────────────────────────────

    const skillsSystemPrompt =
      "You are a career advisor with deep knowledge of industry role requirements. Based on the job title, company type, and years of experience, suggest 3-5 professional skills this person most likely developed in this role. Choose skills that a hiring manager would expect to see for this title and tenure — prioritize in-demand, specific skills over generic ones. Short tenure: focus on core/foundational skills. Long tenure: include advanced, leadership, or architecture-level skills. Return ONLY a valid JSON array of short skill strings (1-3 words each), no other text. Example: [\"Project Management\",\"TypeScript\",\"Agile\"]";

    const skillsUserParts = [`Role: ${role.trim()}`, `Company: ${company.trim()}`];
    if (yearsWorked) {
      skillsUserParts.push(`Years in role: ${yearsWorked}`);
    }
    const skillsUserMessage = skillsUserParts.join("\n");

    let suggestedSkills: string[] = [];
    try {
      const raw = await askAI(skillsSystemPrompt, skillsUserMessage, 512);

      // Strip markdown code fences if the AI wrapped the JSON in ```json ... ```
      let clean = raw.trim();
      if (clean.startsWith("```")) {
        clean = clean
          .replace(/^```(?:json)?\s*\n?/i, "")
          .replace(/\n?```\s*$/, "")
          .trim();
      }

      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        suggestedSkills = parsed
          .map((s: unknown) => (typeof s === "string" ? s.trim() : ""))
          .filter((s: string) => s.length > 0 && s.length <= 50);
      }
    } catch {
      // Skills are best-effort — if parsing fails, return empty array
      suggestedSkills = [];
    }

    return NextResponse.json({ description, suggestedSkills });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 },
    );
  }
}
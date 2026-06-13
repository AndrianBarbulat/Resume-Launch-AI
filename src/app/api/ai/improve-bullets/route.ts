import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";

interface ImproveBulletsBody {
  role: string;
  company: string;
  bullets: string[];
  description?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

/** Compute years worked from YYYY-MM dates. Returns a human-readable string or null. */
function computeYearsWorked(
  startDate?: string,
  endDate?: string,
  current?: boolean,
): string | null {
  if (!startDate) return null;

  const start = new Date(startDate + "-01");
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

  const rounded = Math.round(years * 10) / 10;

  if (rounded < 1) {
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

    const body: ImproveBulletsBody = await req.json();
    const {
      role,
      company,
      bullets,
      description = "",
      startDate,
      endDate,
      current = false,
    } = body;

    if (!role?.trim() || !company?.trim()) {
      return NextResponse.json({ error: "role and company are required" }, { status: 400 });
    }

    const yearsWorked = computeYearsWorked(startDate, endDate, current);
    const hasDescription = description.trim().length > 0;
    const hasBullets = bullets.length > 0 && bullets.some((b) => b.trim().length > 0);

    // ── Context lines shared across generate & improve ────────────────

    const contextParts: string[] = [
      `Role: ${role.trim()}`,
      `Company: ${company.trim()}`,
    ];

    if (yearsWorked) {
      contextParts.push(`Years in role: ${yearsWorked}`);
    }

    if (hasDescription) {
      contextParts.push(`Role description: ${description.trim()}`);
    }

    let systemPrompt: string;
    let userMessage: string;

    if (!hasBullets) {
      // ── GENERATE from scratch ──────────────────────────────────────

      systemPrompt =
        "You are a professional resume writer. Based on the job title, company, tenure, and role description provided, generate 5 powerful, specific achievement bullet points for the \"Key Responsibilities / Achievements\" section of a resume. Each bullet must be a complete, detailed statement using the STAR approach (Situation, Task, Action, Result). Every bullet MUST include: a strong action verb at the start, specific context and scope, a quantifiable result (invent realistic metrics where needed — percentages, dollar amounts, team sizes, timeframes), and the business impact or outcome. Use the role description as primary evidence for what this person actually did. Do NOT repeat the same information — each bullet should cover a distinct achievement or responsibility area. Return ONLY a valid JSON array of 5 bullet strings, no other text.";

      const extraContext = [
        "There are currently no bullet points. Generate 5 new, distinct achievement bullets.",
        "Ground each bullet in the role context provided. Invent realistic, specific metrics.",
      ];

      userMessage = [...contextParts, ...extraContext].join("\n");
    } else {
      // ── IMPROVE existing bullets ───────────────────────────────────

      systemPrompt =
        "You are a professional resume writer. Dramatically improve the following resume bullet points for the given role. Transform each bullet into a powerful, detailed achievement statement using the STAR method (Situation, Task, Action, Result). Every bullet MUST include: a strong action verb at the start, specific context about what was done and why, quantifiable metrics (percentages, dollar amounts, team sizes, timeframes — invent realistic ones if not provided), the tools or technologies used, and the business impact or outcome. Use the role description and tenure as additional context to enrich the bullets with authenticity. Do not write short generic bullets — each one should read like a mini success story. Return ONLY a valid JSON array of improved bullet strings, no other text. Return the exact same number of bullets as provided.";

      userMessage = [
        ...contextParts,
        `Current bullets:\n${JSON.stringify(bullets)}`,
      ].join("\n");
    }

    const raw = await askAI(systemPrompt, userMessage, 4096);

    // Strip markdown code fences if the AI wrapped the JSON in ```json ... ```
    let clean = raw.trim();
    if (clean.startsWith("```")) {
      clean = clean
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/, "")
        .trim();
    }

    let result: string[];
    try {
      result = JSON.parse(clean);
      if (!Array.isArray(result)) throw new Error("not an array");
    } catch {
      // Fallback: extract lines that look like bullet content
      result = clean
        .split("\n")
        .map((l) => l.replace(/^[\s\-\*\d.\)"]+/, "").trim())
        .filter(Boolean)
        .slice(0, hasBullets ? bullets.length : 5);
    }

    // When improving: preserve original bullet count
    if (hasBullets) {
      const origLen = bullets.length;
      if (result.length < origLen) {
        result = [...result, ...Array<string>(origLen - result.length).fill("")];
      } else if (result.length > origLen) {
        result = result.slice(0, origLen);
      }
    }

    return NextResponse.json({ bullets: result });
  } catch {
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
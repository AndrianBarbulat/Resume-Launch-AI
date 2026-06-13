import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";

interface SuggestSkillsBody {
  jobTitle: string;
  currentSkills: string[];
  experience: string;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip).allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body: SuggestSkillsBody = await req.json();
    const { jobTitle, currentSkills, experience } = body;

    if (!jobTitle) {
      return NextResponse.json({ error: "jobTitle is required" }, { status: 400 });
    }

    const systemPrompt =
      "You are an elite career advisor and resume specialist with deep knowledge of what Fortune 500 hiring managers and ATS systems prioritize. Based on the job title and experience provided, suggest 20 highly relevant skills that would significantly strengthen a resume. Be extremely thorough and include ALL of the following categories: core technical skills specific to the role (6-8 skills), industry-standard tools, platforms, and software (4-5 skills), methodologies, frameworks, and processes (3-4 skills), leadership and management skills (2-3 skills), and critical soft skills that top employers look for (3-4 skills). Order them by relevance and impact — most important first. Each skill should be specific, not generic — for example 'Agile/Scrum Project Management' instead of just 'Project Management', or 'PostgreSQL Database Administration' instead of just 'Databases'. Do not repeat any skills already listed. Return ONLY a valid JSON array of skill strings, no other text or explanation.";

    const parts = [`Job Title: ${jobTitle}`];
    if (experience) parts.push(`Experience: ${experience}`);
    if (currentSkills && currentSkills.length > 0) {
      parts.push(`Skills already listed (do not repeat): ${currentSkills.join(", ")}`);
    }
    const userMessage = parts.join("\n");

    const raw = await askAI(systemPrompt, userMessage, 4096);

    // Strip markdown code fences if the AI wrapped the JSON in ```json ... ```
    let clean = raw.trim();
    if (clean.startsWith("```")) {
      clean = clean
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/, "")
        .trim();
    }

    let skills: string[];
    try {
      skills = JSON.parse(clean);
      if (!Array.isArray(skills)) throw new Error("not an array");
    } catch {
      skills = clean
        .split("\n")
        .map((l) => l.replace(/^[\s\-\*\d.\)\"]+/, "").replace(/[\"]+$/, "").trim())
        .filter(Boolean);
    }

    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

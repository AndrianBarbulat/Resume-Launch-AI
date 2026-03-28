import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/openai";
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
      "You are a career advisor. Based on the job title and experience provided, suggest 10 relevant technical and soft skills that would strengthen a resume. Do not repeat any skills already listed. Return ONLY a valid JSON array of skill strings, no other text or explanation.";

    const parts = [`Job Title: ${jobTitle}`];
    if (experience) parts.push(`Experience: ${experience}`);
    if (currentSkills && currentSkills.length > 0) {
      parts.push(`Skills already listed (do not repeat): ${currentSkills.join(", ")}`);
    }
    const userMessage = parts.join("\n");

    const raw = await askAI(systemPrompt, userMessage, 400);

    let skills: string[];
    try {
      skills = JSON.parse(raw);
      if (!Array.isArray(skills)) throw new Error("not an array");
    } catch {
      skills = raw
        .split("\n")
        .map((l) => l.replace(/^[\s\-\*\d.\)\"]+/, "").replace(/[\"]+$/, "").trim())
        .filter(Boolean);
    }

    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

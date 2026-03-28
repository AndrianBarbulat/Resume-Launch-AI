import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";

interface SummaryBody {
  jobTitle: string;
  experience: string;
  skills: string[];
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip).allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body: SummaryBody = await req.json();
    const { jobTitle, experience, skills } = body;

    if (!jobTitle) {
      return NextResponse.json({ error: "jobTitle is required" }, { status: 400 });
    }
    const systemPrompt =
      "You are a professional resume writer. Generate a compelling 2-3 sentence professional summary for a resume. Focus on key strengths, years of experience, and value proposition. Do not use first person (I, my). Write in third person implied tone like real resumes use. Keep it under 1000 characters.";

    const parts: string[] = [`Job Title: ${jobTitle}`];
    if (experience) parts.push(`Experience: ${experience}`);
    if (skills && skills.length > 0) parts.push(`Skills: ${skills.join(", ")}`);
    const userMessage = parts.join("\n");

    const summary = await askAI(systemPrompt, userMessage, 300);
    return NextResponse.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ai/summary]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

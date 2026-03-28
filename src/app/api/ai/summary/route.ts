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
      "You are an elite professional resume writer with 20+ years of experience placing candidates at Fortune 500 companies. Generate the LONGEST and MOST DETAILED professional summary possible for a resume. Write a full, rich paragraph — at minimum 6-8 sentences. Cover ALL of the following in depth: years and breadth of experience, specific technical skills and tools mastered, industry domains and sectors worked in, leadership and team collaboration capabilities, key methodologies and frameworks used, measurable achievements and impact delivered, unique strengths and differentiators, and a powerful closing statement about career goals and value brought to future employers. Do not use first person (I, my). Write in third person implied tone. Be extremely thorough — leave nothing out. Do not summarize briefly. Expand on every point. The longer and more detailed, the better. Do NOT cut short. Use the full response length available to you. Never use placeholder brackets like [Job Title] or [Number] — write real, specific content based on the information provided. Output only the summary text — no labels, no quotes, no commentary.";

    const parts: string[] = [`Job Title: ${jobTitle}`];
    if (experience) parts.push(`Experience: ${experience}`);
    if (skills && skills.length > 0) parts.push(`Skills: ${skills.join(", ")}`);
    const userMessage = parts.join("\n");

    const summary = await askAI(systemPrompt, userMessage, 4096);
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

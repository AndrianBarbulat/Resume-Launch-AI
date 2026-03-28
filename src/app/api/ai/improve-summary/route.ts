import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";

interface ImproveSummaryBody {
  currentSummary: string;
  jobTitle: string;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip).allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body: ImproveSummaryBody = await req.json();
    const { currentSummary, jobTitle } = body;

    if (!currentSummary || currentSummary.trim().length < 20) {
      return NextResponse.json(
        { error: "currentSummary must be at least 20 characters" },
        { status: 400 }
      );
    }

    const systemPrompt =
      "You are an elite professional resume writer with 20+ years of experience. Take the following professional summary and DRAMATICALLY expand and improve it. Make it at minimum 6-8 sentences — a full, rich paragraph. Add significantly more detail about: specific technical expertise, measurable achievements with numbers and percentages, leadership experience, industry knowledge, methodologies used, tools and platforms mastered, soft skills demonstrated through examples, and career impact. Enhance every vague statement with concrete specifics. Do not shorten — only expand and enrich. The improved version must be substantially longer and more detailed than the original. Do not use first person. Use the full response length available to you. Return ONLY the improved summary text, nothing else.";

    const parts = [`Current Summary: ${currentSummary}`];
    if (jobTitle) parts.push(`Job Title: ${jobTitle}`);
    const userMessage = parts.join("\n");

    const summary = await askAI(systemPrompt, userMessage, 4096);
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

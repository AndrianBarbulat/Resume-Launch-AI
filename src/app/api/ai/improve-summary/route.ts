import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/openai";
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
      "You are a professional resume writer. Improve the following professional summary. Make it more compelling, concise, and impactful. Keep the same general meaning but enhance the language and professionalism. Do not use first person. Keep it under 500 characters. Return ONLY the improved summary text, nothing else.";

    const parts = [`Current Summary: ${currentSummary}`];
    if (jobTitle) parts.push(`Job Title: ${jobTitle}`);
    const userMessage = parts.join("\n");

    const summary = await askAI(systemPrompt, userMessage, 300);
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

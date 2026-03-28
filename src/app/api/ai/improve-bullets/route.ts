import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";

interface ImproveBulletsBody {
  role: string;
  company: string;
  bullets: string[];
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip).allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body: ImproveBulletsBody = await req.json();
    const { role, company, bullets } = body;

    if (!role || !company) {
      return NextResponse.json({ error: "role and company are required" }, { status: 400 });
    }
    if (!bullets || bullets.length === 0) {
      return NextResponse.json(
        { error: "bullets must have at least 1 entry" },
        { status: 400 }
      );
    }

    const systemPrompt =
      "You are an elite professional resume writer with 20+ years of experience. Dramatically improve the following resume bullet points for the given role. Transform each bullet into a powerful, DETAILED achievement statement using the STAR method (Situation, Task, Action, Result). Make each bullet as long and descriptive as possible — aim for 150-250 characters per bullet. Every bullet MUST include: a strong action verb at the start, specific context about what was done and why, quantifiable metrics (percentages, dollar amounts, team sizes, timeframes — invent realistic ones if not provided), the tools or technologies used, and the business impact or outcome achieved. Do not write short generic bullets — each one should read like a mini success story. Return ONLY a valid JSON array of improved bullet strings, no other text or explanation. Return the exact same number of bullets as provided.";

    const userMessage = [
      `Role: ${role}`,
      `Company: ${company}`,
      `Bullets:\n${JSON.stringify(bullets)}`,
    ].join("\n");

    const raw = await askAI(systemPrompt, userMessage, 4096);

    let improved: string[];
    try {
      improved = JSON.parse(raw);
      if (!Array.isArray(improved)) throw new Error("not an array");
    } catch {
      // Fallback: extract lines that look like bullet content
      improved = raw
        .split("\n")
        .map((l) => l.replace(/^[\s\-\*\d.\)]+/, "").trim())
        .filter(Boolean)
        .slice(0, bullets.length);
    }

    return NextResponse.json({ bullets: improved });
  } catch {
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

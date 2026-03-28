import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/openai";
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
      "You are a professional resume writer. Improve the following resume bullet points for the given role. Make them more impactful using strong action verbs, quantifiable achievements where possible, and concise professional language. Return ONLY a valid JSON array of improved bullet strings, no other text or explanation. Keep each bullet under 150 characters. Return the exact same number of bullets as provided.";

    const userMessage = [
      `Role: ${role}`,
      `Company: ${company}`,
      `Bullets:\n${JSON.stringify(bullets)}`,
    ].join("\n");

    const raw = await askAI(systemPrompt, userMessage, 500);

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

import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";

interface ImproveEducationBody {
  institution: string;
  degree: string;
  field: string;
  existingDescription?: string;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip).allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body: ImproveEducationBody = await req.json();
    const { institution, degree, field, existingDescription = "" } = body;

    if (!institution?.trim() || !degree?.trim() || !field?.trim()) {
      return NextResponse.json(
        { error: "institution, degree, and field are required" },
        { status: 400 },
      );
    }

    const hasExisting = existingDescription.trim().length > 0;

    let systemPrompt: string;
    const userParts: string[] = [
      `Institution: ${institution.trim()}`,
      `Degree: ${degree.trim()}`,
      `Field of Study: ${field.trim()}`,
    ];

    if (hasExisting) {
      systemPrompt =
        "You are a professional resume writer. Rewrite and improve the following education description to enhance clarity, flow, and professional impact. Use precise, active language and eliminate vague phrases. Highlight academic focus, key learning areas, relevant coursework, projects, honors, or research — whatever is mentioned. Keep approximately the same length as the original. Return only the improved description text — no JSON, no bullet points, no extra commentary.";
      userParts.push(`Current description: ${existingDescription.trim()}`);
    } else {
      systemPrompt =
        "You are a professional resume writer. Write a concise 2-3 sentence education description for a resume. Describe the course of study, academic focus, key learning areas, and any notable aspects like honors, relevant coursework, research, or projects — grounded in the degree, field, and institution provided. Use professional language and strong framing. Do not invent specific GPA, awards, or honors unless implied by the context. Return only the description text — no JSON, no bullet points, no extra commentary.";
    }

    const userMessage = userParts.join("\n");
    const description = await askAI(systemPrompt, userMessage, 2048);

    return NextResponse.json({ description });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 },
    );
  }
}
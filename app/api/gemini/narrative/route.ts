import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  let description = "";
  try {
    const body = await req.json();
    description = body.description ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!description.trim()) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }

  const prompt =
    `Rewrite the following incident description in clear, professional legal language ` +
    `suitable for a small claims court filing. ` +
    `Keep it factual and concise (under 180 words). ` +
    `Do not add facts not present in the original. ` +
    `Return only the rewritten paragraph — no headings, no preamble.\n\n${description}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 350, temperature: 0.25 },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Gemini error" }, { status: 502 });
    }

    const json = await res.json();
    const narrative: string =
      json.candidates?.[0]?.content?.parts?.[0]?.text ?? description;
    return NextResponse.json({ narrative: narrative.trim() });
  } catch {
    return NextResponse.json({ narrative: description });
  }
}

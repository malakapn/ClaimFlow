import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const CLAIM_LABELS: Record<string, string> = {
  unpaid_debt: "unpaid debt",
  property_damage: "property damage",
  security_deposit: "security deposit refusal",
  breach_contract: "breach of contract",
  personal_injury: "personal injury",
  faulty_goods: "faulty goods or services",
  harassment: "harassment or nuisance",
  other: "a civil dispute",
};

export async function GET(req: NextRequest) {
  const claimType = req.nextUrl.searchParams.get("claimType") ?? "";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const label = CLAIM_LABELS[claimType] ?? "a civil dispute";

  const prompt =
    `You are a small claims court advisor. For a case involving ${label}, ` +
    `list exactly 6 specific pieces of evidence the plaintiff should gather. ` +
    `Return ONLY a valid JSON array of short strings (under 12 words each). ` +
    `No extra text, no markdown, no code fences. ` +
    `Example: ["Signed contract dated [date]","Bank statement showing payment made"]`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.2 },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Gemini error" }, { status: 502 });
    }

    const json = await res.json();
    const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    const evidence: string[] = match ? JSON.parse(match[0]) : [];
    return NextResponse.json({ evidence });
  } catch {
    return NextResponse.json({ evidence: [] });
  }
}

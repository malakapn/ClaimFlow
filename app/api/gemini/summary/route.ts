import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const CLAIM_LABELS: Record<string, string> = {
  unpaid_debt: "Unpaid Debt",
  property_damage: "Property Damage",
  security_deposit: "Security Deposit (Wrongful Withholding)",
  breach_contract: "Breach of Contract",
  personal_injury: "Personal Injury",
  faulty_goods: "Faulty Goods / Services",
  harassment: "Harassment / Nuisance",
  other: "Civil Dispute",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  let data: Record<string, string> = {};
  try {
    const body = await req.json();
    data = body.data ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const claimLabel = CLAIM_LABELS[data.claimType] ?? "Civil Dispute";

  const prompt =
    `Write a 2–3 sentence professional legal case summary for a small claims court filing. ` +
    `Use third person, past tense, formal legal style. ` +
    `Return only the summary — no headings, no preamble.\n\n` +
    `Plaintiff: ${data.plName || "Plaintiff"}\n` +
    `Defendant: ${data.defName || "Defendant"} (${data.defType || "individual"})\n` +
    `Claim Type: ${claimLabel}\n` +
    `Amount in Dispute: $${data.amountTotal || "0"}\n` +
    `Incident Date: ${data.incidentDate || "unknown"}\n` +
    `Facts: ${data.incidentDesc || "See filing"}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.2 },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Gemini error" }, { status: 502 });
    }

    const json = await res.json();
    const summary: string =
      json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return NextResponse.json({ summary: summary.trim() });
  } catch {
    return NextResponse.json({ summary: "" });
  }
}

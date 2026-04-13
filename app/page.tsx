"use client";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type Tier = "basic" | "pro" | "premium" | null;
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=landing, 1-5=wizard, 6=download

interface ClaimData {
  // Step 1 – Defendant
  defName: string;
  defAddress: string;
  defCity: string;
  defState: string;
  defZip: string;
  defType: "individual" | "business" | "";
  // Step 2 – Claim type
  claimType: string;
  // Step 3 – Incident
  incidentDate: string;
  incidentDesc: string;
  evidence: string;
  // Step 4 – Amount
  amountTotal: string;
  amountBreakdown: string;
  // Step 5 – Plaintiff
  plName: string;
  plEmail: string;
  plPhone: string;
  plAddress: string;
  plCity: string;
  plState: string;
  plZip: string;
}

const EMPTY: ClaimData = {
  defName: "", defAddress: "", defCity: "", defState: "", defZip: "", defType: "",
  claimType: "",
  incidentDate: "", incidentDesc: "", evidence: "",
  amountTotal: "", amountBreakdown: "",
  plName: "", plEmail: "", plPhone: "", plAddress: "", plCity: "", plState: "", plZip: "",
};

const CLAIM_TYPES = [
  { id: "unpaid_debt", label: "Unpaid Debt", icon: "💰" },
  { id: "property_damage", label: "Property Damage", icon: "🏠" },
  { id: "security_deposit", label: "Security Deposit", icon: "🔑" },
  { id: "breach_contract", label: "Breach of Contract", icon: "📄" },
  { id: "personal_injury", label: "Personal Injury", icon: "🩹" },
  { id: "faulty_goods", label: "Faulty Goods / Services", icon: "🛠️" },
  { id: "harassment", label: "Harassment / Nuisance", icon: "🚫" },
  { id: "other", label: "Other", icon: "⚖️" },
];

const STEPS = ["Defendant", "Claim Type", "Incident", "Amount", "Your Info"];

// ── PDF Generation ─────────────────────────────────────────────────────────
async function generatePDF(data: ClaimData, tier: Tier) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 60;
  let y = 60;

  const heading = (text: string, size = 16) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(15, 40, 80);
    doc.text(text, margin, y);
    y += size + 8;
  };
  const sub = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(value || "—", W - margin * 2 - 120);
    doc.text(lines, margin + 120, y);
    y += Math.max(14, lines.length * 12) + 4;
  };
  const rule = () => {
    doc.setDrawColor(200, 210, 230);
    doc.line(margin, y, W - margin, y);
    y += 14;
  };
  const newPage = () => { doc.addPage(); y = 60; };

  // Header bar
  doc.setFillColor(15, 40, 80);
  doc.rect(0, 0, W, 40, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("ClaimFlow", margin, 26);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Small Claims Court Preparation Packet", W - margin, 26, { align: "right" });
  y = 70;

  heading("CASE SUMMARY", 18);
  rule();
  sub("Plaintiff", data.plName);
  sub("Defendant", data.defName + (data.defType ? ` (${data.defType})` : ""));
  sub("Claim Type", CLAIM_TYPES.find(c => c.id === data.claimType)?.label || data.claimType);
  sub("Amount Claimed", `$${data.amountTotal}`);
  sub("Incident Date", data.incidentDate);
  y += 10;

  heading("CASE NARRATIVE");
  rule();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  const narrative = `${data.plName} brings this small claims action against ${data.defName} arising from ${CLAIM_TYPES.find(c => c.id === data.claimType)?.label?.toLowerCase() || "a dispute"} on or about ${data.incidentDate}. ${data.incidentDesc}`;
  const narLines = doc.splitTextToSize(narrative, W - margin * 2);
  doc.text(narLines, margin, y);
  y += narLines.length * 13 + 16;

  heading("AMOUNT BREAKDOWN");
  rule();
  sub("Total Claimed", `$${data.amountTotal}`);
  if (data.amountBreakdown) sub("Breakdown", data.amountBreakdown);
  y += 10;

  heading("FILING CHECKLIST");
  rule();
  const checklist = [
    "Complete the court's official plaintiff claim form",
    "Make 3 copies of all documents (court, defendant, your copy)",
    "Pay the filing fee at the court clerk's office",
    "Arrange for defendant service (sheriff, certified mail, or process server)",
    "Gather all evidence: receipts, photos, contracts, messages",
    "Confirm the court's small claims dollar limit for your state",
    "Mark your hearing date and arrive 15 minutes early",
  ];
  doc.setFontSize(10);
  checklist.forEach(item => {
    doc.setTextColor(20, 20, 20);
    doc.text("☐  " + item, margin, y);
    y += 16;
  });

  // PRO / PREMIUM extras
  if (tier === "pro" || tier === "premium") {
    newPage();
    heading("EVIDENCE CHECKLIST");
    rule();
    sub("Evidence Described", data.evidence || "None provided");
    y += 8;
    const evChecklist = [
      "Written contracts or agreements",
      "Text messages / emails / chat logs",
      "Photos or videos of damage",
      "Receipts, invoices, bank statements",
      "Witness names and contact info",
      "Any prior demands or complaints sent",
    ];
    evChecklist.forEach(item => {
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      doc.text("☐  " + item, margin, y);
      y += 16;
    });

    y += 10;
    heading("HEARING SCRIPT");
    rule();
    const script = `Good morning / afternoon, Your Honor. My name is ${data.plName}, and I am the plaintiff in this matter.\n\nI am here today because ${data.defName} owes me $${data.amountTotal} as a result of ${CLAIM_TYPES.find(c => c.id === data.claimType)?.label?.toLowerCase() || "the incident described"}.\n\nOn or about ${data.incidentDate}, ${data.incidentDesc}\n\nI have brought the following evidence to support my claim: ${data.evidence || "documents and records as described in my filing"}.\n\nI am requesting that the court award me $${data.amountTotal} plus any applicable court costs. Thank you.`;
    const scriptLines = doc.splitTextToSize(script, W - margin * 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(scriptLines, margin, y);
    y += scriptLines.length * 13 + 16;

    heading("CASE TIMELINE");
    rule();
    sub("Incident Date", data.incidentDate);
    sub("Filing Date", new Date().toLocaleDateString());
    sub("Next Step", "Await hearing notice from court clerk (typically 30–70 days)");
  }

  if (tier === "premium") {
    newPage();
    heading("DEFENDANT SERVICE INSTRUCTIONS");
    rule();
    sub("Defendant Name", data.defName);
    sub("Defendant Address", `${data.defAddress}, ${data.defCity}, ${data.defState} ${data.defZip}`);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    const serviceSteps = [
      "1. After filing, obtain the court-stamped summons from the clerk.",
      "2. Choose a service method: Certified Mail, Sheriff / Marshal, or Process Server.",
      "3. Certified Mail: Send via USPS Certified Mail Return Receipt. Keep the green card.",
      "4. Sheriff Service: Pay the sheriff's fee (typically $25–$75) and provide defendant's address.",
      "5. File Proof of Service with the court at least 5–15 days before the hearing.",
      "6. If defendant cannot be located, ask the clerk about substitute service options.",
    ];
    serviceSteps.forEach(step => {
      const lines = doc.splitTextToSize(step, W - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 14 + 4;
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "ClaimFlow • For informational purposes only. Not legal advice. Consult an attorney for your specific situation.",
      W / 2, doc.internal.pageSize.getHeight() - 20,
      { align: "center" }
    );
    doc.text(`Page ${i} of ${pageCount}`, W - margin, doc.internal.pageSize.getHeight() - 20, { align: "right" });
  }

  doc.save(`ClaimFlow_${data.plName.replace(/\s+/g, "_")}_${tier}.pdf`);
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState<Step>(0);
  const [data, setData] = useState<ClaimData>(EMPTY);
  const [tier, setTier] = useState<Tier>(null);
  const [generating, setGenerating] = useState(false);

  const set = (field: keyof ClaimData, value: string) =>
    setData(prev => ({ ...prev, [field]: value }));

  const handleGenerate = async (selectedTier: Tier) => {
    setTier(selectedTier);
    setGenerating(true);
    await generatePDF(data, selectedTier);
    setGenerating(false);
    setStep(6);
  };

  // ── Landing ──────────────────────────────────────────────────────────────
  if (step === 0) return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f8f6f1", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ background: "#0f2850", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 22, letterSpacing: 1 }}>⚖️ ClaimFlow</span>
        <button onClick={() => setStep(1)} style={{ background: "#e8b84b", color: "#0f2850", border: "none", borderRadius: 6, padding: "8px 22px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
          Start My Claim →
        </button>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f2850 0%, #1a3d6e 60%, #0f2850 100%)", padding: "90px 40px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(232,184,75,0.15)", border: "1px solid rgba(232,184,75,0.4)", borderRadius: 20, padding: "6px 18px", marginBottom: 24 }}>
          <span style={{ color: "#e8b84b", fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>SMALL CLAIMS MADE SIMPLE</span>
        </div>
        <h1 style={{ color: "#fff", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 700, maxWidth: 700, margin: "0 auto 20px", lineHeight: 1.2 }}>
          File Your Small Claims Case<br />
          <span style={{ color: "#e8b84b" }}>with Confidence</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 18, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Answer 5 simple questions. Get a court-ready PDF packet — case narrative, filing checklist, and hearing script — in minutes.
        </p>
        <button onClick={() => setStep(1)} style={{ background: "#e8b84b", color: "#0f2850", border: "none", borderRadius: 8, padding: "16px 44px", fontWeight: 800, cursor: "pointer", fontSize: 18, boxShadow: "0 4px 24px rgba(232,184,75,0.4)" }}>
          Start My Claim — Free →
        </button>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 14 }}>No account required · Pay only when you download</p>
      </div>

      {/* Claim type tags */}
      <div style={{ background: "#fff", padding: "28px 40px", borderBottom: "1px solid #e8e4dc", textAlign: "center" }}>
        <p style={{ color: "#888", fontSize: 12, letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>We handle</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {CLAIM_TYPES.map(c => (
            <span key={c.id} style={{ background: "#f0ede6", border: "1px solid #ddd8cc", borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#333" }}>
              {c.icon} {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: "70px 40px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "#e8b84b", fontWeight: 700, letterSpacing: 2, fontSize: 12, textTransform: "uppercase", marginBottom: 12 }}>How It Works</p>
        <h2 style={{ color: "#0f2850", fontSize: 28, fontWeight: 700, marginBottom: 48 }}>Three steps to court-ready</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
          {[
            { n: "1", t: "Answer 5 Questions", d: "Tell us about the dispute, defendant, incident date, and amount owed." },
            { n: "2", t: "Choose Your Package", d: "Pick Basic, Pro, or Premium based on how much support you need." },
            { n: "3", t: "Download Your Packet", d: "Get a professional PDF ready to take to court — instantly on your device." },
          ].map(s => (
            <div key={s.n} style={{ background: "#fff", borderRadius: 12, padding: "32px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#0f2850", color: "#e8b84b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, margin: "0 auto 18px" }}>{s.n}</div>
              <h3 style={{ color: "#0f2850", fontWeight: 700, marginBottom: 10, fontSize: 17 }}>{s.t}</h3>
              <p style={{ color: "#666", lineHeight: 1.7, fontSize: 14 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{ background: "#0f2850", padding: "70px 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#e8b84b", fontWeight: 700, letterSpacing: 2, fontSize: 12, textTransform: "uppercase", marginBottom: 12 }}>Pricing</p>
          <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginBottom: 48 }}>Pay once. Download instantly.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {[
              { id: "basic", name: "Basic", price: "$19.99", badge: null, features: ["Case Summary", "Court-ready PDF", "Timeline + Claim Structure", "Filing Checklist"] },
              { id: "pro", name: "Pro", price: "$29.99", badge: "BEST SELLER", features: ["Everything in Basic", "Evidence Checklist", "Hearing Script", "Case Timeline", "Multiple Document Formats"] },
              { id: "premium", name: "Premium", price: "$39.99", badge: null, features: ["Everything in Pro", "Defendant Service Instructions", "Priority Processing", "Step-by-step Service Guide"] },
            ].map(p => (
              <div key={p.id} style={{ background: p.badge ? "#e8b84b" : "rgba(255,255,255,0.08)", borderRadius: 14, padding: "36px 28px", border: p.badge ? "none" : "1px solid rgba(255,255,255,0.12)", position: "relative" }}>
                {p.badge && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#0f2850", color: "#e8b84b", borderRadius: 20, padding: "4px 16px", fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>{p.badge}</div>}
                <h3 style={{ color: p.badge ? "#0f2850" : "#fff", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>{p.name}</h3>
                <div style={{ color: p.badge ? "#0f2850" : "#e8b84b", fontSize: 36, fontWeight: 800, marginBottom: 20 }}>{p.price}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", textAlign: "left" }}>
                  {p.features.map(f => (
                    <li key={f} style={{ color: p.badge ? "#0f2850" : "rgba(255,255,255,0.85)", fontSize: 14, marginBottom: 10, paddingLeft: 22, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setStep(1)} style={{ width: "100%", background: p.badge ? "#0f2850" : "#e8b84b", color: p.badge ? "#e8b84b" : "#0f2850", border: "none", borderRadius: 8, padding: "13px", fontWeight: 800, cursor: "pointer", fontSize: 15 }}>
                  Get Started →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why this exists */}
      <div style={{ padding: "70px 40px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "#e8b84b", fontWeight: 700, letterSpacing: 2, fontSize: 12, textTransform: "uppercase", marginBottom: 12 }}>Why This Exists</p>
        <h2 style={{ color: "#0f2850", fontSize: 26, fontWeight: 700, marginBottom: 20 }}>The courts are public. The process shouldn't be a mystery.</h2>
        <p style={{ color: "#555", lineHeight: 1.9, fontSize: 16 }}>
          Most people who have a legitimate small claims case never file — not because they don't have a case, but because the paperwork, process, and courtroom feel overwhelming. ClaimFlow levels the playing field. We turn your situation into a court-ready packet so you walk in prepared, not panicked.
        </p>
      </div>

      {/* Footer */}
      <footer style={{ background: "#0f2850", padding: "32px 40px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, maxWidth: 700, margin: "0 auto", lineHeight: 1.8 }}>
          ⚖️ <strong style={{ color: "rgba(255,255,255,0.7)" }}>ClaimFlow</strong> — ClaimFlow provides document preparation assistance only. We are not a law firm and do not provide legal advice. The documents generated are for informational and preparation purposes only. Consult a licensed attorney for advice specific to your situation. Court rules vary by jurisdiction.
        </p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 16 }}>© {new Date().getFullYear()} ClaimFlow. All rights reserved.</p>
      </footer>
    </div>
  );

  // ── Wizard ───────────────────────────────────────────────────────────────
  if (step >= 1 && step <= 5) {
    const pct = ((step - 1) / 5) * 100;
    return (
      <div style={{ fontFamily: "'Georgia', serif", background: "#f8f6f1", minHeight: "100vh" }}>
        <nav style={{ background: "#0f2850", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>⚖️ ClaimFlow</span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Step {step} of 5</span>
        </nav>

        {/* Progress */}
        <div style={{ background: "#e8e4dc", height: 4 }}>
          <div style={{ background: "#e8b84b", height: "100%", width: `${pct}%`, transition: "width 0.4s ease" }} />
        </div>

        <div style={{ maxWidth: 620, margin: "48px auto", padding: "0 24px" }}>
          {/* Step labels */}
          <div style={{ display: "flex", gap: 0, marginBottom: 36, overflowX: "auto" }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: "center", fontSize: 11, color: i + 1 === step ? "#0f2850" : "#aaa", fontWeight: i + 1 === step ? 700 : 400, borderBottom: `2px solid ${i + 1 === step ? "#e8b84b" : "#ddd"}`, paddingBottom: 8, whiteSpace: "nowrap" }}>
                {i + 1}. {s}
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: "40px 36px", boxShadow: "0 2px 20px rgba(0,0,0,0.08)" }}>

            {/* Step 1 */}
            {step === 1 && <>
              <h2 style={{ color: "#0f2850", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Who are you suing?</h2>
              <p style={{ color: "#888", marginBottom: 28, fontSize: 14 }}>Enter the defendant's information as it appears on any contracts or receipts.</p>
              <label style={lbl}>Defendant's Full Name or Business Name *</label>
              <input style={inp} value={data.defName} onChange={e => set("defName", e.target.value)} placeholder="e.g. John Smith or ABC Contractors LLC" />
              <label style={lbl}>Defendant Type *</label>
              <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                {(["individual", "business"] as const).map(t => (
                  <button key={t} onClick={() => set("defType", t)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${data.defType === t ? "#0f2850" : "#ddd"}`, background: data.defType === t ? "#0f2850" : "#fff", color: data.defType === t ? "#fff" : "#333", cursor: "pointer", fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>
                    {t === "individual" ? "👤 Individual" : "🏢 Business"}
                  </button>
                ))}
              </div>
              <label style={lbl}>Street Address</label>
              <input style={inp} value={data.defAddress} onChange={e => set("defAddress", e.target.value)} placeholder="123 Main St" />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>City</label><input style={inp} value={data.defCity} onChange={e => set("defCity", e.target.value)} placeholder="City" /></div>
                <div><label style={lbl}>State</label><input style={inp} value={data.defState} onChange={e => set("defState", e.target.value)} placeholder="CA" /></div>
                <div><label style={lbl}>ZIP</label><input style={inp} value={data.defZip} onChange={e => set("defZip", e.target.value)} placeholder="90210" /></div>
              </div>
            </>}

            {/* Step 2 */}
            {step === 2 && <>
              <h2 style={{ color: "#0f2850", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>What's the claim about?</h2>
              <p style={{ color: "#888", marginBottom: 28, fontSize: 14 }}>Choose the option that best describes your situation.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {CLAIM_TYPES.map(c => (
                  <button key={c.id} onClick={() => set("claimType", c.id)} style={{ padding: "16px 12px", borderRadius: 10, border: `2px solid ${data.claimType === c.id ? "#0f2850" : "#e8e4dc"}`, background: data.claimType === c.id ? "#0f2850" : "#fff", color: data.claimType === c.id ? "#fff" : "#333", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 600 }}>
                    <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </>}

            {/* Step 3 */}
            {step === 3 && <>
              <h2 style={{ color: "#0f2850", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Tell us about the incident</h2>
              <p style={{ color: "#888", marginBottom: 28, fontSize: 14 }}>Be specific — dates, amounts, and facts matter in court.</p>
              <label style={lbl}>Date of Incident *</label>
              <input style={inp} type="date" value={data.incidentDate} onChange={e => set("incidentDate", e.target.value)} />
              <label style={lbl}>Describe What Happened *</label>
              <textarea style={{ ...inp, height: 120, resize: "vertical" }} value={data.incidentDesc} onChange={e => set("incidentDesc", e.target.value)} placeholder="Explain the situation clearly — what happened, when, where, and what was agreed upon..." />
              <label style={lbl}>Evidence You Have</label>
              <textarea style={{ ...inp, height: 90, resize: "vertical" }} value={data.evidence} onChange={e => set("evidence", e.target.value)} placeholder="e.g. Text messages, receipts, contract, photos of damage, emails..." />
            </>}

            {/* Step 4 */}
            {step === 4 && <>
              <h2 style={{ color: "#0f2850", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Amount in dispute</h2>
              <p style={{ color: "#888", marginBottom: 28, fontSize: 14 }}>Enter the total you are claiming and how it breaks down.</p>
              <label style={lbl}>Total Amount Claimed ($) *</label>
              <input style={inp} type="number" value={data.amountTotal} onChange={e => set("amountTotal", e.target.value)} placeholder="e.g. 2500" />
              <label style={lbl}>Amount Breakdown (optional)</label>
              <textarea style={{ ...inp, height: 100, resize: "vertical" }} value={data.amountBreakdown} onChange={e => set("amountBreakdown", e.target.value)} placeholder="e.g. $1,800 unpaid invoice + $400 late fees + $300 storage costs..." />
              <div style={{ background: "#fff8e8", border: "1px solid #f0d88a", borderRadius: 8, padding: "14px 16px", marginTop: 8 }}>
                <p style={{ color: "#7a5c00", fontSize: 13, margin: 0 }}>💡 <strong>Tip:</strong> Small claims limits vary by state — typically $5,000–$25,000. Check your local court's limit before filing.</p>
              </div>
            </>}

            {/* Step 5 */}
            {step === 5 && <>
              <h2 style={{ color: "#0f2850", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Your information</h2>
              <p style={{ color: "#888", marginBottom: 28, fontSize: 14 }}>This appears on your court documents as the plaintiff.</p>
              <label style={lbl}>Full Legal Name *</label>
              <input style={inp} value={data.plName} onChange={e => set("plName", e.target.value)} placeholder="Your full name as it appears on ID" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>Email</label><input style={inp} type="email" value={data.plEmail} onChange={e => set("plEmail", e.target.value)} placeholder="you@email.com" /></div>
                <div><label style={lbl}>Phone</label><input style={inp} type="tel" value={data.plPhone} onChange={e => set("plPhone", e.target.value)} placeholder="(555) 000-0000" /></div>
              </div>
              <label style={lbl}>Street Address</label>
              <input style={inp} value={data.plAddress} onChange={e => set("plAddress", e.target.value)} placeholder="123 Your Street" />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>City</label><input style={inp} value={data.plCity} onChange={e => set("plCity", e.target.value)} placeholder="City" /></div>
                <div><label style={lbl}>State</label><input style={inp} value={data.plState} onChange={e => set("plState", e.target.value)} placeholder="CA" /></div>
                <div><label style={lbl}>ZIP</label><input style={inp} value={data.plZip} onChange={e => set("plZip", e.target.value)} placeholder="90210" /></div>
              </div>
            </>}

            {/* Nav buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
              <button onClick={() => setStep((step - 1) as Step)} style={{ background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "10px 24px", cursor: "pointer", color: "#666", fontSize: 14 }}>
                ← Back
              </button>
              {step < 5
                ? <button onClick={() => setStep((step + 1) as Step)} style={{ background: "#0f2850", color: "#fff", border: "none", borderRadius: 8, padding: "12px 32px", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                    Continue →
                  </button>
                : <button onClick={() => setStep(6)} style={{ background: "#e8b84b", color: "#0f2850", border: "none", borderRadius: 8, padding: "12px 32px", cursor: "pointer", fontWeight: 800, fontSize: 15 }}>
                    Choose Package →
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pricing / Download ───────────────────────────────────────────────────
  if (step === 6) return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f8f6f1", minHeight: "100vh" }}>
      <nav style={{ background: "#0f2850", padding: "0 40px", display: "flex", alignItems: "center", height: 60 }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>⚖️ ClaimFlow</span>
      </nav>

      <div style={{ maxWidth: 960, margin: "56px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 20, padding: "6px 18px", marginBottom: 20 }}>
          <span style={{ color: "#2e7d32", fontSize: 13, fontWeight: 700 }}>✓ Your claim is ready to package!</span>
        </div>
        <h2 style={{ color: "#0f2850", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Choose your packet</h2>
        <p style={{ color: "#666", marginBottom: 48, fontSize: 16 }}>Your PDF downloads instantly to your device. No account needed.</p>

        {generating && (
          <div style={{ background: "#fff", borderRadius: 12, padding: 32, marginBottom: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p style={{ color: "#0f2850", fontWeight: 700, fontSize: 18 }}>Generating your PDF packet...</p>
            <p style={{ color: "#888", fontSize: 14 }}>This takes just a moment</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {[
            { id: "basic" as Tier, name: "Basic", price: "$19.99", badge: null, color: "#0f2850", features: ["Case Summary & Narrative", "Court-ready PDF", "Filing Checklist", "Timeline + Claim Structure"] },
            { id: "pro" as Tier, name: "Pro", price: "$29.99", badge: "BEST SELLER", color: "#e8b84b", features: ["Everything in Basic", "Evidence Checklist", "Hearing Script", "Case Timeline"] },
            { id: "premium" as Tier, name: "Premium", price: "$39.99", badge: null, color: "#0f2850", features: ["Everything in Pro", "Defendant Service Instructions", "Priority Processing", "Step-by-step Service Guide"] },
          ].map(p => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 14, padding: "36px 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", border: p.badge ? "2px solid #e8b84b" : "1px solid #eee", position: "relative" }}>
              {p.badge && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#e8b84b", color: "#0f2850", borderRadius: 20, padding: "4px 16px", fontSize: 11, fontWeight: 800 }}>{p.badge}</div>}
              <h3 style={{ color: "#0f2850", fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{p.name}</h3>
              <div style={{ color: "#e8b84b", fontSize: 34, fontWeight: 800, marginBottom: 20 }}>{p.price}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", textAlign: "left" }}>
                {p.features.map(f => (
                  <li key={f} style={{ color: "#444", fontSize: 14, marginBottom: 10, paddingLeft: 22, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, color: "#2e7d32" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleGenerate(p.id)}
                disabled={generating}
                style={{ width: "100%", background: p.badge ? "#e8b84b" : "#0f2850", color: p.badge ? "#0f2850" : "#fff", border: "none", borderRadius: 8, padding: "14px", fontWeight: 800, cursor: generating ? "not-allowed" : "pointer", fontSize: 15, opacity: generating ? 0.6 : 1 }}
              >
                {generating ? "Generating..." : `Download ${p.name} PDF →`}
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => setStep(5)} style={{ marginTop: 32, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, textDecoration: "underline" }}>
          ← Edit my information
        </button>

        <p style={{ color: "#aaa", fontSize: 12, marginTop: 28, maxWidth: 600, margin: "28px auto 0" }}>
          For demonstration purposes, PDF downloads directly in your browser. In production, integrate Stripe for payment before generating the PDF.
        </p>
      </div>
    </div>
  );

  return null;
}

// ── Shared styles ──────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 6, marginTop: 14,
};
const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#fafafa",
};

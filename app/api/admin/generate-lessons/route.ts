import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/serverAuth";
import type { Step, StepType } from "@/lib/courseTypes";
import Groq from "groq-sdk";

/* ---- validation: coerce whatever the model returns into safe Step shapes ---- */

const VALID_TYPES: StepType[] = [
  "intro", "explainer", "quiz", "fill-blank", "true-false",
  "match-pairs", "sort-sequence", "fraction-bar", "pie-divider",
  "number-line", "tap-label",
];

function coerceStep(raw: Record<string, unknown>): Step | null {
  const type = String(raw.type ?? "") as StepType;
  if (!VALID_TYPES.includes(type)) return null;
  const script = String(raw.script ?? "").slice(0, 400);
  const base: Step = { type, script };

  switch (type) {
    case "intro":
    case "explainer":
      return base;

    case "quiz": {
      const choices = Array.isArray(raw.choices)
        ? raw.choices.map((c) => String(c)).slice(0, 4)
        : [];
      if (choices.length < 2) return null;
      let answer = Number(raw.answer);
      if (!Number.isInteger(answer) || answer < 0 || answer >= choices.length) answer = 0;
      return { ...base, prompt: String(raw.prompt ?? ""), choices, answer };
    }

    case "fill-blank":
      if (!raw.answer) return null;
      return { ...base, prompt: String(raw.prompt ?? ""), answer: String(raw.answer) };

    case "true-false": {
      const a = raw.answer === true || raw.answer === "true";
      return { ...base, prompt: String(raw.prompt ?? ""), answer: a ? "true" : "false" };
    }

    case "match-pairs": {
      const pairs = Array.isArray(raw.pairs)
        ? raw.pairs
            .filter((p): p is { left: unknown; right: unknown } => !!p && typeof p === "object")
            .map((p) => ({ left: String((p as { left: unknown }).left ?? ""), right: String((p as { right: unknown }).right ?? "") }))
            .filter((p) => p.left && p.right)
            .slice(0, 5)
        : [];
      if (pairs.length < 2) return null;
      return { ...base, prompt: String(raw.prompt ?? ""), pairs };
    }

    case "sort-sequence": {
      const items = Array.isArray(raw.items)
        ? raw.items.map((i) => String(i)).filter(Boolean).slice(0, 6)
        : [];
      if (items.length < 2) return null;
      return { ...base, prompt: String(raw.prompt ?? ""), items };
    }

    case "fraction-bar":
    case "pie-divider": {
      const denominator = Math.min(12, Math.max(2, Number(raw.denominator) || 4));
      const numerator = Math.min(denominator, Math.max(1, Number(raw.numerator) || 1));
      return { ...base, prompt: String(raw.prompt ?? ""), numerator, denominator };
    }

    case "number-line": {
      const min = Number.isFinite(Number(raw.min)) ? Number(raw.min) : 0;
      const max = Number.isFinite(Number(raw.max)) ? Number(raw.max) : 10;
      const target = Number.isFinite(Number(raw.target)) ? Number(raw.target) : Math.round((min + max) / 2);
      if (max <= min) return null;
      return { ...base, prompt: String(raw.prompt ?? ""), min, max, target };
    }

    case "tap-label": {
      const labels = Array.isArray(raw.labels)
        ? raw.labels
            .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
            .map((l) => ({ x: Number(l.x) || 50, y: Number(l.y) || 50, text: String(l.text ?? "") }))
            .filter((l) => l.text)
            .slice(0, 6)
        : [];
      if (labels.length < 1) return null;
      return { ...base, prompt: String(raw.prompt ?? ""), labels, imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined };
    }

    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.uid))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, subject, description, gradeBand, lessonCount, topics } = await req.json();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

  const count = Math.min(12, Math.max(1, Number(lessonCount) || 6));
  const topicList: string[] = Array.isArray(topics)
    ? topics.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const groq = new Groq({ apiKey });

  const isMath = String(subject).toLowerCase().includes("math");
  const mathTypes = isMath
    ? "\nfraction-bar/pie-divider:{type,script,prompt,numerator,denominator}\nnumber-line:{type,script,prompt,min,max,target}"
    : "";

  const topicBlock = topicList.length
    ? `Cover these topics, one per lesson, in order: ${topicList.join("; ")}.`
    : `Choose a sensible easy-to-hard topic sequence.`;

  // Compact prompt — keeps the request well under Groq free-tier's 6000 tokens/min.
  const prompt = `Design ${count} lessons for a kids' tutoring app (grades ${gradeBand ?? "5-8"}).
Course: "${title}" (${subject}).${description ? " About: " + String(description).slice(0, 200) : ""}
${topicBlock}

Each lesson = {"title","objective","steps":[...]} with 4-5 steps.
Step JSON shapes (use a VARIETY across the course):
intro:{type,script}
explainer:{type,script}
quiz:{type,script,prompt,choices:[4 strings],answer:correctIndex}
fill-blank:{type,script,prompt:"... ___ ...",answer}
true-false:{type,script,prompt,answer:true|false}
match-pairs:{type,script,prompt,pairs:[{left,right}]}
sort-sequence:{type,script,prompt,items:[in correct order]}${mathTypes}

Each lesson: start with one intro, then one explainer, then 2-3 interactive steps.
Scripts: max 2 short friendly sentences, spoken by a kind tutor, never reveal the answer.
Return ONLY JSON: {"lessons":[...]}.`;

  // Budget: prompt (~400 tok) + completion must stay under the 6000 TPM limit.
  const maxTokens = Math.min(5000, 500 + count * 520);

  async function runOnce(mt: number) {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: mt,
      response_format: { type: "json_object" },
    });
    const rawText = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(rawText);
    return (parsed.lessons ?? [])
      .slice(0, count)
      .map((l: Record<string, unknown>) => ({
        title: String(l.title ?? "Untitled lesson"),
        objective: String(l.objective ?? ""),
        steps: (Array.isArray(l.steps) ? l.steps : [])
          .map((s) => coerceStep(s as Record<string, unknown>))
          .filter((s): s is Step => s !== null),
      }))
      .filter((l: { steps: Step[] }) => l.steps.length > 0);
  }

  try {
    const lessons = await runOnce(maxTokens);
    return NextResponse.json({ lessons, requested: count });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Free-tier tokens-per-minute hit — retry once with a smaller budget.
    if (msg.includes("rate_limit") || msg.includes("413") || msg.includes("too large")) {
      try {
        const lessons = await runOnce(Math.min(3000, maxTokens));
        return NextResponse.json({ lessons, requested: count });
      } catch {
        return NextResponse.json(
          { error: "Groq free tier is rate-limited (6k tokens/min). Try fewer lessons, or wait a minute and retry." },
          { status: 429 }
        );
      }
    }
    console.error("Groq error", e);
    return NextResponse.json({ error: "AI generation failed — try again" }, { status: 500 });
  }
}

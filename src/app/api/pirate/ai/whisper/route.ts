import { NextResponse } from "next/server";
import type { SeaWhisperAction } from "@/lib/pirate-ai";

const HF_MODEL = "google/flan-t5-base";

function actionInstruction(action: SeaWhisperAction) {
  if (action === "refine") return "Refine this text lightly for flow while preserving meaning.";
  if (action === "shorten") return "Shorten this text to about 60-70% length while keeping core meaning.";
  if (action === "clarify") return "Rewrite this text for clarity and practical readability.";
  return "Spark 3 concise improvement ideas for this text as bullet points.";
}

function parseHfOutput(data: unknown): string {
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as { generated_text?: string };
    if (first?.generated_text) return String(first.generated_text).trim();
  }
  if (data && typeof data === "object") {
    const asObj = data as { generated_text?: string; error?: string };
    if (asObj.generated_text) return String(asObj.generated_text).trim();
    if (asObj.error) return "";
  }
  return "";
}

export async function POST(req: Request) {
  const body = (await req.json()) as { action?: SeaWhisperAction; text?: string };
  const action = body.action;
  const text = body.text?.trim();

  if (!action || !["refine", "shorten", "clarify", "spark"].includes(action)) {
    return NextResponse.json({ error: "Invalid Sea Whisper action" }, { status: 400 });
  }
  if (!text) return NextResponse.json({ error: "Missing source text" }, { status: 400 });

  const prompt = `${actionInstruction(action)}\n\nText:\n${text}`;
  const token = process.env.HUGGINGFACE_API_KEY?.trim();

  const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      inputs: prompt,
      options: { wait_for_model: true },
      parameters: {
        max_new_tokens: action === "spark" ? 180 : 280,
        temperature: action === "spark" ? 0.8 : 0.4,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const rawMsg = String((err as { error?: string })?.error ?? "");
    let msg = "Sea Whisper is unavailable right now.";
    if (/authorization|token|401|403/i.test(rawMsg)) {
      msg = "Sea Whisper is currently offline. You can continue without it.";
    } else if (/loading|currently loading|503|overloaded|timeout/i.test(rawMsg)) {
      msg = "Sea Whisper currents are rough right now. Try again shortly.";
    }
    return NextResponse.json({ error: msg }, { status: response.status });
  }

  const data = await response.json();
  const output = parseHfOutput(data);

  if (!output) {
    return NextResponse.json(
      { error: "Sea Whisper returned no suggestion. Try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ output });
}


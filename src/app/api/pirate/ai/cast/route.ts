import { NextResponse } from "next/server";

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    apiKey?: string;
    prompt?: string;
    castIntent?: string;
    model?: string;
  };

  const apiKey = body.apiKey?.trim();
  const prompt = body.prompt?.trim();
  const castIntent = body.castIntent?.trim();
  const model = (body.model?.trim() || DEFAULT_GEMINI_MODEL).replace(/[^a-zA-Z0-9._-]/g, "");

  if (!apiKey) return NextResponse.json({ error: "Missing Devil Fruit key" }, { status: 400 });
  if (!prompt) return NextResponse.json({ error: "Missing prompt to cast" }, { status: 400 });

  const instruction = castIntent
    ? `You are casting a prepared prompt skill. Follow the prompt and prioritize this user intent: ${castIntent}\n\nPrompt:\n${prompt}`
    : `You are casting a prepared prompt skill. Follow the prompt exactly and produce the best practical output.\n\nPrompt:\n${prompt}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: instruction }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1200,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const rawMsg = String(err?.error?.message ?? "");
    let msg = "Casting failed. Please try again.";
    if (/api key|invalid|permission|auth|unauthorized/i.test(rawMsg)) {
      msg = "Your Devil Fruit key was rejected. Replace it in Captain Log, then cast again.";
    } else if (/quota|rate|limit/i.test(rawMsg)) {
      msg = "Casting limit reached for now. Try again shortly.";
    } else if (/timeout|deadline|unavailable|503|overloaded/i.test(rawMsg)) {
      msg = "The cast sea is rough right now. Try again in a moment.";
    }
    return NextResponse.json({ error: msg }, { status: response.status });
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const output =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("\n").trim() ?? "";

  if (!output) {
    return NextResponse.json(
      { error: "No cast output returned. Try again with a clearer intent." },
      { status: 502 },
    );
  }

  return NextResponse.json({ output });
}


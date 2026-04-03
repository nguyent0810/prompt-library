export type SeaWhisperAction = "refine" | "shorten" | "clarify" | "spark";

const DEVIL_FRUIT_KEY = "pirate-devil-fruit-gemini-key-v1";

export function getDevilFruitKey() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(DEVIL_FRUIT_KEY) ?? "";
}

export function setDevilFruitKey(apiKey: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEVIL_FRUIT_KEY, apiKey.trim());
  window.dispatchEvent(new CustomEvent("pirate-devil-fruit-changed"));
}

export function clearDevilFruitKey() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEVIL_FRUIT_KEY);
  window.dispatchEvent(new CustomEvent("pirate-devil-fruit-changed"));
}

export function maskDevilFruitKey(apiKey: string) {
  if (!apiKey) return "";
  if (apiKey.length <= 8) return "********";
  return `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}`;
}

export async function castWithDevilFruit(params: {
  apiKey: string;
  prompt: string;
  castIntent?: string;
  model?: string;
}) {
  const res = await fetch("/api/pirate/ai/cast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Cast failed (${res.status})`);
  }

  const data = (await res.json()) as { output: string };
  return data.output;
}

export async function seaWhisper(params: {
  action: SeaWhisperAction;
  text: string;
}) {
  const res = await fetch("/api/pirate/ai/whisper", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Sea Whisper failed (${res.status})`);
  }

  const data = (await res.json()) as { output: string };
  return data.output;
}


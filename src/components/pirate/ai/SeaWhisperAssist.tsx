"use client";

import { useState } from "react";
import { seaWhisper, type SeaWhisperAction } from "@/lib/pirate-ai";

type SeaWhisperAssistProps = {
  getSourceText: () => string;
  onApply?: (nextText: string) => void;
  title?: string;
};

const actions: Array<{ id: SeaWhisperAction; label: string }> = [
  { id: "refine", label: "Refine lightly" },
  { id: "shorten", label: "Shorten" },
  { id: "clarify", label: "Make clearer" },
  { id: "spark", label: "Spark ideas" },
];

export function SeaWhisperAssist({ getSourceText, onApply, title }: SeaWhisperAssistProps) {
  const [loading, setLoading] = useState<SeaWhisperAction | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = async (action: SeaWhisperAction) => {
    const text = getSourceText().trim();
    if (!text) {
      setError("Nothing to whisper on yet.");
      return;
    }
    setLoading(action);
    setError("");
    setCopied(false);
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Sea Whisper is slow right now. Try again.")), 16000);
      });
      const out = await Promise.race([seaWhisper({ action, text }), timeoutPromise]);
      setResult(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sea Whisper failed.";
      if (/unavailable|loading|model|503|busy/i.test(msg)) {
        setError("Sea Whisper currents are rough right now. Try again in a moment.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-card p-4 rounded-2xl border border-[rgba(246,225,160,0.14)] bg-[rgba(9,12,22,0.14)]">
      <div className="flex items-center justify-between gap-2">
        <div className="p-title text-[15px] font-semibold">{title ?? "Sea Whisper"}</div>
        <span className="p-badge">
          <span aria-hidden="true">🌬️</span> Ambient
        </span>
      </div>
      <div className="mt-1 text-[12px] p-muted-2 leading-relaxed">
        Lightweight assist only. Your main workflow still runs without AI.
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            className="p-btn p-btn-ghost px-3 py-[8px]"
            disabled={loading !== null}
            onClick={() => {
              void run(a.id);
            }}
          >
            {loading === a.id ? "Whispering..." : a.label}
          </button>
        ))}
      </div>

      {error ? <div className="mt-2 text-[12.5px] text-[rgba(255,170,150,0.95)]">{error}</div> : null}

      {result ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] p-muted-2">Whisper result</div>
            <button
              type="button"
              className="p-btn p-btn-ghost px-3 py-[8px]"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1000);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <div className="p-prompt-content whitespace-pre-wrap max-h-[300px]">{result}</div>
          {onApply ? (
            <button
              type="button"
              className="p-btn p-btn-primary px-3 py-[9px]"
              onClick={() => onApply(result)}
            >
              Apply to draft <span aria-hidden="true">✨</span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 text-[12.5px] p-muted-2">No whisper result yet.</div>
      )}
    </div>
  );
}


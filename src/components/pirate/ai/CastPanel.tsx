"use client";

import { useEffect, useMemo, useState } from "react";
import { castWithDevilFruit, getDevilFruitKey } from "@/lib/pirate-ai";

type CastPanelProps = {
  sourceLabel: string;
  promptText: string;
};

export function CastPanel({ sourceLabel, promptText }: CastPanelProps) {
  const [castIntent, setCastIntent] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const hasFruit = useMemo(() => !!getDevilFruitKey(), [loading, result, error, attempted]);
  const hasPrompt = promptText.trim().length > 0;

  useEffect(() => {
    const onFruitChanged = () => {
      setError("");
      setAttempted(false);
    };
    window.addEventListener("pirate-devil-fruit-changed", onFruitChanged);
    return () => window.removeEventListener("pirate-devil-fruit-changed", onFruitChanged);
  }, []);

  const runCast = async () => {
    setAttempted(true);
    if (!hasPrompt) {
      setError("Add or fill prompt content first, then cast.");
      return;
    }

    const apiKey = getDevilFruitKey();
    if (!apiKey) {
      setError("Consume a Devil Fruit in Captain Log to unlock strong casting.");
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("The cast took too long. Try again with a shorter intent.")), 22000);
      });
      const output = await Promise.race([
        castWithDevilFruit({
          apiKey,
          prompt: promptText,
          castIntent,
        }),
        timeoutPromise,
      ]);
      setResult(output);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Cast failed.";
      if (/api key|auth|permission|unauthorized|invalid/i.test(msg)) {
        setError("That Devil Fruit key was rejected. Replace it in Captain Log and cast again.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-card p-card-strong p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="p-title text-[18px] font-semibold">Cast with Devil Fruit</div>
          <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
            Stronger execution from {sourceLabel}. Optional power-up, never required.
          </div>
        </div>
        <span className="p-badge p-badge-brass">
          <span aria-hidden="true">⚡</span> {hasFruit ? "Fruit Unlocked" : "Fruit Needed"}
        </span>
      </div>

      <div className="mt-4">
        <label className="block">
          <div className="text-[12px] p-muted-2 mb-1">Cast intent (optional)</div>
          <input
            className="p-input"
            value={castIntent}
            onChange={(e) => setCastIntent(e.target.value)}
            placeholder="e.g., generate a concise strategy memo for startup leadership"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="p-btn p-btn-primary" onClick={runCast} disabled={loading}>
          {loading ? "Casting..." : "Cast Skill"} <span aria-hidden="true">🌊</span>
        </button>
        <a href="/captain" className="p-btn p-btn-ghost">
          Manage Devil Fruit <span aria-hidden="true">🍈</span>
        </a>
        {attempted && !loading ? (
          <button type="button" className="p-btn p-btn-ghost" onClick={runCast}>
            Retry Cast <span aria-hidden="true">↺</span>
          </button>
        ) : null}
      </div>

      {!hasFruit ? (
        <div className="mt-3 text-[12.5px] p-muted-2 leading-relaxed">
          No Devil Fruit consumed yet. You can still use the archive and chest without casting.
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 text-[12.5px] text-[rgba(255,170,150,0.95)]">{error}</div>
      ) : null}

      {!result && !loading && !error ? (
        <div className="mt-4 p-card p-4 rounded-2xl border border-[rgba(246,225,160,0.14)] bg-[rgba(9,12,22,0.12)]">
          <div className="p-title text-[14px] font-semibold">No cast result yet</div>
          <div className="p-muted mt-1 text-[13px] leading-relaxed">
            Set an optional intent and cast when you want stronger output.
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-[12px] p-muted-2">Cast Result</div>
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
          <div className="p-prompt-content whitespace-pre-wrap max-h-[420px]">{result}</div>
        </div>
      ) : null}
    </div>
  );
}


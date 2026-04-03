"use client";

import { useEffect, useState } from "react";
import { clearDevilFruitKey, getDevilFruitKey, maskDevilFruitKey, setDevilFruitKey } from "@/lib/pirate-ai";

export function DevilFruitCard() {
  const [keyInput, setKeyInput] = useState("");
  const [storedKey, setStoredKey] = useState("");
  const [savedPulse, setSavedPulse] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [keyError, setKeyError] = useState("");

  useEffect(() => {
    setStoredKey(getDevilFruitKey());
    const onChanged = () => setStoredKey(getDevilFruitKey());
    window.addEventListener("pirate-devil-fruit-changed", onChanged);
    return () => window.removeEventListener("pirate-devil-fruit-changed", onChanged);
  }, []);

  return (
    <div className="p-card p-card-strong p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="p-title text-[20px] font-semibold">Devil Fruit Power</div>
          <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
            Consume your Gemini key to unlock stronger casting from scrolls and variants.
          </div>
        </div>
        <span className="p-badge p-badge-brass">
          <span aria-hidden="true">🍈</span> {storedKey ? "Unlocked" : "Locked"}
        </span>
      </div>

      <div className="mt-4 p-card p-4 rounded-2xl border border-[rgba(246,225,160,0.16)]">
        <div className="text-[12px] p-muted-2">Current Fruit Ability</div>
        <div className="mt-1 p-title text-[15px] font-semibold">
          {storedKey ? `Gemini BYOK (${maskDevilFruitKey(storedKey)})` : "No fruit consumed yet"}
        </div>
        <div className="p-muted mt-1 text-[13px] leading-relaxed">
          Local-only storage in this browser for now. It is never required to browse, save, or forge variants.
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="p-btn p-btn-primary" onClick={() => setShowInput((v) => !v)}>
          {storedKey ? "Replace Devil Fruit" : "Consume a Devil Fruit"} <span aria-hidden="true">⚡</span>
        </button>
        {storedKey ? (
          <button
            type="button"
            className="p-btn p-btn-ghost"
            onClick={() => {
              clearDevilFruitKey();
              setKeyInput("");
              setSavedPulse(false);
            }}
          >
            Remove Fruit <span aria-hidden="true">🗑️</span>
          </button>
        ) : null}
      </div>

      {showInput ? (
        <div className="mt-4 p-card p-4 rounded-2xl border border-[rgba(246,225,160,0.16)]">
          <label className="block">
            <div className="text-[12px] p-muted-2 mb-1">Gemini API key</div>
            <input
              className="p-input w-full"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIza..."
              autoComplete="off"
            />
          </label>
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              type="button"
              className="p-btn p-btn-primary"
              disabled={!keyInput.trim()}
              onClick={() => {
                const trimmed = keyInput.trim();
                if (!/^AIza[0-9A-Za-z_\-]{20,}$/.test(trimmed)) {
                  setKeyError("That key format looks off. Paste a valid Gemini API key and try again.");
                  return;
                }
                setKeyError("");
                setDevilFruitKey(keyInput);
                setSavedPulse(true);
                window.setTimeout(() => setSavedPulse(false), 1200);
                setKeyInput("");
              }}
            >
              Unlock Ability <span aria-hidden="true">✨</span>
            </button>
            <button type="button" className="p-btn p-btn-ghost" onClick={() => setShowInput(false)}>
              Close
            </button>
          </div>
          {savedPulse ? (
            <div className="mt-2 text-[12.5px] text-[rgba(240,195,92,0.95)]">
              Fruit Ability Unlocked.
            </div>
          ) : null}
          {keyError ? (
            <div className="mt-2 text-[12.5px] text-[rgba(255,170,150,0.95)]">{keyError}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}


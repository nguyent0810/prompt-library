"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { CastPanel } from "@/components/pirate/ai/CastPanel";
import { SeaWhisperAssist } from "@/components/pirate/ai/SeaWhisperAssist";
import {
  addOriginalToChest,
  findChestIdContainingItem,
  getItemIdForPrompt,
  isItemEquipped,
  recordRecentlyViewed,
  removeItemFromChest,
  readInventoryState,
  toggleEquip,
} from "@/lib/pirate-inventory";
import type { PiratePrompt } from "@/data/pirate-prompts";

function fillTemplate(content: string, bindings: Record<string, string>) {
  return content.replace(/\$\{([a-zA-Z0-9_-]+)\}/g, (_, varId: string) => {
    const v = bindings[varId];
    return v !== undefined && v !== null && String(v).length > 0 ? String(v) : "";
  });
}

export function ScrollDetailClient({ prompt }: { prompt: PiratePrompt }) {
  const hasVariables = !!prompt.variables?.length;
  const router = useRouter();
  const { status } = useSession();
  const itemId = useMemo(() => getItemIdForPrompt(prompt.id), [prompt.id]);

  const [savedChestId, setSavedChestId] = useState<string | null>(() => findChestIdContainingItem(itemId));
  const saved = savedChestId !== null;
  const [storedChestName, setStoredChestName] = useState<string | null>(null);

  const [equipped, setEquipped] = useState<boolean>(() => isItemEquipped(itemId));

  const [bindings, setBindings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of prompt.variables ?? []) {
      initial[v.id] = v.defaultValue ?? "";
    }
    return initial;
  });

  const filled = useMemo(() => {
    if (!hasVariables) return prompt.content;
    return fillTemplate(prompt.content, bindings);
  }, [bindings, hasVariables, prompt.content]);

  const [copied, setCopied] = useState<"none" | "filled" | "original">("none");
  const needsAuth = status !== "authenticated";

  const requestLogin = async () => {
    await signIn(undefined, {
      callbackUrl: typeof window !== "undefined" ? window.location.href : `/scroll/${prompt.id}`,
    });
  };

  useEffect(() => {
    recordRecentlyViewed(itemId);

    const onChanged = () => {
      const inv = readInventoryState();
      const chestId = findChestIdContainingItem(itemId, inv);
      setSavedChestId(chestId);
      setEquipped(isItemEquipped(itemId));
      const chest = inv.chests.find((c) => c.id === chestId) ?? null;
      setStoredChestName(chest?.name ?? null);
    };

    onChanged();
    window.addEventListener("pirate-inventory-changed", onChanged);
    return () => window.removeEventListener("pirate-inventory-changed", onChanged);
  }, [itemId]);

  const copyToClipboard = async (text: string, which: "filled" | "original") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied("none"), 1200);
    } catch {
      // Clipboard might fail in some environments; keep UI calm.
      setCopied("none");
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="p-badge p-badge-brass">
          <span aria-hidden="true">📜</span> Archive Scroll
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={saved ? "p-btn p-btn-ghost" : "p-btn p-btn-primary"}
            onClick={() => {
              if (needsAuth) {
                void requestLogin();
                return;
              }
              if (saved) {
                removeItemFromChest(itemId);
                setSavedChestId(null);
                setStoredChestName(null);
                setEquipped(false);
              } else {
                const next = addOriginalToChest(prompt);
                const chestId = findChestIdContainingItem(itemId, next);
                setSavedChestId(chestId);
                const chest = next.chests.find((c) => c.id === chestId) ?? null;
                setStoredChestName(chest?.name ?? null);
                setEquipped(next.equippedItemIds.includes(itemId));
              }
            }}
          >
            {saved ? (
              <>
                {storedChestName ? (
                  <>In {storedChestName} <span aria-hidden="true">📦</span></>
                ) : (
                  <>In Chest <span aria-hidden="true">📦</span></>
                )}
              </>
            ) : (
              <>
                Store in Chest <span aria-hidden="true">🗝️</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="p-btn p-btn-ghost"
            onClick={() => {
              if (needsAuth) {
                void requestLogin();
                return;
              }
              router.push(`/my-version/create/${prompt.id}`);
            }}
            title="Create a personal working version you can edit"
          >
            Create My Version <span aria-hidden="true">🧪</span>
          </button>

          <button
            type="button"
            className={equipped ? "p-btn p-btn-primary" : "p-btn p-btn-ghost"}
            onClick={() => {
              if (needsAuth) {
                void requestLogin();
                return;
              }
              const next = toggleEquip(itemId);
              setEquipped(next.equippedItemIds.includes(itemId));
            }}
            disabled={!saved && !needsAuth}
            aria-pressed={equipped}
            title="Equip this scroll into your loadout (up to 3)"
          >
            {equipped ? (
              <>
                Equipped <span aria-hidden="true">⭐</span>
              </>
            ) : (
              <>
                Equip <span aria-hidden="true">⭐</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="p-btn"
            onClick={() => copyToClipboard(filled, "filled")}
          >
            Ink the filled scroll{" "}
            {copied === "filled" ? (
              <span aria-hidden="true">Stamped ✓</span>
            ) : null}
          </button>
          {hasVariables ? (
            <button
              type="button"
              className="p-btn p-btn-ghost"
              onClick={() => copyToClipboard(prompt.content, "original")}
            >
              Ink the raw scroll{" "}
              {copied === "original" ? (
                <span aria-hidden="true">Stamped ✓</span>
              ) : null}
            </button>
          ) : null}
        </div>
        <div className="text-[12.5px] p-muted-2 leading-relaxed">
          Preview is instant. Optional casting is available via Devil Fruit BYOK.
        </div>
      </div>

      <CastPanel sourceLabel="this archive scroll" promptText={filled} />

      <SeaWhisperAssist
        title="Sea Whisper (ambient hint)"
        getSourceText={() => filled}
      />

      {hasVariables ? (
        <div className="p-card p-card-strong p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="p-title text-[18px] font-semibold">Bindings Preview</div>
              <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                Fill the bindings to see the final scroll text. Then copy it.
              </div>
            </div>
            <span className="p-badge p-badge-brass">
              <span aria-hidden="true">🧩</span> Training Arena (Preview)
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {prompt.variables?.map((v) => (
                <label key={v.id} className="block">
                  <div className="text-[12px] p-muted-2 mb-1">
                    {v.label}{" "}
                    {v.hint ? <span className="text-[11px] p-muted-2">· {v.hint}</span> : null}
                  </div>
                  <input
                    value={bindings[v.id] ?? ""}
                    onChange={(e) =>
                      setBindings((prev) => ({
                        ...prev,
                        [v.id]: e.target.value,
                      }))
                    }
                    placeholder={v.placeholder}
                    className="p-input"
                    aria-label={v.label}
                  />
                </label>
              ))}
            </div>

            <div>
              <div className="text-[12px] p-muted-2 mb-2">Filled Scroll</div>
              <div className="p-prompt-content">{filled}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-card p-4 sm:p-5 rounded-2xl">
          <div className="text-[13.5px] p-muted leading-relaxed">
            This scroll has no bindings. Open it, copy it, and use it as-is.
          </div>
        </div>
      )}
    </div>
  );
}


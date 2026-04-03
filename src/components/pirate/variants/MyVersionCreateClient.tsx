"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { SeaWhisperAssist } from "@/components/pirate/ai/SeaWhisperAssist";
import type { PiratePrompt } from "@/data/pirate-prompts";
import {
  createVariantFromPrompt,
  getDefaultChestId,
  readInventoryState,
  recordRecentlyViewed,
  saveVariantToChest,
  type InventoryItemId,
  type PirateInventoryState,
} from "@/lib/pirate-inventory";

function fillTemplate(content: string, bindings: Record<string, string>) {
  return content.replace(/\$\{([a-zA-Z0-9_-]+)\}/g, (_, varId: string) => {
    const v = bindings[varId];
    return v !== undefined && v !== null && String(v).length > 0 ? String(v) : "";
  });
}

export function MyVersionCreateClient({ basePrompt }: { basePrompt: PiratePrompt }) {
  const router = useRouter();
  const { status } = useSession();
  const [inv, setInv] = useState<PirateInventoryState>(() => readInventoryState());

  useEffect(() => {
    const onChanged = () => setInv(readInventoryState());
    window.addEventListener("pirate-inventory-changed", onChanged);
    return () => window.removeEventListener("pirate-inventory-changed", onChanged);
  }, []);

  const hasVariables = !!basePrompt.variables?.length;

  const [title, setTitle] = useState<string>(basePrompt.title);
  const [workingNote, setWorkingNote] = useState<string>("");
  const [content, setContent] = useState<string>(basePrompt.content);

  const [bindings, setBindings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of basePrompt.variables ?? []) initial[v.id] = v.defaultValue ?? "";
    return initial;
  });

  const filledPreview = useMemo(() => {
    if (!hasVariables) return content;
    return fillTemplate(content, bindings);
  }, [content, bindings, hasVariables]);

  const selectedChestIdInitial = inv.lastActiveChestId ?? getDefaultChestId(inv);
  const [selectedChestId, setSelectedChestId] = useState<string>(selectedChestIdInitial);

  useEffect(() => {
    // If chests change (rename/delete), keep selection valid.
    if (!inv.chests.some((c) => c.id === selectedChestId)) {
      setSelectedChestId(inv.chests[0]?.id ?? selectedChestIdInitial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv.chests, selectedChestId]);

  if (status !== "authenticated") {
    return (
      <div className="p-container py-8 md:py-10">
        <div className="p-empty">
          <div className="p-title text-[18px] font-semibold">Login required for My Version</div>
          <div className="p-muted mt-1 text-[14px] leading-relaxed max-w-2xl">
            Your personal variants are tied to your account so they persist across sessions and devices.
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              type="button"
              className="p-btn p-btn-primary"
              onClick={() => {
                void signIn(undefined, {
                  callbackUrl:
                    typeof window !== "undefined" ? window.location.href : `/my-version/create/${basePrompt.id}`,
                });
              }}
            >
              Log in to continue <span aria-hidden="true">🗝️</span>
            </button>
            <button type="button" className="p-btn p-btn-ghost" onClick={() => router.push(`/scroll/${basePrompt.id}`)}>
              Back to scroll
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-container py-8 md:py-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="p-title text-[26px] md:text-[32px] font-semibold">Forge My Version</div>
          <div className="p-muted mt-2 text-[14px] leading-relaxed">
            Adapt this archive scroll into your own working tool.
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="p-badge">
              <span aria-hidden="true">📜</span> Original archive item
            </span>
            <span className="p-badge p-badge-brass">
              <span aria-hidden="true">🧪</span> Personal adaptation
            </span>
            {basePrompt.rarity ? (
              <span className="p-badge p-badge-brass">
                <span aria-hidden="true">✨</span>{" "}
                {basePrompt.rarity === "legendary" ? "Legendary" : basePrompt.rarity === "rare" ? "Rare" : "Common"}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button type="button" className="p-btn p-btn-ghost" onClick={() => router.push(`/scroll/${basePrompt.id}`)}>
            Back to Archive <span aria-hidden="true">↩</span>
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-card p-card-strong p-5">
            <div className="p-title text-[18px] font-semibold">Name & Captain’s Note</div>
            <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
              Title is optional. Your note is local to this version.
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <div className="text-[12px] p-muted-2 mb-1">Version title (optional)</div>
                <input
                  className="p-input w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`${basePrompt.title} (My Version)`}
                />
              </label>

              <label className="block">
                <div className="text-[12px] p-muted-2 mb-1">Captain’s Note (optional)</div>
                <textarea
                  className="p-input w-full min-h-[90px]"
                  value={workingNote}
                  onChange={(e) => setWorkingNote(e.target.value)}
                  placeholder="What changed? What’s the trick? How should it be used?"
                />
              </label>
            </div>
          </div>

          <div className="p-card p-card-strong p-5">
            <div className="p-title text-[18px] font-semibold">Parchment Ink (your edited version)</div>
            <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
              Edit the content directly. If this prompt uses bindings, keep the{" "}
              <span className="font-semibold">{"${var}"}</span> tokens.
            </div>

            <div className="mt-4">
              <textarea
                className="p-input w-full min-h-[320px] font-mono text-[12.6px] leading-[1.65]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                aria-label="Edited prompt content"
              />
            </div>

            <div className="mt-4">
              <SeaWhisperAssist
                title="Sea Whisper (draft assist)"
                getSourceText={() => content}
                onApply={(next) => setContent(next)}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-card p-card-strong p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="p-title text-[18px] font-semibold">Bindings Preview</div>
                <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                  {hasVariables ? "Enter values to see the filled scroll." : "No bindings on this scroll."}
                </div>
              </div>
              <span className="p-badge p-badge-brass whitespace-nowrap">
                <span aria-hidden="true">🧩</span> Preview
              </span>
            </div>

            {hasVariables ? (
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div className="space-y-3">
                  {basePrompt.variables?.map((v) => (
                    <label key={v.id} className="block">
                      <div className="text-[12px] p-muted-2 mb-1">{v.label}</div>
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
                  <div className="text-[12px] p-muted-2 mb-2">Filled scroll preview</div>
                  <div className="p-prompt-content">{filledPreview}</div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-card p-4 bg-[rgba(9,12,22,0.14)] rounded-2xl">
                <div className="text-[13.5px] p-muted leading-relaxed">
                  This version has no bindings. Your edited content is ready as-is.
                </div>
              </div>
            )}
          </div>

          <div className="p-card p-card-strong p-5">
            <div className="p-title text-[18px] font-semibold">Save destination</div>
            <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
              Choose where your personal version should live.
            </div>

            <div className="mt-4">
              <div className="text-[12px] p-muted-2 mb-1">Chest</div>
              <select className="p-input w-full" value={selectedChestId} onChange={(e) => setSelectedChestId(e.target.value)}>
                {inv.chests.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.isDefault ? "Default" : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex gap-2 flex-wrap">
              <button
                type="button"
                className="p-btn p-btn-primary"
                onClick={() => {
                  const variantId = createVariantFromPrompt({
                    basePrompt,
                    title,
                    content,
                    workingNote,
                  });
                  saveVariantToChest(variantId, selectedChestId);
                  const itemId = `variant:${variantId}` as InventoryItemId;
                  recordRecentlyViewed(itemId);
                  router.push(`/variant/${variantId}`);
                }}
              >
                Save now <span aria-hidden="true">🧪</span>
              </button>
              <button type="button" className="p-btn p-btn-ghost" onClick={() => router.push(`/scroll/${basePrompt.id}`)}>
                Keep editing later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


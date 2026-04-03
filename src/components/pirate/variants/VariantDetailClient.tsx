"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { piratePrompts } from "@/data/pirate-prompts";
import { CastPanel } from "@/components/pirate/ai/CastPanel";
import type { PiratePrompt, PirateRarity } from "@/data/pirate-prompts";
import type { InventoryItemId, PirateInventoryState } from "@/lib/pirate-inventory";
import {
  findChestIdContainingItem,
  moveItemToChest,
  readInventoryState,
  recordRecentlyViewed,
  removeItemFromChest,
  toggleEquip,
  isItemEquipped,
  type PirateVariant,
} from "@/lib/pirate-inventory";

function fillTemplate(content: string, bindings: Record<string, string>) {
  return content.replace(/\$\{([a-zA-Z0-9_-]+)\}/g, (_, varId: string) => {
    const v = bindings[varId];
    return v !== undefined && v !== null && String(v).length > 0 ? String(v) : "";
  });
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function rarityLabel(rarity?: PirateRarity) {
  if (!rarity) return null;
  return rarity === "legendary" ? "Legendary" : rarity === "rare" ? "Rare" : "Common";
}

export function VariantDetailClient({ variantId }: { variantId: string }) {
  const router = useRouter();
  const { status } = useSession();
  const [inv, setInv] = useState<PirateInventoryState>(() => readInventoryState());

  useEffect(() => {
    const onChanged = () => setInv(readInventoryState());
    window.addEventListener("pirate-inventory-changed", onChanged);
    return () => window.removeEventListener("pirate-inventory-changed", onChanged);
  }, []);

  const itemId: InventoryItemId = `variant:${variantId}` as InventoryItemId;

  const variant: PirateVariant | null = inv.versionById[variantId] ?? null;
  const basePrompt = useMemo(() => {
    if (!variant) return null;
    return piratePrompts.find((p) => p.id === variant.basePromptId) ?? null;
  }, [variant]);

  useEffect(() => {
    if (!variant) return;
    recordRecentlyViewed(itemId);
  }, [variant, itemId]);

  const storedChestId = useMemo(() => {
    return variant ? findChestIdContainingItem(itemId, inv) : null;
  }, [variant, itemId, inv]);

  const storedChest = storedChestId ? inv.chests.find((c) => c.id === storedChestId) ?? null : null;

  const equipped = isItemEquipped(itemId);

  const hasVariables = !!basePrompt?.variables?.length;
  const [bindings, setBindings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of basePrompt?.variables ?? []) initial[v.id] = v.defaultValue ?? "";
    return initial;
  });

  useEffect(() => {
    if (!basePrompt) return;
    const initial: Record<string, string> = {};
    for (const v of basePrompt.variables ?? []) initial[v.id] = v.defaultValue ?? "";
    setBindings(initial);
  }, [basePrompt?.id]);

  const filled = useMemo(() => {
    if (!variant || !basePrompt) return "";
    if (!hasVariables) return variant.content;
    return fillTemplate(variant.content, bindings);
  }, [variant, basePrompt, bindings, hasVariables]);

  const [copied, setCopied] = useState<"none" | "filled" | "original">("none");

  if (status !== "authenticated") {
    return (
      <div className="p-container py-8 md:py-10">
        <div className="p-empty">
          <div className="p-title text-[18px] font-semibold">Login required for My Versions</div>
          <div className="p-muted mt-1 text-[14px] leading-relaxed max-w-2xl">
            Personal variants are account-owned so they sync across devices.
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              type="button"
              className="p-btn p-btn-primary"
              onClick={() => {
                void signIn(undefined, {
                  callbackUrl: typeof window !== "undefined" ? window.location.href : `/variant/${variantId}`,
                });
              }}
            >
              Log in <span aria-hidden="true">🗝️</span>
            </button>
            <Link href="/archive" className="p-btn p-btn-ghost">
              Browse archive
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const copyToClipboard = async (text: string, which: "filled" | "original") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied("none"), 1200);
    } catch {
      setCopied("none");
    }
  };

  if (!variant || !basePrompt) {
    return (
      <div className="p-container py-8 md:py-10">
        <div className="p-empty">
          <div className="p-title text-[18px] font-semibold">My Version not found</div>
          <div className="p-muted mt-1 text-[14px] leading-relaxed max-w-2xl">
            This personal variant may have been discarded from your chest.
          </div>
          <div className="mt-4">
            <button type="button" className="p-btn p-btn-primary" onClick={() => router.push("/chest")}>
              Open Chest <span aria-hidden="true">📦</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-container py-8 md:py-10">
      <div className="p-hero-parchment px-5 md:px-8 py-8 md:py-10">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-badge p-badge-brass">
              <span aria-hidden="true">🧪</span> My Version
            </span>
            {storedChest ? (
              <span className="p-badge">
                <span aria-hidden="true">📦</span> Stored in {storedChest.isDefault ? "Default" : storedChest.name}
              </span>
            ) : null}
            {basePrompt.rarity ? (
              <span className="p-badge p-badge-brass">
                <span aria-hidden="true">✨</span> {rarityLabel(basePrompt.rarity)}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div>
              <h1 className="p-title text-[28px] md:text-[40px] leading-[1.05] font-semibold">
                {variant.title}
              </h1>
              <div className="p-muted mt-2 text-[14px] leading-relaxed">
                Based on{" "}
                <Link href={`/scroll/${basePrompt.id}`} className="hover:underline underline-offset-4">
                  {basePrompt.title}
                </Link>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                className={equipped ? "p-btn p-btn-primary" : "p-btn p-btn-ghost"}
                onClick={() => toggleEquip(itemId)}
                aria-pressed={equipped}
                title="Equip this version into your loadout"
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
                className="p-btn p-btn-ghost"
                onClick={() => {
                  removeItemFromChest(itemId);
                  router.push("/chest");
                }}
                title="Remove this version from your chest"
              >
                Discard <span aria-hidden="true">🗑️</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 p-card p-card-strong p-5 md:p-7 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="p-btn" onClick={() => copyToClipboard(filled, "filled")}>
              Ink the filled version{" "}
              {copied === "filled" ? <span aria-hidden="true">Stamped ✓</span> : null}
            </button>
            <button
              type="button"
              className="p-btn p-btn-ghost"
              onClick={() => copyToClipboard(variant.content, "original")}
            >
              Ink the raw version{" "}
              {copied === "original" ? <span aria-hidden="true">Stamped ✓</span> : null}
            </button>
          </div>

          <div className="text-[12.5px] p-muted-2 leading-relaxed">
            Your version is account-linked. Optional BYOK casting is available.
          </div>
        </div>

        <div className="mt-6">
          <CastPanel sourceLabel="your personal variant" promptText={filled} />
        </div>

        {hasVariables ? (
          <div className="mt-6 p-card p-card-strong p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="p-title text-[18px] font-semibold">Bindings Preview</div>
                <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                  Enter values to see your filled personal scroll.
                </div>
              </div>
              <span className="p-badge p-badge-brass whitespace-nowrap">
                <span aria-hidden="true">🧩</span> Training Arena (Preview)
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {basePrompt.variables?.map((v) => (
                  <label key={v.id} className="block">
                    <div className="text-[12px] p-muted-2 mb-1">
                      {v.label} {v.hint ? <span className="text-[11px] p-muted-2">· {v.hint}</span> : null}
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
                <div className="text-[12px] p-muted-2 mb-2">Filled Personal Version</div>
                <div className="p-prompt-content">{filled}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-card p-4 sm:p-5 rounded-2xl">
            <div className="text-[13.5px] p-muted leading-relaxed">
              This version has no bindings. Your edited content is ready as-is.
            </div>
          </div>
        )}

        {/* Move destination */}
        <div className="mt-6">
          <div className="text-[12px] p-muted-2 mb-1">Move to another chest</div>
          <select
            className="p-input w-full"
            value={storedChestId ?? inv.lastActiveChestId}
            onChange={(e) => {
              const to = e.target.value;
              if (to && storedChestId && to !== storedChestId) moveItemToChest(itemId, to);
            }}
            aria-label="Move this version to another chest"
          >
            {inv.chests.map((c) => (
              <option key={c.id} value={c.id}>
                {c.isDefault ? "Default" : c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Personal metadata */}
        <div className="mt-6 space-y-4">
          <div>
            <div className="text-[12px] p-muted-2 mb-1">Captain’s Note</div>
            {variant.workingNote?.trim() ? (
              <div className="p-prompt-content whitespace-pre-wrap">{variant.workingNote}</div>
            ) : (
              <div className="p-empty" style={{ padding: 16 }}>
                <div className="p-title text-[14px] font-semibold">No note</div>
                <div className="p-muted mt-1 text-[13px] leading-relaxed">
                  Add a note when you forge the version.
                </div>
              </div>
            )}
          </div>

          <div className="text-[12.5px] p-muted-2 leading-relaxed">
            Last refined:{" "}
            <span className="text-[rgba(243,231,198,0.95)] font-semibold">{formatDate(variant.updatedAt)}</span>
          </div>

          <div className="p-muted text-[12.5px] leading-relaxed">
            Your personal variant is distinct from the original archive scroll. Copy filled/raw from here for your current workflow.
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { piratePrompts } from "@/data/pirate-prompts";
import { getDefaultChestId, readInventoryState } from "@/lib/pirate-inventory";
import type { InventoryItemId, PirateInventoryState } from "@/lib/pirate-inventory";

function isVariantItem(itemId: InventoryItemId) {
  return itemId.startsWith("variant:");
}

export function ChestPreview() {
  const [inv, setInv] = useState<PirateInventoryState>(() => readInventoryState());

  useEffect(() => {
    const onChanged = () => {
      setInv(readInventoryState());
    };

    window.addEventListener("pirate-inventory-changed", onChanged);
    return () => window.removeEventListener("pirate-inventory-changed", onChanged);
  }, []);

  const defaultChestId = useMemo(() => getDefaultChestId(inv), [inv]);

  const itemIds = inv.chestItemsByChestId[defaultChestId] ?? [];

  const savedPrompts = useMemo(() => {
    const byPromptId = new Map(piratePrompts.map((p) => [p.id, p]));

    return itemIds
      .slice(0, 3)
      .map((itemId) => {
        if (isVariantItem(itemId)) {
          const variantId = itemId.replace("variant:", "");
          const variant = inv.versionById[variantId];
          if (!variant) return null;
          const base = byPromptId.get(variant.basePromptId);
          return {
            kind: "variant" as const,
            itemId,
            variant,
            base,
          };
        }

        const prompt = byPromptId.get(itemId.replace("orig:", ""));
        if (!prompt) return null;
        return { kind: "original" as const, itemId, prompt };
      })
      .filter(Boolean) as Array<
      | { kind: "original"; itemId: InventoryItemId; prompt: (typeof piratePrompts)[number] }
      | { kind: "variant"; itemId: InventoryItemId; variant: (typeof inv.versionById)[string]; base: (typeof piratePrompts)[number] | undefined }
    >;
  }, [inv, itemIds]);

  return (
    <div className="p-card p-card-strong p-5 md:p-6 rounded-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="p-title text-[18px] font-semibold">Your Chest</div>
          <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
            Account-backed loadout for scrolls and My Versions.
          </div>
        </div>
        <span className="p-badge p-badge-brass">
          <span aria-hidden="true">📦</span> {itemIds.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {savedPrompts.length === 0 ? (
          <div className="p-empty" style={{ padding: 16 }}>
            <div className="p-title text-[14px] font-semibold">Empty for now</div>
            <div className="p-muted mt-1 text-[13px] leading-relaxed">
              Save a scroll from the Archive to see it here.
            </div>
          </div>
        ) : (
          savedPrompts.map((entry) => (
            <Link
              key={entry.itemId}
              href={
                entry.kind === "original" ? `/scroll/${entry.prompt.id}` : `/variant/${entry.variant.id}`
              }
              className="block rounded-2xl border border-[rgba(246,225,160,0.14)] bg-[rgba(9,12,22,0.18)] p-4 hover:bg-[rgba(9,12,22,0.26)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="p-title font-semibold text-[15px]">
                    {entry.kind === "original" ? entry.prompt.title : entry.variant.title}
                  </div>
                  <div className="p-muted mt-1 text-[13px] leading-relaxed line-clamp-2">
                    {entry.kind === "original"
                      ? entry.prompt.description
                      : entry.base?.description ?? "A personal adaptation from your captain’s desk."}
                  </div>
                </div>
                {entry.kind === "variant" ? (
                  <span className="p-badge p-badge-brass text-[11px] whitespace-nowrap">
                    <span aria-hidden="true">🧪</span> My Version
                  </span>
                ) : entry.prompt.rarity ? (
                  <span className="p-badge p-badge-brass text-[11px] whitespace-nowrap">
                    <span aria-hidden="true">✨</span>{" "}
                    {entry.prompt.rarity === "legendary" ? "Legendary" : "Rare"}
                  </span>
                ) : (
                  <span className="p-badge text-[11px] whitespace-nowrap">
                    <span aria-hidden="true">🗝️</span> Premium
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-4">
        <Link href="/chest" className="p-btn p-btn-ghost w-full justify-center px-4 py-2.5">
          Open Chest <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </div>
  );
}


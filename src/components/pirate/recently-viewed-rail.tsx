"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { piratePrompts } from "@/data/pirate-prompts";
import type { InventoryItemId, PirateInventoryState, PirateVariant } from "@/lib/pirate-inventory";
import { readInventoryState } from "@/lib/pirate-inventory";

function isVariantItem(itemId: InventoryItemId) {
  return itemId.startsWith("variant:");
}

export function RecentlyViewedRail() {
  const [inv, setInv] = useState<PirateInventoryState>(() => readInventoryState());

  useEffect(() => {
    const onChanged = () => setInv(readInventoryState());
    window.addEventListener("pirate-inventory-changed", onChanged);
    return () => window.removeEventListener("pirate-inventory-changed", onChanged);
  }, []);

  const promptById = useMemo(() => new Map(piratePrompts.map((p) => [p.id, p])), []);
  const items = inv.recentlyViewedItemIds;

  const resolved = useMemo(() => {
    return items
      .slice(0, 6)
      .map((itemId) => {
        if (isVariantItem(itemId)) {
          const variantId = itemId.replace("variant:", "");
          const variant = inv.versionById[variantId] as PirateVariant | undefined;
          if (!variant) return null;
          const base = promptById.get(variant.basePromptId);
          return {
            itemId,
            kind: "variant" as const,
            title: variant.title,
            description: base?.description ?? "A personal adaptation.",
            rarity: base?.rarity,
            href: `/variant/${variant.id}`,
          };
        }

        const promptId = itemId.replace("orig:", "");
        const prompt = promptById.get(promptId);
        if (!prompt) return null;
        return {
          itemId,
          kind: "original" as const,
          title: prompt.title,
          description: prompt.description,
          rarity: prompt.rarity,
          href: `/scroll/${prompt.id}`,
        };
      })
      .filter(Boolean) as Array<{
      itemId: InventoryItemId;
      kind: "original" | "variant";
      title: string;
      description: string;
      rarity?: "common" | "rare" | "legendary";
      href: string;
    }>;
  }, [items, inv.versionById, promptById]);

  return (
    <div className="p-card p-card-strong p-5 md:p-6 rounded-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="p-title text-[18px] font-semibold">Recent Finds</div>
          <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
            Pick up where you left off.
          </div>
        </div>
        <span className="p-badge p-badge-brass whitespace-nowrap">
          <span aria-hidden="true">🗝️</span> {resolved.length}
        </span>
      </div>

      {resolved.length === 0 ? (
        <div className="mt-4 p-empty" style={{ padding: 16 }}>
          <div className="p-title text-[14px] font-semibold">No recent finds yet</div>
          <div className="p-muted mt-1 text-[13px] leading-relaxed">
            Open any scroll and this rail will remember your trail.
          </div>
          <div className="mt-3">
            <Link href="/archive" className="p-btn p-btn-ghost px-3 py-[9px]">
              Start from Archive <span aria-hidden="true">🧭</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {resolved.map((entry) => (
            <Link
              key={entry.itemId}
              href={entry.href}
              className="block rounded-2xl border border-[rgba(246,225,160,0.14)] bg-[rgba(9,12,22,0.18)] p-4 hover:bg-[rgba(9,12,22,0.26)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="p-title font-semibold text-[15px] leading-snug">{entry.title}</div>
                  <div className="p-muted mt-1 text-[13px] leading-relaxed line-clamp-2">
                    {entry.description}
                  </div>
                </div>
                {entry.kind === "variant" ? (
                  <span className="p-badge p-badge-brass text-[11px] whitespace-nowrap">
                    <span aria-hidden="true">🧪</span> My Version
                  </span>
                ) : entry.rarity ? (
                  <span className="p-badge p-badge-brass text-[11px] whitespace-nowrap">
                    <span aria-hidden="true">✨</span>{" "}
                    {entry.rarity === "legendary" ? "Legendary" : entry.rarity === "rare" ? "Rare" : "Common"}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


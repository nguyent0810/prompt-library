"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { pirateCategories, piratePrompts } from "@/data/pirate-prompts";
import type { PiratePrompt, PirateRarity } from "@/data/pirate-prompts";
import type { PirateVariant, InventoryItemId, PirateInventoryState } from "@/lib/pirate-inventory";
import {
  createChest,
  deleteChest,
  moveItemToChest,
  readInventoryState,
  renameChest,
  removeItemFromChest,
  setLastActiveChestId,
  toggleEquip,
} from "@/lib/pirate-inventory";

function categoryName(categoryId: string) {
  return pirateCategories.find((c) => c.id === categoryId)?.name ?? categoryId;
}

export default function ChestPage() {
  const { status } = useSession();
  const [inv, setInv] = useState<PirateInventoryState>(() => readInventoryState());

  const [newChestOpen, setNewChestOpen] = useState(false);
  const [newChestName, setNewChestName] = useState("");

  const [renameChestOpen, setRenameChestOpen] = useState<null | { chestId: string; name: string }>(null);
  const [deleteChestOpen, setDeleteChestOpen] = useState<null | { chestId: string; name: string }>(null);

  useEffect(() => {
    const onChanged = () => setInv(readInventoryState());
    window.addEventListener("pirate-inventory-changed", onChanged);
    return () => window.removeEventListener("pirate-inventory-changed", onChanged);
  }, []);

  const activeChestId = inv.lastActiveChestId;
  const activeChest = inv.chests.find((c) => c.id === activeChestId) ?? inv.chests[0];
  const chestItems = inv.chestItemsByChestId[activeChest.id] ?? [];

  const promptById = useMemo(() => new Map(piratePrompts.map((p) => [p.id, p])), []);

  function resolveItem(itemId: InventoryItemId) {
    if (itemId.startsWith("orig:")) {
      const promptId = itemId.replace("orig:", "");
      const prompt = promptById.get(promptId);
      return prompt ? { kind: "original" as const, itemId, prompt } : null;
    }

    const variantId = itemId.replace("variant:", "");
    const variant = inv.versionById[variantId];
    if (!variant) return null;
    const base = promptById.get(variant.basePromptId);
    return base ? { kind: "variant" as const, itemId, variant, base } : null;
  }

  type ResolvedItem =
    | { kind: "original"; itemId: InventoryItemId; prompt: PiratePrompt }
    | { kind: "variant"; itemId: InventoryItemId; variant: PirateVariant; base: PiratePrompt };

  const resolvedActiveItems = useMemo(() => {
    return chestItems.map(resolveItem).filter(Boolean) as ResolvedItem[];
  }, [chestItems, inv.versionById]);

  const equippedItems = useMemo(() => {
    return inv.equippedItemIds.map(resolveItem).filter(Boolean).slice(0, 3) as ResolvedItem[];
  }, [inv.equippedItemIds, inv.versionById]);

  const groupedByCategory = useMemo(() => {
    const m = new Map<string, ResolvedItem[]>();
    for (const entry of resolvedActiveItems) {
      const categoryId = entry.kind === "original" ? entry.prompt.categoryId : entry.base.categoryId;
      const list = m.get(categoryId) ?? [];
      m.set(categoryId, [...list, entry]);
    }
    return m;
  }, [resolvedActiveItems]);

  const chestCountById = useMemo(() => {
    const result: Record<string, number> = {};
    for (const c of inv.chests) {
      result[c.id] = (inv.chestItemsByChestId[c.id] ?? []).length;
    }
    return result;
  }, [inv.chests, inv.chestItemsByChestId]);

  const totalStored = useMemo(() => {
    return Object.values(inv.chestItemsByChestId).reduce((acc, list) => acc + list.length, 0);
  }, [inv.chestItemsByChestId]);

  function rarityBadge(rarity: PirateRarity | undefined) {
    if (!rarity) return null;
    const label = rarity === "legendary" ? "Legendary" : rarity === "rare" ? "Rare" : "Common";
    const icon = rarity === "legendary" ? "✨" : rarity === "rare" ? "🪙" : "📜";
    return (
      <span className="p-badge p-badge-brass whitespace-nowrap">
        <span aria-hidden="true">{icon}</span> {label}
      </span>
    );
  }

  function detailHref(entry: ResolvedItem) {
    return entry.kind === "original" ? `/scroll/${entry.prompt.id}` : `/variant/${entry.variant.id}`;
  }

  function entryTitle(entry: ResolvedItem) {
    return entry.kind === "original" ? entry.prompt.title : entry.variant.title;
  }

  function entryDescription(entry: ResolvedItem) {
    return entry.kind === "original" ? entry.prompt.description : entry.base.description;
  }

  function isEquipped(itemId: InventoryItemId) {
    return inv.equippedItemIds.includes(itemId);
  }

  if (status !== "authenticated") {
    return (
      <div className="p-container py-8 md:py-10">
        <div className="p-empty">
          <div className="p-title text-[18px] font-semibold">Captain access needed</div>
          <div className="p-muted mt-1 text-[14px] leading-relaxed max-w-2xl">
            Browsing stays open, but your Chest is account-bound so it syncs across devices.
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              type="button"
              className="p-btn p-btn-primary"
              onClick={() => {
                void signIn(undefined, {
                  callbackUrl: typeof window !== "undefined" ? window.location.href : "/chest",
                });
              }}
            >
              Log in to open Chest <span aria-hidden="true">🗝️</span>
            </button>
            <Link href="/archive" className="p-btn p-btn-ghost">
              Keep browsing <span aria-hidden="true">🧭</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-container py-8 md:py-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="p-title text-[26px] md:text-[32px] font-semibold">
            Your Chest
          </div>
          <div className="p-muted mt-2 text-[14px]">
            Multi-chest inventory tied to your account. Move, rename, and forge versions.
          </div>
        </div>
        <Link
          href="/archive"
          className="p-btn p-btn-primary px-4 py-2.5"
          aria-label="Go to archive to save more scrolls"
        >
          Find more scrolls <span aria-hidden="true">🧭</span>
        </Link>
      </div>

      {/* Chest selector */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {inv.chests
              .slice()
              .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt - a.createdAt)
              .map((c) => {
                const isActive = c.id === activeChest.id;
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    className={[
                      "px-3 py-2 rounded-xl border transition-colors",
                      isActive
                        ? "border-[rgba(214,162,58,0.62)] bg-[rgba(214,162,58,0.14)]"
                        : "border-[rgba(246,225,160,0.12)] bg-[rgba(9,12,22,0.12)] hover:border-[rgba(214,162,58,0.35)]",
                    ].join(" ")}
                    onClick={() => {
                      setLastActiveChestId(c.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLastActiveChestId(c.id);
                      }
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-[14px] font-semibold">
                        {c.isDefault ? "Default" : c.name}
                      </span>
                      <span className="p-badge text-[11px] whitespace-nowrap">
                        {chestCountById[c.id] ? chestCountById[c.id] : "0"}
                      </span>
                    </span>
                    {!c.isDefault ? (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-xl border border-[rgba(246,225,160,0.12)] hover:border-[rgba(214,162,58,0.35)] bg-[rgba(9,12,22,0.10)]"
                          aria-label={`Rename ${c.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameChestOpen({ chestId: c.id, name: c.name });
                          }}
                          title="Rename"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-xl border border-[rgba(246,225,160,0.12)] hover:border-[rgba(214,162,58,0.35)] bg-[rgba(9,12,22,0.10)]"
                          aria-label={`Delete ${c.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteChestOpen({ chestId: c.id, name: c.name });
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </span>
                    ) : null}
                  </div>
                );
              })}

            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-[rgba(246,225,160,0.12)] bg-[rgba(9,12,22,0.12)] hover:border-[rgba(214,162,58,0.35)] transition-colors"
              onClick={() => setNewChestOpen(true)}
              aria-label="Create a new chest"
            >
              + New Chest
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Loadout */}
        <div className="p-card p-card-strong p-5 md:p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="p-title text-[18px] font-semibold">Equipped Loadout</div>
              <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                Choose up to 3 scrolls for quick access. (All local-only in this slice.)
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-badge p-badge-brass">
                <span aria-hidden="true">⭐</span> {inv.equippedItemIds.length} equipped
              </span>
              <span className="p-badge">
                <span aria-hidden="true">🧾</span> {totalStored} stored
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((slot) => {
              const entry = equippedItems[slot];
              if (!entry) {
                return (
                  <div
                    key={slot}
                    className="p-empty"
                    style={{ padding: 16, borderStyle: "dashed" }}
                  >
                    <div className="p-title text-[14px] font-semibold">Empty slot</div>
                    <div className="p-muted mt-1 text-[13px] leading-relaxed">
                      Equip a scroll from your chests.
                    </div>
                  </div>
                );
              }

              return (
                <div key={entry.itemId} className="p-card p-card-strong p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={detailHref(entry)}
                      className="p-title font-semibold text-[15.5px] leading-snug hover:underline underline-offset-4"
                    >
                      {entryTitle(entry)}
                    </Link>
                    <button
                      type="button"
                      className="p-btn p-btn-ghost px-3 py-[10px]"
                      onClick={() => {
                        toggleEquip(entry.itemId);
                      }}
                      aria-label={`Unequip ${entryTitle(entry)}`}
                      title="Unequip"
                    >
                      Unequip
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="p-badge">
                      <span aria-hidden="true">🗺️</span>{" "}
                      {entry.kind === "original"
                        ? categoryName(entry.prompt.categoryId)
                        : categoryName(entry.base.categoryId)}
                    </span>
                    {entry.kind === "variant" ? (
                      <span className="p-badge p-badge-brass whitespace-nowrap">
                        <span aria-hidden="true">🧪</span> My Version
                      </span>
                    ) : (
                      rarityBadge(entry.prompt.rarity)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {resolvedActiveItems.length === 0 ? (
          <div className="p-empty">
            <div className="p-title text-[18px] font-semibold">
              Nothing in {activeChest.isDefault ? "Default" : activeChest.name}
            </div>
            <div className="p-muted mt-1 text-[14px] leading-relaxed max-w-2xl">
              Open a scroll in the Archive and tap “Store in Chest”, or forge a “My Version”.
            </div>
            <div className="mt-4">
              <Link href="/archive" className="p-btn p-btn-primary">
                Chart the Waters <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Inventory by guild */}
            <div className="mt-6 space-y-5">
              {pirateCategories.map((c) => {
                const list = groupedByCategory.get(c.id) ?? [];
                if (list.length === 0) return null;
                return (
                  <div key={c.id} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="p-title text-[18px] font-semibold">
                        {c.icon} {c.name}
                      </div>
                      <div className="p-muted-2 text-[13px]">{list.length} scrolls</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {list.map((p) => {
                        const entry = p;
                        const equipped = isEquipped(entry.itemId);
                        return (
                          <div key={entry.itemId} className="p-card p-card-strong p-5 h-full">
                            <div className="flex items-start justify-between gap-3">
                              <Link
                                href={detailHref(entry)}
                                className="p-title font-semibold text-[15.5px] leading-snug hover:underline underline-offset-4"
                              >
                                {entryTitle(entry)}
                              </Link>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className={equipped ? "p-btn p-btn-primary px-3 py-[10px]" : "p-btn p-btn-ghost px-3 py-[10px]"}
                                  onClick={() => {
                                    toggleEquip(entry.itemId);
                                  }}
                                  aria-pressed={equipped}
                                  title="Equip"
                                >
                                  {equipped ? "Equipped ⭐" : "Equip ⭐"}
                                </button>
                                <button
                                  type="button"
                                  className="p-btn p-btn-ghost px-3 py-[10px]"
                                  onClick={() => {
                                    removeItemFromChest(entry.itemId);
                                  }}
                                  aria-label={`Discard ${entryTitle(entry)} from chest`}
                                  title="Discard"
                                >
                                  Discard
                                </button>
                              </div>
                            </div>

                            <div className="p-muted text-[13.5px] mt-2 leading-relaxed line-clamp-3">
                              {entryDescription(entry)}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {entry.kind === "variant" ? (
                                <span className="p-badge p-badge-brass whitespace-nowrap">
                                  <span aria-hidden="true">🧪</span> My Version
                                </span>
                              ) : null}
                              {entry.kind === "original" ? rarityBadge(entry.prompt.rarity) : rarityBadge(entry.base.rarity)}
                              <span className="p-badge">
                                <span aria-hidden="true">🧷</span> Loadout-ready
                              </span>
                            </div>

                            {inv.chests.length > 1 ? (
                              <div className="mt-4">
                                <div className="text-[12px] p-muted-2 mb-1">Move to</div>
                                <select
                                  className="p-input w-full"
                                  aria-label="Move to another chest"
                                  defaultValue={activeChest.id}
                                  onChange={(e) => {
                                    const to = e.target.value;
                                    if (to !== activeChest.id) moveItemToChest(entry.itemId, to);
                                  }}
                                >
                                  {inv.chests.map((ch) => (
                                    <option key={ch.id} value={ch.id}>
                                      {ch.isDefault ? "Default" : ch.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create chest modal */}
      {newChestOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/50 p-4 flex items-center justify-center">
          <div className="p-card p-card-strong p-5 md:p-6 w-full max-w-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="p-title text-[18px] font-semibold">Forge a named chest</div>
                <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                  This helps you organize scrolls by voyage.
                </div>
              </div>
              <button
                type="button"
                className="p-btn p-btn-ghost h-10 w-10"
                onClick={() => {
                  setNewChestOpen(false);
                  setNewChestName("");
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <label className="block">
                <div className="text-[12px] p-muted-2 mb-1">Chest name</div>
                <input
                  value={newChestName}
                  onChange={(e) => setNewChestName(e.target.value)}
                  placeholder="e.g., Captain’s Tools"
                  className="p-input w-full"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2 flex-wrap">
              <button
                type="button"
                className="p-btn p-btn-primary"
                onClick={() => {
                  const id = createChest(newChestName);
                  if (id) {
                    setNewChestOpen(false);
                    setNewChestName("");
                  }
                }}
                disabled={!newChestName.trim()}
              >
                Create <span aria-hidden="true">🗂️</span>
              </button>
              <button
                type="button"
                className="p-btn p-btn-ghost"
                onClick={() => {
                  setNewChestOpen(false);
                  setNewChestName("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Rename chest modal */}
      {renameChestOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/50 p-4 flex items-center justify-center">
          <div className="p-card p-card-strong p-5 md:p-6 w-full max-w-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="p-title text-[18px] font-semibold">Rename chest</div>
                <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                  Keep the fantasy. Keep it yours.
                </div>
              </div>
              <button
                type="button"
                className="p-btn p-btn-ghost h-10 w-10"
                onClick={() => setRenameChestOpen(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <label className="block">
                <div className="text-[12px] p-muted-2 mb-1">New name</div>
                <input
                  value={renameChestOpen.name}
                  onChange={(e) =>
                    setRenameChestOpen((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                  }
                  className="p-input w-full"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2 flex-wrap">
              <button
                type="button"
                className="p-btn p-btn-primary"
                disabled={!renameChestOpen.name.trim()}
                onClick={() => {
                  renameChest(renameChestOpen.chestId, renameChestOpen.name);
                  setRenameChestOpen(null);
                }}
              >
                Save <span aria-hidden="true">✨</span>
              </button>
              <button type="button" className="p-btn p-btn-ghost" onClick={() => setRenameChestOpen(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete chest modal */}
      {deleteChestOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/50 p-4 flex items-center justify-center">
          <div className="p-card p-card-strong p-5 md:p-6 w-full max-w-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="p-title text-[18px] font-semibold">Delete chest</div>
                <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                  Items will be safely moved to <span className="font-semibold">Default</span>.
                </div>
              </div>
              <button
                type="button"
                className="p-btn p-btn-ghost h-10 w-10"
                onClick={() => setDeleteChestOpen(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 p-card p-4 bg-[rgba(9,12,22,0.18)] border border-[rgba(246,225,160,0.14)] rounded-2xl">
              <div className="p-title text-[15px] font-semibold">{deleteChestOpen.name}</div>
              <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                This chest is not the default one, so you can delete it.
              </div>
            </div>

            <div className="mt-5 flex gap-2 flex-wrap">
              <button
                type="button"
                className="p-btn p-btn-ghost"
                onClick={() => setDeleteChestOpen(null)}
              >
                Keep it
              </button>
              <button
                type="button"
                className="p-btn p-btn-primary"
                onClick={() => {
                  deleteChest(deleteChestOpen.chestId);
                  setDeleteChestOpen(null);
                }}
              >
                Delete <span aria-hidden="true">🗑️</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


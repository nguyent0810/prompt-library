import type { PiratePrompt } from "@/data/pirate-prompts";

export type InventoryItemId = `orig:${string}` | `variant:${string}`;

export type PirateVariant = {
  id: string;
  basePromptId: string;
  title: string;
  content: string;
  workingNote?: string;
  createdAt: number;
  updatedAt: number;
};

export type PirateChest = {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: number;
};

export type PirateInventoryState = {
  versionById: Record<string, PirateVariant>;
  chests: PirateChest[];
  // Each chest contains itemIds (orig:* or variant:*)
  chestItemsByChestId: Record<string, InventoryItemId[]>;
  equippedItemIds: InventoryItemId[];
  lastActiveChestId: string;
  recentlyViewedItemIds: InventoryItemId[];
};

const INVENTORY_KEY = "pirate-inventory-v1";
const IMPORT_ACK_KEY = "pirate-inventory-import-ack-v1";

let syncTimer: number | null = null;
let syncingNow = false;
let syncQueuedState: PirateInventoryState | null = null;

function uid(prefix: string) {
  // Short, collision-resistant enough for local-only usage.
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultState(): PirateInventoryState {
  const defaultChestId = "default-chest";
  return {
    versionById: {},
    chests: [
      {
        id: defaultChestId,
        name: "Default Chest",
        isDefault: true,
        createdAt: Date.now(),
      },
    ],
    chestItemsByChestId: {
      [defaultChestId]: [],
    },
    equippedItemIds: [],
    lastActiveChestId: defaultChestId,
    recentlyViewedItemIds: [],
  };
}

function safeParse(raw: string | null): PirateInventoryState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PirateInventoryState>;
    if (!parsed || typeof parsed !== "object") return null;
    const base = defaultState();

    const versionById =
      parsed.versionById && typeof parsed.versionById === "object"
        ? (parsed.versionById as Record<string, PirateVariant>)
        : base.versionById;

    const chests = Array.isArray(parsed.chests) ? (parsed.chests as PirateChest[]) : base.chests;

    const chestItemsByChestId =
      parsed.chestItemsByChestId && typeof parsed.chestItemsByChestId === "object"
        ? (parsed.chestItemsByChestId as Record<string, InventoryItemId[]>)
        : base.chestItemsByChestId;

    const equippedItemIds = Array.isArray(parsed.equippedItemIds)
      ? (parsed.equippedItemIds as InventoryItemId[])
      : base.equippedItemIds;

    const lastActiveChestId =
      typeof parsed.lastActiveChestId === "string" ? parsed.lastActiveChestId : base.lastActiveChestId;

    const recentlyViewedItemIds = Array.isArray(parsed.recentlyViewedItemIds)
      ? (parsed.recentlyViewedItemIds as InventoryItemId[])
      : base.recentlyViewedItemIds;

    // Ensure default chest exists.
    const defaultChest = chests.find((c) => c.isDefault) ?? base.chests[0];
    const normalizedChests = chests.length > 0 ? chests : [defaultChest];

    if (!normalizedChests.find((c) => c.id === base.chests[0].id)) {
      normalizedChests.unshift(base.chests[0]);
    }

    const normalizedChestItems: Record<string, InventoryItemId[]> = { ...chestItemsByChestId };
    for (const chest of normalizedChests) {
      if (!Array.isArray(normalizedChestItems[chest.id])) normalizedChestItems[chest.id] = [];
    }

    const normalizedLastActive =
      normalizedChests.some((c) => c.id === lastActiveChestId) ? lastActiveChestId : base.chests[0].id;

    return {
      versionById,
      chests: normalizedChests,
      chestItemsByChestId: normalizedChestItems,
      equippedItemIds: equippedItemIds.slice(0, 3),
      lastActiveChestId: normalizedLastActive,
      recentlyViewedItemIds: recentlyViewedItemIds.slice(0, 8),
    };
  } catch {
    return null;
  }
}

export function readInventoryState(): PirateInventoryState {
  if (typeof window === "undefined") return defaultState();
  const parsed = safeParse(window.localStorage.getItem(INVENTORY_KEY));
  return parsed ?? defaultState();
}

function writeInventoryState(next: PirateInventoryState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INVENTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("pirate-inventory-changed"));
  queueSyncToServer(next);
}

function writeInventoryStateLocalOnly(next: PirateInventoryState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INVENTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("pirate-inventory-changed"));
}

async function pushStateToServer(state: PirateInventoryState) {
  const res = await fetch("/api/pirate/inventory", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ state }),
  });
  if (!res.ok) throw new Error(`Failed to sync inventory: ${res.status}`);
}

function queueSyncToServer(state: PirateInventoryState) {
  if (typeof window === "undefined") return;
  const cookie = typeof document !== "undefined" ? document.cookie : "";
  const maybeLoggedIn =
    cookie.includes("next-auth.session-token=") ||
    cookie.includes("__Secure-next-auth.session-token=") ||
    cookie.includes("authjs.session-token=") ||
    cookie.includes("__Secure-authjs.session-token=");
  if (!maybeLoggedIn) return;

  syncQueuedState = state;
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(async () => {
    if (syncingNow || !syncQueuedState) return;
    syncingNow = true;
    const payload = syncQueuedState;
    try {
      await pushStateToServer(payload);
    } catch {
      // Keep local UX instant; failed remote sync will retry on next mutation.
    } finally {
      syncingNow = false;
    }
  }, 450);
}

export function getDefaultChestId(state?: PirateInventoryState) {
  const s = state ?? readInventoryState();
  return s.chests.find((c) => c.isDefault)?.id ?? s.chests[0]?.id ?? "default-chest";
}

export function getItemIdForPrompt(promptId: string): InventoryItemId {
  return `orig:${promptId}`;
}

export function getItemIdForVariant(variantId: string): InventoryItemId {
  return `variant:${variantId}`;
}

export function findChestIdContainingItem(itemId: InventoryItemId, state?: PirateInventoryState): string | null {
  const s = state ?? readInventoryState();
  for (const chest of s.chests) {
    const items = s.chestItemsByChestId[chest.id] ?? [];
    if (items.includes(itemId)) return chest.id;
  }
  return null;
}

export function listChests() {
  const s = readInventoryState();
  return s.chests.slice().sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.createdAt - b.createdAt);
}

export function getLastActiveChestId() {
  const s = readInventoryState();
  return s.lastActiveChestId;
}

export function setLastActiveChestId(chestId: string) {
  const s = readInventoryState();
  if (!s.chests.some((c) => c.id === chestId)) return;
  writeInventoryState({ ...s, lastActiveChestId: chestId });
}

export function createChest(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const s = readInventoryState();
  const id = uid("chest");
  const nextChest: PirateChest = { id, name: trimmed, isDefault: false, createdAt: Date.now() };
  const next: PirateInventoryState = {
    ...s,
    chests: [...s.chests, nextChest],
    chestItemsByChestId: { ...s.chestItemsByChestId, [id]: [] },
    lastActiveChestId: id,
  };
  writeInventoryState(next);
  return id;
}

export function renameChest(chestId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const s = readInventoryState();
  const next = {
    ...s,
    chests: s.chests.map((c) => (c.id === chestId ? { ...c, name: trimmed } : c)),
  };
  writeInventoryState(next);
}

export function deleteChest(chestId: string) {
  const s = readInventoryState();
  const chest = s.chests.find((c) => c.id === chestId);
  if (!chest) return;
  if (chest.isDefault) return;

  const defaultChestId = getDefaultChestId(s);
  const itemsToMove = s.chestItemsByChestId[chestId] ?? [];

  const nextChestItemsByChestId: Record<string, InventoryItemId[]> = { ...s.chestItemsByChestId };
  nextChestItemsByChestId[defaultChestId] = Array.from(new Set([...(nextChestItemsByChestId[defaultChestId] ?? []), ...itemsToMove]));
  delete nextChestItemsByChestId[chestId];

  const nextEquipped = s.equippedItemIds;

  const next: PirateInventoryState = {
    ...s,
    chests: s.chests.filter((c) => c.id !== chestId),
    chestItemsByChestId: nextChestItemsByChestId,
    equippedItemIds: nextEquipped,
    lastActiveChestId: s.lastActiveChestId === chestId ? defaultChestId : s.lastActiveChestId,
  };

  // If a chest is deleted, keep itemIds (safe move to default).
  writeInventoryState(next);
}

function ensureItemNotInOtherChests(itemId: InventoryItemId, state: PirateInventoryState) {
  const s = state;
  const containing = findChestIdContainingItem(itemId, s);
  if (!containing) return s;
  if (containing === null) return s;
  const next = { ...s, chestItemsByChestId: { ...s.chestItemsByChestId } };
  next.chestItemsByChestId[containing] = (next.chestItemsByChestId[containing] ?? []).filter(
    (x) => x !== itemId,
  );
  return next;
}

export function addOriginalToChest(prompt: PiratePrompt, chestId?: string) {
  const s0 = readInventoryState();
  const targetChestId = chestId && s0.chests.some((c) => c.id === chestId) ? chestId : getDefaultChestId(s0);
  const itemId = getItemIdForPrompt(prompt.id);
  const s1 = ensureItemNotInOtherChests(itemId, s0);
  const items = s1.chestItemsByChestId[targetChestId] ?? [];
  if (items.includes(itemId)) return s1;
  const next: PirateInventoryState = {
    ...s1,
    chestItemsByChestId: {
      ...s1.chestItemsByChestId,
      [targetChestId]: [...items, itemId],
    },
    lastActiveChestId: targetChestId,
  };
  writeInventoryState(next);
  return next;
}

export function removeItemFromChest(itemId: InventoryItemId) {
  const s = readInventoryState();
  const chestId = findChestIdContainingItem(itemId, s);
  if (!chestId) return;

  const next: PirateInventoryState = {
    ...s,
    chestItemsByChestId: {
      ...s.chestItemsByChestId,
      [chestId]: (s.chestItemsByChestId[chestId] ?? []).filter((x) => x !== itemId),
    },
    equippedItemIds: s.equippedItemIds.filter((x) => x !== itemId),
  };
  writeInventoryState(next);
}

export function moveItemToChest(itemId: InventoryItemId, toChestId: string) {
  const s0 = readInventoryState();
  if (!s0.chests.some((c) => c.id === toChestId)) return;
  const fromChestId = findChestIdContainingItem(itemId, s0);

  const s1 = ensureItemNotInOtherChests(itemId, s0);
  if (fromChestId && fromChestId === toChestId) {
    writeInventoryState({ ...s0, lastActiveChestId: toChestId });
    return;
  }

  const items = s1.chestItemsByChestId[toChestId] ?? [];
  const next: PirateInventoryState = {
    ...s1,
    chestItemsByChestId: {
      ...s1.chestItemsByChestId,
      [toChestId]: items.includes(itemId) ? items : [...items, itemId],
    },
    lastActiveChestId: toChestId,
  };
  writeInventoryState(next);
}

export function isItemEquipped(itemId: InventoryItemId) {
  const s = readInventoryState();
  return s.equippedItemIds.includes(itemId);
}

export function toggleEquip(itemId: InventoryItemId, maxSlots = 3) {
  const s0 = readInventoryState();
  const equipped = s0.equippedItemIds.includes(itemId);
  if (equipped) {
    const next = { ...s0, equippedItemIds: s0.equippedItemIds.filter((x) => x !== itemId) };
    writeInventoryState(next);
    return next;
  }

  // Only equip items that exist in any chest.
  if (!findChestIdContainingItem(itemId, s0)) return s0;

  const nextEquipped = [...s0.equippedItemIds, itemId].slice(0, maxSlots);
  const next = { ...s0, equippedItemIds: nextEquipped };
  writeInventoryState(next);
  return next;
}

export function addVariant(variant: PirateVariant) {
  const s = readInventoryState();
  const next: PirateInventoryState = {
    ...s,
    versionById: { ...s.versionById, [variant.id]: variant },
  };
  writeInventoryState(next);
  return variant.id;
}

export function createVariantFromPrompt(params: {
  basePrompt: PiratePrompt;
  title: string;
  content: string;
  workingNote?: string;
}) {
  const s = readInventoryState();
  const id = uid("v");
  const now = Date.now();
  const variant: PirateVariant = {
    id,
    basePromptId: params.basePrompt.id,
    title: params.title.trim() ? params.title.trim() : `${params.basePrompt.title} (My Version)`,
    content: params.content,
    workingNote: params.workingNote?.trim() ? params.workingNote.trim() : undefined,
    createdAt: now,
    updatedAt: now,
  };
  const next: PirateInventoryState = {
    ...s,
    versionById: { ...s.versionById, [id]: variant },
    lastActiveChestId: s.lastActiveChestId,
  };
  writeInventoryState(next);
  return id;
}

export function saveVariantToChest(variantId: string, chestId?: string) {
  const s0 = readInventoryState();
  const targetChestId =
    chestId && s0.chests.some((c) => c.id === chestId) ? chestId : getDefaultChestId(s0);
  const itemId = getItemIdForVariant(variantId);
  const s1 = ensureItemNotInOtherChests(itemId, s0);
  const items = s1.chestItemsByChestId[targetChestId] ?? [];
  if (!items.includes(itemId)) {
    const next: PirateInventoryState = {
      ...s1,
      chestItemsByChestId: {
        ...s1.chestItemsByChestId,
        [targetChestId]: [...items, itemId],
      },
      lastActiveChestId: targetChestId,
    };
    writeInventoryState(next);
    return next;
  }
  return s1;
}

export function getRecentlyViewedItems() {
  const s = readInventoryState();
  return s.recentlyViewedItemIds;
}

export function recordRecentlyViewed(itemId: InventoryItemId) {
  const s0 = readInventoryState();
  const nextViewed = [itemId, ...s0.recentlyViewedItemIds.filter((x) => x !== itemId)].slice(0, 8);
  writeInventoryState({ ...s0, recentlyViewedItemIds: nextViewed });
}

export function getVariantById(id: string): PirateVariant | null {
  const s = readInventoryState();
  return s.versionById[id] ?? null;
}

export function getItemsForChest(chestId: string) {
  const s = readInventoryState();
  return s.chestItemsByChestId[chestId] ?? [];
}

export async function hydrateInventoryFromServer() {
  if (typeof window === "undefined") return { ok: false as const };
  try {
    const res = await fetch("/api/pirate/inventory", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 401) return { ok: false as const, unauthorized: true as const };
    if (!res.ok) return { ok: false as const };
    const data = (await res.json()) as { state?: PirateInventoryState };
    if (!data?.state) return { ok: false as const };
    writeInventoryStateLocalOnly(data.state);
    return { ok: true as const, state: data.state };
  } catch {
    return { ok: false as const };
  }
}

export async function importLocalInventoryToAccount(localState: PirateInventoryState) {
  const res = await fetch("/api/pirate/inventory/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ state: localState }),
  });
  if (!res.ok) throw new Error(`Import failed: ${res.status}`);
  const data = (await res.json()) as {
    imported: boolean;
    reason?: string | null;
    state?: PirateInventoryState;
  };
  if (data.state) writeInventoryStateLocalOnly(data.state);
  return data;
}

export function hasLocalInventoryData(state?: PirateInventoryState) {
  const s = state ?? readInventoryState();
  const itemCount = Object.values(s.chestItemsByChestId).reduce((acc, list) => acc + list.length, 0);
  const variantCount = Object.keys(s.versionById).length;
  return itemCount > 0 || variantCount > 0 || s.chests.length > 1;
}

export function hasAcknowledgedImportPrompt() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(IMPORT_ACK_KEY) === "1";
}

export function acknowledgeImportPrompt() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(IMPORT_ACK_KEY, "1");
}


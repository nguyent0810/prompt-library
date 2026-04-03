import { db } from "@/lib/db";
import type { InventoryItemId, PirateInventoryState, PirateVariant } from "@/lib/pirate-inventory";

type DbPayload = {
  chests: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    createdAt: Date;
    items: Array<{ itemId: string }>;
  }>;
  variants: Array<{
    id: string;
    basePromptId: string;
    title: string;
    content: string;
    workingNote: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  meta: {
    lastActiveChestId: string | null;
    equippedItemIds: unknown;
    recentlyViewedItemIds: unknown;
    importedFromLocalAt: Date | null;
  } | null;
};

function toInventoryState(payload: DbPayload): PirateInventoryState {
  const defaultChest = payload.chests.find((c) => c.isDefault) ?? payload.chests[0] ?? null;
  const fallbackChestId = defaultChest?.id ?? "default-chest";

  const chestItemsByChestId: Record<string, InventoryItemId[]> = {};
  for (const chest of payload.chests) {
    chestItemsByChestId[chest.id] = chest.items.map((x) => x.itemId as InventoryItemId);
  }

  const versionById: Record<string, PirateVariant> = {};
  for (const v of payload.variants) {
    versionById[v.id] = {
      id: v.id,
      basePromptId: v.basePromptId,
      title: v.title,
      content: v.content,
      workingNote: v.workingNote ?? undefined,
      createdAt: v.createdAt.getTime(),
      updatedAt: v.updatedAt.getTime(),
    };
  }

  const recentlyViewedItemIds = Array.isArray(payload.meta?.recentlyViewedItemIds)
    ? (payload.meta?.recentlyViewedItemIds as InventoryItemId[]).slice(0, 8)
    : [];
  const equippedItemIds = Array.isArray(payload.meta?.equippedItemIds)
    ? (payload.meta?.equippedItemIds as InventoryItemId[]).slice(0, 3)
    : [];

  const state: PirateInventoryState = {
    versionById,
    chests: payload.chests.map((c) => ({
      id: c.id,
      name: c.name,
      isDefault: c.isDefault,
      createdAt: c.createdAt.getTime(),
    })),
    chestItemsByChestId,
    equippedItemIds,
    lastActiveChestId: payload.meta?.lastActiveChestId ?? fallbackChestId,
    recentlyViewedItemIds,
  };
  return state;
}

export async function loadPirateInventoryForUser(userId: string) {
  const [chests, variants, meta] = await Promise.all([
    db.pirateChest.findMany({
      where: { userId },
      include: { items: { select: { itemId: true } } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    db.pirateVariant.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    db.pirateInventoryState.findUnique({ where: { userId } }),
  ]);

  if (chests.length === 0) {
    const defaultChest = await db.pirateChest.create({
      data: {
        userId,
        name: "Default Chest",
        isDefault: true,
      },
      include: { items: { select: { itemId: true } } },
    });

    const next = toInventoryState({
      chests: [defaultChest],
      variants,
      meta,
    });
    return next;
  }

  return toInventoryState({ chests, variants, meta });
}

export async function savePirateInventoryForUser(userId: string, state: PirateInventoryState) {
  await db.$transaction(async (tx) => {
    const existingChests = await tx.pirateChest.findMany({
      where: { userId },
      select: { id: true, isDefault: true },
    });
    const existingChestIds = new Set(existingChests.map((c) => c.id));

    for (const chest of state.chests) {
      if (existingChestIds.has(chest.id)) {
        await tx.pirateChest.update({
          where: { id: chest.id },
          data: { name: chest.name, isDefault: chest.isDefault },
        });
      } else {
        await tx.pirateChest.create({
          data: {
            id: chest.id,
            userId,
            name: chest.name,
            isDefault: chest.isDefault,
            createdAt: new Date(chest.createdAt),
          },
        });
      }
    }

    const incomingChestIds = new Set(state.chests.map((c) => c.id));
    for (const chestId of existingChestIds) {
      if (!incomingChestIds.has(chestId)) {
        await tx.pirateChest.delete({ where: { id: chestId } });
      }
    }

    await tx.pirateChestItem.deleteMany({
      where: { chest: { userId } },
    });

    for (const chest of state.chests) {
      const itemIds = state.chestItemsByChestId[chest.id] ?? [];
      if (itemIds.length === 0) continue;
      await tx.pirateChestItem.createMany({
        data: itemIds.map((itemId) => ({
          chestId: chest.id,
          itemId,
        })),
        skipDuplicates: true,
      });
    }

    const existingVariants = await tx.pirateVariant.findMany({
      where: { userId },
      select: { id: true },
    });
    const existingVariantIds = new Set(existingVariants.map((v) => v.id));
    const incomingVariantIds = new Set(Object.keys(state.versionById));

    for (const [id, variant] of Object.entries(state.versionById)) {
      if (existingVariantIds.has(id)) {
        await tx.pirateVariant.update({
          where: { id },
          data: {
            basePromptId: variant.basePromptId,
            title: variant.title,
            content: variant.content,
            workingNote: variant.workingNote ?? null,
            updatedAt: new Date(variant.updatedAt),
          },
        });
      } else {
        await tx.pirateVariant.create({
          data: {
            id,
            userId,
            basePromptId: variant.basePromptId,
            title: variant.title,
            content: variant.content,
            workingNote: variant.workingNote ?? null,
            createdAt: new Date(variant.createdAt),
            updatedAt: new Date(variant.updatedAt),
          },
        });
      }
    }

    for (const variantId of existingVariantIds) {
      if (!incomingVariantIds.has(variantId)) {
        await tx.pirateVariant.delete({ where: { id: variantId } });
      }
    }

    await tx.pirateInventoryState.upsert({
      where: { userId },
      update: {
        lastActiveChestId: state.lastActiveChestId,
        equippedItemIds: state.equippedItemIds,
        recentlyViewedItemIds: state.recentlyViewedItemIds,
      },
      create: {
        userId,
        lastActiveChestId: state.lastActiveChestId,
        equippedItemIds: state.equippedItemIds,
        recentlyViewedItemIds: state.recentlyViewedItemIds,
      },
    });
  });
}

export async function importPirateInventoryFromLocal(userId: string, state: PirateInventoryState) {
  const [chestCount, variantCount] = await Promise.all([
    db.pirateChest.count({ where: { userId } }),
    db.pirateVariant.count({ where: { userId } }),
  ]);

  if (chestCount > 0 || variantCount > 0) {
    return { imported: false, reason: "existing_data" as const };
  }

  await savePirateInventoryForUser(userId, state);
  await db.pirateInventoryState.upsert({
    where: { userId },
    update: { importedFromLocalAt: new Date() },
    create: { userId, importedFromLocalAt: new Date() },
  });
  return { imported: true as const };
}


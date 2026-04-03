-- CreateTable
CREATE TABLE "pirate_chests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "pirate_chests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pirate_chest_items" (
    "id" TEXT NOT NULL,
    "chestId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pirate_chest_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pirate_variants" (
    "id" TEXT NOT NULL,
    "basePromptId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "workingNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "pirate_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pirate_inventory_states" (
    "userId" TEXT NOT NULL,
    "lastActiveChestId" TEXT,
    "equippedItemIds" JSONB,
    "recentlyViewedItemIds" JSONB,
    "importedFromLocalAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pirate_inventory_states_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "pirate_chests_userId_idx" ON "pirate_chests"("userId");

-- CreateIndex
CREATE INDEX "pirate_chests_userId_isDefault_idx" ON "pirate_chests"("userId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "pirate_chest_items_chestId_itemId_key" ON "pirate_chest_items"("chestId", "itemId");

-- CreateIndex
CREATE INDEX "pirate_chest_items_chestId_idx" ON "pirate_chest_items"("chestId");

-- CreateIndex
CREATE INDEX "pirate_chest_items_itemId_idx" ON "pirate_chest_items"("itemId");

-- CreateIndex
CREATE INDEX "pirate_variants_userId_idx" ON "pirate_variants"("userId");

-- CreateIndex
CREATE INDEX "pirate_variants_basePromptId_idx" ON "pirate_variants"("basePromptId");

-- AddForeignKey
ALTER TABLE "pirate_chests" ADD CONSTRAINT "pirate_chests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pirate_chest_items" ADD CONSTRAINT "pirate_chest_items_chestId_fkey" FOREIGN KEY ("chestId") REFERENCES "pirate_chests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pirate_variants" ADD CONSTRAINT "pirate_variants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pirate_inventory_states" ADD CONSTRAINT "pirate_inventory_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

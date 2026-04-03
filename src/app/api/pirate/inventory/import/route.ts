import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { PirateInventoryState } from "@/lib/pirate-inventory";
import { importPirateInventoryFromLocal, loadPirateInventoryForUser } from "@/lib/pirate-inventory-server";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { state?: PirateInventoryState };
  if (!body?.state) {
    return NextResponse.json({ error: "Missing local state" }, { status: 400 });
  }

  const result = await importPirateInventoryFromLocal(userId, body.state);
  const state = await loadPirateInventoryForUser(userId);

  return NextResponse.json({
    ok: true,
    imported: result.imported,
    reason: "reason" in result ? result.reason : null,
    state,
  });
}


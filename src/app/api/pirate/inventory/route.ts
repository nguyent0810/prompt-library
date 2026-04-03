import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { PirateInventoryState } from "@/lib/pirate-inventory";
import { loadPirateInventoryForUser, savePirateInventoryForUser } from "@/lib/pirate-inventory-server";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await loadPirateInventoryForUser(userId);
  return NextResponse.json({ state });
}

export async function PUT(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { state?: PirateInventoryState };
  if (!body?.state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }

  await savePirateInventoryForUser(userId, body.state);
  return NextResponse.json({ ok: true });
}


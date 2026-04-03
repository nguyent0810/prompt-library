"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  acknowledgeImportPrompt,
  hasAcknowledgedImportPrompt,
  hasLocalInventoryData,
  hydrateInventoryFromServer,
  importLocalInventoryToAccount,
  readInventoryState,
} from "@/lib/pirate-inventory";

export function InventoryAuthSync() {
  const { status } = useSession();
  const hydratedOnce = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (hydratedOnce.current) return;
    hydratedOnce.current = true;

    (async () => {
      const local = readInventoryState();
      const hasLocal = hasLocalInventoryData(local);
      const hydrated = await hydrateInventoryFromServer();

      // One-time local import prompt for users coming from pre-auth/local-only usage.
      if (hasLocal && hydrated.ok && !hasAcknowledgedImportPrompt()) {
        const serverHasData = hasLocalInventoryData(hydrated.state);
        if (!serverHasData) {
          const confirmed = window.confirm(
            "Import your local Chest and My Versions into your account now? This is a one-time migration.",
          );
          if (confirmed) {
            try {
              await importLocalInventoryToAccount(local);
            } catch {
              // Keep silent; local data remains available.
            }
          }
        }
        acknowledgeImportPrompt();
      }
    })();
  }, [status]);

  return null;
}


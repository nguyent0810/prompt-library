import type { ReactNode } from "react";
import { Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import { InventoryAuthSync } from "@/components/pirate/inventory-auth-sync";

const pirateDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const pirateMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export function PirateShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`pirate-skin pirate-wrap ${className || ""}`.trim()}
      style={
        {
          ["--p-font-display" as any]: pirateDisplay.style.fontFamily,
          ["--p-font-mono" as any]: pirateMono.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <InventoryAuthSync />
      {children}
    </div>
  );
}


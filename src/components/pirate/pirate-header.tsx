"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { readInventoryState } from "@/lib/pirate-inventory";

const navItems: Array<{ href: string; label: string }> = [
  { href: "/harbor", label: "Harbor" },
  { href: "/archive", label: "Archive" },
  { href: "/chest", label: "Chest" },
  { href: "/arena", label: "Arena" },
  { href: "/captain", label: "Captain Log" },
];

function formatChestCount(count: number) {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}

export function PirateHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chestCount, setChestCount] = useState(0);

  useEffect(() => {
    const state = readInventoryState();
    const total = Object.values(state.chestItemsByChestId).reduce((acc, list) => acc + list.length, 0);
    setChestCount(total);

    const onChestChanged = () => {
      const next = readInventoryState();
      const total = Object.values(next.chestItemsByChestId).reduce((acc, list) => acc + list.length, 0);
      setChestCount(total);
    };

    window.addEventListener("pirate-inventory-changed", onChestChanged);
    return () => window.removeEventListener("pirate-inventory-changed", onChestChanged);
  }, []);

  const activeHref = useMemo(() => {
    if (!pathname) return "";
    if (pathname.startsWith("/scroll/") || pathname.startsWith("/variant/") || pathname.startsWith("/my-version/"))
      return "/archive";
    return pathname;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(246,225,160,0.20)] bg-[rgba(5,7,12,0.60)] backdrop-blur supports-[backdrop-filter]:bg-[rgba(5,7,12,0.42)]">
      <div className="p-container py-3 flex items-center justify-between gap-3">
        <Link
          href="/harbor"
          className="flex items-center gap-3 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="h-9 w-9 rounded-xl border border-[rgba(214,162,58,0.45)] bg-[rgba(214,162,58,0.14)] flex items-center justify-center">
            <span className="text-[15px] leading-none">⚓</span>
          </div>
          <div className="leading-tight">
            <div className="p-title text-[17px] font-semibold text-[rgba(243,231,198,0.98)]">
              Treasure Archive
            </div>
            <div className="text-[11px] text-[rgba(243,231,198,0.65)]">
              Prompt scrolls for serious captains
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === activeHref ||
              (item.href === "/harbor" && pathname === "/harbor");
            const chestLabel = item.href === "/chest" ? `Chest` : item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "px-3 py-2 rounded-xl text-[13px] border transition-colors",
                  isActive
                    ? "border-[rgba(214,162,58,0.62)] bg-[rgba(214,162,58,0.14)]"
                    : "border-[rgba(246,225,160,0.12)] bg-[rgba(9,12,22,0.12)] hover:border-[rgba(214,162,58,0.35)] hover:bg-[rgba(9,12,22,0.22)]",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-2">
                  {item.href === "/chest" ? (
                    <span className="inline-flex items-center gap-2">
                      {chestLabel}
                      {chestCount > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1 rounded-full text-[11px] border border-[rgba(214,162,58,0.55)] bg-[rgba(214,162,58,0.16)]">
                          {formatChestCount(chestCount)}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <button
            className="p-btn h-10 w-10 rounded-2xl p-0"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="text-[16px]">☰</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen ? (
        <div className="md:hidden border-t border-[rgba(246,225,160,0.18)] bg-[rgba(5,7,12,0.86)]">
          <div className="p-container py-3">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const isActive = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setMobileOpen(false);
                      router.refresh();
                    }}
                    className={[
                      "px-3 py-3 rounded-xl text-[13px] border transition-colors",
                      isActive
                        ? "border-[rgba(214,162,58,0.62)] bg-[rgba(214,162,58,0.14)]"
                        : "border-[rgba(246,225,160,0.12)] bg-[rgba(9,12,22,0.12)] hover:border-[rgba(214,162,58,0.35)] hover:bg-[rgba(9,12,22,0.22)]",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{item.label}</span>
                      {item.href === "/chest" && chestCount > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1 rounded-full text-[11px] border border-[rgba(214,162,58,0.55)] bg-[rgba(214,162,58,0.16)]">
                          {formatChestCount(chestCount)}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}


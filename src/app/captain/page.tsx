import Link from "next/link";
import { DevilFruitCard } from "@/components/pirate/ai/DevilFruitCard";

export default function CaptainPage() {
  return (
    <div className="p-container py-8 md:py-10">
      <div className="p-hero-parchment px-5 md:px-8 py-8 md:py-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <div className="p-title text-[26px] md:text-[32px] font-semibold">
              Captain Log
            </div>
            <div className="p-muted mt-2 text-[14px] leading-relaxed max-w-2xl">
              Your Captain Log is now the trust deck:
              account-backed inventory + optional Devil Fruit control.
              The core product still starts with Archive browsing.
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Link href="/chest" className="p-btn p-btn-primary">
                Open your Chest <span aria-hidden="true">📦</span>
              </Link>
              <Link href="/archive" className="p-btn p-btn-ghost">
                Find more scrolls <span aria-hidden="true">🗺️</span>
              </Link>
            </div>
          </div>

          <div className="p-card p-card-strong p-5 sm:p-6 w-full lg:max-w-[420px]">
            <div className="text-[12px] p-muted-2">Trust controls</div>
            <div className="p-title text-[18px] font-semibold mt-2">Power-up status</div>
            <div className="p-muted mt-2 text-[13.5px] leading-relaxed">
              Your inventory persists with account login. Optional AI casting stays a focused power-up:
              ambient Sea Whisper + Devil Fruit BYOK for stronger execution.
            </div>
          </div>
        </div>

        <div className="mt-6">
          <DevilFruitCard />
        </div>
      </div>
    </div>
  );
}


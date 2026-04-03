import Link from "next/link";
import { piratePrompts } from "@/data/pirate-prompts";

export default function ArenaPage() {
  const sample = piratePrompts.find((p) => p.variables?.length) ?? piratePrompts[0];

  return (
    <div className="p-container py-8 md:py-10">
      <div className="p-hero-parchment px-5 md:px-8 py-8 md:py-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <div className="p-title text-[26px] md:text-[32px] font-semibold">
              Arena (Preview)
            </div>
            <div className="p-muted mt-2 text-[14px] leading-relaxed max-w-2xl">
              This Phase 2 slice includes bindings preview only. You can fill
              variables and copy the final scroll text without running any AI.
              When you open a scroll, you can practice like a captain.
            </div>
          </div>

          <div className="p-card p-card-strong p-4 sm:p-5">
            <div className="text-[12px] p-muted-2">Try a sample</div>
            <div className="p-title text-[18px] font-semibold mt-2">
              {sample?.title}
            </div>
            <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
              Open the scroll to fill bindings.
            </div>
            <div className="mt-3">
              <Link href={`/scroll/${sample?.id}`} className="p-btn p-btn-primary w-full justify-center">
                Enter the Arena <span aria-hidden="true">⚔️</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import { notFound } from "next/navigation";
import Link from "next/link";
import {
  pirateCategories,
  piratePrompts,
  pirateTags,
  type PiratePrompt,
} from "@/data/pirate-prompts";
import { ScrollDetailClient } from "@/components/pirate/scroll/ScrollDetailClient";

function categoryName(categoryId: string) {
  return pirateCategories.find((c) => c.id === categoryId)?.name ?? categoryId;
}

function rarityBadge(rarity?: string) {
  if (!rarity) return null;
  const base =
    rarity === "legendary"
      ? "p-badge p-badge-brass"
      : rarity === "rare"
        ? "p-badge p-badge-ember"
        : "p-badge";
  const label =
    rarity === "legendary" ? "Legendary Cache" : rarity === "rare" ? "Rare Find" : "Common Find";
  return (
    <span className={base}>
      <span aria-hidden="true">✨</span> {label}
    </span>
  );
}

export default async function ScrollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prompt = piratePrompts.find((p) => p.id === id);
  if (!prompt) notFound();

  const related = (prompt.relatedIds ?? [])
    .map((rid) => piratePrompts.find((p) => p.id === rid) ?? null)
    .filter((p): p is PiratePrompt => Boolean(p))
    .slice(0, 4);

  const fallbackRelated =
    related.length > 0
      ? related
      : piratePrompts
          .filter((p) => p.categoryId === prompt.categoryId && p.id !== prompt.id)
          .slice(0, 4);

  return (
    <div className="p-container py-8 md:py-10">
      <div className="p-hero-parchment px-5 md:px-8 py-8 md:py-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-3">
              {rarityBadge(prompt.rarity)}
              <span className="p-badge">
                <span aria-hidden="true">🗺️</span> {categoryName(prompt.categoryId)}
              </span>
              {prompt.premium ? (
                <span className="p-badge p-badge-brass">
                  <span aria-hidden="true">🗝️</span> Premium Scroll
                </span>
              ) : null}
            </div>

            <h1 className="p-title text-[32px] md:text-[44px] leading-[1.05] font-semibold">
              {prompt.title}
            </h1>
            <p className="p-muted mt-4 text-[15.5px] md:text-[17px] leading-relaxed">
              {prompt.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {prompt.tags.map((t) => (
                <span key={t} className="p-tag">
                  {pirateTags.find((x) => x.id === t)?.label ?? t}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:pt-1">
            <div className="p-card p-card-strong p-4">
              <div className="text-[12px] p-muted-2">Scroll actions</div>
              <div className="text-[13.5px] p-muted mt-2 leading-relaxed">
                Copy and save instantly. Bindings preview is local-no AI calls.
              </div>
              <div className="mt-3 p-divider" />
              <div className="mt-3">
                <Link href="/archive" className="p-btn p-btn-ghost w-full justify-center px-4 py-2.5">
                  Back to Archive <span aria-hidden="true">↩</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 p-card p-card-strong p-5 md:p-7 rounded-2xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="p-title text-[18px] font-semibold">Parchment Ink</div>
            <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
              Read it like a treasure map: clear structure, readable pacing.
            </div>
          </div>
          <div className="text-[12.5px] p-muted-2">
            Variable placeholders use <span className="font-semibold">{"${...}"}</span>
          </div>
        </div>
        <div className="mt-4 p-prompt-content">{prompt.content}</div>

        <ScrollDetailClient prompt={prompt} />
      </div>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="p-title text-[18px] font-semibold">Nearby treasures</div>
            <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
              Similar disciplines, or neighboring techniques from the same crew.
            </div>
          </div>
          <Link href={`/archive?category=${prompt.categoryId}`} className="p-btn p-btn-ghost px-4 py-2.5">
            Browse this guild <span aria-hidden="true">🗺️</span>
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fallbackRelated.map((p) => (
            <Link key={p.id} href={`/scroll/${p.id}`} className="block">
              <div className="p-card p-4 rounded-2xl h-full hover:translate-y-[-2px] transition-transform">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-title font-semibold text-[15px] leading-snug">
                    {p.title}
                  </div>
                  {p.rarity ? (
                    <span className="p-badge p-badge-brass text-[11px] whitespace-nowrap">
                      {p.rarity === "legendary" ? "Legendary" : p.rarity === "rare" ? "Rare" : "Common"}
                    </span>
                  ) : null}
                </div>
                <div className="p-muted text-[13px] mt-2 leading-relaxed line-clamp-3">
                  {p.description}
                </div>
                <div className="mt-3 text-[12px] p-muted-2">
                  {categoryName(p.categoryId)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}


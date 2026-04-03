import Link from "next/link";
import { pirateCategories, piratePrompts } from "@/data/pirate-prompts";
import { ChestPreview } from "@/components/pirate/chest-preview";
import { RecentlyViewedRail } from "@/components/pirate/recently-viewed-rail";

function RarityPreview({ label }: { label: string }) {
  return (
    <span className="p-badge p-badge-brass">
      <span aria-hidden="true">✨</span>
      {label}
    </span>
  );
}

export default function HarborPage() {
  const featuredCategoryIds = pirateCategories.map((c) => c.id).slice(0, 5);
  const featuredPrompts = piratePrompts
    .filter((p) => p.premium)
    .slice(0, 3);

  return (
    <div className="p-container py-10 md:py-14">
      <div className="p-hero-parchment px-5 md:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="p-badge">
                <span aria-hidden="true">🗺️</span>
                Prompt scrolls
              </span>
              <span className="p-badge p-badge-ember">
                <span aria-hidden="true">⚓</span>
                Treasure-first UX
              </span>
              <RarityPreview label="Optional casting, never required" />
            </div>

            <h1 className="p-title text-[38px] md:text-[54px] leading-[1.03] font-semibold">
              Set sail for the{" "}
              <span className="text-[rgba(240,195,92,0.98)]">Treasure Archive</span>.
            </h1>
            <p className="p-muted mt-4 text-[15px] md:text-[17px] leading-relaxed max-w-2xl">
              Discover prompts by discipline, store your favorites in chests,
              and preview your filled scrolls before you ever cast.
              <span className="block mt-2 text-[rgba(243,231,198,0.62)]">
                Browsing is free-first. Casting is optional and only unlocks if you consume a Devil Fruit.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link href="/archive" className="p-btn p-btn-primary">
                Chart the Waters <span aria-hidden="true">→</span>
              </Link>
              <Link href="/chest" className="p-btn p-btn-ghost">
                View your Chest <span aria-hidden="true">📦</span>
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-card rounded-2xl p-4">
                <div className="text-[12px] p-muted-2">Start</div>
                <div className="p-title text-[16px] font-semibold mt-1">
                  Browse without login
                </div>
              </div>
              <div className="p-card rounded-2xl p-4">
                <div className="text-[12px] p-muted-2">Save</div>
                <div className="p-title text-[16px] font-semibold mt-1">
                  Save to account-backed chests
                </div>
              </div>
              <div className="p-card rounded-2xl p-4">
                <div className="text-[12px] p-muted-2">Power-up</div>
                <div className="p-title text-[16px] font-semibold mt-1">
                  Optional Devil Fruit casting
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-card p-card-strong p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="p-title text-[20px] font-semibold">
                    Captain’s Picks
                  </div>
                  <div className="text-[12px] p-muted mt-1">
                    Premium scrolls from the archive
                  </div>
                </div>
                <span className="p-badge p-badge-brass">
                  <span aria-hidden="true">🪙</span> Rare
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {featuredPrompts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/scroll/${p.id}`}
                    className="block p-4 rounded-2xl border border-[rgba(246,225,160,0.16)] bg-[rgba(9,12,22,0.22)] hover:bg-[rgba(9,12,22,0.34)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="p-title font-semibold text-[15px]">
                          {p.title}
                        </div>
                        <div className="text-[12.5px] p-muted mt-1 line-clamp-2">
                          {p.description}
                        </div>
                      </div>
                      {p.rarity ? (
                        <span className="p-badge p-badge-ember whitespace-nowrap">
                          {p.rarity === "legendary"
                            ? "Legendary"
                            : p.rarity === "rare"
                              ? "Rare"
                              : "Common"}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-4 p-divider" />
              <div className="mt-4 text-[13px] p-muted leading-relaxed">
                Open a scroll to see its bindings preview and save it into
                your Chest.
              </div>
            </div>

            <ChestPreview />
            <div className="mt-4">
              <RecentlyViewedRail />
            </div>
          </div>
        </div>
      </div>

      {/* Featured categories */}
      <section className="mt-10 md:mt-14">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="p-title text-[22px] font-semibold">Disciplines</div>
            <div className="p-muted mt-2 text-[14px] max-w-2xl">
              Browse by guild: tactics, storycraft, research, brand voice, and
              the dev guild.
            </div>
          </div>
          <Link href="/archive" className="p-btn p-btn-ghost px-4 py-2.5">
            Open Archive <span aria-hidden="true">🧭</span>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {pirateCategories
            .filter((c) => featuredCategoryIds.includes(c.id))
            .map((c) => (
              <Link
                key={c.id}
                href={`/archive?category=${c.id}`}
                className="p-card rounded-2xl p-5 hover:translate-y-[-1px] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[22px]" aria-hidden="true">
                    {c.icon}
                  </span>
                  <span className="p-badge">
                    <span aria-hidden="true">⛵</span> Guild
                  </span>
                </div>
                <div className="p-title font-semibold text-[16px] mt-3">
                  {c.name}
                </div>
                <div className="p-muted text-[13px] mt-2 leading-relaxed">
                  {c.id === "tactics" && "Guided questions, rubrics, and safe edits."}
                  {c.id === "storycraft" && "Arcs, interviews, and roleplay scenes."}
                  {c.id === "research" && "Claims, evidence tables, and decision memos."}
                  {c.id === "brandvoice" && "Tone controls and copy that stays on-chart."}
                  {c.id === "devguild" && "Checklists, schemas, and code review hunts."}
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-10 md:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 p-card p-card-strong p-6 md:p-8 rounded-2xl">
          <div className="p-title text-[22px] font-semibold">How the Archive works</div>
          <div className="p-muted mt-2 text-[14px] leading-relaxed max-w-2xl">
            A treasure archive should feel like browsing scrolls, not a dashboard.
            Here’s the flow we ship in this slice.
          </div>

          <div className="mt-6 space-y-3">
            {[
              { n: "1", title: "Chart the Waters", text: "Search by title, skim by discipline, filter by skills." },
              { n: "2", title: "Open a Scroll", text: "Read the content in a readable parchment panel." },
              { n: "3", title: "Fill Bindings", text: "Preview the filled prompt and copy it cleanly." },
            ].map((step) => (
              <div
                key={step.n}
                className="p-card rounded-2xl border border-[rgba(246,225,160,0.14)] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl border border-[rgba(214,162,58,0.55)] bg-[rgba(214,162,58,0.14)] flex items-center justify-center p-title font-semibold">
                    {step.n}
                  </div>
                  <div>
                    <div className="p-title font-semibold">{step.title}</div>
                    <div className="p-muted text-[13.5px] mt-1 leading-relaxed">
                      {step.text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 p-card rounded-2xl p-6 md:p-8">
          <div className="p-title text-[20px] font-semibold">The Chest experience</div>
          <div className="p-muted mt-2 text-[14px] leading-relaxed">
            Chest and variants are account-backed for multi-session use. Archive browsing stays fast and public.
          </div>

          <div className="mt-5 space-y-3">
            {[
              { title: "Store Scrolls", text: "Tap “Save to Chest” from a scroll page." },
              { title: "Find them fast", text: "Your saved list updates immediately." },
              { title: "Copy with confidence", text: "Bindings preview helps you paste the right version." },
            ].map((x) => (
              <div
                key={x.title}
                className="border border-[rgba(246,225,160,0.14)] rounded-2xl p-4 bg-[rgba(9,12,22,0.20)]"
              >
                <div className="p-title font-semibold">{x.title}</div>
                <div className="p-muted text-[13.5px] mt-1 leading-relaxed">
                  {x.text}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link href="/archive?premium=1" className="p-btn p-btn-primary w-full justify-center">
              See Premium Scrolls <span aria-hidden="true">🗝️</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


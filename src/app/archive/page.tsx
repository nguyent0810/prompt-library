"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  pirateCategories,
  piratePrompts,
  pirateTags,
  type PirateCategoryId,
  type PiratePrompt,
  type PirateRarity,
  type PirateTagId,
} from "@/data/pirate-prompts";

function getCategoryName(id: PirateCategoryId) {
  return pirateCategories.find((c) => c.id === id)?.name ?? id;
}

function getTagLabel(id: PirateTagId) {
  return pirateTags.find((t) => t.id === id)?.label ?? id;
}

function rarityRank(rarity?: PirateRarity) {
  if (!rarity) return 0;
  if (rarity === "legendary") return 3;
  if (rarity === "rare") return 2;
  return 1;
}

function computeFilteredPrompts(opts: {
  prompts: PiratePrompt[];
  query: string;
  categoryId: PirateCategoryId | "all";
  selectedTags: PirateTagId[];
  sort: "featured" | "rarity" | "alpha";
  premiumOnly: boolean;
}) {
  const q = opts.query.trim().toLowerCase();
  const selectedTagsSet = new Set(opts.selectedTags);

  const filtered = opts.prompts.filter((p) => {
    if (opts.premiumOnly && !p.premium) return false;
    if (opts.categoryId !== "all" && p.categoryId !== opts.categoryId) return false;

    if (selectedTagsSet.size > 0) {
      // Skill filter: match any selected skill
      const matchAny = p.tags.some((t) => selectedTagsSet.has(t));
      if (!matchAny) return false;
    }

    if (q.length > 0) {
      const haystack = `${p.title}\n${p.description}\n${p.content}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (opts.sort === "alpha") return a.title.localeCompare(b.title);
    if (opts.sort === "rarity") {
      const r = rarityRank(b.rarity) - rarityRank(a.rarity);
      if (r !== 0) return r;
      return a.title.localeCompare(b.title);
    }
    // featured
    const p = Number(!!b.premium) - Number(!!a.premium);
    if (p !== 0) return p;
    const r = rarityRank(b.rarity) - rarityRank(a.rarity);
    if (r !== 0) return r;
    return a.title.localeCompare(b.title);
  });

  return sorted;
}

export default function ArchivePage() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const paramsSafe = params ?? new URLSearchParams();
  const paramsKey = paramsSafe.toString();
  const hasUrlParams = paramsKey.trim().length > 0;

  const RESTORE_KEY = "pirate-archive-ui-v1";

  const initialQuery = paramsSafe.get("q") ?? "";
  const initialCategory = (paramsSafe.get("category") as PirateCategoryId | "all" | null) ?? "all";
  const initialSort = (paramsSafe.get("sort") as "featured" | "rarity" | "alpha" | null) ?? "featured";
  const initialPremium = paramsSafe.get("premium") === "1";
  const initialTags = (paramsSafe.get("tags") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as PirateTagId[];

  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState<PirateCategoryId | "all">(initialCategory);
  const [sort, setSort] = useState<"featured" | "rarity" | "alpha">(initialSort);
  const [premiumOnly, setPremiumOnly] = useState(initialPremium);
  const [selectedTags, setSelectedTags] = useState<PirateTagId[]>(initialTags);
  const [skillsExpanded, setSkillsExpanded] = useState(false);

  // If the user navigates with back/forward, re-sync state from URL.
  useEffect(() => {
    setQuery(paramsSafe.get("q") ?? "");
    setCategoryId((paramsSafe.get("category") as PirateCategoryId | "all" | null) ?? "all");
    setSort((paramsSafe.get("sort") as "featured" | "rarity" | "alpha" | null) ?? "featured");
    setPremiumOnly(paramsSafe.get("premium") === "1");
    const tags = (paramsSafe.get("tags") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as PirateTagId[];
    setSelectedTags(tags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, paramsKey]);

  const restoreOnceRef = useRef(false);
  useEffect(() => {
    if (restoreOnceRef.current) return;
    if (hasUrlParams) {
      restoreOnceRef.current = true;
      return;
    }
    try {
      const raw = window.localStorage.getItem(RESTORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        q: string;
        category: PirateCategoryId | "all";
        sort: "featured" | "rarity" | "alpha";
        premium: boolean;
        tags: PirateTagId[];
      }>;
      if (typeof saved.q === "string") setQuery(saved.q);
      if (saved.category && typeof saved.category === "string") setCategoryId(saved.category);
      if (saved.sort && typeof saved.sort === "string") setSort(saved.sort);
      if (typeof saved.premium === "boolean") setPremiumOnly(saved.premium);
      if (Array.isArray(saved.tags)) setSelectedTags(saved.tags);
    } catch {
      // ignore
    } finally {
      restoreOnceRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUrlParams]);

  useEffect(() => {
    try {
      const next = {
        q: query,
        category: categoryId,
        sort,
        premium: premiumOnly,
        tags: selectedTags,
      };
      window.localStorage.setItem(RESTORE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [query, categoryId, sort, premiumOnly, selectedTags]);

  const allTags = pirateTags;

  const filtered = useMemo(() => {
    return computeFilteredPrompts({
      prompts: piratePrompts,
      query,
      categoryId,
      selectedTags,
      sort,
      premiumOnly,
    });
  }, [categoryId, premiumOnly, query, selectedTags, sort]);

  const foundCount = filtered.length;

  const featured = filtered
    .filter((p) => p.premium || p.rarity === "legendary" || p.rarity === "rare")
    .slice(0, 4);

  const legendary = filtered.filter((p) => p.rarity === "legendary");
  const rare = filtered.filter((p) => p.rarity === "rare");
  const common = filtered.filter((p) => !p.rarity || p.rarity === "common");

  const pushParams = (next: Partial<{ q: string; category: string; sort: string; premium: string; tags: string }>) => {
    const sp = new URLSearchParams(paramsSafe.toString());
    if (next.q !== undefined) {
      if (next.q.trim().length > 0) sp.set("q", next.q.trim());
      else sp.delete("q");
    }
    if (next.category !== undefined) {
      if (next.category !== "all") sp.set("category", next.category);
      else sp.delete("category");
    }
    if (next.sort !== undefined) sp.set("sort", next.sort);
    if (next.premium !== undefined) {
      if (next.premium === "1") sp.set("premium", "1");
      else sp.delete("premium");
    }
    if (next.tags !== undefined) {
      if (next.tags.trim().length > 0) sp.set("tags", next.tags);
      else sp.delete("tags");
    }

    // Keep it clean: reset page-based UX since this slice is a single page.
    sp.delete("page");
    const qs = sp.toString();
    router.push(qs.length > 0 ? `/archive?${qs}` : "/archive");
  };

  const clearFilters = () => {
    router.push("/archive");
  };

  return (
    <div className="p-container py-8 md:py-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="p-title text-[26px] md:text-[32px] font-semibold">Treasure Archive</div>
          <div className="p-muted mt-2 text-[14px]">
            Chart the Waters and open a scroll.
          </div>
          <div className="mt-3 text-[12.5px] p-muted-2">
            Found <span className="text-[rgba(243,231,198,0.95)] font-semibold">{foundCount}</span>{" "}
            {foundCount === 1 ? "scroll" : "scrolls"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] p-muted select-none">
            <input
              type="checkbox"
              checked={premiumOnly}
              onChange={(e) => {
                const v = e.target.checked;
                setPremiumOnly(v);
                pushParams({ premium: v ? "1" : "0" });
              }}
              className="accent-[rgba(214,162,58,0.9)]"
            />
            Premium only
          </label>
          <button
            type="button"
            className="p-btn px-4 py-2.5 p-btn-ghost"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 p-card p-card-strong p-4 md:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-5">
            <div className="text-[12px] p-muted-2 mb-2">Search</div>
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") pushParams({ q: query });
                }}
                className="p-input"
                placeholder="e.g., rubric, evidence table, roleplay..."
                aria-label="Search prompts"
              />
              <button
                type="button"
                className="p-btn px-3 py-[11px]"
                onClick={() => pushParams({ q: query })}
              >
                🧭
              </button>
            </div>
            <div className="mt-2 text-[12.5px] p-muted-2 leading-relaxed">
              Tip: search matches title, description, and scroll text.
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="text-[12px] p-muted-2 mb-2">Discipline</div>
            <select
              value={categoryId}
              onChange={(e) => {
                const v = e.target.value as PirateCategoryId | "all";
                setCategoryId(v);
                pushParams({ category: v });
              }}
              className="p-input"
              aria-label="Filter by category"
            >
              <option value="all">All guilds</option>
              {pirateCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="text-[12px] p-muted-2 mb-2">Sort</div>
            <select
              value={sort}
              onChange={(e) => {
                const v = e.target.value as "featured" | "rarity" | "alpha";
                setSort(v);
                pushParams({ sort: v });
              }}
              className="p-input"
              aria-label="Sort scrolls"
            >
              <option value="featured">Captain’s picks</option>
              <option value="rarity">Rarity first</option>
              <option value="alpha">A-Z</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="text-[12px] p-muted-2 mb-2">Skills</div>
            <div className="flex flex-col gap-2">
              <div className="text-[12.5px] p-muted-2">
                {selectedTags.length > 0 ? `${selectedTags.length} selected` : "Any skill"}
              </div>
              <button
                type="button"
                className="p-btn px-3 py-[11px] p-btn-ghost"
                onClick={() => {
                  setSelectedTags([]);
                  pushParams({ tags: "" });
                }}
              >
                Reset skills
              </button>
            </div>
          </div>
        </div>

        {/* Tag pills */}
        <div className="mt-4">
          <div className="text-[12px] p-muted-2 mb-2">Filter by skill badges</div>
          <div className="hidden md:flex flex-wrap gap-2">
            {allTags.map((t) => {
              const active = selectedTags.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? selectedTags.filter((x) => x !== t.id)
                      : [...selectedTags, t.id];
                    setSelectedTags(next);
                    pushParams({ tags: next.join(",") });
                  }}
                  className={[
                    "p-tag transition-colors",
                    active
                      ? "border-[rgba(214,162,58,0.62)] bg-[rgba(214,162,58,0.14)] text-[rgba(243,231,198,0.98)]"
                      : "border-[rgba(246,225,160,0.14)]",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="md:hidden">
            <button
              type="button"
              className="p-btn p-btn-ghost px-4 py-[10px] w-full justify-between"
              onClick={() => setSkillsExpanded((v) => !v)}
              aria-expanded={skillsExpanded}
            >
              <span>
                Skills{" "}
                {selectedTags.length > 0 ? (
                  <span className="font-semibold" aria-hidden="true">
                    ({selectedTags.length})
                  </span>
                ) : null}
              </span>
              <span aria-hidden="true">{skillsExpanded ? "−" : "+"}</span>
            </button>

            {skillsExpanded ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {allTags.map((t) => {
                  const active = selectedTags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? selectedTags.filter((x) => x !== t.id)
                          : [...selectedTags, t.id];
                        setSelectedTags(next);
                        pushParams({ tags: next.join(",") });
                      }}
                      className={[
                        "p-tag transition-colors",
                        active
                          ? "border-[rgba(214,162,58,0.62)] bg-[rgba(214,162,58,0.14)] text-[rgba(243,231,198,0.98)]"
                          : "border-[rgba(246,225,160,0.14)]",
                      ].join(" ")}
                      aria-pressed={active}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-7">
        {filtered.length === 0 ? (
          <div className="p-empty">
            <div className="p-title text-[18px] font-semibold">No scrolls uncovered</div>
            <div className="p-muted mt-1 text-[14px] leading-relaxed max-w-2xl">
              The map is quiet. Try removing a skill badge, switching guild, or searching a broader phrase.
            </div>
            <div className="mt-2 text-[12.5px] p-muted-2 leading-relaxed">
              First voyage tip: start with Captain’s Picks, store one scroll, then forge your My Version.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="p-btn p-btn-primary" onClick={clearFilters}>
                Reset the map <span aria-hidden="true">↺</span>
              </button>
              <Link href="/harbor" className="p-btn p-btn-ghost">
                Back to Harbor
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {featured.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <div className="p-title text-[20px] font-semibold">Captain’s Picks</div>
                    <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                      The best treasures for your current voyage. Open one to preview bindings and save it.
                    </div>
                  </div>
                  <span className="p-badge p-badge-brass">
                    <span aria-hidden="true">🗝️</span> {featured.length} featured
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {featured.map((p) => (
                    <Link key={p.id} href={`/scroll/${p.id}`} className="block group">
                      <div className="p-card p-card-strong p-5 h-full transition-transform group-hover:translate-y-[-2px]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="p-title font-semibold text-[16px] leading-snug">{p.title}</div>
                            <div className="p-muted mt-2 text-[13px] leading-relaxed line-clamp-2">
                              {p.description}
                            </div>
                          </div>
                          {p.rarity ? (
                            <span className="p-badge p-badge-brass whitespace-nowrap">
                              <span aria-hidden="true">✨</span>{" "}
                              {p.rarity === "legendary" ? "Legendary" : "Rare"}
                            </span>
                          ) : (
                            <span className="p-badge whitespace-nowrap">
                              <span aria-hidden="true">🗝️</span> Premium
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="p-badge">
                            <span aria-hidden="true">🗺️</span> {getCategoryName(p.categoryId)}
                          </span>
                          <span className="p-tag">{p.tags[0] ? getTagLabel(p.tags[0]) : "Skill"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Rarity progression */}
            {legendary.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <div className="p-title text-[20px] font-semibold">Legendary Cache</div>
                    <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                      High-impact scrolls designed to keep you moving.
                    </div>
                  </div>
                  <span className="p-badge p-badge-brass">
                    <span aria-hidden="true">✨</span> {legendary.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {legendary.map((p) => (
                    <Link key={p.id} href={`/scroll/${p.id}`} className="block group">
                      <div className="p-card p-card-strong p-5 h-full transition-transform group-hover:translate-y-[-2px]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="p-title font-semibold text-[16px] leading-snug">{p.title}</div>
                            <div className="p-muted mt-2 text-[13.5px] leading-relaxed line-clamp-3">{p.description}</div>
                          </div>
                          <span className="p-badge p-badge-brass whitespace-nowrap">
                            Legendary
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="p-badge"><span aria-hidden="true">🗺️</span> {getCategoryName(p.categoryId)}</span>
                          {p.premium ? (
                            <span className="p-badge"><span aria-hidden="true">🗝️</span> Premium</span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {rare.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <div className="p-title text-[20px] font-semibold">Rare Finds</div>
                    <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                      Useful treasures with tight rules and sharp structure.
                    </div>
                  </div>
                  <span className="p-badge p-badge-ember">
                    <span aria-hidden="true">🧰</span> {rare.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rare.map((p) => (
                    <Link key={p.id} href={`/scroll/${p.id}`} className="block group">
                      <div className="p-card p-card-strong p-5 h-full transition-transform group-hover:translate-y-[-2px]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="p-title font-semibold text-[16px] leading-snug">{p.title}</div>
                            <div className="p-muted mt-2 text-[13.5px] leading-relaxed line-clamp-3">{p.description}</div>
                          </div>
                          <span className="p-badge p-badge-ember whitespace-nowrap">
                            Rare
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="p-badge"><span aria-hidden="true">🗺️</span> {getCategoryName(p.categoryId)}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {p.tags.slice(0, 3).map((t) => (
                            <span key={t} className="p-tag">{getTagLabel(t)}</span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {common.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <div className="p-title text-[20px] font-semibold">Common Finds</div>
                    <div className="p-muted mt-1 text-[13.5px] leading-relaxed">
                      Solid scrolls that work as reliable tools in your kit.
                    </div>
                  </div>
                  <span className="p-badge">
                    <span aria-hidden="true">📜</span> {common.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {common.map((p) => (
                    <Link key={p.id} href={`/scroll/${p.id}`} className="block group">
                      <div className="p-card p-5 h-full transition-transform group-hover:translate-y-[-2px]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="p-title font-semibold text-[16px] leading-snug">{p.title}</div>
                            <div className="p-muted mt-2 text-[13.5px] leading-relaxed line-clamp-3">{p.description}</div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="p-badge"><span aria-hidden="true">🗺️</span> {getCategoryName(p.categoryId)}</span>
                          <span className="p-tag">{p.tags[0] ? getTagLabel(p.tags[0]) : "Skill"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}


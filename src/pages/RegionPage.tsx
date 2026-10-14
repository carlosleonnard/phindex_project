/**
 * PÁGINA DE REGIÃO (RegionPage.tsx)
 *
 * Um dos seis continentes do índice:
 *
 *   cabeçalho  — nome, números, nota sobre o ano 1500 e o globo da região;
 *   sub-regiões — um cromossomo em que a largura de cada faixa é a parcela
 *                 dos perfis daquela sub-região; clicar filtra a grade;
 *   "most read as" — o fenótipo vencedor de cada perfil da região, somado;
 *   "needs your vote here" — rostos da região com menos de dez votos;
 *   grade      — tipo de perfil + ordenação, com "mostrar mais";
 *   outras regiões, com contagem.
 *
 * O continente de um perfil vem de profileContinent: o voto geográfico, e o
 * país enquanto ninguém votou. A sub-região só existe com voto.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AppLayout, Crumbs } from "@/components/AppLayout";
import { PhenotypeCard } from "@/components/PhenotypeCard";
import { SegmentedCapsule, SortTabs } from "@/components/kt/RegionFilter";
import { VoteProgress } from "@/components/kt/Meters";
import { FacePhoto, REGION_HEX, RegionDot, SC, SpecimenFrame, formatCount } from "@/components/kt/Misc";
import { KT } from "@/components/kt/bands";
import {
  EmptySheet,
  GRID_CLASS,
  GridSkeleton,
  LISTING_SORTS,
  SORT_LABEL,
  ShowMoreButton,
  sortListing,
  type ListingSort,
} from "@/components/kt/Listing";
import { useIndexProfiles, LOW_VOTE_THRESHOLD } from "@/hooks/use-index";
import { CONTINENT_META, CONTINENT_ORDER, profileContinent, type Continent } from "@/constants/regions";
import { GEOGRAPHIC_OPTIONS } from "@/constants/taxonomy";
import { cn } from "@/lib/utils";

const STEP = 12;

const DEMONYM: Record<Continent, string> = {
  Africa: "African",
  Americas: "American",
  Asia: "Asian",
  Europe: "European",
  "Middle East": "Middle Eastern",
  Oceania: "Oceanian",
};

type ProfileType = "all" | "famous" | "community";

const PROFILE_TYPES: Array<{ value: ProfileType; label: string }> = [
  { value: "all", label: "All" },
  { value: "famous", label: "Famous people" },
  { value: "community", label: "Community" },
];

/** Sombra de cada posição do ranking "most read as". */
const READ_AS_SHADES = [KT.ink, KT.b75, KT.b75, KT.b50, KT.b50];

const continentFromSlug = (slug: string): Continent | null =>
  CONTINENT_ORDER.find((continent) => CONTINENT_META[continent].slug === slug) ?? null;

export default function RegionPage() {
  const { region } = useParams<{ region: string }>();
  const regionKey = (region || "").toLowerCase();
  const continent = continentFromSlug(regionKey);

  const { profiles, isLoading, isError } = useIndexProfiles();
  const [subregion, setSubregion] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<ProfileType>("all");
  const [sort, setSort] = useState<ListingSort>("popular");
  const [visibleCount, setVisibleCount] = useState(STEP);

  useEffect(() => {
    setSubregion(null);
    setProfileType("all");
    setVisibleCount(STEP);
  }, [regionKey]);

  useEffect(() => setVisibleCount(STEP), [subregion, profileType, sort]);

  const regionProfiles = useMemo(
    () => (continent ? profiles.filter((profile) => profileContinent(profile) === continent) : []),
    [profiles, continent]
  );

  /** Sub-regiões com perfis, da maior para a menor. */
  const subregions = useMemo(() => {
    if (!continent) return [];
    const counts = new Map<string, number>();
    regionProfiles.forEach((profile) => {
      const value = profile.most_voted_geographic;
      if (value && GEOGRAPHIC_OPTIONS[continent].includes(value)) counts.set(value, (counts.get(value) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [regionProfiles, continent]);
  const placedCount = subregions.reduce((sum, item) => sum + item.count, 0);

  /** O fenótipo vencedor de cada perfil, somado: top 5 + "other". */
  const readAs = useMemo(() => {
    const counts = new Map<string, number>();
    regionProfiles.forEach((profile) => {
      if (profile.most_voted_phenotype) {
        counts.set(profile.most_voted_phenotype, (counts.get(profile.most_voted_phenotype) || 0) + 1);
      }
    });
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, 5).map(([name, count]) => ({ name, pct: total ? (count / total) * 100 : 0 }));
    const otherCount = ranked.slice(5).reduce((sum, [, count]) => sum + count, 0);
    return { total, top, otherPct: total ? (otherCount / total) * 100 : 0 };
  }, [regionProfiles]);

  const needsVotes = useMemo(
    () =>
      regionProfiles
        .filter((profile) => profile.vote_count < LOW_VOTE_THRESHOLD)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3),
    [regionProfiles]
  );

  const filtered = useMemo(() => {
    const list = regionProfiles.filter((profile) => {
      if (subregion && profile.most_voted_geographic !== subregion) return false;
      if (profileType === "community" && profile.category !== "User Profiles") return false;
      if (profileType === "famous" && profile.category === "User Profiles") return false;
      return true;
    });
    return sortListing(list, sort);
  }, [regionProfiles, subregion, profileType, sort]);

  const regionCounts = useMemo(() => {
    const counts = new Map<Continent, number>();
    profiles.forEach((profile) => {
      const value = profileContinent(profile);
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    });
    return counts;
  }, [profiles]);

  if (!continent) {
    return (
      <AppLayout>
        <h1 className="m-0 text-[40px] font-medium text-kt-ink">Region not found</h1>
        <p className="mt-2 text-[18px] text-kt-body">
          There’s no region at this address. <Link to="/explore">Explore the index</Link> instead.
        </p>
      </AppLayout>
    );
  }

  const demonym = DEMONYM[continent];
  const totalVotes = regionProfiles.reduce((sum, profile) => sum + profile.vote_count, 0);
  const visible = filtered.slice(0, visibleCount);
  // Barras na mesma escala, inclusive "other" — que costuma ser a maior fatia.
  const maxReadAs = Math.max(readAs.top[0]?.pct || 0, readAs.otherPct) || 1;

  const regionTitle = `${continent} Phenotypes | Phindex`;
  const regionDescription = `Explore ${continent} phenotypes and physical traits. Discover phenotype classifications from ${continent}. Vote and compare physical characteristics.`;
  const regionUrl = `https://www.phenotypeindex.com/region/${regionKey}`;
  // Card 1200x630 gerado a partir do banner da região (public/og/).
  const regionImage = `https://www.phenotypeindex.com/og/region-${regionKey}.png`;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: regionTitle,
    url: regionUrl,
    description: regionDescription,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: filtered.length,
      itemListElement: visible.map((profile, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://www.phenotypeindex.com/user-profile/${profile.slug}`,
        name: profile.name,
      })),
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.phenotypeindex.com" },
      { "@type": "ListItem", position: 2, name: continent, item: regionUrl },
    ],
  };

  return (
    <AppLayout>
      <Helmet>
        <title>{regionTitle}</title>
        <meta name="description" content={regionDescription} />
        <link rel="canonical" href={regionUrl} />
        <meta property="og:title" content={regionTitle} />
        <meta property="og:description" content={regionDescription} />
        <meta property="og:url" content={regionUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta property="og:image" content={regionImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content={regionTitle} />
        <meta name="twitter:description" content={regionDescription} />
        <meta name="twitter:image" content={regionImage} />
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Crumbs items={[{ label: "Discover", to: "/community" }, { label: "Regions", to: "/explore" }, { label: continent }]} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-14 gap-y-7 border-b-[1.5px] border-kt-ink pb-7">
        <div className="min-w-0 flex-[1_1_420px]">
          <SC as="p" className="m-0 flex items-center gap-2.5 text-[16px] text-kt-teal">
            <RegionDot continent={continent} size={9} />
            region
          </SC>
          <h1 className="mb-0 mt-1 text-[clamp(52px,6.2vw,88px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
            {continent}
            <sup className="relative top-[0.3em] ml-[0.08em] align-top text-[0.24em] tracking-normal">
              <a href="#region-note" aria-label="About regions" className="text-kt-teal no-underline">
                1
              </a>
            </sup>
          </h1>
          <p className="mb-0 mt-3 text-[20px] italic text-kt-body">Explore and classify phenotypes from {continent}.</p>
          <p className="mb-0 mt-3.5 flex flex-wrap gap-x-5 gap-y-1 text-[16px] text-kt-body">
            <span>
              <span className="text-kt-ink">{isLoading ? "…" : formatCount(regionProfiles.length)}</span> profiles
            </span>
            <span>
              <span className="text-kt-ink">{GEOGRAPHIC_OPTIONS[continent].length}</span> sub-regions
            </span>
            <span>
              <span className="text-kt-ink">{isLoading ? "…" : formatCount(totalVotes)}</span> votes cast
            </span>
          </p>
          <p id="region-note" className="mb-0 mt-[18px] max-w-[62ch] border-t border-kt-rule pt-3 text-[15px] leading-normal text-kt-body">
            <span className="mr-1 align-super text-[12px] text-kt-teal">1</span>
            Regions describe where populations lived around 1500, before colonisation and globalisation. A face belongs
            to the region most of its voters chose; until it has votes, its country places it.
          </p>
        </div>
        <figure className="m-0 w-[250px] max-w-full flex-none">
          <SpecimenFrame tick={14}>
            <img
              src={`/region-${regionKey}.png`}
              alt={`Globe centred on ${continent}, with ${continent} highlighted`}
              className="block aspect-square h-auto w-full opacity-[0.92]"
              style={{ filter: "hue-rotate(54deg) saturate(1.3)" }}
            />
          </SpecimenFrame>
          <figcaption className="mt-2 text-center font-sc text-[13px] tracking-[0.06em] text-kt-body">
            fig. — {continent.toLowerCase()}, orthographic view
          </figcaption>
        </figure>
      </div>

      <section aria-labelledby="sub-title" className="mt-7">
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
          <h2 id="sub-title" className="m-0 font-sc text-[17px] font-semibold tracking-[0.06em] text-kt-ink">
            sub-regions
          </h2>
          <span className="text-[15px] italic text-kt-body">
            {placedCount > 0
              ? `band width = share of the ${placedCount} profiles placed by votes`
              : "no sub-region votes yet"}
          </span>
        </div>
        {isLoading ? (
          <div aria-hidden="true" className="h-14 animate-pulse rounded-full bg-kt-wash" />
        ) : subregions.length > 0 ? (
          <div role="group" aria-label="Filter by sub-region" className="flex min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              aria-pressed={subregion === null}
              onClick={() => setSubregion(null)}
              className={cn(
                "min-h-14 shrink-0 rounded-full border-[1.5px] border-kt-ink px-5 font-[inherit] text-[16px] transition-colors",
                subregion === null ? "bg-kt-ink text-kt-paper" : "bg-white text-kt-slate hover:bg-kt-seg"
              )}
            >
              All
            </button>
            <div className="flex flex-[1_0_auto] overflow-hidden rounded-full border-[1.5px] border-kt-ink">
              {subregions.map((item, index) => {
                const active = subregion === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${item.name}, ${item.count} profiles`}
                    onClick={() => setSubregion(active ? null : item.name)}
                    className={cn(
                      "flex min-h-[53px] min-w-[112px] flex-col justify-center border-0 px-3.5 text-left font-[inherit] leading-[1.15] transition-[filter] hover:brightness-[.94]",
                      index === 0 && "pl-[22px]",
                      index === subregions.length - 1 && "pr-5",
                      index > 0 && "border-l-[1.5px] border-white",
                      active ? "bg-kt-ink text-kt-paper" : cn(index % 2 ? "bg-kt-wash" : "bg-kt-b25", "text-kt-ink")
                    )}
                    style={{ flex: `${item.count} 1 0px` }}
                  >
                    <span className="truncate text-[16px]">{item.name}</span>
                    <span className={cn("text-[13px]", active ? "text-kt-b50" : "text-kt-slate")}>
                      {index === 0 ? `${item.count} profiles` : item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="h-14 rounded-full border-[1.5px] border-dashed border-kt-b50"
            style={{ background: `repeating-linear-gradient(45deg,${KT.sheet} 0 4px,${KT.wash2} 4px 5px)` }}
          />
        )}
      </section>

      <div className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-start gap-x-11 gap-y-6">
        <section aria-labelledby="readas-title">
          <h2 id="readas-title" className="m-0 font-sc text-[17px] font-semibold tracking-[0.06em] text-kt-ink">
            most read as
          </h2>
          <p className="mb-2.5 mt-1 text-[15px] italic text-kt-body">Top phenotype of each {demonym} profile.</p>
          {readAs.top.length === 0 ? (
            <p className="m-0 border-t border-kt-rule pt-3 text-[15px] text-kt-body">
              No phenotype votes in this region yet.
            </p>
          ) : (
            <ol className="m-0 list-none p-0">
              {readAs.top.map((item, index) => (
                <li
                  key={item.name}
                  className="grid grid-cols-[20px_minmax(0,128px)_minmax(0,1fr)_42px] items-center gap-3 border-t border-kt-rule py-2"
                >
                  <span className="text-[17px] italic text-kt-teal">{index + 1}</span>
                  <Link to={`/explore?q=${encodeURIComponent(item.name)}`} className="truncate text-[16px] text-kt-ink">
                    {item.name}
                  </Link>
                  <span
                    aria-hidden="true"
                    className="box-border h-2.5 rounded-full border border-kt-ink"
                    style={{
                      background: `linear-gradient(90deg,${READ_AS_SHADES[index]} 0 ${(item.pct / maxReadAs) * 100}%,${KT.sheet} 0)`,
                    }}
                  />
                  <span className="text-right text-[15px] text-kt-body">{Math.round(item.pct)}%</span>
                </li>
              ))}
              {readAs.otherPct > 0 && (
                <li className="grid grid-cols-[20px_minmax(0,128px)_minmax(0,1fr)_42px] items-center gap-3 border-y border-kt-rule py-2">
                  <span />
                  <span className="text-[16px] text-kt-body">other</span>
                  <span
                    aria-hidden="true"
                    className="box-border h-2.5 rounded-full border border-kt-b50"
                    style={{
                      background: `linear-gradient(90deg,${KT.b25} 0 ${(readAs.otherPct / maxReadAs) * 100}%,${KT.sheet} 0)`,
                    }}
                  />
                  <span className="text-right text-[15px] text-kt-body">{Math.round(readAs.otherPct)}%</span>
                </li>
              )}
            </ol>
          )}
        </section>

        <section aria-labelledby="needs-region" className="rounded-[3px] border border-kt-rule bg-white p-5">
          <h2 id="needs-region" className="m-0 font-sc text-[17px] font-semibold tracking-[0.06em] text-kt-ink">
            needs your vote here
          </h2>
          <p className="mb-2 mt-1 text-[15px] italic text-kt-body">{demonym} faces with fewer than ten votes.</p>
          {needsVotes.length === 0 ? (
            <p className="m-0 border-t border-kt-rule pt-3 text-[15px] text-kt-body">
              {isLoading ? "Loading…" : "Every face here has ten votes or more."}
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {needsVotes.map((profile) => (
                <li
                  key={profile.id}
                  className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-t border-kt-rule py-[11px]"
                >
                  <span className="block h-12 w-12 overflow-hidden rounded-[3px] bg-kt-wash">
                    <FacePhoto src={profile.front_image_url} alt="" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] leading-tight text-kt-ink">
                      {profile.name}
                      {profile.country ? ` · ${profile.country}` : ""}
                    </span>
                    <span className="mt-[3px] block text-[13px] text-kt-body">
                      {profile.vote_count} of {LOW_VOTE_THRESHOLD} votes
                    </span>
                    <VoteProgress count={profile.vote_count} className="mt-[5px]" />
                  </span>
                  <Link
                    to={`/user-profile/${profile.slug}`}
                    aria-label={`Vote on ${profile.name}`}
                    className="inline-flex min-h-9 items-center rounded-full border-[1.5px] border-kt-teal px-[13px] font-sc text-[15px] tracking-[0.05em] text-kt-teal no-underline hover:bg-kt-teal/[0.06]"
                  >
                    vote
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5 border-y border-kt-rule py-3.5">
        <SegmentedCapsule options={PROFILE_TYPES} value={profileType} onChange={(value) => setProfileType(value)} label="Profile type" />
        <SortTabs options={LISTING_SORTS} value={sort} onChange={(value) => setSort(value)} />
      </div>

      <div className="mb-3.5 mt-[18px] flex flex-wrap items-baseline justify-between gap-3">
        <p className="m-0 text-[15px] text-kt-body" role="status">
          {isLoading
            ? "Loading profiles…"
            : filtered.length === 0
            ? "No profiles match"
            : `Showing 1–${visible.length} of ${filtered.length}${subregion ? ` in ${subregion}` : ""} · sorted by ${SORT_LABEL[sort]}`}
        </p>
        {(subregion || profileType !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSubregion(null);
              setProfileType("all");
            }}
            className="border-0 bg-transparent p-0 font-[inherit] text-[15px] text-kt-teal underline underline-offset-4"
          >
            clear filters
          </button>
        )}
      </div>

      {isError ? (
        <EmptySheet title="Couldn’t load this region">Check your connection and reload the page.</EmptySheet>
      ) : isLoading ? (
        <GridSkeleton />
      ) : visible.length === 0 ? (
        <EmptySheet title={regionProfiles.length === 0 ? `No ${demonym} faces yet` : "Nothing matches these filters"}>
          {regionProfiles.length === 0
            ? "Faces land here once voters place them in this region."
            : "Try another sub-region or profile type."}
        </EmptySheet>
      ) : (
        <section aria-label={`${demonym} profiles`} className={GRID_CLASS}>
          {visible.map((profile, index) => (
            <PhenotypeCard key={profile.id} profile={profile} variant="grid" priority={index < 4} />
          ))}
        </section>
      )}

      {visible.length < filtered.length && (
        <ShowMoreButton onClick={() => setVisibleCount((count) => count + STEP)}>
          show more {demonym} faces
        </ShowMoreButton>
      )}

      <section aria-labelledby="other-regions" className="mt-[52px] border-t-[1.5px] border-kt-ink pt-[22px]">
        <h2 id="other-regions" className="mb-3.5 mt-0 font-sc text-[17px] font-semibold tracking-[0.06em] text-kt-ink">
          other regions
        </h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-2.5 p-0">
          {CONTINENT_ORDER.filter((item) => item !== continent).map((item) => (
            <li key={item}>
              <Link
                to={`/region/${CONTINENT_META[item].slug}`}
                className="flex min-h-[52px] items-center gap-2.5 rounded-full border border-kt-rule bg-white px-[18px] text-[17px] text-kt-ink no-underline transition-colors hover:border-kt-b50 hover:bg-kt-wash hover:text-kt-ink"
              >
                <span aria-hidden="true" className="h-[9px] w-[9px] rounded-full" style={{ background: REGION_HEX[item] }} />
                {item}
                <span className="ml-auto text-[14px] text-kt-body">{regionCounts.get(item) || 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  );
}

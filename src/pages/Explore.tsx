/**
 * PÁGINA EXPLORE (Explore.tsx)
 *
 * Busca e navegação em grade. Diferente da home, que é passiva (você rola),
 * aqui a intenção é ativa: o usuário procura algo específico.
 *
 * A busca é refletida na URL (?q=), então um resultado pode ser compartilhado
 * ou salvo nos favoritos do navegador. O índice inteiro vem de useIndexProfiles
 * e é filtrado no cliente: a base é pequena e o filtro responde na hora.
 */

import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PhenotypeCard } from "@/components/PhenotypeCard";
import { RegionFilter, SortTabs } from "@/components/kt/RegionFilter";
import { EmptySheet, GRID_CLASS, GridSkeleton, ShowMoreButton, chipClass, sortListing } from "@/components/kt/Listing";
import { outlineCapsule } from "@/components/kt/Centromere";
import { useIndexProfiles } from "@/hooks/use-index";
import { useDebounce } from "@/hooks/use-debounce";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import { profileContinent, type Continent } from "@/constants/regions";
import { cn } from "@/lib/utils";

/**
 * Categorias filtráveis. "User Profiles" é o valor gravado no banco para os
 * perfis da comunidade — é a maior fatia do índice.
 */
const EXPLORE_CATEGORIES = [
  { label: "Community", value: "User Profiles" },
  ...CATEGORY_OPTIONS.map((name) => ({ label: name, value: name })),
];

const categoryLabel = (value: string) => (value === "User Profiles" ? "Community" : value);

type SortKey = "popular" | "recent";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "popular", label: "Most voted" },
  { value: "recent", label: "Recent" },
];

const STEP = 16;

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const [region, setRegion] = useState<Continent | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("popular");
  // Aberto no desktop; no celular o painel empurraria os resultados para fora da tela.
  const [filtersOpen, setFiltersOpen] = useState(
    () => typeof window === "undefined" || window.matchMedia("(min-width: 768px)").matches
  );
  const [visibleCount, setVisibleCount] = useState(STEP);

  const debouncedQuery = useDebounce(query, 250);

  // Mantém a URL em sincronia com a busca, sem empilhar histórico a cada tecla.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedQuery) next.set("q", debouncedQuery);
    else next.delete("q");
    setSearchParams(next, { replace: true });
    // searchParams é omitido de propósito: incluí-lo relança o efeito em loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // Um link para /explore?q=… vindo de dentro do próprio Explore troca a busca.
  useEffect(() => {
    if (urlQuery !== debouncedQuery) setQuery(urlQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  useEffect(() => setVisibleCount(STEP), [debouncedQuery, region, category, sort]);

  const { profiles, isLoading, isError } = useIndexProfiles();
  const term = debouncedQuery.trim();

  const results = useMemo(() => {
    const needle = term.toLowerCase();
    const filtered = profiles.filter((profile) => {
      if (needle) {
        const haystack = [
          profile.name,
          profile.country,
          categoryLabel(profile.category),
          profile.subcategory ?? "",
          profile.ancestry,
          profile.most_voted_phenotype ?? "",
          profile.most_voted_geographic ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (region && profileContinent(profile) !== region) return false;
      if (category && profile.category !== category) return false;
      return true;
    });
    return sortListing(filtered, sort);
  }, [profiles, term, region, category, sort]);

  const activeFilterCount = (region ? 1 : 0) + (category ? 1 : 0);
  const visible = results.slice(0, visibleCount);
  const remaining = results.length - visible.length;

  const clearFilters = () => {
    setRegion(null);
    setCategory(null);
  };

  const scope = [
    term && ` match “${term}”`,
    region && ` in ${region}`,
    category && ` · ${categoryLabel(category)}`,
  ]
    .filter(Boolean)
    .join("");

  return (
    <AppLayout showSearch={false}>
      <Helmet>
        <title>Explore Phenotypes | Phindex</title>
        <meta
          name="description"
          content="Search and filter human phenotypes by name, region, ancestry and category across the Phindex community index."
        />
        <link rel="canonical" href="https://www.phenotypeindex.com/explore" />
      </Helmet>

      <h1 className="m-0 text-[clamp(48px,5.8vw,84px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
        Explore
      </h1>
      <p className="mb-0 mt-3 text-[19px] italic text-kt-body">Search the index by name, region, ancestry or category.</p>

      <form role="search" className="mt-[26px]" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="explore-q" className="sr-only">
          Search the phenotype index
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-[22px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-kt-ink"
            strokeWidth={1.6}
          />
          <input
            id="explore-q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search faces, phenotypes, countries…"
            autoComplete="off"
            className="box-border h-[60px] w-full rounded-full border-[1.5px] border-kt-ink bg-white pl-[58px] pr-16 font-[inherit] text-[19px] text-kt-ink placeholder:text-kt-mute sm:text-[21px] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-kt-wash text-kt-ink transition-colors hover:bg-kt-seg"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-x-[18px] gap-y-3">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="explore-filters"
          onClick={() => setFiltersOpen((open) => !open)}
          className={cn(
            "inline-flex min-h-11 items-center gap-[9px] rounded-full border-[1.5px] border-kt-ink px-[18px] font-[inherit] text-[16px] transition-colors",
            filtersOpen ? "bg-kt-ink text-kt-paper" : "bg-white text-kt-ink hover:bg-kt-wash"
          )}
        >
          <SlidersHorizontal className="h-[17px] w-[17px]" strokeWidth={1.7} aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-kt-glow px-1 text-[14px] text-kt-deep">
              {activeFilterCount}
            </span>
          )}
        </button>
        <SortTabs options={SORTS} value={sort} onChange={(value) => setSort(value)} />
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto min-h-11 border-0 bg-transparent px-1 font-[inherit] text-[16px] text-kt-teal underline underline-offset-4 hover:text-kt-ink"
          >
            clear filters
          </button>
        )}
      </div>

      {filtersOpen && (
        <div id="explore-filters" className="mt-3.5 rounded-[3px] border border-kt-rule bg-white px-[22px] py-5">
          <h2 className="mb-2.5 mt-0 font-sc text-[15px] font-semibold tracking-[0.06em] text-kt-slate">region</h2>
          <RegionFilter value={region} onChange={setRegion} allLabel="Any" size="sm" label="Region" />
          <h2 className="mb-2.5 mt-5 font-sc text-[15px] font-semibold tracking-[0.06em] text-kt-slate">category</h2>
          <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={category === null}
              onClick={() => setCategory(null)}
              className={chipClass(category === null, "text-[15px]")}
            >
              Any
            </button>
            {EXPLORE_CATEGORIES.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(category === value ? null : value)}
                className={chipClass(category === value, "text-[15px]")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5 border-b-[1.5px] border-kt-ink pb-3">
        <p role="status" className="m-0 text-[20px] text-kt-ink">
          {isLoading ? (
            "Searching the index…"
          ) : (
            <>
              <span className="font-semibold">
                {results.length} {results.length === 1 ? "face" : "faces"}
              </span>
              {scope ? (results.length === 1 ? scope.replace(" match ", " matches ") : scope) : " in the index"}
            </>
          )}
        </p>
        <p className="m-0 text-[15px] italic text-kt-body">matching names, countries, ancestry and phenotypes</p>
      </div>

      <div className="mt-5">
        {isError ? (
          <EmptySheet title="Couldn’t load the index">Check your connection and reload the page.</EmptySheet>
        ) : isLoading ? (
          <GridSkeleton />
        ) : results.length === 0 ? (
          <EmptySheet
            title="No matches"
            action={
              (activeFilterCount > 0 || query) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    clearFilters();
                  }}
                  className={outlineCapsule("min-h-11 font-[inherit] text-[16px]")}
                >
                  reset search
                </button>
              )
            }
          >
            {term ? `Nothing in the index matches “${term}”.` : "No profiles match these filters."} Try a broader search or
            clear the filters.
          </EmptySheet>
        ) : (
          <section aria-label="Search results" className={GRID_CLASS}>
            {visible.map((profile, index) => (
              <PhenotypeCard key={profile.id} profile={profile} variant="grid" priority={index < 4} highlight={term} />
            ))}
          </section>
        )}
      </div>

      {remaining > 0 && (
        <ShowMoreButton onClick={() => setVisibleCount((count) => count + STEP)}>
          show {Math.min(STEP, remaining)} more
        </ShowMoreButton>
      )}
    </AppLayout>
  );
};

export default Explore;

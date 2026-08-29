/**
 * PÁGINA EXPLORE (Explore.tsx)
 *
 * Busca e navegação em grade. Diferente da home, que é passiva (você rola),
 * aqui a intenção é ativa: o usuário procura algo específico.
 *
 * A busca é refletida na URL (?q=), então um resultado pode ser compartilhado
 * ou salvo nos favoritos do navegador.
 */

import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { PhenotypeCard } from "@/components/PhenotypeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHighlightProfiles } from "@/hooks/use-profile-feed";
import { useDebounce } from "@/hooks/use-debounce";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import { CONTINENTS, continentOf } from "@/constants/regions";
import { cn } from "@/lib/utils";

/**
 * Categorias filtráveis. "User Profiles" é o valor gravado no banco para os
 * perfis da comunidade — é a maior fatia do índice e estava de fora da lista
 * de categorias de celebridade.
 */
const EXPLORE_CATEGORIES = [
  { label: "Community", value: "User Profiles" },
  ...CATEGORY_OPTIONS.map((name) => ({ label: name, value: name })),
];

type SortKey = "popular" | "recent";

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [region, setRegion] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Carrega um conjunto amplo e filtra no cliente: a base é pequena o bastante
  // e assim o filtro responde instantaneamente, sem ida ao servidor.
  const { profiles, isLoading } = useHighlightProfiles(300);

  const results = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();

    const filtered = profiles.filter((profile) => {
      if (term) {
        const haystack = [
          profile.name,
          profile.country,
          profile.category,
          profile.ancestry,
          profile.most_voted_phenotype ?? "",
          profile.most_voted_geographic ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      // O voto guarda a sub-região ("North Africa"); o filtro usa o
      // continente ("Africa"), então a comparação passa pelo mapa.
      if (region && continentOf(profile.most_voted_geographic) !== region) return false;
      if (category && profile.category !== category) return false;

      return true;
    });

    return sort === "popular"
      ? [...filtered].sort((a, b) => b.vote_count - a.vote_count)
      : [...filtered].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
  }, [profiles, debouncedQuery, region, category, sort]);

  const activeFilterCount = (region ? 1 : 0) + (category ? 1 : 0);

  const clearFilters = () => {
    setRegion(null);
    setCategory(null);
  };

  /** Pílula de filtro reutilizada por região e categoria. */
  const FilterPill = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Explore Phenotypes | Phindex</title>
        <meta
          name="description"
          content="Search and filter human phenotypes by name, region, ancestry and category across the Phindex community index."
        />
        <link rel="canonical" href="https://www.phenotypeindex.com/explore" />
      </Helmet>

      <Header />
      <AppSidebar />

      <main className="px-4 pb-24 pt-20 lg:pl-[21rem] lg:pr-6 lg:pb-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="py-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Explore
            </h1>
            <p className="mt-1 text-muted-foreground">
              Search the index by name, region, ancestry or category.
            </p>
          </div>

          {/* BUSCA */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search faces, phenotypes, countries…"
              aria-label="Search the phenotype index"
              className="h-12 rounded-full border-border/60 bg-card pl-11 pr-11 text-base"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* FILTROS */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className="gap-1.5 rounded-full"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <div className="flex items-center gap-1 rounded-full bg-muted p-1">
              {(["popular", "recent"] as SortKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSort(key)}
                  aria-pressed={sort === key}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    sort === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {key === "popular" ? "Most voted" : "Recent"}
                </button>
              ))}
            </div>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                Clear filters
              </Button>
            )}
          </div>

          {filtersOpen && (
            <div className="mt-4 space-y-4 rounded-2xl border border-border/60 bg-card p-4">
              <div>
                <h2 className="mb-2 text-sm font-semibold text-foreground">Region</h2>
                <div className="flex flex-wrap gap-2">
                  {CONTINENTS.map((item) => (
                    <FilterPill
                      key={item}
                      label={item}
                      active={region === item}
                      onClick={() => setRegion(region === item ? null : item)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-2 text-sm font-semibold text-foreground">Category</h2>
                <div className="flex flex-wrap gap-2">
                  {EXPLORE_CATEGORIES.map(({ label, value }) => (
                    <FilterPill
                      key={value}
                      label={label}
                      active={category === value}
                      onClick={() => setCategory(category === value ? null : value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RESULTADOS */}
          <div className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-card"
                    aria-hidden="true"
                  >
                    <div className="aspect-[640/607] animate-pulse bg-muted" />
                    <div className="space-y-2 p-3.5">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                <h2 className="text-lg font-semibold text-foreground">No matches</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  {debouncedQuery
                    ? `Nothing in the index matches “${debouncedQuery}”.`
                    : "No profiles match these filters."}{" "}
                  Try a broader search or clear the filters.
                </p>
                {(activeFilterCount > 0 || query) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      clearFilters();
                    }}
                    className="mt-5 rounded-full"
                  >
                    Reset search
                  </Button>
                )}
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground" role="status">
                  {results.length} {results.length === 1 ? "profile" : "profiles"}
                </p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {results.map((profile, index) => (
                    <PhenotypeCard
                      key={profile.id}
                      profile={profile}
                      variant="grid"
                      priority={index < 4}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Explore;

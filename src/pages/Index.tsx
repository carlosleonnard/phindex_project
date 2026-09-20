/**
 * PÁGINA INICIAL (Index.tsx)
 *
 * O feed de descoberta do Phindex. A página é organizada em quatro faixas:
 *
 * 1. Banner              — a apresentação do produto
 * 2. Barra de filtros    — recorte por região, fixa no topo ao rolar
 * 3. Trilho + feed       — quem está em alta, e a grade com scroll infinito
 * 4. Painel de descoberta — o que precisa de voto (apenas em telas largas)
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Plus } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { AddProfileModal } from "@/components/AddProfileModal";
import { StatsBanner } from "@/components/StatsBanner";
import { HighlightRail } from "@/components/HighlightRail";
import { DiscoveryPanel } from "@/components/DiscoveryPanel";
import { PhenotypeCard } from "@/components/PhenotypeCard";
import { Button } from "@/components/ui/button";
import { useProfileFeed, useHighlightProfiles, type FeedSort } from "@/hooks/use-profile-feed";
import {
  CONTINENT_ORDER,
  profileContinent,
  type Continent,
} from "@/constants/regions";
import { cn } from "@/lib/utils";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Phindex - Phenotype Index",
  url: "https://www.phenotypeindex.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.phenotypeindex.com/explore?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const SORT_OPTIONS: { value: FeedSort; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "popular", label: "Most voted" },
  { value: "needs-votes", label: "Needs votes" },
];

const Index = () => {
  const [sort, setSort] = useState<FeedSort>("recent");
  /** `null` = todas as regiões. */
  const [region, setRegion] = useState<Continent | null>(null);
  // Dois modais distintos: cada botão já define se o perfil é de uma pessoa
  // famosa ou da comunidade, então a pergunta some do formulário.
  const [showFamousModal, setShowFamousModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  const { profiles: highlights, isLoading: highlightsLoading } = useHighlightProfiles();
  const {
    profiles: feedProfiles,
    isLoading: feedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    refetch,
  } = useProfileFeed(sort);

  // Sentinela do scroll infinito.
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      // Carrega antes de chegar ao fim, para o scroll não travar.
      { rootMargin: "600px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * O filtro de região roda no cliente, sobre as páginas já carregadas: a
   * região vem do voto geográfico (uma sub-região como "Levant"), que o banco
   * não guarda como continente. É o mesmo critério do Explore. Com o filtro
   * ativo a rolagem infinita continua trazendo páginas, então a lista cresce
   * conforme o usuário desce.
   */
  const visibleProfiles = useMemo(
    () =>
      region
        ? feedProfiles.filter((profile) => profileContinent(profile) === region)
        : feedProfiles,
    [feedProfiles, region]
  );

  const mostClassified = useMemo(
    () =>
      [...highlights]
        .filter((profile) => !profile.is_anonymous && profile.vote_count > 0)
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, 12),
    [highlights]
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Phindex - Phenotype Index | Discover Human Phenotypes, Ancestry &amp; Physical Traits</title>
        <meta name="description" content="Explore and classify human phenotypes from around the world. Discover European, African, Asian, American and Middle Eastern phenotypes. Vote on physical characteristics like skin color, hair texture, eye color, body type and more." />
        <meta name="keywords" content="phenotype, phenotypes, what is my phenotype, european phenotype, african phenotype, asian phenotype, american phenotype, ancestry, genotype, dna, human physical traits, phenotype classification, phenotype index, skin color, hair texture, eye color, body type, facial features, nasal breadth, jaw type, head type" />
        <link rel="canonical" href="https://www.phenotypeindex.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Phindex - Phenotype Index" />
        <meta property="og:description" content="Explore and classify human phenotypes from around the world." />
        <meta property="og:image" content="https://www.phenotypeindex.com/og-default.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://www.phenotypeindex.com" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content="Phindex - Phenotype Index" />
        <meta name="twitter:description" content="Explore and classify human phenotypes from around the world." />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/og-default.png" />
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>

      <Header />
      <AppSidebar />

      <main className="px-4 pt-20 lg:pl-[21rem] lg:pr-6 lg:pb-12">
        <div className="mx-auto max-w-[1400px]">
          <StatsBanner />

          {/* O trilho fica FORA da grade de duas colunas, ocupando a largura
              inteira: ele rola na horizontal, então cada pixel a mais mostra
              mais um rosto. O painel lateral começa só na altura do Discover,
              onde a leitura passa a ser vertical e a coluna estreita ajuda. */}
          <HighlightRail
            title="Most classified"
            description="Famous people the community is voting on right now"
            profiles={mostClassified}
            isLoading={highlightsLoading}
            ranked
            seeAllPath="/explore"
          />

          {/* BARRA DE FILTROS — fica logo acima do Discover, que é o que ela
              filtra: o trilho de destaques acima não responde a estes
              controles, então tê-los ali sugeria um alcance que não existe.
              Continua grudando no topo ao rolar, para o recorte permanecer
              acessível depois que o feed já passou vários cards. */}
          <div className="sticky top-16 z-30 -mx-4 mb-4 flex items-center gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md">
            <div
              role="group"
              aria-label="Filter by region"
              className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <button
                type="button"
                onClick={() => setRegion(null)}
                aria-pressed={region === null}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  region === null
                    ? "bg-phindex-dark font-medium text-white"
                    : "border border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                All regions
              </button>

              {CONTINENT_ORDER.map((continent) => {
                const isActive = region === continent;
                return (
                  <button
                    key={continent}
                    type="button"
                    onClick={() => setRegion(isActive ? null : continent)}
                    aria-pressed={isActive}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-phindex-dark font-medium text-white"
                        : "border border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    {continent}
                  </button>
                );
              })}
            </div>

            <div
              role="group"
              aria-label="Sort feed"
              className="hidden shrink-0 items-center gap-1 rounded-full bg-muted p-1 sm:flex"
            >
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSort(option.value)}
                  aria-pressed={sort === option.value}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    sort === option.value
                      ? "bg-card font-medium text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-8">
            <div className="min-w-0 flex-1">
              {/* FEED */}
              <section aria-labelledby="feed-heading" className="pb-2">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h2
                      id="feed-heading"
                      className="text-[26px] font-semibold leading-tight tracking-tight text-foreground"
                    >
                      Discover
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      New profiles from the Phindex community
                    </p>
                  </div>

                  {/* Em telas estreitas a ordenação sai da barra fixa, que já
                      está cheia com as regiões, e aparece aqui. */}
                  <div
                    role="group"
                    aria-label="Sort feed"
                    className="flex items-center gap-1 rounded-full bg-muted p-1 sm:hidden"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSort(option.value)}
                        aria-pressed={sort === option.value}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm transition-colors duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          sort === option.value
                            ? "bg-card font-medium text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isError ? (
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
                    <p className="text-foreground">We couldn&rsquo;t load the feed.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Check your connection and try again.
                    </p>
                    <Button onClick={() => refetch()} className="mt-4 rounded-full">
                      Retry
                    </Button>
                  </div>
                ) : feedLoading ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-2xl border border-border/60 bg-card"
                        aria-hidden="true"
                      >
                        <div className="aspect-[4/3] animate-pulse bg-muted" />
                        <div className="space-y-2.5 p-4">
                          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                          <div className="h-6 w-1/2 animate-pulse rounded-full bg-muted" />
                          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : visibleProfiles.length === 0 ? (
                  /* Duas ausências diferentes, duas saídas diferentes: um
                     filtro que não casou se resolve limpando o filtro; um
                     índice vazio se resolve adicionando o primeiro rosto. */
                  region && feedProfiles.length > 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                      <h3 className="text-lg font-semibold text-foreground">
                        Nothing from this region yet
                      </h3>
                      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                        No loaded profile matches this region. Keep scrolling to
                        load more, or clear the filter.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setRegion(null)}
                        className="mt-5 rounded-full"
                      >
                        Show all regions
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                      <h3 className="text-lg font-semibold text-foreground">
                        The index is empty
                      </h3>
                      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                        Be the first to add a face and let the community classify it.
                      </p>
                      <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <Button
                          onClick={() => setShowFamousModal(true)}
                          className="gap-1.5 rounded-full"
                        >
                          <Plus className="h-4 w-4" />
                          Add famous person
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowCommunityModal(true)}
                          className="gap-1.5 rounded-full"
                        >
                          <Plus className="h-4 w-4" />
                          Add to community
                        </Button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleProfiles.map((profile, index) => (
                      <div
                        key={profile.id}
                        className="motion-safe:animate-[feedItemIn_400ms_cubic-bezier(0.22,1,0.36,1)_backwards]"
                        // Escalona só dentro da página recém-chegada.
                        style={{ animationDelay: `${(index % 12) * 40}ms` }}
                      >
                        <PhenotypeCard profile={profile} variant="feed" priority={index < 3} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Sentinela + estado de carregamento da próxima página. */}
                <div ref={sentinelRef} className="h-px" aria-hidden="true" />

                {isFetchingNextPage && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Loading more&hellip;
                  </p>
                )}

                {!hasNextPage && visibleProfiles.length > 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    You&rsquo;ve reached the end of the index.
                  </p>
                )}
              </section>
            </div>

            {/* PAINEL DIREITO */}
            <aside className="hidden w-80 shrink-0 xl:block">
              {/* Fixo na viewport, mas com rolagem própria: sem a altura máxima,
                  um painel mais alto que a janela ficava cortado pela metade e
                  não havia como alcançar o que estava embaixo.
                  scrollbar-hide esconde a barra sem desabilitar a rolagem. */}
              <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto overscroll-contain scrollbar-hide pb-4">
                <DiscoveryPanel profiles={highlights} isLoading={highlightsLoading} />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />

      {/* Pessoa famosa: is_anonymous = false, categoria escolhida no formulário. */}
      <AddProfileModal
        triggerExternal={showFamousModal}
        onTriggerExternalChange={setShowFamousModal}
        initialIsAnonymous={false}
        lockIsAnonymous
      />

      {/* Comunidade: is_anonymous = true, categoria fixada em "User Profiles". */}
      <AddProfileModal
        triggerExternal={showCommunityModal}
        onTriggerExternalChange={setShowCommunityModal}
        initialIsAnonymous={true}
        lockIsAnonymous
      />
    </div>
  );
};

export default Index;

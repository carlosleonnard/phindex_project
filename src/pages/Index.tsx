/**
 * PÁGINA INICIAL (Index.tsx)
 *
 * O feed de descoberta do Phindex. A página é organizada em três faixas:
 *
 * 1. Trilhos de destaque  — leitura rápida de quem está em alta
 * 2. Feed vertical        — cards grandes com scroll infinito e action bar
 * 3. Painel de descoberta — tendências e atividade (apenas em telas largas)
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
];

const Index = () => {
  const [sort, setSort] = useState<FeedSort>("recent");
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

  const mostVoted = useMemo(
    () =>
      [...highlights]
        .filter((profile) => !profile.is_anonymous)
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, 14),
    [highlights]
  );

  const community = useMemo(
    () => highlights.filter((profile) => profile.is_anonymous).slice(0, 14),
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

      {/* pb-24 no mobile abre espaço para a bottom nav fixa. */}
      <main className="px-4 pb-24 pt-20 lg:pl-[21rem] lg:pr-6 lg:pb-12">
        <div className="mx-auto flex max-w-[1400px] gap-8">
          <div className="min-w-0 flex-1">
            <StatsBanner />

            <HighlightRail
              title="Famous people"
              description="The public figures the community has classified most"
              profiles={mostVoted}
              isLoading={highlightsLoading}
              ranked
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFamousModal(true)}
                  className="shrink-0 gap-1.5 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                  Add famous person
                </Button>
              }
            />

            <HighlightRail
              title="From the community"
              description="Profiles submitted by Phindex members"
              profiles={community}
              isLoading={highlightsLoading}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCommunityModal(true)}
                  className="shrink-0 gap-1.5 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                  Add to community
                </Button>
              }
            />

            {/* FEED */}
            <section aria-labelledby="feed-heading" className="pt-2">
              <div className="sticky top-16 z-30 -mx-4 mb-4 flex items-center justify-between gap-4 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md">
                <h2 id="feed-heading" className="text-xl font-semibold tracking-tight text-foreground">
                  Discover
                </h2>

                <div
                  role="group"
                  aria-label="Sort feed"
                  className="flex items-center gap-1 rounded-full bg-muted p-1"
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
                          ? "bg-card text-foreground shadow-sm"
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
                <div className="grid gap-5 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-2xl border border-border/60 bg-card"
                      aria-hidden="true"
                    >
                      <div className="aspect-[4/5] animate-pulse bg-muted sm:aspect-[640/607]" />
                      <div className="space-y-2 p-5">
                        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : feedProfiles.length === 0 ? (
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
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {feedProfiles.map((profile, index) => (
                    <div
                      key={profile.id}
                      className="motion-safe:animate-[feedItemIn_400ms_cubic-bezier(0.22,1,0.36,1)_backwards]"
                      // Escalona só dentro da página recém-chegada.
                      style={{ animationDelay: `${(index % 12) * 40}ms` }}
                    >
                      <PhenotypeCard profile={profile} variant="feed" priority={index < 2} />
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

              {!hasNextPage && feedProfiles.length > 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  You&rsquo;ve reached the end of the index.
                </p>
              )}
            </section>
          </div>

          {/* PAINEL DIREITO */}
          <aside className="hidden w-80 shrink-0 xl:block">
            <div className="sticky top-24">
              <DiscoveryPanel profiles={highlights} isLoading={highlightsLoading} />
            </div>
          </aside>
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

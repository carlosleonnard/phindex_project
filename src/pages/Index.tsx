/**
 * FEED DE DESCOBERTA (Index.tsx)
 *
 * A home de quem já entrou (e /community para todos). De cima para baixo:
 *
 * 1. Cabeçalho  — "Discover" e a leitura do índice (famosos × comunidade).
 * 2. Trilho     — os famosos mais classificados.
 * 3. Filtros    — região (o cromossomo de seis faixas) e ordenação; gruda no
 *                 topo ao rolar.
 * 4. Grade      — cartões em duas colunas, com rolagem infinita, e o convite
 *                 para adicionar um rosto no meio da primeira página.
 * 5. Painel     — o que precisa de voto, os melhores do mês e a atividade
 *                 recente (só em telas largas).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useSearchParams } from "react-router-dom";

import { AppLayout } from "@/components/AppLayout";
import { AddProfileModal } from "@/components/AddProfileModal";
import { LoginModal } from "@/components/LoginModal";
import { HighlightRail } from "@/components/HighlightRail";
import { DiscoveryPanel, IndexReadout } from "@/components/DiscoveryPanel";
import { PhenotypeCard } from "@/components/PhenotypeCard";
import { RegionFilter, SortTabs } from "@/components/kt/RegionFilter";
import { CenButton } from "@/components/kt/Centromere";
import { useProfileFeed, useHighlightProfiles, type FeedSort } from "@/hooks/use-profile-feed";
import { useProfileStats } from "@/hooks/use-profile-stats";
import { useAuth } from "@/hooks/use-auth";
import { profileContinent, type Continent } from "@/constants/regions";

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

const isFeedSort = (value: string | null): value is FeedSort =>
  value === "recent" || value === "popular" || value === "needs-votes";

/** O convite para adicionar um rosto, no meio da grade. */
const AddFaceCard = ({ onFamous, onOwn }: { onFamous: () => void; onOwn: () => void }) => (
  <article className="flex min-h-[300px] flex-col items-start justify-center gap-3.5 rounded-[3px] border-[1.5px] border-dashed border-kt-b50 bg-kt-wash p-7">
    <p className="m-0 font-sc text-[14px] tracking-[0.06em] text-kt-teal">add to the index</p>
    <h3 className="m-0 text-[28px] font-medium leading-[1.1] text-kt-ink">A face the index is missing?</h3>
    <p className="m-0 max-w-[30ch] text-[17px] text-kt-body">
      Add a famous person, or post your own photo for the community to read.
    </p>
    <div className="mt-1.5 flex flex-wrap gap-2.5">
      <CenButton size="sm" icon="plus" onClick={onFamous}>
        famous person
      </CenButton>
      <button
        type="button"
        onClick={onOwn}
        className="inline-flex h-11 items-center rounded-full border-[1.5px] border-kt-teal bg-transparent px-5 font-[inherit] text-[17px] text-kt-teal hover:bg-kt-teal/[0.06]"
      >
        your own photo
      </button>
    </div>
  </article>
);

const Index = () => {
  const [searchParams] = useSearchParams();
  // Em /community o canônico é /community; em "/" (com sessão) é a raiz.
  const { pathname } = useLocation();
  const pageUrl = `https://www.phenotypeindex.com${pathname === "/community" ? "/community" : "/"}`;
  const initialSort = searchParams.get("sort");
  const [sort, setSort] = useState<FeedSort>(isFeedSort(initialSort) ? initialSort : "recent");
  const [region, setRegion] = useState<Continent | null>(null);
  const [showFamousModal, setShowFamousModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user } = useAuth();

  const { data: stats } = useProfileStats();
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

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "600px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * O filtro de região roda no cliente, sobre as páginas já carregadas — a
   * região vem do voto geográfico, que o banco não guarda como continente.
   */
  const visibleProfiles = useMemo(
    () => (region ? feedProfiles.filter((profile) => profileContinent(profile) === region) : feedProfiles),
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

  const openAdd = (famous: boolean) => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    if (famous) setShowFamousModal(true);
    else setShowCommunityModal(true);
  };

  const addCard = <AddFaceCard key="add-face" onFamous={() => openAdd(true)} onOwn={() => openAdd(false)} />;
  const cards = visibleProfiles.map((profile, index) => (
    <div
      key={profile.id}
      className="motion-safe:animate-[feedItemIn_400ms_cubic-bezier(0.22,1,0.36,1)_backwards]"
      style={{ animationDelay: `${(index % 12) * 40}ms` }}
    >
      <PhenotypeCard profile={profile} variant="feed" priority={index < 2} />
    </div>
  ));
  if (cards.length > 0) cards.splice(Math.min(5, cards.length), 0, addCard);

  return (
    <AppLayout>
      <Helmet>
        <title>Phindex - Phenotype Index | Discover Human Phenotypes, Ancestry &amp; Physical Traits</title>
        <meta
          name="description"
          content="Explore and classify human phenotypes from around the world. Discover European, African, Asian, American and Middle Eastern phenotypes. Vote on physical characteristics like skin color, hair texture, eye color, body type and more."
        />
        <meta
          name="keywords"
          content="phenotype, phenotypes, what is my phenotype, european phenotype, african phenotype, asian phenotype, american phenotype, ancestry, genotype, dna, human physical traits, phenotype classification, phenotype index, skin color, hair texture, eye color, body type, facial features, nasal breadth, jaw type, head type"
        />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Phindex - Phenotype Index" />
        <meta property="og:description" content="Explore and classify human phenotypes from around the world." />
        <meta property="og:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content="Phindex - Phenotype Index" />
        <meta name="twitter:description" content="Explore and classify human phenotypes from around the world." />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>

      <div className="flex flex-wrap items-start gap-10">
        <div className="min-w-0 flex-[999_1_560px]">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <div className="min-w-0">
              <h1 className="m-0 text-[clamp(40px,4.4vw,60px)] font-medium leading-none tracking-[-0.022em] text-kt-ink">
                Discover
              </h1>
              <p className="mb-0 mt-2 text-[18px] italic text-kt-body">New profiles from the Phindex community.</p>
            </div>
            <IndexReadout
              total={stats?.totalProfiles ?? 0}
              famous={stats?.celebrities ?? 0}
              community={stats?.communityProfiles ?? 0}
            />
          </div>

          <HighlightRail
            title="Most classified"
            description="Famous people the community is voting on right now"
            profiles={mostClassified}
            isLoading={highlightsLoading}
            ranked
            seeAllPath="/explore"
          />

          <div className="sticky top-[73px] z-30 mb-6 mt-[30px] flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-kt-rule bg-kt-paper py-3.5">
            <RegionFilter value={region} onChange={setRegion} />
            <SortTabs options={SORT_OPTIONS} value={sort} onChange={(value) => setSort(value)} label="Sort feed" />
          </div>

          <section aria-label="Profiles">
            {isError ? (
              <div className="rounded-[3px] border border-kt-rule bg-white p-8 text-center">
                <p className="m-0 text-kt-ink">We couldn’t load the feed.</p>
                <p className="mb-0 mt-1 text-[15px] text-kt-body">Check your connection and try again.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 inline-flex h-11 items-center rounded-full border-[1.5px] border-kt-teal bg-transparent px-5 font-[inherit] text-[17px] text-kt-teal"
                >
                  retry
                </button>
              </div>
            ) : feedLoading ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-[22px]">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} aria-hidden="true" className="overflow-hidden rounded-[3px] border border-kt-rule bg-white">
                    <div className="aspect-[4/3] animate-pulse bg-kt-wash" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-2/3 animate-pulse rounded-[3px] bg-kt-wash" />
                      <div className="h-3 w-full animate-pulse rounded-full bg-kt-wash" />
                      <div className="h-3 w-1/3 animate-pulse rounded-[3px] bg-kt-wash" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleProfiles.length === 0 ? (
              region && feedProfiles.length > 0 ? (
                <div className="rounded-[3px] border-[1.5px] border-dashed border-kt-b50 bg-kt-wash p-10 text-center">
                  <h2 className="m-0 text-[24px] font-medium text-kt-ink">Nothing from this region yet</h2>
                  <p className="mx-auto mb-0 mt-1.5 max-w-[42ch] text-[16px] text-kt-body">
                    No loaded profile matches this region. Keep scrolling to load more, or clear the filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRegion(null)}
                    className="mt-5 inline-flex h-11 items-center rounded-full border-[1.5px] border-kt-teal bg-transparent px-5 font-[inherit] text-[17px] text-kt-teal"
                  >
                    show all regions
                  </button>
                </div>
              ) : (
                addCard
              )
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-[22px]">{cards}</div>
            )}

            <div ref={sentinelRef} className="h-px" aria-hidden="true" />

            {isFetchingNextPage && (
              <p className="mb-0 mt-7 text-center text-[16px] italic text-kt-body">Loading more faces…</p>
            )}
            {!hasNextPage && visibleProfiles.length > 0 && (
              <p className="mb-0 mt-7 text-center text-[16px] italic text-kt-body">You’ve reached the end of the index.</p>
            )}
          </section>
        </div>

        <aside aria-label="Discovery" className="hidden min-w-0 max-w-[300px] flex-[1_1_280px] xl:block">
          <DiscoveryPanel profiles={highlights} isLoading={highlightsLoading} />
        </aside>
      </div>

      <AddProfileModal
        triggerExternal={showFamousModal}
        onTriggerExternalChange={setShowFamousModal}
        initialIsAnonymous={false}
        lockIsAnonymous
      />
      <AddProfileModal
        triggerExternal={showCommunityModal}
        onTriggerExternalChange={setShowCommunityModal}
        initialIsAnonymous={true}
        lockIsAnonymous
      />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </AppLayout>
  );
};

export default Index;

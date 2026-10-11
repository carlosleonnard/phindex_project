/**
 * PÁGINA DE SALVOS (Saved.tsx)
 *
 * Coleção pessoal do usuário: os perfis marcados com o coração no feed.
 * Exige login — sem sessão, não há o que listar.
 */

import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/AppLayout";
import { PhenotypeCard } from "@/components/PhenotypeCard";
import { LoginModal } from "@/components/LoginModal";
import { CenButton, CenLink } from "@/components/kt/Centromere";
import { SortTabs } from "@/components/kt/RegionFilter";
import { EmptySheet, GRID_CLASS, GridSkeleton, sortListing } from "@/components/kt/Listing";
import { useAuth } from "@/hooks/use-auth";
import { useSavedProfiles } from "@/hooks/use-saved-profiles";

type SavedSort = "saved" | "popular" | "needs-votes";

const SORTS: Array<{ value: SavedSort; label: string }> = [
  { value: "saved", label: "Recently saved" },
  { value: "popular", label: "Most voted" },
  { value: "needs-votes", label: "Needs votes" },
];

const Saved = () => {
  const { user, loading: authLoading } = useAuth();
  // useSavedProfiles já devolve os perfis com os agregados do feed, na ordem em que foram salvos.
  const { savedProfiles, isLoading } = useSavedProfiles();
  const [sort, setSort] = useState<SavedSort>("saved");
  const [loginOpen, setLoginOpen] = useState(false);

  const cards = useMemo(
    () => (sort === "saved" ? savedProfiles : sortListing(savedProfiles, sort)),
    [savedProfiles, sort]
  );
  const needVotes = savedProfiles.filter((profile) => profile.vote_count < 10).length;

  return (
    <AppLayout>
      <Helmet>
        <title>Saved Profiles | Phindex</title>
        <meta name="description" content="The phenotype profiles you've saved on Phindex." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-b-[1.5px] border-kt-ink pb-6">
        <div>
          <p className="m-0 font-sc text-[16px] tracking-[0.06em] text-kt-teal">your collection</p>
          <h1 className="mb-0 mt-1 text-[clamp(48px,5.8vw,84px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
            Saved
          </h1>
          <p className="mb-0 mt-3 text-[19px] italic text-kt-body">Faces you’ve kept to revisit.</p>
        </div>
        {user && savedProfiles.length > 0 && (
          <p className="m-0 flex flex-wrap gap-x-5 gap-y-1 text-[16px] text-kt-body">
            <span>
              <span className="text-kt-ink">{savedProfiles.length}</span> saved
            </span>
            <span>
              <span className="text-kt-ink">{needVotes}</span> still need votes
            </span>
          </p>
        )}
      </div>

      {authLoading ? (
        <div className="mt-6">
          <GridSkeleton count={4} />
        </div>
      ) : !user ? (
        <EmptySheet
          className="mt-8"
          title="Log in to keep a collection"
          action={<CenButton size="sm" onClick={() => setLoginOpen(true)}>log in</CenButton>}
        >
          Saved profiles are tied to your account, so they follow you across devices.
        </EmptySheet>
      ) : isLoading ? (
        <div className="mt-6">
          <GridSkeleton count={4} />
        </div>
      ) : cards.length === 0 ? (
        <EmptySheet
          className="mt-8"
          title="Nothing saved yet"
          action={
            <CenLink to="/explore" size="sm">
              explore the index
            </CenLink>
          }
        >
          Tap the heart on any face — or double-tap the photo — to keep it here.
        </EmptySheet>
      ) : (
        <>
          <div className="mb-3.5 mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p className="m-0 text-[15px] text-kt-body" role="status">
              {cards.length} {cards.length === 1 ? "profile" : "profiles"}
            </p>
            <SortTabs options={SORTS} value={sort} onChange={(value) => setSort(value)} />
          </div>
          <section aria-label="Saved profiles" className={GRID_CLASS}>
            {cards.map((profile, index) => (
              <PhenotypeCard key={profile.id} profile={profile} variant="grid" priority={index < 4} />
            ))}
          </section>
        </>
      )}

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </AppLayout>
  );
};

export default Saved;

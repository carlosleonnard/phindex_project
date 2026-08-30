/**
 * PÁGINA DE SALVOS (Saved.tsx)
 *
 * Coleção pessoal do usuário: os perfis marcados com ❤️ no feed.
 * Exige login — sem sessão, não há o que listar.
 */

import { Helmet } from "react-helmet-async";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { PhenotypeCard } from "@/components/PhenotypeCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSavedProfiles } from "@/hooks/use-saved-profiles";

const Saved = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { savedProfiles, isLoading } = useSavedProfiles();

  // useSavedProfiles já devolve os perfis com os agregados do feed.
  const cards = savedProfiles;

  const showEmpty = !isLoading && cards.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Saved Profiles | Phindex</title>
        <meta name="description" content="The phenotype profiles you've saved on Phindex." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <Header />
      <AppSidebar />

      <main className="px-4 pt-20 lg:pl-[21rem] lg:pr-6 lg:pb-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="py-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Saved
            </h1>
            <p className="mt-1 text-muted-foreground">
              Faces you&rsquo;ve kept to revisit.
            </p>
          </div>

          {authLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                  <div className="aspect-[640/607] animate-pulse bg-muted" />
                  <div className="space-y-2 p-3.5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : !user ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                Sign in to keep a collection
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Saved profiles are tied to your account, so they follow you across devices.
              </p>
              <Button onClick={() => navigate("/")} className="mt-5 rounded-full">
                Back to the feed
              </Button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                  <div className="aspect-[640/607] animate-pulse bg-muted" />
                  <div className="space-y-2 p-3.5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : showEmpty ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                Nothing saved yet
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Tap the heart on any face &mdash; or double-tap the photo &mdash; to keep it here.
              </p>
              <Button onClick={() => navigate("/explore")} className="mt-5 rounded-full">
                Explore the index
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground" role="status">
                {cards.length} {cards.length === 1 ? "profile" : "profiles"}
              </p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {cards.map((profile, index) => (
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
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Saved;

/**
 * PAINEL DE DESCOBERTA (DiscoveryPanel.tsx)
 *
 * Coluna direita da home em telas largas: fenótipos em alta, perfis sugeridos
 * e atividade recente da comunidade. Tudo derivado dos dados reais de voto —
 * nenhuma métrica inventada.
 *
 * Escondido abaixo de xl, onde a largura pertence ao feed.
 */

import { TrendingUp, Sparkles, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import type { FeedProfile } from "@/hooks/use-profile-feed";

interface DiscoveryPanelProps {
  profiles: FeedProfile[];
  isLoading?: boolean;
}

/** Distância em linguagem natural, sem dependência extra. */
const timeAgo = (iso: string): string => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

const PanelSection = ({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof TrendingUp;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-border/60 bg-card p-4">
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {title}
    </h2>
    {children}
  </section>
);

export const DiscoveryPanel = ({ profiles, isLoading = false }: DiscoveryPanelProps) => {
  const navigate = useNavigate();

  /** Fenótipos mais classificados, com a contagem real de perfis. */
  const trending = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const profile of profiles) {
      const phenotype = profile.most_voted_phenotype;
      if (phenotype) counts[phenotype] = (counts[phenotype] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [profiles]);

  /** Perfis com poucos votos: onde a participação do usuário rende mais. */
  const needsVotes = useMemo(
    () =>
      [...profiles]
        .filter((profile) => profile.vote_count < 3)
        .slice(0, 4),
    [profiles]
  );

  const recent = useMemo(
    () =>
      [...profiles]
        .sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5),
    [profiles]
  );

  if (isLoading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trending.length > 0 && (
        <PanelSection icon={TrendingUp} title="Trending phenotypes">
          <ul className="space-y-1">
            {trending.map(([phenotype, count]) => (
              <li key={phenotype}>
                <button
                  type="button"
                  onClick={() => navigate(`/explore?q=${encodeURIComponent(phenotype)}`)}
                  className="flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="truncate text-sm text-foreground">{phenotype}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {count} {count === 1 ? "profile" : "profiles"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PanelSection>
      )}

      {needsVotes.length > 0 && (
        <PanelSection icon={Sparkles} title="Needs your vote">
          <ul className="space-y-1">
            {needsVotes.map((profile) => (
              <li key={profile.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/user-profile/${profile.slug}`)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <img
                    src={profile.front_image_url}
                    alt=""
                    loading="lazy"
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                    onError={(event) => {
                      (event.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">
                      {profile.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {profile.vote_count === 0
                        ? "No votes yet"
                        : `${profile.vote_count} ${profile.vote_count === 1 ? "vote" : "votes"}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PanelSection>
      )}

      {recent.length > 0 && (
        <PanelSection icon={Clock} title="Recent activity">
          <ul className="space-y-2.5">
            {recent.map((profile) => (
              <li key={profile.id} className="text-sm leading-snug">
                <button
                  type="button"
                  onClick={() => navigate(`/user-profile/${profile.slug}`)}
                  className="text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-foreground">{profile.name}</span>
                  <span className="text-muted-foreground"> joined Phindex</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {timeAgo(profile.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PanelSection>
      )}
    </div>
  );
};

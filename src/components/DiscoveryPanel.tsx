/**
 * PAINEL DE DESCOBERTA (DiscoveryPanel.tsx)
 *
 * Coluna direita da home em telas largas: perfis que precisam de voto,
 * leaderboard do jogo e atividade recente da comunidade (perfis novos e
 * comentários novos, intercalados por data). Tudo derivado dos dados reais —
 * nenhuma métrica inventada.
 *
 * "Needs your vote" vem primeiro por ser a seção acionável: pede uma
 * contribuição, enquanto as outras duas só informam. Ela lista apenas perfis
 * sem nenhum voto, dos criados mais recentemente para os mais antigos.
 *
 * Escondido abaixo de xl, onde a largura pertence ao feed.
 */

import { Trophy, Sparkles, Clock, Award, MessageSquare, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import type { FeedProfile } from "@/hooks/use-profile-feed";
import { useLeaderboard, type LeaderboardPeriod } from "@/hooks/use-leaderboard";
import { useRecentComments } from "@/hooks/use-recent-comments";
import { cn } from "@/lib/utils";

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
  icon: typeof Trophy;
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

/** Uma linha do "Recent activity", vinda de perfis novos ou de comentários. */
type ActivityItem = {
  kind: "profile" | "comment";
  id: string;
  createdAt: string;
  /** Quem agiu: o nome do perfil criado, ou o apelido de quem comentou. */
  name: string;
  /** Slug do perfil de destino do link. */
  slug: string;
  /** Só para comentários: o perfil que recebeu o comentário. */
  targetName?: string;
};

/** Os três recortes do leaderboard, iguais aos da página /leaderboard. */
const LEADERBOARD_PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

export const DiscoveryPanel = ({ profiles, isLoading = false }: DiscoveryPanelProps) => {
  const navigate = useNavigate();

  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("week");
  const { data: leaderboard, isLoading: leaderboardLoading } =
    useLeaderboard(leaderboardPeriod);
  // O painel é estreito: cinco linhas bastam, o resto fica na página cheia.
  const topPlayers = (leaderboard ?? []).slice(0, 5);

  /**
   * Perfis ainda sem nenhum voto — onde a participação do usuário rende mais,
   * porque ali um voto é o primeiro em vez de somar a uma contagem existente.
   * Famosos e perfis da comunidade entram juntos, dos criados mais
   * recentemente para os mais antigos. A lista rola, então não corta em 4.
   */
  const needsVotes = useMemo(
    () =>
      profiles
        .filter((profile) => profile.vote_count === 0)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    [profiles]
  );

  const { data: recentComments } = useRecentComments(5);

  /**
   * Atividade recente = perfis novos + comentários novos, intercalados por
   * data. Os dois tipos vêm de fontes diferentes, então são normalizados para
   * um formato comum antes de ordenar.
   */
  const recent = useMemo<ActivityItem[]>(() => {
    const newProfiles: ActivityItem[] = profiles.map((profile) => ({
      kind: "profile",
      id: `profile-${profile.id}`,
      createdAt: profile.created_at,
      name: profile.name,
      slug: profile.slug,
    }));

    const newComments: ActivityItem[] = (recentComments ?? []).map((comment) => ({
      kind: "comment",
      id: `comment-${comment.id}`,
      createdAt: comment.created_at,
      name: comment.nickname,
      slug: comment.profileSlug,
      targetName: comment.profileName,
    }));

    return [...newProfiles, ...newComments]
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [profiles, recentComments]);

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
      {needsVotes.length > 0 && (
        <PanelSection icon={Sparkles} title="Needs your vote">
          {/* Altura limitada com rolagem própria: a seção mostra muitos perfis
              sem empurrar leaderboard e atividade recente para fora da tela.
              scrollbar-hide esconde a barra sem desabilitar a rolagem. */}
          <ul className="max-h-64 space-y-1 overflow-y-auto overscroll-contain scrollbar-hide">
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
                    {/* A seção só lista perfis sem voto, então o rótulo é fixo. */}
                    <span className="block truncate text-xs text-muted-foreground">
                      No votes yet
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PanelSection>
      )}

      <PanelSection icon={Trophy} title="Leaderboard">
        {/* Filtros de período. O estado é local: o painel não interfere na
            página /leaderboard, que mantém o próprio recorte. */}
        <div
          role="tablist"
          aria-label="Leaderboard period"
          className="mb-3 flex items-center gap-1 rounded-lg bg-muted p-0.5"
        >
          {LEADERBOARD_PERIODS.map(({ key, label }) => {
            const isActive = leaderboardPeriod === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setLeaderboardPeriod(key)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {leaderboardLoading ? (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : topPlayers.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            No players in this period yet.
          </p>
        ) : (
          <>
            <ul className="space-y-1">
              {topPlayers.map((entry, index) => (
                <li key={entry.userId}>
                  <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                    {/* Top 3 ganham medalha; do 4º em diante, só o número. */}
                    <span className="flex w-5 shrink-0 justify-center">
                      {index < 3 ? (
                        <Award
                          className={cn(
                            "h-4 w-4",
                            index === 0 && "text-yellow-500",
                            index === 1 && "text-gray-400",
                            index === 2 && "text-amber-600"
                          )}
                        />
                      ) : (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {entry.nickname}
                    </span>
                    <span
                      className="shrink-0 text-xs tabular-nums text-muted-foreground"
                      title={`${entry.totalCorrect} correct of ${entry.totalQuestions}`}
                    >
                      {entry.totalCorrect}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => navigate("/leaderboard")}
              className="mt-2 w-full rounded-lg px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              See full leaderboard
            </button>
          </>
        )}
      </PanelSection>

      {recent.length > 0 && (
        <PanelSection icon={Clock} title="Recent activity">
          <ul className="space-y-2.5">
            {recent.map((item) => (
              <li key={item.id} className="text-sm leading-snug">
                <button
                  type="button"
                  onClick={() => navigate(`/user-profile/${item.slug}`)}
                  className="flex w-full items-start gap-2 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Ícone diferencia perfil novo de comentário novo. */}
                  {item.kind === "profile" ? (
                    <UserPlus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : (
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-category-primary" />
                  )}
                  <span className="min-w-0 flex-1">
                    {item.kind === "profile" ? (
                      <>
                        <span className="text-foreground">{item.name}</span>
                        <span className="text-muted-foreground"> joined Phindex</span>
                      </>
                    ) : (
                      <>
                        <span className="text-foreground">{item.name}</span>
                        <span className="text-muted-foreground"> commented on </span>
                        <span className="text-foreground">{item.targetName}</span>
                      </>
                    )}
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {timeAgo(item.createdAt)}
                    </span>
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

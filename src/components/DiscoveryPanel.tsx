/**
 * PAINEL DE DESCOBERTA (DiscoveryPanel.tsx)
 *
 * Coluna direita da home em telas largas. Três blocos, em ordem de quanto
 * pedem do usuário: o que precisa do voto dele, quem está classificando mais,
 * e a regra de privacidade que rege os perfis da comunidade.
 *
 * "Needs your vote" vem primeiro por ser a única seção acionável. Lista perfis
 * com menos de 10 votos, dos mais recentes para os mais antigos — abaixo desse
 * volume um voto ainda muda o resultado, que é o que torna a contribuição
 * interessante.
 *
 * Escondido abaixo de xl, onde a largura pertence ao feed.
 */

import { Trophy, Sparkles, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import type { FeedProfile } from "@/hooks/use-profile-feed";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { cn } from "@/lib/utils";

interface DiscoveryPanelProps {
  profiles: FeedProfile[];
  isLoading?: boolean;
}

/** Abaixo disto, um voto novo ainda desloca o resultado. */
const LOW_VOTE_THRESHOLD = 10;

/** Quantos perfis a seção sugere de cada vez. */
const NEEDS_VOTE_LIMIT = 10;

/** Distância em linguagem natural, sem dependência extra. */
const timeAgo = (iso: string): string => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

/**
 * Pontos do classificador.
 *
 * O produto ainda não define uma economia de pontos, então a fórmula é
 * declarada aqui e em um lugar só: 10 por acerto no jogo, mais 2 por partida
 * concluída. O acerto é o que vale; a partida entra com peso pequeno para que
 * quem joga com frequência apareça sem que volume sozinho supere precisão.
 *
 * Se um dia existir uma regra oficial, é este ponto que muda.
 */
const POINTS_PER_CORRECT = 10;
const POINTS_PER_GAME = 2;

const classifierPoints = (entry: { totalCorrect: number; totalGames: number }): number =>
  entry.totalCorrect * POINTS_PER_CORRECT + entry.totalGames * POINTS_PER_GAME;

const PanelSection = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Trophy;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-border/60 bg-card p-4">
    <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      {title}
    </h2>
    {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
    <div className="mt-3">{children}</div>
  </section>
);

/** Inicial em disco, para quem não tem avatar no leaderboard. */
const InitialAvatar = ({ name }: { name: string }) => (
  <span
    aria-hidden="true"
    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
  >
    {name.trim().charAt(0).toUpperCase() || "?"}
  </span>
);

export const DiscoveryPanel = ({ profiles, isLoading = false }: DiscoveryPanelProps) => {
  const navigate = useNavigate();

  // O painel espelha o recorte mensal do mockup; a página /leaderboard mantém
  // os próprios filtros.
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard("month");

  const topClassifiers = useMemo(
    () =>
      (leaderboard ?? [])
        .map((entry) => ({ ...entry, points: classifierPoints(entry) }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 5),
    [leaderboard]
  );

  /**
   * Perfis com poucos votos, dos criados mais recentemente para os mais
   * antigos, limitados aos dez primeiros: é uma sugestão, não um inventário —
   * quem quiser percorrer tudo tem o feed com a aba "Needs votes".
   */
  const needsVotes = useMemo(
    () =>
      profiles
        .filter((profile) => profile.vote_count < LOW_VOTE_THRESHOLD)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, NEEDS_VOTE_LIMIT),
    [profiles]
  );

  if (isLoading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        {[0, 1].map((index) => (
          <div key={index} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="space-y-2.5">
              <div className="h-9 animate-pulse rounded bg-muted" />
              <div className="h-9 animate-pulse rounded bg-muted" />
              <div className="h-9 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {needsVotes.length > 0 && (
        <PanelSection
          icon={Sparkles}
          title="Needs your vote"
          subtitle={`Profiles with fewer than ${LOW_VOTE_THRESHOLD} votes`}
        >
          {/* Caixa curta com rolagem própria: mostra cinco perfis e mantém o
              resto a um gesto de distância, sem empurrar "Top classifiers"
              para fora da tela. A barra fica visível de propósito — é ela que
              avisa que a lista continua depois do quinto nome. */}
          <ul className="max-h-[268px] space-y-1 overflow-y-auto overscroll-contain scrollbar-slim pr-1">
            {needsVotes.map((profile) => (
              <li key={profile.id}>
                <div className="group flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-muted/60">
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
                      Uploaded {timeAgo(profile.created_at)}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => navigate(`/user-profile/${profile.slug}`)}
                    className="shrink-0 rounded-full border border-primary/30 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Vote
                    <span className="sr-only"> on {profile.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </PanelSection>
      )}

      <PanelSection icon={Trophy} title="Top classifiers" subtitle="This month">
        {leaderboardLoading ? (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : topClassifiers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one has played this month yet. Be the first.
          </p>
        ) : (
          <>
            <ol className="space-y-0.5">
              {topClassifiers.map((entry, index) => (
                <li key={entry.userId}>
                  <div className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                    <span className="w-3 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <InitialAvatar name={entry.nickname} />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {entry.nickname}
                    </span>
                    <span
                      className="shrink-0 text-xs font-medium tabular-nums text-foreground"
                      title={`${entry.totalCorrect} correct across ${entry.totalGames} games`}
                    >
                      {entry.points.toLocaleString()} pts
                    </span>
                  </div>
                </li>
              ))}
            </ol>

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

      {/* A regra que rege os perfis da comunidade. Fica no painel, e não num
          rodapé, porque é a resposta à pergunta que o feed provoca: "posso
          postar alguém aqui?". Escura de propósito — é a única superfície
          invertida da página, e não compete com nada por atenção. */}
      <section className="rounded-2xl bg-phindex-dark p-4 text-white">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Privacy first
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-white/75">
          Community profiles need consent from the person pictured and can be
          posted anonymously.
        </p>
      </section>
    </div>
  );
};

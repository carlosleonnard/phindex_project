/**
 * FAIXA DE QUATRO COLUNAS DA LANDING (LandingColumns.tsx)
 *
 * A metade de baixo da landing: as três coisas que dá para fazer no Phindex,
 * cada uma demonstrada com conteúdo real do índice, mais a atividade da
 * comunidade à direita.
 *
 * A regra da faixa é não explicar o produto — mostrar. "Read others" traz um
 * perfil que existe; "Play the game" traz uma rodada montada a partir de um
 * rosto real e suas opções de fenótipo. Quem chega entende o que acontece
 * depois do cadastro porque está vendo acontecer.
 */

import { Link } from "react-router-dom";
import { ArrowRight, Heart, MessageCircle, Share2 } from "lucide-react";

import type { FeedProfile } from "@/hooks/use-profile-feed";
import type { RecentComment } from "@/hooks/use-recent-comments";
import { cn } from "@/lib/utils";

/**
 * Cabeçalho comum das colunas: o ponto teal e o rótulo em caixa alta.
 * É a marca de seção da faixa — mesma forma nas quatro colunas, para a linha
 * de títulos ler como uma régua horizontal.
 */
const ColumnHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-3 flex items-center gap-2.5">
    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-phindex-teal" aria-hidden="true" />
    <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-foreground">
      {children}
    </span>
  </h2>
);

const ColumnText = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-5 max-w-[30ch] text-sm leading-relaxed text-muted-foreground">
    {children}
  </p>
);

/** Distância em linguagem natural, no mesmo formato do painel de descoberta. */
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

/** Iniciais para o lugar do avatar, que o banco não guarda. */
const initials = (name: string) =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

interface LandingColumnsProps {
  profiles: FeedProfile[];
  comments: RecentComment[];
  isLoading?: boolean;
  onJoin: () => void;
}

export const LandingColumns = ({
  profiles,
  comments,
  isLoading,
  onJoin,
}: LandingColumnsProps) => {
  // Cada coluna usa um perfil diferente, para a faixa não repetir o mesmo
  // rosto três vezes.
  const [readProfile, gameProfile] = profiles;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr_1fr_0.85fr] lg:gap-8 xl:gap-10">
      {/* ── 1. READ OTHERS ────────────────────────────────────────────── */}
      <section>
        <ColumnHeading>Read others</ColumnHeading>
        <ColumnText>
          Explore profiles, discover new perspectives and see how people
          perceive each other.
        </ColumnText>

        {isLoading || !readProfile ? (
          <CardSkeleton />
        ) : (
          <article className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-card">
            <div className="flex items-center gap-2.5 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                {readProfile.front_image_url ? (
                  <img
                    src={readProfile.front_image_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(readProfile.name)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  to={`/profile/${readProfile.slug}`}
                  className="block truncate text-sm font-medium text-foreground hover:text-phindex-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {readProfile.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {timeAgo(readProfile.created_at)}
                </span>
              </span>
            </div>

            <Link
              to={`/profile/${readProfile.slug}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <img
                src={readProfile.front_image_url}
                alt={readProfile.name}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </Link>

            <div className="p-3">
              {/* As tags são o que a comunidade já votou neste rosto — não
                  rótulos decorativos. Sem votos, nada aparece. */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-phindex-teal">
                {readProfile.most_voted_phenotype && (
                  <span>#{readProfile.most_voted_phenotype.toLowerCase().replace(/\s+/g, "")}</span>
                )}
                {readProfile.most_voted_geographic && (
                  <span>#{readProfile.most_voted_geographic.toLowerCase().replace(/\s+/g, "")}</span>
                )}
                {readProfile.country && (
                  <span>#{readProfile.country.toLowerCase().replace(/\s+/g, "")}</span>
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5 text-sm">
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  {readProfile.save_count}
                  <span className="sr-only">saves</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {readProfile.comment_count}
                  <span className="sr-only">comments</span>
                </span>
                <Share2 className="h-4 w-4" aria-hidden="true" />

                {/* A contagem de votos é a prova de que o índice funciona —
                    fica à direita, onde fecha a linha. */}
                <span className="ml-auto text-sm text-phindex-teal">
                  {readProfile.vote_count}{" "}
                  {readProfile.vote_count === 1 ? "vote" : "votes"}
                </span>
              </div>
            </div>
          </article>
        )}
      </section>

      {/* ── 2. GET READ ───────────────────────────────────────────────── */}
      <section>
        <ColumnHeading>Get read</ColumnHeading>
        <ColumnText>
          Post your photo, get insights and see how others perceive your
          phenotype.
        </ColumnText>

        {/* Esta coluna é a única que não pode mostrar dado real: o resultado
            pertence a quem ainda não entrou. Então ela mostra a FORMA do
            resultado — o que a pessoa vai receber — e o botão que leva lá. */}
        <div className="rounded-xl border border-border/70 bg-card p-3 shadow-card">
          <div className="flex gap-3">
            <div className="relative w-[38%] shrink-0 overflow-hidden rounded-lg bg-muted">
              {isLoading || !gameProfile ? (
                <div className="aspect-[3/4] w-full animate-pulse bg-muted" />
              ) : (
                <img
                  src={gameProfile.front_image_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/4] w-full object-cover grayscale contrast-[1.1]"
                />
              )}
              <span
                className="pointer-events-none absolute inset-0 bg-phindex-teal mix-blend-color"
                aria-hidden="true"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground">
                Your phenotype
              </h3>
              {/* Exemplo do formato do laudo, marcado como exemplo para não se
                  passar por resultado de ninguém. */}
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span> Geographic origin
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span> Phenotype group
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span> Trait-by-trait votes
                </li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground/80">
                Example of what you receive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onJoin}
            className={cn(
              "group mt-3 flex w-full items-center justify-between rounded-lg px-1 py-2",
              "text-sm font-medium text-phindex-teal",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <span className="underline underline-offset-4">Post your photo</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-phindex-teal text-primary-foreground transition-transform duration-300 ease-out group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        </div>
      </section>

      {/* ── 3. PLAY THE GAME ──────────────────────────────────────────── */}
      <section>
        <ColumnHeading>Play the game</ColumnHeading>
        <ColumnText>
          Guess the phenotype. Compare with others. See how you score.
        </ColumnText>

        {isLoading || !gameProfile ? (
          <CardSkeleton />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-card">
            <div className="relative">
              <img
                src={gameProfile.front_image_url}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[16/9] w-full object-cover object-center grayscale contrast-[1.2]"
              />
              <span
                className="pointer-events-none absolute inset-0 bg-phindex-dark mix-blend-color"
                aria-hidden="true"
              />
              <span className="absolute right-2 top-2 rounded-md bg-background/95 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Round 1/5
              </span>
            </div>

            <div className="p-3">
              <p className="text-sm font-medium text-foreground">
                What phenotype is this person?
              </p>
              {/* As alternativas são as regiões reais do índice, na mesma
                  ordem do jogo. */}
              <ul className="mt-2.5 space-y-1.5">
                {["European", "Asian", "African", "Indigenous"].map((option, index) => (
                  <li
                    key={option}
                    className="flex items-center gap-2.5 rounded-full border border-border/70 px-2.5 py-1.5 text-sm text-muted-foreground"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </li>
                ))}
              </ul>

              <Link
                to="/game"
                className={cn(
                  "group mt-3 flex items-center justify-between rounded-lg px-1 py-2",
                  "text-sm font-medium text-phindex-teal",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <span className="underline underline-offset-4">Start a round</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-phindex-teal text-primary-foreground transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── 4. COMMUNITY ACTIVITY ─────────────────────────────────────── */}
      <section className="lg:border-l lg:border-border/70 lg:pl-8">
        <ColumnHeading>Community activity</ColumnHeading>

        {isLoading && comments.length === 0 ? (
          <ul className="space-y-0">
            {Array.from({ length: 5 }).map((_, index) => (
              <li
                key={index}
                className="flex items-center gap-3 border-b border-border/60 py-3 last:border-b-0"
              >
                <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
                <span className="flex-1 space-y-1.5">
                  <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
                  <span className="block h-2.5 w-32 animate-pulse rounded bg-muted" />
                </span>
              </li>
            ))}
          </ul>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activity yet. Be the first to classify a face.
          </p>
        ) : (
          <ul>
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="border-b border-border/60 last:border-b-0"
              >
                <Link
                  to={`/profile/${comment.profileSlug}`}
                  className={cn(
                    "flex items-center gap-3 py-3",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                    {initials(comment.nickname)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {comment.nickname}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      commented on {comment.profileName}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(comment.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

/** Silhueta de card, usada enquanto os perfis carregam. */
const CardSkeleton = () => (
  <div
    className="overflow-hidden rounded-xl border border-border/70 bg-card"
    aria-hidden="true"
  >
    <div className="flex items-center gap-2.5 p-3">
      <span className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      <span className="space-y-1.5">
        <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
        <span className="block h-2.5 w-16 animate-pulse rounded bg-muted" />
      </span>
    </div>
    <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
    <div className="space-y-2 p-3">
      <span className="block h-3 w-2/3 animate-pulse rounded bg-muted" />
      <span className="block h-3 w-1/3 animate-pulse rounded bg-muted" />
    </div>
  </div>
);

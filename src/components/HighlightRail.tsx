/**
 * TRILHO DE DESTAQUES (HighlightRail.tsx)
 *
 * Faixa horizontal no topo da home. Cada card responde a três perguntas de uma
 * vez: quem é, como a comunidade classificou, e quão firme foi essa
 * classificação — o consenso é o que separa um rosto óbvio de um controverso,
 * e é justamente o controverso que merece um voto novo.
 *
 * Usa scroll-snap nativo em vez de um carrossel controlado por JS: rola com
 * gesto, trackpad, teclado e barra de rolagem sem código extra.
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { FeedProfile } from "@/hooks/use-profile-feed";

interface HighlightRailProps {
  title: string;
  description: string;
  profiles: FeedProfile[];
  isLoading?: boolean;
  /** Numera as posições (usado no trilho "mais classificados"). */
  ranked?: boolean;
  /** Destino do link "See all" no canto direito do cabeçalho. */
  seeAllPath?: string;
  action?: React.ReactNode;
}

export const HighlightRail = ({
  title,
  description,
  profiles,
  isLoading = false,
  ranked = false,
  seeAllPath,
  action,
}: HighlightRailProps) => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /** Mantém as setas em sincronia com a posição real do scroll. */
  const syncArrows = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    setCanScrollLeft(node.scrollLeft > 8);
    setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 8);
  }, []);

  useEffect(() => {
    syncArrows();
    const node = scrollerRef.current;
    if (!node) return;

    node.addEventListener("scroll", syncArrows, { passive: true });
    // O conteúdo muda de largura quando os perfis chegam.
    const observer = new ResizeObserver(syncArrows);
    observer.observe(node);

    return () => {
      node.removeEventListener("scroll", syncArrows);
      observer.disconnect();
    };
  }, [syncArrows, profiles.length]);

  const scrollBy = (direction: 1 | -1) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  };

  // Não ocupa espaço quando a seção está vazia e já terminou de carregar.
  if (!isLoading && profiles.length === 0) return null;

  const railId = `rail-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className="pb-6" aria-labelledby={railId}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2
            id={railId}
            className="text-[26px] font-semibold leading-tight tracking-tight text-foreground"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {action}
          {seeAllPath && (
            <button
              type="button"
              onClick={() => navigate(seeAllPath)}
              className="group/all inline-flex items-center gap-1 rounded-full text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              See all
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/all:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* O trilho sangra para além da margem direita da coluna: um card cortado
          na borda da tela lê como "continua", enquanto um card cortado a meio
          caminho do painel lateral lê como bug. O padding devolve o respiro no
          fim da rolagem. */}
      <div className="group/rail relative -mr-4 lg:-mr-6">
        {/* Esmaecimento na borda direita: o corte do último card passa a ler
            como "continua", em vez de parecer um card quebrado. Só aparece
            quando ainda há para onde rolar. */}
        {canScrollRight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background via-background/80 to-transparent"
          />
        )}

        <div
          ref={scrollerRef}
          className={cn(
            "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 pr-4 lg:pr-6",
            // Esconde a barra sem perder a rolagem por gesto.
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="w-[184px] shrink-0 snap-start"
                  aria-hidden="true"
                >
                  <div className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
                  <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-1.5 w-full animate-pulse rounded-full bg-muted" />
                </div>
              ))
            : profiles.map((profile, index) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => navigate(`/user-profile/${profile.slug}`)}
                  className={cn(
                    "w-[184px] shrink-0 snap-start text-left",
                    "rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-muted">
                    <img
                      src={profile.front_image_url}
                      alt={profile.name}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-500 ease-out motion-safe:hover:scale-[1.04]"
                      onError={(event) => {
                        (event.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />

                    {ranked && (
                      <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-card/95 text-[13px] font-semibold tabular-nums text-foreground shadow-sm ring-1 ring-inset ring-border/60 backdrop-blur-sm">
                        {index + 1}
                      </span>
                    )}

                    {/* Véu curto: só o suficiente para o chip ler sobre a foto. */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent"
                    />

                    {profile.most_voted_phenotype && (
                      <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
                        {profile.most_voted_phenotype}
                      </span>
                    )}
                  </div>

                  <h3
                    className="mt-3 truncate text-[15px] font-semibold text-foreground"
                    title={profile.name}
                  >
                    {profile.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {profile.most_voted_geographic && (
                      <>
                        {profile.most_voted_geographic}
                        <span aria-hidden="true"> · </span>
                      </>
                    )}
                    {profile.vote_count} {profile.vote_count === 1 ? "vote" : "votes"}
                  </p>

                  {/* Consenso: barra + número. A barra dá a leitura periférica,
                      o número dá o valor exato — sozinha, a barra seria só
                      decoração. Sem votos de fenótipo não há o que medir. */}
                  {profile.agreement !== null && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                        role="img"
                        aria-label={`${profile.agreement}% agreement on the top phenotype`}
                      >
                        <span
                          className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                          style={{ width: `${profile.agreement}%` }}
                        />
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                        {profile.agreement}% agree
                      </span>
                    </div>
                  )}
                </button>
              ))}
        </div>

        {/* Setas: aparecem no hover em telas com ponteiro, e só quando há para onde rolar. */}
        {canScrollLeft && (
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollBy(-1)}
            className="absolute -left-3 top-[38%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card/95 text-foreground opacity-0 shadow-md backdrop-blur transition-opacity duration-200 hover:bg-card focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/rail:opacity-100 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scrollBy(1)}
            className="absolute right-2 top-[38%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card/95 text-foreground opacity-0 shadow-md backdrop-blur transition-opacity duration-200 hover:bg-card focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/rail:opacity-100 md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
};

/**
 * TRILHO DE DESTAQUES (HighlightRail.tsx)
 *
 * Faixa horizontal compacta no topo da home. Preserva a leitura rápida de
 * "quem está em alta" que os carrosséis antigos davam, sem competir com o
 * feed vertical que vem abaixo.
 *
 * Usa scroll-snap nativo em vez de um carrossel controlado por JS: rola com
 * gesto, trackpad, teclado e barra de rolagem sem código extra.
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Vote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { FeedProfile } from "@/hooks/use-profile-feed";

interface HighlightRailProps {
  title: string;
  description: string;
  profiles: FeedProfile[];
  isLoading?: boolean;
  /** Numera as três primeiras posições (usado no trilho "mais votados"). */
  ranked?: boolean;
  action?: React.ReactNode;
}

export const HighlightRail = ({
  title,
  description,
  profiles,
  isLoading = false,
  ranked = false,
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

  return (
    <section className="py-6" aria-labelledby={`rail-${title.replace(/\s+/g, "-").toLowerCase()}`}>
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div className="min-w-0">
          <h2
            id={`rail-${title.replace(/\s+/g, "-").toLowerCase()}`}
            className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>

      <div className="group/rail relative">
        <div
          ref={scrollerRef}
          className={cn(
            "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2",
            // Esconde a barra sem perder a rolagem por gesto.
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="w-32 shrink-0 snap-start sm:w-36"
                  aria-hidden="true"
                >
                  <div className="aspect-square animate-pulse rounded-xl bg-muted" />
                  <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              ))
            : profiles.map((profile, index) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => navigate(`/user-profile/${profile.slug}`)}
                  className={cn(
                    "w-32 shrink-0 snap-start text-left sm:w-36",
                    "rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <div className="relative overflow-hidden rounded-xl bg-muted">
                    <img
                      src={profile.front_image_url}
                      alt={profile.name}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover/rail:scale-100 motion-safe:hover:scale-[1.06]"
                      onError={(event) => {
                        (event.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />

                    {ranked && index < 3 && (
                      <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
                        {index + 1}
                      </div>
                    )}

                    {profile.vote_count > 0 && (
                      <div className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-white backdrop-blur-sm">
                        <Vote className="h-3 w-3" />
                        <span className="text-xs tabular-nums">{profile.vote_count}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="mt-2 truncate text-sm font-medium text-foreground" title={profile.name}>
                    {profile.name}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.most_voted_phenotype || profile.category}
                  </p>
                </button>
              ))}
        </div>

        {/* Setas: aparecem no hover em telas com ponteiro, e só quando há para onde rolar. */}
        {canScrollLeft && (
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground opacity-0 shadow-md backdrop-blur transition-opacity duration-200 hover:bg-card focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/rail:opacity-100 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground opacity-0 shadow-md backdrop-blur transition-opacity duration-200 hover:bg-card focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/rail:opacity-100 md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
};

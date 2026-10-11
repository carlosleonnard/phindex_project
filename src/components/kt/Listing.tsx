/**
 * PEÇAS DAS PÁGINAS DE LISTAGEM (Listing.tsx)
 *
 * Categoria, região, explore e salvos mostram o mesmo tipo de grade. O que é
 * comum fica aqui: a ordenação, os chips, a paginação em cápsula, a figura de
 * distribuição por região e o estado vazio.
 */

import type { ReactNode } from "react";
import type { FeedProfile } from "@/hooks/use-profile-feed";
import { CONTINENT_ORDER, continentOf, type Continent } from "@/constants/regions";
import { StackedBar } from "./Meters";
import { REGION_HEX } from "./Misc";
import { ArrowLinkInner } from "./Centromere";
import { cn } from "@/lib/utils";

export type ListingSort = "popular" | "recent" | "needs-votes";

export const LISTING_SORTS: Array<{ value: ListingSort; label: string }> = [
  { value: "popular", label: "Most voted" },
  { value: "recent", label: "Recent" },
  { value: "needs-votes", label: "Needs votes" },
];

export const SORT_LABEL: Record<ListingSort, string> = {
  popular: "most voted",
  recent: "most recent",
  "needs-votes": "fewest votes",
};

const byNewest = (a: FeedProfile, b: FeedProfile) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

export const sortListing = (list: FeedProfile[], sort: ListingSort): FeedProfile[] => {
  if (sort === "recent") return [...list].sort(byNewest);
  if (sort === "needs-votes") return [...list].sort((a, b) => a.vote_count - b.vote_count || byNewest(a, b));
  return [...list].sort((a, b) => b.vote_count - a.vote_count || byNewest(a, b));
};

/** Chip em cápsula; o ativo vira tinta. */
export const chipClass = (active: boolean, extra?: string) =>
  cn(
    "inline-flex min-h-10 items-center gap-2 rounded-full px-4 font-[inherit] text-[16px] no-underline transition-colors",
    active
      ? "border-[1.5px] border-kt-ink bg-kt-ink text-kt-paper hover:text-kt-paper"
      : "border border-kt-rule bg-white text-kt-slate hover:border-kt-b50 hover:bg-kt-wash hover:text-kt-ink",
    extra
  );

/** Grade de cartões: colunas de no mínimo 220px. */
export const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-5";

export const GridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className={GRID_CLASS} aria-hidden="true">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="aspect-[3/4] animate-pulse rounded-[3px] bg-kt-wash" />
    ))}
  </div>
);

/** Estado vazio: folha lavada com borda tracejada. */
export const EmptySheet = ({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) => (
  <div className={cn("rounded-[3px] border-[1.5px] border-dashed border-kt-b50 bg-kt-wash px-6 py-10 text-center", className)}>
    <h2 className="m-0 text-[24px] font-medium text-kt-ink">{title}</h2>
    {children && <p className="mx-auto mb-0 mt-1.5 max-w-[46ch] text-[16px] text-kt-body">{children}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

/**
 * Distribuição por região dos perfis dados, segundo o voto geográfico.
 * Só conta quem já foi classificado: a legenda diz "onde a comunidade os põe".
 */
export const RegionShareFigure = ({ profiles, caption }: { profiles: FeedProfile[]; caption: string }) => {
  const counts = new Map<Continent, number>();
  profiles.forEach((profile) => {
    const continent = continentOf(profile.most_voted_geographic);
    if (continent) counts.set(continent, (counts.get(continent) || 0) + 1);
  });
  const placed = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const rows = CONTINENT_ORDER.map((continent) => ({
    continent,
    pct: placed > 0 ? ((counts.get(continent) || 0) / placed) * 100 : 0,
  }))
    .filter((row) => row.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  return (
    <figure className="m-0 min-w-0 flex-[0_1_400px]">
      <figcaption className="flex justify-between gap-3 font-sc text-[14px] tracking-[0.06em] text-kt-body">
        <span>{caption}</span>
        <span className="text-kt-ink">{placed}</span>
      </figcaption>
      {rows.length > 0 ? (
        <>
          <StackedBar
            slices={rows.map((row) => ({ pct: row.pct, color: REGION_HEX[row.continent] }))}
            height={16}
            className="mt-[9px]"
          />
          <ul className="m-0 mt-2.5 grid list-none grid-cols-2 gap-x-3.5 gap-y-1 p-0 text-[14px] text-kt-slate min-[480px]:grid-cols-3">
            {rows.map((row) => (
              <li key={row.continent} className="flex items-center gap-[7px]">
                <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: REGION_HEX[row.continent] }} />
                {row.continent} {Math.round(row.pct)}%
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mb-0 mt-2 text-[15px] italic text-kt-body">No region votes yet.</p>
      )}
    </figure>
  );
};

/** Paginação em cápsula: anterior · 1 2 3 … · próxima. */
export const Pagination = ({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) => {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === pageCount || Math.abs(value - page) <= 1
  );

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-between gap-3.5">
      <p className="m-0 text-[15px] text-kt-body">
        Page {page} of {pageCount}
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="min-h-[42px] border-0 bg-transparent px-1.5 font-[inherit] text-[16px] text-kt-teal hover:text-kt-ink disabled:text-kt-b50"
        >
          previous
        </button>
        <div className="flex overflow-hidden rounded-full border-[1.5px] border-kt-ink">
          {pages.map((value, index) => {
            const gap = index > 0 && value - pages[index - 1] > 1;
            const active = value === page;
            return (
              <span key={value} className="flex">
                {gap && (
                  <span
                    aria-hidden="true"
                    className="flex h-[39px] min-w-[32px] items-center justify-center border-l border-kt-rule bg-white text-kt-body"
                  >
                    …
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Page ${value}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onChange(value)}
                  className={cn(
                    "h-[39px] min-w-[42px] border-0 px-2 font-[inherit] text-[16px] transition-colors",
                    index > 0 && "border-l border-kt-rule",
                    active
                      ? "bg-kt-ink text-kt-paper"
                      : cn(index % 2 ? "bg-kt-wash" : "bg-white", "text-kt-slate hover:bg-kt-seg")
                  )}
                >
                  {value}
                </button>
              </span>
            );
          })}
        </div>
        <button
          type="button"
          disabled={page === pageCount}
          onClick={() => onChange(page + 1)}
          className="group inline-flex min-h-[42px] items-center gap-1.5 border-0 bg-transparent px-1.5 font-[inherit] text-[16px] text-kt-teal hover:text-kt-ink disabled:text-kt-b50"
        >
          <ArrowLinkInner size={16}>next</ArrowLinkInner>
        </button>
      </div>
    </nav>
  );
};

/** Botão de "mostrar mais" em cápsula vazada. */
export const ShowMoreButton = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <div className="mt-7 flex justify-center">
    <button
      type="button"
      onClick={onClick}
      className="min-h-[46px] rounded-full border-[1.5px] border-kt-teal bg-transparent px-6 font-[inherit] text-[17px] text-kt-teal transition-colors hover:bg-kt-teal/[0.06]"
    >
      {children}
    </button>
  </div>
);

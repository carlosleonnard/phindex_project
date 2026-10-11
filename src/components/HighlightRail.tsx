/**
 * TRILHO DE DESTAQUES (HighlightRail.tsx)
 *
 * Faixa horizontal de retratos no topo da home. Cada item diz quem é, em que
 * posição está, a categoria, quantos votos tem e — no medidor fino — quão firme
 * é a leitura da comunidade.
 *
 * Rola com gesto, trackpad e teclado (scroll-snap nativo, sem carrossel em JS).
 */

import { Link } from "react-router-dom";
import type { FeedProfile } from "@/hooks/use-profile-feed";
import { FacePhoto } from "@/components/kt/Misc";

interface HighlightRailProps {
  title: string;
  description: string;
  profiles: FeedProfile[];
  isLoading?: boolean;
  /** Numera as posições. */
  ranked?: boolean;
  seeAllPath?: string;
}

const categoryLabel = (profile: FeedProfile) =>
  (profile.category === "User Profiles" ? "community" : profile.subcategory || profile.category || "").toLowerCase();

export const HighlightRail = ({
  title,
  description,
  profiles,
  isLoading = false,
  ranked = false,
  seeAllPath,
}: HighlightRailProps) => {
  if (!isLoading && profiles.length === 0) return null;

  const railId = `rail-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section aria-labelledby={railId} className="mt-10">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h2 id={railId} className="m-0 text-[28px] font-medium leading-[1.15] text-kt-ink">
            {title}
          </h2>
          <p className="mb-0 mt-0.5 text-[16px] italic text-kt-body">{description}</p>
        </div>
        {seeAllPath && (
          <Link to={seeAllPath} className="whitespace-nowrap text-[16px] text-kt-teal">
            see all
          </Link>
        )}
      </div>

      <ol className="m-0 flex snap-x snap-mandatory list-none gap-[18px] overflow-x-auto p-0 pb-2.5 [scrollbar-width:thin]">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <li key={index} aria-hidden="true" className="w-[164px] shrink-0">
                <div className="aspect-[3/4] animate-pulse rounded-[3px] bg-kt-wash" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded-[3px] bg-kt-wash" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded-[3px] bg-kt-wash" />
              </li>
            ))
          : profiles.map((profile, index) => (
              <li key={profile.id} className="w-[164px] shrink-0 snap-start">
                <Link to={`/user-profile/${profile.slug}`} className="block text-kt-ink no-underline">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[3px] bg-kt-wash">
                    <FacePhoto src={profile.front_image_url} alt={profile.name} />
                  </div>
                  <div className="mt-2.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5">
                    {ranked && (
                      <span className="row-span-3 text-[34px] italic leading-[0.9] text-kt-teal">{index + 1}</span>
                    )}
                    <span className="truncate text-[17px] leading-[1.25]">{profile.name}</span>
                    <span className="truncate font-sc text-[13px] tracking-[0.05em] text-kt-body">
                      {categoryLabel(profile)} · {profile.vote_count} {profile.vote_count === 1 ? "vote" : "votes"}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-1.5 block h-1.5 box-border rounded-full border border-kt-ink"
                      style={{
                        background: `linear-gradient(90deg,#192A43 0 ${profile.agreement ?? 0}%,#FFFFFF 0)`,
                      }}
                    />
                  </div>
                </Link>
              </li>
            ))}
      </ol>
    </section>
  );
};

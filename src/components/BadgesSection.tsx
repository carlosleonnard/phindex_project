/**
 * INSÍGNIAS NAS CONFIGURAÇÕES (BadgesSection.tsx)
 *
 * As quatro trilhas do usuário logado, no mesmo desenho da página de membro.
 * Ao abrir, pede ao banco para recalcular as estatísticas e conceder o que
 * estiver pendente (check_and_award_badges).
 */

import { useEffect } from "react";
import { useBadges, CATEGORY_LABELS } from "@/hooks/use-badges";
import { BADGE_TRACKS, BadgeTrack } from "@/components/kt/BadgeTrack";

export const BadgesSection = () => {
  const { badgesByCategory, earnedBadgeIds, userStats, refreshBadges, isLoading } = useBadges();

  useEffect(() => {
    refreshBadges.mutate();
    // Uma vez por visita; a mutação invalida as consultas quando termina.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalEarned = earnedBadgeIds.size;
  const totalBadges = Object.values(badgesByCategory).flat().length;

  return (
    <section aria-labelledby="badges-title" className="rounded-[3px] border border-kt-rule bg-white p-[clamp(18px,3vw,32px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5">
        <h2 id="badges-title" className="m-0 text-[30px] font-medium leading-[1.15] text-kt-ink">
          Badges
        </h2>
        <span className="text-[15px] italic text-kt-body">
          {isLoading ? "four tracks, ten levels each" : `${totalEarned} of ${totalBadges} earned`}
        </span>
      </div>
      {isLoading ? (
        <div className="mt-[18px] space-y-3" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-[74px] animate-pulse rounded-[3px] bg-kt-wash" />
          ))}
        </div>
      ) : (
        <div className="mt-[18px] border-b border-kt-rule">
          {BADGE_TRACKS.map((track) => {
            const definitions = badgesByCategory[track.category] || [];
            const level = definitions
              .filter((badge) => earnedBadgeIds.has(badge.id))
              .reduce((max, badge) => Math.max(max, badge.level), 0);
            return (
              <BadgeTrack
                key={track.category}
                label={CATEGORY_LABELS[track.category]}
                level={level}
                stat={userStats ? userStats[track.statKey] ?? 0 : null}
                unit={track.unit}
                thresholds={definitions.map((badge) => ({ level: badge.level, threshold: badge.threshold }))}
              />
            );
          })}
        </div>
      )}
      <p className="mb-0 mt-3 text-[15px] text-kt-body">
        Ink bands are earned levels; the teal sliver is progress toward the next one.
      </p>
    </section>
  );
};

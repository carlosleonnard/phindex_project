/**
 * PÁGINA DE MEMBRO (MemberProfile.tsx)
 *
 * Cabeçalho com apelido, "membro desde", posição no ranking e três números;
 * as insígnias como quatro cromossomos de dez faixas (níveis conquistados em
 * tinta, a fatia teal é o progresso até o próximo); atividade recente; o
 * cartão escuro do jogo e os rostos que o membro adicionou.
 */

import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { AppLayout, Crumbs } from "@/components/AppLayout";
import { CenLink } from "@/components/kt/Centromere";
import { FacePhoto, InitialsAvatar, SC, timeAgo } from "@/components/kt/Misc";
import { EmptySheet } from "@/components/kt/Listing";
import { KT, bandSeparators } from "@/components/kt/bands";
import { useMemberData, type MemberGame } from "@/hooks/use-member-data";
import { useLeaderboardData } from "@/hooks/use-leaderboard";
import { useIndexProfiles } from "@/hooks/use-index";
import { LEVELS, type Difficulty } from "@/hooks/use-map-game";
import { CATEGORY_LABELS, LEVEL_NAMES, type BadgeCategory } from "@/hooks/use-badges";
import { BADGE_TRACKS, BadgeTrack } from "@/components/kt/BadgeTrack";

/** Tons do jogo sobre fundo escuro: 80%+ · 60–79 · 40–59 · abaixo. */
const darkShade = (pct: number) => (pct >= 80 ? KT.wash : pct >= 60 ? KT.glow : pct >= 40 ? "#1E6370" : "#16454D");

const darkFormBands = (games: MemberGame[]) => {
  const recent = games.slice(-10);
  const stops = Array.from({ length: 10 }, (_, band) => {
    const game = recent[band];
    const color = game ? darkShade(game.total_questions ? (game.score / game.total_questions) * 100 : 0) : "transparent";
    return `${color} 0 ${(band + 1) * 10}%`;
  });
  return `${bandSeparators(10, KT.deep)},linear-gradient(90deg,${stops.join(",")})`;
};

const scoreBar = (score: number, total: number) => {
  const width = (100 / Math.max(1, total)).toFixed(3);
  const filled = (score / Math.max(1, total)) * 100;
  return `repeating-linear-gradient(90deg,transparent 0 calc(${width}% - 1px),${KT.sheet} calc(${width}% - 1px) ${width}%),linear-gradient(90deg,${KT.ink} 0 ${filled}%,${KT.b50} 0 100%)`;
};

const LEVEL_LABEL: Record<string, string> = Object.fromEntries(
  (Object.keys(LEVELS) as Difficulty[]).map((key) => [key, LEVELS[key].name.toLowerCase()])
);

type Activity = { id: string; at: string; body: React.ReactNode };

const MemberProfile = () => {
  const { userId = "" } = useParams<{ userId: string }>();
  const { profile, stats, badges, thresholds, recentComments, likesTotal, recentLikes, games, isLoading } =
    useMemberData(userId);
  const { data: week = [] } = useLeaderboardData("week");
  const { data: allTime = [] } = useLeaderboardData("all");
  const { profiles } = useIndexProfiles();

  const added = useMemo(
    () =>
      profiles
        .filter((item) => item.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [profiles, userId]
  );

  const weekRank = week.find((entry) => entry.userId === userId)?.rank;
  const allRank = allTime.find((entry) => entry.userId === userId)?.rank;
  const rankLabel = weekRank ? `#${weekRank} this week` : allRank ? `#${allRank} all time` : null;

  const levelOf = (category: string) =>
    badges.filter((item) => item.badge?.category === category).reduce((max, item) => Math.max(max, item.badge.level), 0);

  const gameTotals = games.reduce(
    (totals, game) => ({ correct: totals.correct + game.score, questions: totals.questions + game.total_questions }),
    { correct: 0, questions: 0 }
  );
  const accuracy = gameTotals.questions ? Math.round((gameTotals.correct / gameTotals.questions) * 100) : null;

  const activity: Activity[] = useMemo(() => {
    const items: Activity[] = [];
    recentComments.forEach((comment) => {
      const excerpt = comment.content.length > 140 ? `${comment.content.slice(0, 137).trimEnd()}…` : comment.content;
      items.push({
        id: `c-${comment.id}`,
        at: comment.created_at,
        body: (
          <>
            Commented on{" "}
            {comment.profileSlug ? (
              <Link to={`/user-profile/${comment.profileSlug}`} className="text-kt-ink">
                {comment.profileName}
              </Link>
            ) : (
              "a profile"
            )}
            : <em className="text-kt-slate">“{excerpt}”</em>
          </>
        ),
      });
    });
    games
      .slice(-5)
      .forEach((game, index) =>
        items.push({
          id: `g-${game.created_at}-${index}`,
          at: game.created_at,
          body: (
            <>
              Played <Link to="/game" className="text-kt-ink">Guess the phenotype</Link>
              {game.difficulty && LEVEL_LABEL[game.difficulty] ? ` · ${LEVEL_LABEL[game.difficulty]}` : ""} · {game.score} of{" "}
              {game.total_questions}
              <span
                aria-hidden="true"
                className="ml-1.5 inline-block h-[9px] w-[60px] rounded-full border border-kt-ink align-middle"
                style={{ background: scoreBar(game.score, game.total_questions) }}
              />
            </>
          ),
        })
      );
    recentLikes.forEach((like) =>
      items.push({
        id: `l-${like.id}`,
        at: like.created_at,
        body: like.likerNickname ? (
          <>
            A comment was liked by <strong className="font-semibold">{like.likerNickname}</strong>
          </>
        ) : (
          "A comment was liked"
        ),
      })
    );
    badges.slice(0, 5).forEach((item) => {
      if (!item.badge) return;
      const track = CATEGORY_LABELS[item.badge.category as BadgeCategory] ?? item.badge.category;
      items.push({
        id: `b-${item.badge_id}`,
        at: item.earned_at,
        body: (
          <>
            Earned <strong className="font-semibold">{LEVEL_NAMES[item.badge.level] ?? item.badge.name}</strong> in{" "}
            {track.toLowerCase()}
          </>
        ),
      });
    });
    added.slice(0, 5).forEach((face) =>
      items.push({
        id: `f-${face.id}`,
        at: face.created_at,
        body: (
          <>
            Added a face:{" "}
            <Link to={`/user-profile/${face.slug}`} className="text-kt-ink">
              {face.name}
            </Link>
          </>
        ),
      })
    );
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8);
  }, [recentComments, games, recentLikes, badges, added]);

  if (isLoading) {
    return (
      <AppLayout>
        <div aria-busy="true" className="space-y-4">
          <div className="h-24 animate-pulse rounded-[3px] bg-kt-wash" />
          <div className="h-64 animate-pulse rounded-[3px] bg-kt-wash" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <EmptySheet title="Member not found" action={<CenLink to="/leaderboard" size="sm">see the leaderboard</CenLink>}>
          This member may have left Phindex, or the link is wrong.
        </EmptySheet>
      </AppLayout>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase();
  const nickname = profile.nickname || "member";

  return (
    <AppLayout>
      <Helmet>
        <title>{`${nickname} | Phindex member`}</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <Crumbs items={[{ label: "Leaderboard", to: "/leaderboard" }, { label: nickname }]} />

      <div className="mt-[22px] flex flex-wrap items-center gap-x-7 gap-y-5 border-b-[1.5px] border-kt-ink pb-7">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-24 w-24 shrink-0 rounded-full object-cover" />
        ) : (
          <InitialsAvatar name={nickname} size={96} dark />
        )}
        <div className="min-w-0 flex-[1_1_300px]">
          <SC as="p" className="m-0 text-[15px] text-kt-teal">
            member since {memberSince}
            {rankLabel ? ` · ${rankLabel}` : ""}
          </SC>
          <h1 className="mb-0 mt-0.5 break-words text-[clamp(46px,5.4vw,76px)] font-medium leading-[0.95] tracking-[-0.025em] text-kt-ink">
            {nickname}
          </h1>
        </div>
        <dl className="m-0 flex flex-wrap gap-x-8 gap-y-3">
          {[
            { label: "comments", value: stats?.total_comments ?? recentComments.length },
            { label: "badges", value: badges.length },
            { label: "likes received", value: likesTotal },
          ].map((item) => (
            <div key={item.label}>
              <SC as="dt" className="text-[13px] text-kt-body">
                {item.label}
              </SC>
              <dd className="m-0 text-[30px] leading-[1.1] text-kt-ink">{item.value.toLocaleString("en-US")}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap items-start gap-x-12 gap-y-10">
        <div className="min-w-0 flex-[999_1_440px]">
          <section aria-labelledby="badges-title">
            <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5">
              <h2 id="badges-title" className="m-0 text-[30px] font-medium leading-[1.15] text-kt-ink">
                Badges
              </h2>
              <span className="text-[15px] italic text-kt-body">four tracks, ten levels each</span>
            </div>
            <div className="mt-[18px] border-b border-kt-rule">
              {BADGE_TRACKS.map((track) => (
                <BadgeTrack
                  key={track.category}
                  label={CATEGORY_LABELS[track.category]}
                  level={levelOf(track.category)}
                  stat={stats ? stats[track.statKey] ?? 0 : null}
                  unit={track.unit}
                  thresholds={thresholds.filter((item) => item.category === track.category)}
                />
              ))}
            </div>
            <p className="mb-0 mt-3 text-[15px] text-kt-body">
              Ink bands and icons are earned levels, the ringed icon is the latest, and the teal sliver is progress toward the next one.
            </p>
          </section>

          <section aria-labelledby="act-title" className="mt-10">
            <h2 id="act-title" className="mb-1.5 mt-0 text-[30px] font-medium leading-[1.15] text-kt-ink">
              Recent activity
            </h2>
            {activity.length === 0 ? (
              <p className="m-0 border-t border-kt-rule pt-3.5 text-[17px] text-kt-body">Nothing yet.</p>
            ) : (
              <ul className="m-0 list-none border-b border-kt-rule p-0">
                {activity.map((item) => (
                  <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3.5 border-t border-kt-rule py-3.5">
                    <p className="m-0 text-[17px] leading-[1.45]">{item.body}</p>
                    <span className="whitespace-nowrap text-[14px] text-kt-body">{timeAgo(item.at, true)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 max-w-[330px] flex-[1_1_280px] flex-col gap-5 max-[859px]:max-w-none">
          <section aria-labelledby="game-card" className="rounded-[3px] bg-kt-deep p-[22px] text-kt-wash">
            <div className="flex items-baseline justify-between gap-2.5">
              <SC as="h2" className="m-0 text-[16px] font-semibold text-kt-b50">
                <span id="game-card">origin game</span>
              </SC>
              {rankLabel && (
                <Link to="/leaderboard" className="text-[15px] text-kt-b50">
                  {rankLabel}
                </Link>
              )}
            </div>
            {accuracy === null ? (
              <p className="mb-0 mt-3.5 text-[17px] text-kt-b50">No games played yet.</p>
            ) : (
              <>
                <p className="mb-0 mt-3.5 text-[54px] leading-none text-kt-paper">{accuracy}%</p>
                <p className="mb-0 mt-1.5 text-[15px] text-kt-b50">
                  {gameTotals.correct} of {gameTotals.questions} correct · {games.length} {games.length === 1 ? "game" : "games"}
                </p>
                <div
                  aria-hidden="true"
                  className="mt-4 box-border h-3 rounded-full border border-kt-b50"
                  style={{ background: darkFormBands(games) }}
                />
                <p className="mb-0 mt-1.5 text-[13px] italic text-kt-b50">last 10 games, newest on the right</p>
              </>
            )}
            <Link
              to="/game"
              className="mt-3.5 inline-flex min-h-11 items-center rounded-full border-[1.5px] border-kt-b50 px-[18px] text-[16px] text-kt-wash no-underline transition-colors hover:bg-white/5 hover:text-kt-paper"
            >
              {accuracy === null ? "play a round" : `challenge ${nickname}`}
            </Link>
          </section>

          <section aria-labelledby="added-title" className="rounded-[3px] border border-kt-rule bg-white p-5">
            <div className="flex items-baseline justify-between gap-2.5">
              <SC as="h2" className="m-0 text-[16px] font-semibold text-kt-ink">
                <span id="added-title">faces added</span>
              </SC>
              <span className="text-[15px] text-kt-body">{added.length}</span>
            </div>
            {added.length === 0 ? (
              <p className="mb-0 mt-2.5 text-[15px] text-kt-body">No faces added yet.</p>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {added.slice(0, 6).map((face) => (
                    <Link
                      key={face.id}
                      to={`/user-profile/${face.slug}`}
                      aria-label={face.name}
                      className="block aspect-square overflow-hidden rounded-[3px] bg-kt-wash"
                    >
                      <FacePhoto src={face.front_image_url} alt="" />
                    </Link>
                  ))}
                </div>
                {added.length > 6 && <p className="mb-0 mt-2.5 text-[15px] text-kt-body">and {added.length - 6} more</p>}
              </>
            )}
          </section>
        </aside>
      </div>
    </AppLayout>
  );
};

export default MemberProfile;

/**
 * RANKING (Leaderboard.tsx)
 *
 * Quem lê rostos como a comunidade lê. Ordem: acertos, depois precisão.
 * Os três primeiros ganham linha grande com a "forma recente" — um cromossomo
 * de dez faixas, uma por partida, no tom da precisão daquela partida. Do 4º
 * ao 10º, tabela. Quem está logado e fora do top 10 aparece numa linha "you".
 */

import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { CenLink } from "@/components/kt/Centromere";
import { SegmentedCapsule } from "@/components/kt/RegionFilter";
import { InitialsAvatar, SC } from "@/components/kt/Misc";
import { Swatch } from "@/components/kt/Meters";
import { EmptySheet } from "@/components/kt/Listing";
import { KT, accuracyShade, bandSeparators } from "@/components/kt/bands";
import { useAuth } from "@/hooks/use-auth";
import { useLeaderboardData, type GameRecord, type LeaderboardEntry, type LeaderboardPeriod } from "@/hooks/use-leaderboard";
import { cn } from "@/lib/utils";

const PERIODS: Array<{ value: LeaderboardPeriod; label: string }> = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

const LEGEND = [
  { color: KT.ink, label: "80% or more" },
  { color: KT.b75, label: "60–79%" },
  { color: KT.b50, label: "40–59%" },
  { color: KT.b25, label: "under 40%" },
];

/** Dez faixas, uma por partida, da mais antiga (esquerda) para a mais recente. */
const formBands = (recent: GameRecord[]) => {
  const stops = Array.from({ length: 10 }, (_, band) => {
    const game = recent[band];
    const color = game ? accuracyShade(game.total ? (game.score / game.total) * 100 : 0) : KT.sheet;
    return `${color} 0 ${(band + 1) * 10}%`;
  });
  return `${bandSeparators(10)},linear-gradient(90deg,${stops.join(",")})`;
};

const FormBar = ({ recent, className }: { recent: GameRecord[]; className?: string }) => (
  <span
    aria-hidden="true"
    className={cn("box-border block rounded-full border border-kt-ink", className)}
    style={{ background: formBands(recent) }}
  />
);

const gamesLine = (entry: LeaderboardEntry) =>
  `${entry.totalGames} ${entry.totalGames === 1 ? "game" : "games"} · ${entry.totalCorrect} of ${entry.totalQuestions} correct`;

export default function Leaderboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const { data: entries = [], isLoading, isError } = useLeaderboardData(period);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3, 10);
  const me = user ? entries.find((entry) => entry.userId === user.id) : undefined;
  const nameOf = (entry: LeaderboardEntry) => (entry.userId === user?.id ? `${entry.nickname} (you)` : entry.nickname);
  const description =
    "See who reads faces the way the community does: the Guess the Phenotype leaderboard, ranked by correct answers this week, this month and all time.";

  return (
    <AppLayout>
      <Helmet>
        <title>Leaderboard | Phindex</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://www.phenotypeindex.com/leaderboard" />
        <meta property="og:title" content="Leaderboard | Phindex" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://www.phenotypeindex.com/leaderboard" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta property="og:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content="Leaderboard | Phindex" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
      </Helmet>

      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
        <div className="min-w-0">
          <SC as="p" className="m-0 text-[16px] text-kt-teal">
            origin game
          </SC>
          <h1 className="mb-0 mt-1 text-[clamp(48px,5.8vw,84px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
            Leaderboard
          </h1>
          <p className="mb-0 mt-3 max-w-[48ch] text-[19px] italic leading-[1.45] text-kt-body">
            Who reads faces the way the community does. Ranked by correct answers; accuracy breaks ties.
          </p>
        </div>
        <SegmentedCapsule options={PERIODS} value={period} onChange={(value) => setPeriod(value)} label="Period" />
      </div>

      {isError ? (
        <EmptySheet className="mt-8" title="Couldn’t load the leaderboard">
          Check your connection and reload the page.
        </EmptySheet>
      ) : isLoading ? (
        <div className="mt-8 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-[110px] animate-pulse rounded-[3px] bg-kt-wash" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptySheet
          className="mt-8"
          title={period === "all" ? "No games played yet" : `No games ${period === "week" ? "this week" : "this month"} yet`}
          action={
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <CenLink to="/game" size="sm">
                play a round
              </CenLink>
              {period !== "all" && (
                <button
                  type="button"
                  onClick={() => setPeriod("all")}
                  className="min-h-11 border-0 bg-transparent px-1 font-[inherit] text-[16px] text-kt-teal underline underline-offset-4 hover:text-kt-ink"
                >
                  see all time
                </button>
              )}
            </div>
          }
        >
          The first finished game puts its player at the top.
        </EmptySheet>
      ) : (
        <>
          <ol className="m-0 mt-8 list-none p-0">
            {podium.map((entry, index) => (
              <li
                key={entry.userId}
                className={cn(
                  "grid grid-cols-[minmax(40px,64px)_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3.5 py-[22px] sm:grid-cols-[minmax(56px,84px)_56px_minmax(0,1fr)_auto] sm:gap-x-6",
                  index === 0 ? "border-t-[1.5px] border-kt-ink" : "border-t border-kt-rule"
                )}
              >
                <span className="text-[56px] italic leading-[0.8] text-kt-teal sm:text-[76px]">{entry.rank}</span>
                <InitialsAvatar name={entry.nickname} size={56} dark={index === 0} className="max-sm:hidden" />
                <div className="min-w-0">
                  <p className="m-0 truncate text-[24px] leading-[1.1] sm:text-[28px]">
                    <Link to={`/member/${entry.userId}`} className="text-kt-ink no-underline hover:underline">
                      {nameOf(entry)}
                    </Link>
                  </p>
                  <p className="mb-0 mt-1 text-[15px] text-kt-body">{gamesLine(entry)}</p>
                  <FormBar recent={entry.recent} className="mt-2.5 h-3 max-w-[340px]" />
                </div>
                <div className="text-right">
                  <p className="m-0 text-[34px] leading-none text-kt-ink sm:text-[46px]">{entry.accuracyPercentage}%</p>
                  <SC as="p" className="mb-0 mt-1 text-[13px] text-kt-body">
                    accuracy
                  </SC>
                </div>
              </li>
            ))}
          </ol>

          {(rest.length > 0 || (me && me.rank > 10)) && (
            <div className="mt-1.5 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-[16px]">
                <caption className="pb-2 pt-[18px] text-left font-sc text-[15px] tracking-[0.06em] text-kt-slate [caption-side:top]">
                  {rest.length > 0 ? "the rest of the top ten" : "your position"}
                </caption>
                <thead>
                  <tr className="border-b-[1.5px] border-kt-ink font-sc text-[13px] tracking-[0.06em] text-kt-body">
                    <th scope="col" className="w-12 py-2 pl-0 pr-3 text-left font-normal">
                      rank
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-normal">
                      player
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-normal">
                      games
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-normal">
                      correct
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-normal">
                      accuracy
                    </th>
                    <th scope="col" className="w-[180px] py-2 pl-3 pr-0 text-left font-normal">
                      last 10 games
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((entry) => (
                    <tr key={entry.userId} className="border-b border-kt-rule">
                      <td className="py-[13px] pl-0 pr-3 text-[19px] italic text-kt-teal">{entry.rank}</td>
                      <th scope="row" className="px-3 py-[13px] text-left font-normal">
                        <Link to={`/member/${entry.userId}`} className="text-kt-ink no-underline hover:underline">
                          {nameOf(entry)}
                        </Link>
                      </th>
                      <td className="px-3 py-[13px] text-right text-kt-body">{entry.totalGames}</td>
                      <td className="px-3 py-[13px] text-right">
                        {entry.totalCorrect} / {entry.totalQuestions}
                      </td>
                      <td className="px-3 py-[13px] text-right">{entry.accuracyPercentage}%</td>
                      <td className="py-[13px] pl-3 pr-0">
                        <FormBar recent={entry.recent} className="h-2.5" />
                      </td>
                    </tr>
                  ))}
                  {me && me.rank > 10 && (
                    <tr aria-label="Your position" className="bg-kt-wash">
                      <td className="rounded-l-full py-[13px] pl-2.5 pr-3 text-[19px] italic text-kt-teal">{me.rank}</td>
                      <th scope="row" className="px-3 py-[13px] text-left font-semibold text-kt-ink">
                        you
                      </th>
                      <td className="px-3 py-[13px] text-right text-kt-body">{me.totalGames}</td>
                      <td className="px-3 py-[13px] text-right">
                        {me.totalCorrect} / {me.totalQuestions}
                      </td>
                      <td className="px-3 py-[13px] text-right">{me.accuracyPercentage}%</td>
                      <td className="rounded-r-full py-[13px] pl-3 pr-2.5">
                        <FormBar recent={me.recent} className="h-2.5" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className="mt-9 flex flex-wrap items-center justify-between gap-x-10 gap-y-5 border-t-[1.5px] border-kt-ink pt-6">
        <div className="min-w-0 flex-[1_1_360px]">
          <div className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[15px] text-kt-slate">
            {LEGEND.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-[7px]">
                <Swatch color={item.color} width={18} height={9} />
                {item.label}
              </span>
            ))}
          </div>
          <p className="mb-0 mt-2.5 text-[15px] text-kt-body">
            Each band is one game, newest on the right; its shade is that game’s accuracy.
          </p>
        </div>
        <CenLink to="/game">{user && !me ? "play to get on the board" : "play to climb"}</CenLink>
      </div>
    </AppLayout>
  );
}

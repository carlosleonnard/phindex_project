/**
 * PREPARAÇÃO DA PARTIDA (GameSetup.tsx)
 *
 * Nível (três cartões, cada um com o cromossomo do tamanho da partida),
 * baralho (todos / famosos / comunidade), o botão de começar e o recorde do
 * jogador. Ao lado, o ranking da semana com a posição de quem está logado.
 */

import { Link } from "react-router-dom";
import { CenButton } from "@/components/kt/Centromere";
import { SegmentedCapsule } from "@/components/kt/RegionFilter";
import { SC } from "@/components/kt/Misc";
import { KT, bandGradient } from "@/components/kt/bands";
import { useLeaderboardData } from "@/hooks/use-leaderboard";
import {
  DECKS,
  LEVELS,
  LEVEL_ORDER,
  type Difficulty,
  type GamePool,
  type GameRecordStats,
} from "@/hooks/use-map-game";
import { cn } from "@/lib/utils";

const DECK_OPTIONS = (Object.keys(DECKS) as GamePool[]).map((value) => ({ value, label: DECKS[value] }));

/** Cromossomo do cartão: uma faixa por rosto, largura proporcional ao tamanho da partida. */
const levelBar = (count: number, active: boolean) => {
  const dark = active ? KT.b50 : KT.b75;
  const light = active ? KT.ink : KT.sheet;
  return bandGradient(Array.from({ length: count }, (_, band) => [band % 2 ? light : dark, ((band + 1) / count) * 100]));
};

export const recordLine = (record: GameRecordStats) =>
  `${record.games} ${record.games === 1 ? "game" : "games"} · ${record.correct} of ${record.questions} correct`;

interface GameSetupProps {
  level: Difficulty;
  onLevel: (level: Difficulty) => void;
  pool: GamePool;
  onPool: (pool: GamePool) => void;
  available: Record<Difficulty, number>;
  isLoading: boolean;
  loggedIn: boolean;
  userId?: string;
  record: GameRecordStats | null;
  onStart: () => void;
}

export const GameSetup = ({
  level,
  onLevel,
  pool,
  onPool,
  available,
  isLoading,
  loggedIn,
  userId,
  record,
  onStart,
}: GameSetupProps) => {
  const { data: week = [], isLoading: weekLoading } = useLeaderboardData("week");
  const faceCount = Math.min(LEVELS[level].count, available[level]);
  const me = userId ? week.find((entry) => entry.userId === userId) : undefined;

  return (
    <div className="flex flex-wrap items-start gap-x-12 gap-y-10">
      <div className="min-w-0 flex-[999_1_520px] motion-safe:animate-rise">
        <SC as="p" className="m-0 text-[16px] text-kt-teal">
          origin game
        </SC>
        <h1 className="mb-0 mt-1 text-[clamp(46px,5.6vw,80px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
          Guess the <em className="text-kt-teal">phenotype.</em>
        </h1>
        <p className="mb-0 mt-3.5 max-w-[52ch] text-[19px] leading-[1.55] text-kt-body">
          Place a face by region, or name its exact classification. The right answer is the one most voters chose.
        </p>

        <SC as="h2" className="mb-3 mt-[34px] text-[16px] font-semibold text-kt-slate">
          level
        </SC>
        <div role="group" aria-label="Level" className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-3">
          {LEVEL_ORDER.map((key) => {
            const info = LEVELS[key];
            const active = key === level;
            const ready = available[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => onLevel(key)}
                className={cn(
                  "box-border flex min-h-[150px] flex-col items-start gap-1.5 rounded-[3px] border-[1.5px] px-[18px] pb-4 pt-[18px] text-left font-[inherit] transition-colors",
                  active ? "border-kt-ink bg-kt-ink text-kt-paper" : "border-kt-rule bg-white text-kt-ink hover:border-kt-b50"
                )}
              >
                <span className={cn("font-sc text-[14px] tracking-[0.06em]", active ? "text-kt-b25" : "text-kt-body")}>
                  {info.label}
                </span>
                <span className="text-[26px] leading-[1.05]">{info.name}</span>
                <span className={cn("text-[15px] leading-[1.35]", active ? "text-kt-b25" : "text-kt-body")}>{info.detail}</span>
                <span
                  aria-hidden="true"
                  className={cn("mt-auto box-border block h-2.5 rounded-full border", active ? "border-kt-b50" : "border-kt-ink")}
                  style={{ width: `${info.count * 10}%`, background: levelBar(info.count, active) }}
                />
                <span className={cn("text-[14px]", active ? "text-kt-b25" : "text-kt-body")}>
                  {isLoading || ready >= info.count ? `${info.count} faces` : ready === 0 ? "no faces ready yet" : `${ready} faces ready`}
                </span>
              </button>
            );
          })}
        </div>

        <SC as="h2" className="mb-3 mt-7 text-[16px] font-semibold text-kt-slate">
          who you’ll see
        </SC>
        <SegmentedCapsule options={DECK_OPTIONS} value={pool} onChange={onPool} label="Who you'll see" />

        <div className="mt-[34px] flex flex-wrap items-center gap-x-7 gap-y-4">
          <CenButton size="lg" onClick={onStart} disabled={loggedIn && (isLoading || faceCount === 0)}>
            {!loggedIn ? "log in to play" : isLoading ? "loading faces…" : `start · ${faceCount} ${faceCount === 1 ? "face" : "faces"}`}
          </CenButton>
          <p className="m-0 text-[16px] text-kt-body">
            {!loggedIn ? (
              "Log in to keep a record and climb the leaderboard."
            ) : record && record.games > 0 ? (
              <>
                Your record · <span className="text-kt-ink">{recordLine(record)}</span> ·{" "}
                <span className="text-kt-ink">{Math.round((record.correct / Math.max(1, record.questions)) * 100)}%</span>
              </>
            ) : (
              "No games yet — your record starts with this one."
            )}
          </p>
        </div>
        {loggedIn && !isLoading && faceCount === 0 && (
          <p className="mb-0 mt-3 text-[15px] italic text-kt-body">
            No {DECKS[pool].toLowerCase() === "everyone" ? "" : `${DECKS[pool].toLowerCase()} `}faces have a clear community answer at
            this level yet. Try another level or deck.
          </p>
        )}
        <p className="mb-0 mt-[22px] max-w-[60ch] border-t border-kt-rule pt-3.5 text-[15px] leading-normal text-kt-body">
          Only faces whose voters agree on a clear answer at the chosen level enter the game. Skipping reveals the answer and
          counts as a miss.
        </p>
      </div>

      <aside
        aria-labelledby="week-title"
        className="min-w-0 max-w-[320px] flex-[1_1_260px] rounded-[3px] border border-kt-rule bg-white p-5 motion-safe:animate-rise max-[859px]:max-w-none"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex items-baseline justify-between gap-2.5">
          <SC as="h2" className="m-0 text-[17px] font-semibold text-kt-ink">
            this week
          </SC>
          <Link to="/leaderboard" className="text-[15px] text-kt-teal">
            leaderboard
          </Link>
        </div>
        {weekLoading ? (
          <div className="mt-3 space-y-2" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-8 animate-pulse rounded-[3px] bg-kt-wash" />
            ))}
          </div>
        ) : week.length === 0 ? (
          <p className="mb-0 mt-3 border-t border-kt-rule pt-3 text-[15px] text-kt-body">
            No games this week yet. Be the first on the board.
          </p>
        ) : (
          <ol className="m-0 mt-2.5 list-none p-0">
            {week.slice(0, 3).map((entry) => (
              <li
                key={entry.userId}
                className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-baseline gap-2.5 border-t border-kt-rule py-2.5"
              >
                <span className="text-[20px] italic leading-none text-kt-teal">{entry.rank}</span>
                <Link to={`/member/${entry.userId}`} className="truncate text-kt-ink no-underline hover:underline">
                  {entry.userId === userId ? "you" : entry.nickname}
                </Link>
                <span className="text-[14px] text-kt-body">{entry.accuracyPercentage}%</span>
              </li>
            ))}
            {me && me.rank > 3 && (
              <li className="mt-1.5 grid grid-cols-[24px_minmax(0,1fr)_auto] items-baseline gap-2.5 rounded-full bg-kt-wash px-3 py-2.5">
                <span className="text-[17px] italic leading-none text-kt-teal">{me.rank}</span>
                <span>you</span>
                <span className="text-[14px] text-kt-body">{me.accuracyPercentage}%</span>
              </li>
            )}
          </ol>
        )}
      </aside>
    </div>
  );
};

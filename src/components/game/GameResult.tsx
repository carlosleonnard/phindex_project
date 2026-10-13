/**
 * RESULTADO (GameResult.tsx)
 *
 * O placar grande, o cromossomo da partida faixa a faixa, as ações (de novo,
 * próximo nível, ranking), o texto para compartilhar, o recorde já com esta
 * partida e a revisão rosto a rosto.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Share2 } from "lucide-react";
import { CenButton, outlineCapsule } from "@/components/kt/Centromere";
import { FacePhoto, SC } from "@/components/kt/Misc";
import { Swatch } from "@/components/kt/Meters";
import {
  DECKS,
  LEVELS,
  NEXT_LEVEL,
  type Difficulty,
  type GameFace,
  type GamePick,
  type GamePool,
  type GameRecordStats,
} from "@/hooks/use-map-game";
import { GameLegend, PICK_COLOR, gameBands, pickColor } from "./shared";
import { recordLine } from "./GameSetup";

interface GameResultProps {
  level: Difficulty;
  pool: GamePool;
  faces: GameFace[];
  picks: GamePick[];
  score: number;
  /** Recorde antes desta partida; null se ainda não havia carregado. */
  baseRecord: GameRecordStats | null;
  onPlayAgain: () => void;
  onLevel: (level: Difficulty) => void;
}

export const GameResult = ({ level, pool, faces, picks, score, baseRecord, onPlayAgain, onLevel }: GameResultProps) => {
  const [copied, setCopied] = useState(false);
  const total = faces.length;
  const info = LEVELS[level];
  const nextLevel = NEXT_LEVEL[level];
  const pct = total ? Math.round((score / total) * 100) : 0;
  const anySkipped = picks.some((pick) => !pick || pick.skip);

  const resultLine =
    score === total
      ? "A perfect read: every face, the way most voters saw it."
      : pct >= 60
        ? `Your eye matched the community on ${pct}% of the faces.`
        : `The community split on several of these. Your eye matched ${pct}% of the time.`;

  const glyphs = faces.map((_, band) => (!picks[band] || picks[band].skip ? "–" : picks[band].correct ? "▮" : "▯")).join("");
  const shareText = `Phindex · Guess the phenotype\n${info.name} · ${score}/${total}   ${glyphs}\nphenotypeindex.com/game`;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const withThisGame: GameRecordStats | null = baseRecord
    ? { games: baseRecord.games + 1, correct: baseRecord.correct + score, questions: baseRecord.questions + total }
    : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="motion-safe:animate-rise">
      <SC as="p" className="m-0 text-[16px] text-kt-teal">
        game complete · {info.name.toLowerCase()} · {DECKS[pool].toLowerCase()}
      </SC>
      <h1 className="mb-0 mt-1 text-[clamp(64px,9vw,128px)] font-medium leading-[0.9] tracking-[-0.03em] text-kt-ink">
        {score} <em className="text-kt-teal">of</em> {total}
      </h1>
      <p className="mb-0 mt-3.5 max-w-[46ch] text-[21px] italic leading-[1.45] text-kt-slate">{resultLine}</p>

      <div className="mt-[30px] max-w-[720px]">
        <div
          role="img"
          aria-label={`Your game: ${score} matched out of ${total}`}
          className="box-border h-[30px] rounded-full border-[1.5px] border-kt-ink"
          style={{ background: gameBands(picks, total, null) }}
        />
        <div className="mt-2 flex justify-between gap-3 text-[13px] italic text-kt-body">
          <span>face 1</span>
          <span className="max-sm:hidden">your game, band by band</span>
          <span>face {total}</span>
        </div>
        <div className="mt-3">
          <GameLegend withSkip={anySkipped} />
        </div>
      </div>

      <div className="mt-[30px] flex flex-wrap items-center gap-x-5 gap-y-3.5">
        <CenButton size="lg" onClick={onPlayAgain}>
          play again
        </CenButton>
        <button type="button" onClick={() => onLevel(nextLevel)} className={outlineCapsule("min-h-14 px-[22px] font-[inherit] text-[18px] max-sm:w-full")}>
          try {LEVELS[nextLevel].name.toLowerCase()} · {LEVELS[nextLevel].count} faces
        </button>
        <Link to="/leaderboard" className="text-[17px] text-kt-teal">
          see the leaderboard
        </Link>
      </div>

      <div className="mt-9 flex flex-wrap gap-x-10 gap-y-5 border-t-[1.5px] border-kt-ink pt-6">
        <div className="min-w-0 flex-[1_1_300px]">
          <SC as="h2" className="m-0 text-[16px] font-semibold text-kt-slate">
            share
          </SC>
          <p className="mb-0 mt-2.5 whitespace-pre-line rounded-[3px] border border-kt-rule bg-white px-4 py-3.5 text-[17px] leading-normal text-kt-ink">
            {shareText}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            <button type="button" onClick={copy} className={outlineCapsule("min-h-11 px-[18px] font-[inherit] text-[16px]")}>
              {copied ? "copied" : "copy result"}
            </button>
            {canShare && (
              <button
                type="button"
                onClick={() => navigator.share({ text: shareText }).catch(() => undefined)}
                className={outlineCapsule("min-h-11 px-[18px] font-[inherit] text-[16px]")}
              >
                <Share2 className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                share
              </button>
            )}
          </div>
          <span className="sr-only" role="status">
            {copied ? "Result copied to the clipboard" : ""}
          </span>
        </div>
        <div className="min-w-0 flex-[1_1_260px]">
          <SC as="h2" className="m-0 text-[16px] font-semibold text-kt-slate">
            your record
          </SC>
          {withThisGame ? (
            <>
              <p className="mb-0 mt-2.5 text-[40px] leading-none text-kt-ink">
                {Math.round((withThisGame.correct / Math.max(1, withThisGame.questions)) * 100)}%
              </p>
              <p className="mb-0 mt-1.5 text-[16px] text-kt-body">{recordLine(withThisGame)} · this game included</p>
            </>
          ) : (
            <>
              <p className="mb-0 mt-2.5 text-[40px] leading-none text-kt-ink">{pct}%</p>
              <p className="mb-0 mt-1.5 text-[16px] text-kt-body">this game</p>
            </>
          )}
        </div>
      </div>

      <section aria-labelledby="review-title" className="mt-9">
        <SC as="h2" className="mb-1.5 mt-0 text-[16px] font-semibold text-kt-slate">
          <span id="review-title">face by face</span>
        </SC>
        <ol className="m-0 list-none p-0">
          {faces.map((face, band) => {
            const pick = picks[band];
            const skipped = !pick || pick.skip;
            const mark = skipped ? "skipped" : pick.correct ? "match" : "differs";
            return (
              <li
                key={face.profile.id}
                className="grid grid-cols-[22px_48px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-3 border-t border-kt-rule py-2.5"
              >
                <span className="text-[16px] italic text-kt-teal">{band + 1}</span>
                <span className="relative block h-12 w-12 overflow-hidden rounded-[3px] bg-kt-wash">
                  <FacePhoto src={face.profile.front_image_url} alt="" width={160} height={200} />
                </span>
                <span className="min-w-0">
                  <Link
                    to={`/user-profile/${face.profile.slug}`}
                    className="block truncate text-[16px] leading-tight text-kt-ink no-underline hover:underline"
                  >
                    {face.profile.name}
                  </Link>
                  <span className="block text-[14px] text-kt-body">
                    you: {skipped ? "skipped" : pick.label} · community: {face.answer} ({face.answerPct}%)
                  </span>
                </span>
                <span className="inline-flex items-center gap-[7px] font-sc text-[14px] tracking-[0.05em] text-kt-slate">
                  <Swatch color={skipped ? PICK_COLOR.skip : pickColor(pick)} width={16} height={8} />
                  {mark}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
};

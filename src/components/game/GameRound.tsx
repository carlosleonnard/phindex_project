/**
 * RODADA (GameRound.tsx)
 *
 * Um rosto, a pergunta do nível e seis alternativas. A revelação é imediata e
 * o avanço é manual: o jogador lê a resposta da comunidade antes de seguir.
 *
 * No celular a rodada vira um modo foco em tela cheia — cabeçalho mínimo com
 * "sair", a foto recortada e a revelação numa folha que sobe do rodapé. No
 * desktop fica dentro do layout, com a foto na moldura de amostra.
 *
 * Teclado: a–f escolhem a alternativa; depois da revelação o foco vai para
 * "próximo rosto", então Enter avança.
 */

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { CenButton } from "@/components/kt/Centromere";
import { FacePhoto, SC } from "@/components/kt/Misc";
import { DECKS, LEVELS, type Difficulty, type GameFace, type GamePick, type GamePool } from "@/hooks/use-map-game";
import { gameBands, pickColor } from "./shared";
import { cn } from "@/lib/utils";

const LETTERS = ["a", "b", "c", "d", "e", "f"];

type OptionState = "idle" | "hit" | "miss" | "answer" | "dim";

const OPTION_CLASS: Record<OptionState, string> = {
  idle: "border-[1.5px] border-kt-rule bg-white text-kt-ink hover:border-kt-teal",
  hit: "border-[1.5px] border-kt-ink bg-kt-ink text-kt-paper",
  miss: "border-[1.5px] border-kt-b50 bg-kt-wash text-kt-body",
  answer: "border-[2.5px] border-kt-teal bg-white text-kt-ink",
  dim: "border-[1.5px] border-kt-seg bg-white text-kt-mute",
};

const LETTER_CLASS: Record<OptionState, string> = {
  idle: "bg-kt-wash text-kt-teal",
  hit: "bg-kt-glow text-kt-deep",
  miss: "bg-white text-kt-body",
  answer: "bg-kt-teal text-white",
  dim: "bg-kt-paper text-kt-b50",
};

interface GameRoundProps {
  level: Difficulty;
  pool: GamePool;
  faces: GameFace[];
  index: number;
  current: GameFace;
  picks: GamePick[];
  picked: number | null;
  score: number;
  onPick: (option: number) => void;
  onSkip: () => void;
  onNext: () => void;
  onQuit: () => void;
}

export const GameRound = ({
  level,
  pool,
  faces,
  index,
  current,
  picks,
  picked,
  score,
  onPick,
  onSkip,
  onNext,
  onQuit,
}: GameRoundProps) => {
  const info = LEVELS[level];
  const total = faces.length;
  const revealed = picked !== null;
  const pick = picks[index];
  const isLast = index + 1 >= total;
  const levelLine = `${info.name.toLowerCase()} · ${DECKS[pool].toLowerCase()}`;
  const progress = gameBands(picks, total, revealed ? null : index);

  const questionRef = useRef<HTMLHeadingElement>(null);
  const nextDesktopRef = useRef<HTMLButtonElement>(null);
  const nextMobileRef = useRef<HTMLButtonElement>(null);

  // Revelou: foco no "próximo" visível. Rosto novo: foco na pergunta.
  useEffect(() => {
    if (revealed) {
      const target = [nextDesktopRef.current, nextMobileRef.current].find((button) => button && button.offsetParent !== null);
      target?.focus({ preventScroll: true });
    } else {
      questionRef.current?.focus({ preventScroll: true });
    }
  }, [revealed, index]);

  // a–f escolhem; nada acontece com modificadores ou dentro de campos.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || revealed) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const option = LETTERS.indexOf(event.key.toLowerCase());
      if (option !== -1 && option < current.options.length) {
        event.preventDefault();
        onPick(option);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, current, onPick]);

  const stateOf = (option: string, optionIndex: number): OptionState => {
    if (!revealed) return "idle";
    const isAnswer = option === current.answer;
    const isPick = picked === optionIndex;
    if (isPick && isAnswer) return "hit";
    if (isPick) return "miss";
    if (isAnswer) return "answer";
    return "dim";
  };

  const verdict = !pick ? "" : pick.skip ? "Skipped." : pick.correct ? "Correct." : "Not this time.";
  const stripe = revealed ? pickColor(pick) : null;
  const profile = current.profile;
  const remaining = total - index - 1;

  const nextLabel = isLast ? "see your result" : "next face";

  return (
    <div
      className={cn(
        "max-md:fixed max-md:inset-0 max-md:z-[60] max-md:overflow-y-auto max-md:bg-kt-paper",
        revealed && "max-md:pb-[260px]"
      )}
    >
      <h1 className="sr-only">Guess the phenotype</h1>

      {/* Celular: cabeçalho mínimo e progresso */}
      <div className="md:hidden">
        <div className="sticky top-0 z-[1] flex h-14 items-center justify-between gap-2 border-b border-kt-rule bg-kt-paper pl-1 pr-2.5">
          <button
            type="button"
            onClick={onQuit}
            aria-label="Quit the game"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent text-kt-ink"
          >
            <X className="h-[22px] w-[22px]" strokeWidth={1.7} aria-hidden="true" />
          </button>
          <SC className="text-[15px] text-kt-teal">{levelLine}</SC>
          <span className="min-w-11 text-right text-[16px] text-kt-slate">
            {index + 1} / {total}
          </span>
        </div>
        <div className="px-4 pb-2.5 pt-3">
          <div aria-hidden="true" className="box-border h-3.5 rounded-full border-[1.5px] border-kt-ink" style={{ background: progress }} />
          <p className="mb-0 mt-1.5 flex justify-between text-[14px] text-kt-body">
            <span>{score} matched</span>
            <span>
              {remaining === 0 ? "last face" : `${remaining} ${remaining === 1 ? "face" : "faces"} to go`}
            </span>
          </p>
        </div>
      </div>

      {/* Desktop: barra de progresso */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-kt-rule pb-4 max-md:hidden">
        <SC className="text-[15px] text-kt-teal">{levelLine}</SC>
        <span
          aria-hidden="true"
          className="box-border h-4 max-w-[440px] flex-[1_1_200px] rounded-full border-[1.5px] border-kt-ink"
          style={{ background: progress }}
        />
        <span className="text-[16px] text-kt-slate">
          Face {index + 1} of {total} · {score} matched
        </span>
        <button
          type="button"
          onClick={onQuit}
          className="ml-auto min-h-10 border-0 bg-transparent px-1 font-[inherit] text-[16px] text-kt-body underline underline-offset-4 hover:text-kt-ink"
        >
          quit
        </button>
      </div>

      <div className="flex flex-wrap items-start gap-x-[52px] gap-y-8 md:mt-7">
        <figure className="m-0 w-full max-md:px-4 md:max-w-[460px] md:flex-[1_1_320px]">
          <div className="relative md:p-[14px]">
            {[
              "left-0 top-0 border-l-[1.5px] border-t-[1.5px]",
              "right-0 top-0 border-r-[1.5px] border-t-[1.5px]",
              "bottom-0 left-0 border-b-[1.5px] border-l-[1.5px]",
              "bottom-0 right-0 border-b-[1.5px] border-r-[1.5px]",
            ].map((corner) => (
              <span key={corner} aria-hidden="true" className={cn("absolute h-4 w-4 border-kt-teal max-md:hidden", corner)} />
            ))}
            <div className="relative overflow-hidden rounded-[2px] bg-kt-wash max-md:h-[196px] md:aspect-square md:rounded-none">
              <FacePhoto
                key={profile.id}
                src={profile.front_image_url}
                alt={revealed ? profile.name : `Face ${index + 1} of ${total}`}
                priority
              />
              <span className="absolute left-2.5 top-2.5 rounded-full border border-kt-rule bg-white px-[9px] pb-[3px] pt-0.5 font-sc text-[12px] leading-[1.3] tracking-[0.06em] text-kt-slate md:hidden">
                specimen {index + 1} of {total}
              </span>
              {stripe && (
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[5px] md:hidden" style={{ background: stripe }} />
              )}
            </div>
            <span
              aria-hidden="true"
              className="absolute bottom-[14px] left-[14px] right-[14px] h-1.5 max-md:hidden"
              style={{ background: stripe ?? "#F0F4F4" }}
            />
          </div>
          <figcaption className="mt-2 font-sc text-[14px] tracking-[0.06em] text-kt-body max-md:hidden">
            specimen {index + 1} of {total}
          </figcaption>
        </figure>

        <div className="min-w-0 flex-[999_1_340px] max-md:px-4">
          <h2
            ref={questionRef}
            tabIndex={-1}
            className="m-0 text-[25px] font-medium leading-[1.1] tracking-[-0.01em] text-kt-ink outline-none md:text-[clamp(30px,3.2vw,40px)] md:tracking-[-0.015em]"
          >
            {info.question}
          </h2>
          <p className="mb-0 mt-1 text-[15px] italic text-kt-body md:mt-2 md:text-[17px]">{info.help}</p>

          <div role="group" aria-label="Answers" className="mt-3 flex flex-col gap-1.5 md:mt-5 md:gap-2.5">
            {current.options.map((option, optionIndex) => {
              const state = stateOf(option, optionIndex);
              const mark =
                state === "hit"
                  ? "your pick · community"
                  : state === "miss"
                    ? "your pick"
                    : state === "answer"
                      ? `community · ${current.answerPct}%`
                      : "";
              return (
                <button
                  key={option}
                  type="button"
                  aria-disabled={revealed}
                  onClick={() => onPick(optionIndex)}
                  className={cn(
                    "box-border flex min-h-[46px] w-full items-center gap-3 rounded-full py-1 pl-1.5 pr-3.5 text-left font-[inherit] text-[17px] transition-colors md:min-h-[54px] md:gap-3.5 md:py-1.5 md:pl-2 md:pr-[18px] md:text-[18px]",
                    revealed && "cursor-default",
                    OPTION_CLASS[state]
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sc text-[15px] md:h-9 md:w-9 md:text-[16px]",
                      LETTER_CLASS[state]
                    )}
                  >
                    {LETTERS[optionIndex]}
                  </span>
                  <span className={cn("min-w-0 flex-auto", state === "miss" && "line-through")}>{option}</span>
                  {mark && (
                    <span
                      className={cn(
                        "whitespace-nowrap font-sc text-[13px] tracking-[0.05em] md:text-[14px]",
                        state === "answer" && "text-kt-teal"
                      )}
                    >
                      {mark}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!revealed && (
            <button
              type="button"
              onClick={onSkip}
              className="mt-1 min-h-11 border-0 bg-transparent px-1 font-[inherit] text-[17px] text-kt-teal underline underline-offset-[5px] hover:text-kt-ink"
            >
              skip this face
            </button>
          )}

          {revealed && pick && (
            <>
              <div
                role="status"
                className={cn(
                  "mt-2.5 rounded-[3px] border border-kt-rule bg-white px-5 py-[18px] motion-safe:animate-rise-fast",
                  "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-[61] max-md:m-0 max-md:rounded-b-none max-md:border-0",
                  "max-md:border-t-[1.5px] max-md:border-kt-ink max-md:px-4 max-md:pb-[calc(22px+env(safe-area-inset-bottom))]",
                  "max-md:shadow-[0_-14px_30px_-18px_rgba(25,42,67,.35)]"
                )}
              >
                <div aria-hidden="true" className="mx-auto -mt-1.5 mb-3 h-1 w-9 rounded-full bg-kt-rule md:hidden" />
                <p className="m-0 text-[25px] leading-[1.15] text-kt-ink md:text-[26px]">{verdict}</p>
                <p className="mb-0 mt-1.5 text-[16px] leading-normal text-kt-slate md:text-[17px]">
                  The community read this face as <strong className="font-semibold text-kt-ink">{current.answer}</strong>:{" "}
                  {current.answerPct}% of {current.votes} {current.votes === 1 ? "vote" : "votes"}.
                </p>
                <SC as="p" className="mb-0 mt-2 text-[13px] text-kt-body md:mt-2.5 md:text-[14px]">
                  {profile.name} · <Link to={`/user-profile/${profile.slug}`} className="text-kt-teal">open the profile</Link>
                </SC>
                <CenButton ref={nextMobileRef} onClick={onNext} fullWidth size="md" className="mt-3.5 md:hidden">
                  {nextLabel}
                </CenButton>
              </div>
              <CenButton ref={nextDesktopRef} onClick={onNext} size="md" className="mt-[18px] max-md:hidden">
                {nextLabel}
              </CenButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * PEÇAS COMUNS DO JOGO (game/shared.tsx)
 *
 * O cromossomo da partida — uma faixa por rosto, pintada conforme a resposta —
 * e a legenda das cores, usados na rodada e no resultado.
 */

import type { GamePick } from "@/hooks/use-map-game";
import { KT, bandSeparators } from "@/components/kt/bands";
import { Swatch } from "@/components/kt/Meters";

export const PICK_COLOR = {
  match: KT.ink,
  differs: KT.b50,
  skip: KT.rule,
  current: KT.glow,
  empty: KT.sheet,
} as const;

export const pickColor = (pick: GamePick | undefined): string => {
  if (!pick) return PICK_COLOR.empty;
  if (pick.skip) return PICK_COLOR.skip;
  return pick.correct ? PICK_COLOR.match : PICK_COLOR.differs;
};

/** Fundo do cromossomo da partida; `live` marca o rosto atual em glow. */
export const gameBands = (picks: GamePick[], total: number, live: number | null): string => {
  const stops = Array.from({ length: total }, (_, band) => {
    const pick = picks[band];
    const color = pick ? pickColor(pick) : live === band ? PICK_COLOR.current : PICK_COLOR.empty;
    return `${color} 0 ${(((band + 1) / total) * 100).toFixed(3)}%`;
  });
  return `${bandSeparators(total, KT.b25)},linear-gradient(90deg,${stops.join(",")})`;
};

export const GameLegend = ({ withSkip = true, compact = false }: { withSkip?: boolean; compact?: boolean }) => (
  <div className={compact ? "flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-kt-slate" : "flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-kt-slate"}>
    <span className="inline-flex items-center gap-2">
      <Swatch color={PICK_COLOR.match} width={20} height={10} />
      matched the community
    </span>
    <span className="inline-flex items-center gap-2">
      <Swatch color={PICK_COLOR.differs} width={20} height={10} />
      read it differently
    </span>
    {withSkip && (
      <span className="inline-flex items-center gap-2">
        <Swatch color={PICK_COLOR.skip} width={20} height={10} />
        skipped
      </span>
    )}
  </div>
);

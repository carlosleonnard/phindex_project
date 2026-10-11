/**
 * MEDIDORES (Meters.tsx)
 *
 * As faixas que carregam dados:
 *
 *   ConsensusMeter — fatia da resposta vencedora (o "agreement" do perfil),
 *                    com o tracejado marcando a maioria.
 *   VoteProgress   — quantos dos dez votos que tornam um rosto "lido" já há.
 *   NoVotesBar     — o vazio de quem ainda não foi lido: tracejado e hachura.
 *   TraitStrip     — uma faixa por opção, na ordem da escala; o tom é a fatia.
 *   StackedBar     — distribuição em fatias contíguas (região, fenótipo).
 *
 * Todas são decorativas para leitores de tela (`aria-hidden`): o número que
 * representam sempre aparece em texto ao lado.
 */

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { KT, HATCH_SOFT, bandSeparators, equalBands, shareShade } from "./bands";

interface BarProps {
  height?: number;
  className?: string;
  style?: CSSProperties;
}

const capsule = "block box-border rounded-full";

export const ConsensusMeter = ({
  agreement,
  runnerUp,
  height = 12,
  tick = true,
  thin = false,
  className,
}: BarProps & {
  /** 0–100 */
  agreement: number;
  /** Fatia do segundo colocado, quando conhecida (0–100). */
  runnerUp?: number;
  tick?: boolean;
  /** Borda de 1px, para medidores pequenos. */
  thin?: boolean;
}) => {
  const first = Math.max(0, Math.min(100, agreement));
  const second = runnerUp ? Math.min(100, first + runnerUp) : first;
  const background = runnerUp
    ? `linear-gradient(90deg,${KT.ink} 0 ${first}%,${KT.b50} 0 ${second}%,${KT.sheet} 0 100%)`
    : `linear-gradient(90deg,${KT.ink} 0 ${first}%,${KT.sheet} 0)`;

  return (
    <span
      aria-hidden="true"
      className={cn(capsule, "relative", className)}
      style={{
        height,
        border: `${thin ? 1 : 1.5}px solid ${KT.ink}`,
        background,
      }}
    >
      {tick && (
        <span
          className="absolute left-1/2"
          style={{
            top: -4,
            bottom: -4,
            borderLeft: `1px dashed ${first > 50 ? KT.paper : KT.ink}`,
          }}
        />
      )}
    </span>
  );
};

export const VoteProgress = ({
  count,
  total = 10,
  height = 7,
  className,
}: BarProps & { count: number; total?: number }) => {
  const filled = Math.max(0, Math.min(total, count));
  const pct = (filled / total) * 100;
  return (
    <span
      aria-hidden="true"
      className={cn(capsule, className)}
      style={{
        height,
        border: `1px solid ${KT.ink}`,
        background: `${bandSeparators(total)},linear-gradient(90deg,${KT.teal} 0 ${pct}%,${KT.wash2} 0 100%)`,
      }}
    />
  );
};

export const NoVotesBar = ({ height = 12, className }: BarProps) => (
  <span
    aria-hidden="true"
    className={cn(capsule, className)}
    style={{ height, border: `1.5px dashed ${KT.b50}`, background: HATCH_SOFT }}
  />
);

/**
 * @param shares fatias por opção (0–100), na ordem da escala.
 */
export const TraitStrip = ({
  shares,
  height = 14,
  className,
}: BarProps & { shares: number[] }) => (
  <span
    aria-hidden="true"
    className={cn(capsule, className)}
    style={{
      height,
      border: `1px solid ${KT.ink}`,
      background: `${bandSeparators(shares.length, KT.rule)},${equalBands(shares.map(shareShade))}`,
    }}
  />
);

export interface StackedSlice {
  /** 0–100 */
  pct: number;
  color: string;
}

/** Fatias contíguas separadas por uma linha da cor do fundo. */
export const StackedBar = ({
  slices,
  height = 14,
  borderColor = KT.ink,
  gapColor = KT.sheet,
  borderWidth = 1.5,
  className,
}: BarProps & {
  slices: StackedSlice[];
  borderColor?: string;
  gapColor?: string;
  borderWidth?: number;
}) => {
  let cursor = 0;
  const stops: string[] = [];
  slices.forEach((slice, index) => {
    const end = Math.min(100, cursor + slice.pct);
    stops.push(`${slice.color} 0 ${end}%`);
    if (index < slices.length - 1 && end < 100) {
      stops.push(`${gapColor} 0 calc(${end}% + 2px)`);
    }
    cursor = end;
  });
  if (cursor < 100) stops.push(`${KT.sheet} 0 100%`);

  return (
    <span
      aria-hidden="true"
      className={cn(capsule, className)}
      style={{
        height,
        border: `${borderWidth}px solid ${borderColor}`,
        background: `linear-gradient(90deg,${stops.join(",")})`,
      }}
    />
  );
};

/** Amostra de legenda: uma cápsula pequena na cor dada. */
export const Swatch = ({
  color,
  width = 22,
  height = 10,
  background,
  borderColor = KT.ink,
}: {
  color?: string;
  width?: number;
  height?: number;
  background?: string;
  borderColor?: string;
}) => (
  <span
    aria-hidden="true"
    className="inline-block box-border shrink-0 rounded-full"
    style={{ width, height, border: `1px solid ${borderColor}`, background: background ?? color }}
  />
);

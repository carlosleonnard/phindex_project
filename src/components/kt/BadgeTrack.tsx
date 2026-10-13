/**
 * TRILHA DE INSÍGNIA (BadgeTrack.tsx)
 *
 * Cada categoria de insígnia é um cromossomo de dez faixas: níveis
 * conquistados em tinta, e uma fatia teal com o progresso até o próximo
 * limiar. Usada na página de membro e nas configurações.
 *
 * Embaixo de cada faixa fica o ícone do nível — medalha, prêmio, estrela…
 * até o troféu do Godlike. Os conquistados acendem em tinta, o mais recente
 * ganha um anel teal, e os que faltam ficam em contorno apagado. O nome e o
 * limiar de cada um aparecem ao passar o mouse e são lidos pelo leitor de tela.
 */

import { Award, Crown, Flame, Gem, Medal, Mountain, Shield, Star, Trophy, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SC } from "./Misc";
import { KT, bandSeparators } from "./bands";
import { LEVEL_NAMES, type BadgeCategory } from "@/hooks/use-badges";

export type BadgeStatKey = "total_votes_cast" | "total_comments" | "total_games_played" | "total_profiles_created";

/** Ordem e vocabulário das trilhas. */
export const BADGE_TRACKS: Array<{ category: BadgeCategory; statKey: BadgeStatKey; unit: string }> = [
  { category: "Voter", statKey: "total_votes_cast", unit: "votes" },
  { category: "Commentator", statKey: "total_comments", unit: "comments" },
  { category: "Gamer", statKey: "total_games_played", unit: "games" },
  { category: "Creator", statKey: "total_profiles_created", unit: "faces added" },
];

/** Ícone de cada nível, do Bronze (1) ao Godlike (10). */
const LEVEL_ICONS: LucideIcon[] = [Medal, Award, Star, Shield, Gem, Flame, Zap, Mountain, Crown, Trophy];

export const BadgeTrack = ({
  label,
  level,
  stat,
  unit,
  thresholds,
}: {
  label: string;
  /** Nível conquistado, 0–10. */
  level: number;
  /** Valor atual da estatística da trilha; null se desconhecido. */
  stat: number | null;
  unit: string;
  /** Limiar (e nome da insígnia, quando conhecido) de cada nível desta trilha. */
  thresholds: Array<{ level: number; threshold: number; name?: string }>;
}) => {
  const thresholdOf = (value: number) => thresholds.find((item) => item.level === value)?.threshold;
  const badgeNameOf = (value: number) => thresholds.find((item) => item.level === value)?.name;
  // "1 comment", não "1 comments": a primeira palavra da unidade vai para o singular.
  const unitFor = (count: number) => (count === 1 ? unit.replace(/^(\w+)s\b/, "$1") : unit);
  const next = level < 10 ? thresholdOf(level + 1) : undefined;
  const previous = level > 0 ? thresholdOf(level) ?? 0 : 0;
  const fraction =
    stat !== null && next !== undefined && next > previous ? Math.min(1, Math.max(0, (stat - previous) / (next - previous))) : 0;
  const earnedEnd = level * 10;
  const progressEnd = earnedEnd + fraction * 10;

  return (
    <div className="border-t border-kt-rule py-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <SC as="h3" className="m-0 text-[16px] font-semibold text-kt-slate">
          {label.toLowerCase()}
        </SC>
        <span className="text-[17px] text-kt-ink">
          {level > 0 ? LEVEL_NAMES[level] : "No badge yet"} <span className="text-kt-body">· level {level}</span>
        </span>
      </div>
      <div
        role="img"
        aria-label={`${label}: level ${level} of 10`}
        className="mt-2.5 box-border h-[18px] rounded-full border-[1.5px] border-kt-ink"
        style={{
          background: `${bandSeparators(10)},linear-gradient(90deg,${KT.ink} 0 ${earnedEnd}%,${KT.teal} 0 ${progressEnd}%,${KT.sheet} 0 100%)`,
        }}
      />
      <ol aria-label={`${label} badges`} className="m-0 mt-2 grid list-none grid-cols-10 p-0">
        {LEVEL_ICONS.map((Icon, index) => {
          const value = index + 1;
          const earned = value <= level;
          const threshold = thresholdOf(value);
          const badgeName = badgeNameOf(value);
          const description = [
            `${LEVEL_NAMES[value]}${badgeName ? `: ${badgeName}` : ""}`,
            threshold !== undefined ? `${threshold.toLocaleString("en-US")} ${unitFor(threshold)}` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={value} className="flex justify-center px-[2px]">
              <span
                title={description}
                className={cn(
                  "flex aspect-square w-full max-w-[34px] items-center justify-center rounded-full transition-colors",
                  earned ? "bg-kt-ink text-kt-paper" : "border border-dashed border-kt-b50/70 text-kt-b50",
                  value === level && "bg-kt-teal ring-2 ring-kt-teal/35 ring-offset-2 ring-offset-transparent"
                )}
              >
                <Icon className="h-[52%] w-[52%]" strokeWidth={1.8} aria-hidden="true" />
                <span className="sr-only">
                  {description}, {earned ? "earned" : "not earned yet"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-1.5 flex justify-between gap-3 text-[14px] text-kt-body">
        <em className="max-sm:hidden">bronze</em>
        <span className="text-center">
          {level >= 10
            ? "all ten levels earned"
            : next !== undefined
              ? `next: ${LEVEL_NAMES[level + 1]} at ${next.toLocaleString("en-US")} ${unitFor(next)}${
                  stat !== null ? ` · ${stat.toLocaleString("en-US")} so far` : ""
                }`
              : stat !== null
                ? `${stat.toLocaleString("en-US")} ${unitFor(stat)} so far`
                : ""}
        </span>
        <em className="max-sm:hidden">godlike</em>
      </div>
    </div>
  );
};

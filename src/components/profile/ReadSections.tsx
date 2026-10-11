/**
 * SEÇÕES DA LEITURA (ReadSections.tsx)
 *
 *   Classification — o braço curto em detalhe: a distribuição de região e de
 *                    fenótipo, com as segundas e terceiras escolhas.
 *   TraitTable     — o braço longo: uma faixa por traço, cada opção uma banda
 *                    na ordem da escala, o tom pela fatia de votos.
 *   BlindRead      — voto × palpite às cegas (o jogo), em três níveis.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TRAITS, traitOptionLabel } from "@/constants/traits";
import { phenotypeGroupOf } from "@/constants/taxonomy";
import { continentOf, type Continent } from "@/constants/regions";
import { useProfileGameStats, type GameDifficulty } from "@/hooks/use-profile-game-stats";
import { RANK_SHADES, KT } from "@/components/kt/bands";
import { NoVotesBar, StackedBar, Swatch, TraitStrip } from "@/components/kt/Meters";
import { SegmentedCapsule } from "@/components/kt/RegionFilter";
import { REGION_HEX, SC } from "@/components/kt/Misc";

export interface VoteShare {
  classification: string;
  count: number;
  percentage: number;
}

export interface PhysicalCharacteristicVotes {
  name: string;
  votes: Array<{ option: string; count: number; percentage: number }>;
}

const SectionHead = ({ id, title, arm }: { id: string; title: string; arm: string }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5 border-b-[1.5px] border-kt-ink pb-3">
    <h2 id={id} className="m-0 text-[30px] font-medium leading-[1.15] text-kt-ink">
      {title}
    </h2>
    <SC className="text-[14px] text-kt-teal">{arm}</SC>
  </div>
);

/** Top 4 + "other", com os tons de ranking. */
const toSlices = (votes: VoteShare[]) => {
  const top = votes.slice(0, 4);
  const otherPct = votes.slice(4).reduce((sum, vote) => sum + vote.percentage, 0);
  const rows: Array<{ label: string; pct: number; color: string; other: boolean }> = top.map((vote, index) => ({
    label: vote.classification,
    pct: vote.percentage,
    color: RANK_SHADES[index],
    other: false,
  }));
  if (otherPct > 0.5) rows.push({ label: "other", pct: otherPct, color: KT.sheet, other: true });
  return rows;
};

const DistributionBlock = ({
  title,
  primary,
  secondary,
  tertiary,
}: {
  title: string;
  primary: VoteShare[];
  secondary?: VoteShare[];
  tertiary?: VoteShare[];
}) => {
  const rows = toSlices(primary);
  const leader = primary[0];

  return (
    <div>
      <SC as="h3" className="m-0 text-[15px] font-semibold text-kt-slate">
        {title}
      </SC>
      {leader ? (
        <>
          <p className="mb-0 mt-1.5 flex items-baseline gap-2.5 text-[26px] leading-[1.15] text-kt-ink">
            {leader.classification}{" "}
            <span className="text-[17px] text-kt-body">{Math.round(leader.percentage)}%</span>
          </p>
          <StackedBar slices={rows.map((row) => ({ pct: row.pct, color: row.color }))} className="mt-3" />
          <ol className="m-0 mt-3 list-none p-0 text-[16px]">
            {rows.map((row) => (
              <li key={row.label} className="grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-2.5 py-[5px]">
                <Swatch
                  width={14}
                  height={8}
                  color={row.color}
                  borderColor={row.other ? KT.b50 : row.color}
                />
                <span className={row.other ? "text-kt-body" : undefined}>{row.label}</span>
                <span className="text-kt-body">{Math.round(row.pct)}%</span>
              </li>
            ))}
          </ol>
          {(secondary?.[0] || tertiary?.[0]) && (
            <p className="mb-0 mt-2.5 text-[15px] text-kt-body">
              {secondary?.[0] && (
                <>
                  <SC>secondary</SC> {secondary[0].classification}
                </>
              )}
              {secondary?.[0] && tertiary?.[0] && " · "}
              {tertiary?.[0] && (
                <>
                  <SC>tertiary</SC> {tertiary[0].classification}
                </>
              )}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mb-0 mt-1.5 text-[20px] italic text-kt-body">No votes yet</p>
          <NoVotesBar height={14} className="mt-3" />
        </>
      )}
    </div>
  );
};

export const Classification = ({
  geographic,
  phenotype,
}: {
  geographic: Record<string, VoteShare[]>;
  phenotype: Record<string, VoteShare[]>;
}) => (
  <section aria-labelledby="class-title" className="mt-11">
    <SectionHead id="class-title" title="Classification" arm="short arm · p" />
    <div className="mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-x-10 gap-y-7">
      <DistributionBlock
        title="region"
        primary={geographic["Primary Geographic"] ?? []}
        secondary={geographic["Secondary Geographic"]}
        tertiary={geographic["Tertiary Geographic"]}
      />
      <DistributionBlock
        title="phenotype"
        primary={phenotype["Primary Phenotype"] ?? []}
        secondary={phenotype["Secondary Phenotype"]}
        tertiary={phenotype["Tertiary Phenotype"]}
      />
    </div>
  </section>
);

/** Fatias por opção (0–100) na ordem da escala, mais o líder. */
export const traitSummary = (key: string, votes: PhysicalCharacteristicVotes["votes"]) => {
  const trait = TRAITS.find((item) => item.key === key)!;
  const total = votes.reduce((sum, vote) => sum + vote.count, 0);
  const shares = trait.options.map((option) => {
    const match = votes.find((vote) => vote.option === option.value);
    return total > 0 && match ? (match.count / total) * 100 : 0;
  });
  const top = [...votes].sort((a, b) => b.count - a.count)[0];
  return {
    total,
    shares,
    top: top ? traitOptionLabel(key, top.option) : null,
    topPct: top && total > 0 ? Math.round((top.count / total) * 100) : null,
  };
};

export const TraitTable = ({ characteristics }: { characteristics: PhysicalCharacteristicVotes[] }) => (
  <section aria-labelledby="traits-title" className="mt-12">
    <SectionHead id="traits-title" title="Ten traits" arm="long arm · q" />
    <p className="mb-0 mt-3 text-[16px] italic text-kt-body">
      Each band is one option on the scale; the darker it is, the more people chose it.
    </p>
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[16px]">
        <thead>
          <tr className="font-sc text-[13px] tracking-[0.06em] text-kt-body">
            <th scope="col" className="pb-2 pr-4 pt-2.5 text-left font-normal">
              trait
            </th>
            <th scope="col" className="px-4 pb-2 pt-2.5 text-left font-normal">
              how people voted
            </th>
            <th scope="col" className="pb-2 pt-2.5 text-right font-normal">
              most chosen
            </th>
          </tr>
        </thead>
        <tbody>
          {TRAITS.map((trait, index) => {
            const votes = characteristics.find((item) => item.name === trait.key)?.votes ?? [];
            const summary = traitSummary(trait.key, votes);
            return (
              <tr
                key={trait.key}
                className={`border-t border-kt-rule ${index === TRAITS.length - 1 ? "border-b" : ""}`}
              >
                <th scope="row" className="whitespace-nowrap py-3 pr-4 text-left font-normal text-kt-ink">
                  {trait.title}
                </th>
                <td className="w-[52%] px-4 py-3">
                  {summary.total > 0 ? <TraitStrip shares={summary.shares} /> : <NoVotesBar height={14} />}
                  <div aria-hidden="true" className="mt-[3px] flex justify-between text-[12px] italic text-kt-body">
                    <span>{trait.ends[0]}</span>
                    <span>{trait.ends[1]}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap py-3 text-right">
                  {summary.top ? (
                    <>
                      {summary.top} <span className="text-kt-body">{summary.topPct}%</span>
                      <span className="block text-[13px] text-kt-body">
                        <em>n</em> = {summary.total}
                      </span>
                    </>
                  ) : (
                    <span className="italic text-kt-body">no votes yet</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);

const LEVELS: Array<{ value: GameDifficulty; label: string }> = [
  { value: "easy", label: "Region" },
  { value: "medium", label: "Sub-region" },
  { value: "hard", label: "Phenotype" },
];

const DARK_SHADES = ["#349DB2", "#94BCC5", "#EE9D2B", "#8D69BF", "#5E9BA7", "#428CD7"];

interface Slice {
  label: string;
  pct: number;
}

const toPercentages = (counts: Record<string, number>): Slice[] => {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return Object.entries(counts)
    .map(([label, count]) => ({ label, pct: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct);
};

export const BlindRead = ({
  profileId,
  geographic,
  phenotype,
}: {
  profileId: string;
  geographic: VoteShare[];
  phenotype: VoteShare[];
}) => {
  const [level, setLevel] = useState<GameDifficulty>("easy");
  const { stats, isLoading } = useProfileGameStats(profileId, level);

  /** O que os votantes escolheram, no vocabulário do nível. */
  const voted: Slice[] = useMemo(() => {
    if (level === "hard") {
      // O nível difícil pergunta pelo grupo: votos de subgrupos somam no grupo.
      const byGroup: Record<string, number> = {};
      phenotype.forEach((vote) => {
        const group = phenotypeGroupOf(vote.classification);
        byGroup[group] = (byGroup[group] || 0) + vote.count;
      });
      return toPercentages(byGroup);
    }
    if (level === "medium") return geographic.map((vote) => ({ label: vote.classification, pct: vote.percentage }));
    const byContinent: Record<string, number> = {};
    geographic.forEach((vote) => {
      const continent = continentOf(vote.classification) ?? "other";
      byContinent[continent] = (byContinent[continent] || 0) + vote.count;
    });
    return toPercentages(byContinent);
  }, [level, geographic, phenotype]);

  const guessed: Slice[] = useMemo(() => {
    const byLabel: Record<string, number> = {};
    (stats?.distribution ?? []).forEach((tally) => {
      // Partidas antigas do nível difícil gravaram subgrupos; contam no grupo.
      const label = level === "hard" ? phenotypeGroupOf(tally.guess) : tally.guess;
      byLabel[label] = (byLabel[label] || 0) + tally.count;
    });
    return toPercentages(byLabel);
  }, [stats, level]);

  // Uma cor por rótulo, igual nas duas barras.
  const colorOf = useMemo(() => {
    const labels = [...new Set([...voted, ...guessed].map((slice) => slice.label))];
    const map = new Map<string, string>();
    labels.forEach((label, index) => {
      if (level === "easy" && label in REGION_HEX) map.set(label, REGION_HEX[label as Continent]);
      else map.set(label, DARK_SHADES[index % DARK_SHADES.length]);
    });
    return (label: string) => map.get(label) ?? "#3D5A61";
  }, [voted, guessed, level]);

  const barFor = (slices: Slice[]) => {
    const top = slices.slice(0, 4);
    const rest = slices.slice(4).reduce((sum, slice) => sum + slice.pct, 0);
    const parts = top.map((slice) => ({ pct: slice.pct, color: colorOf(slice.label) }));
    if (rest > 0.5) parts.push({ pct: rest, color: "#3D5A61" });
    return parts;
  };

  const legend = [...new Set([...voted.slice(0, 4), ...guessed.slice(0, 4)].map((slice) => slice.label))].slice(0, 6);
  const votedTop = voted[0];
  const guessedTop = guessed[0];
  const total = stats?.totalGuesses ?? 0;

  return (
    <section
      aria-labelledby="blind-title"
      className="mt-12 rounded-[3px] bg-kt-deep px-[clamp(18px,2.4vw,30px)] py-7 text-kt-wash"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5">
        <h2 id="blind-title" className="m-0 text-[30px] font-medium leading-[1.15] text-kt-paper">
          Blind read
        </h2>
        <SC className="text-[14px] text-kt-b50">voted vs. guessed</SC>
      </div>
      <p className="mb-0 mt-2.5 max-w-[58ch] text-[17px] text-kt-b50">
        Voters saw the name and country before deciding. Players in the Origin Game saw only the face.
      </p>
      <div className="mt-[18px]">
        <SegmentedCapsule options={LEVELS} value={level} onChange={(value) => setLevel(value)} label="Guess level" dark />
      </div>

      {isLoading ? (
        <div className="mt-6 h-20 animate-pulse rounded-[3px] bg-white/5" aria-hidden="true" />
      ) : total === 0 ? (
        <p className="mb-0 mt-6 border-t border-kt-b50/25 pt-4 text-[17px] text-kt-paper">
          No one has guessed this face blind at this level yet.{" "}
          <Link to="/game" className="text-kt-glow">
            Play a round
          </Link>{" "}
          to add the first guess.
        </p>
      ) : (
        <>
          <div className="mt-[22px] grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3.5">
            <SC className="text-[15px] text-kt-paper">voted</SC>
            {voted.length > 0 ? (
              <StackedBar slices={barFor(voted)} height={18} borderWidth={1} borderColor="rgba(148,188,197,.7)" gapColor={KT.deep} />
            ) : (
              <span className="text-[15px] italic text-kt-b50">no votes yet</span>
            )}
            <span className="text-[15px] text-kt-wash">{votedTop ? `${votedTop.label} ${Math.round(votedTop.pct)}%` : "—"}</span>

            <SC className="text-[15px] text-kt-paper">guessed</SC>
            <StackedBar slices={barFor(guessed)} height={18} borderWidth={1} borderColor="rgba(148,188,197,.7)" gapColor={KT.deep} />
            <span className="text-[15px] text-kt-wash">{guessedTop ? `${guessedTop.label} ${Math.round(guessedTop.pct)}%` : "—"}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-kt-b50">
            {legend.map((label) => (
              <span key={label} className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: colorOf(label) }} />
                {label}
              </span>
            ))}
          </div>
          <p className="mb-0 mt-5 border-t border-kt-b50/25 pt-4 text-[18px] text-kt-paper">
            {stats?.divergent && votedTop && guessedTop ? (
              <>
                <em className="text-kt-glow">The reads diverge.</em> Voters chose {votedTop.label}; players without
                context leaned {guessedTop.label}.
              </>
            ) : (
              <>
                <em className="text-kt-glow">The reads agree.</em> With or without context, this face reads as{" "}
                {guessedTop?.label ?? votedTop?.label}.
              </>
            )}{" "}
            <span className="text-kt-b50">
              Based on {total} {total === 1 ? "guess" : "guesses"}.
            </span>
          </p>
        </>
      )}
    </section>
  );
};

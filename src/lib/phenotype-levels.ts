/**
 * OS DOIS NÍVEIS DO FENÓTIPO (phenotype-levels.ts)
 *
 * O voto grava um nome por posição (Primary/Secondary/Tertiary Phenotype): o
 * subtipo, quando a pessoa escolheu um, ou o grupo. O nível geral sai do
 * subtipo pela taxonomia — cada subtipo pertence a um grupo só — então as duas
 * leituras vêm das mesmas linhas, sem gravar o grupo duas vezes.
 *
 *   geral      — cada voto somado no seu grupo ("Trønder" conta para Nordid);
 *   específico — só os votos que nomeiam um subtipo (ou um grupo sem
 *                subtipos). Votos antigos que pararam num grupo com subtipos
 *                ficam de fora: dizem o grupo, não o subtipo.
 */

import { isSpecificPhenotype, phenotypeGroupOf } from "@/constants/taxonomy";

export interface PhenotypeShare {
  classification: string;
  count: number;
  percentage: number;
}

/** As três posições gravadas, em ordem de força. */
export const PHENOTYPE_RANK_KEYS = ["Primary Phenotype", "Secondary Phenotype", "Tertiary Phenotype"] as const;

const withPercentages = (counts: Map<string, number>): PhenotypeShare[] => {
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [...counts.entries()]
    .map(([classification, count]) => ({
      classification,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.classification.localeCompare(b.classification));
};

/** A distribuição somada por grupo. */
export const toGeneralShares = (shares: PhenotypeShare[] = []): PhenotypeShare[] => {
  const counts = new Map<string, number>();
  for (const share of shares) {
    const group = phenotypeGroupOf(share.classification);
    counts.set(group, (counts.get(group) ?? 0) + share.count);
  }
  return withPercentages(counts);
};

/** A distribuição só dos votos que chegaram ao subtipo. */
export const toSpecificShares = (shares: PhenotypeShare[] = []): PhenotypeShare[] => {
  const counts = new Map<string, number>();
  for (const share of shares) {
    if (!isSpecificPhenotype(share.classification)) continue;
    counts.set(share.classification, (counts.get(share.classification) ?? 0) + share.count);
  }
  return withPercentages(counts);
};

/** As três posições de um nível, a partir do que o banco devolve por posição. */
export const phenotypeLevel = (
  byRank: Record<string, PhenotypeShare[]>,
  level: "general" | "specific"
): Record<string, PhenotypeShare[]> =>
  Object.fromEntries(
    PHENOTYPE_RANK_KEYS.map((key) => [key, (level === "general" ? toGeneralShares : toSpecificShares)(byRank[key])])
  );

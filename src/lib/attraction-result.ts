/**
 * O RESULTADO DA ESCALA DE ATRAÇÃO (attraction-result.ts)
 *
 * Funções puras: entram as notas da pessoa e os agregados da amostra, sai o
 * que a tela do resultado mostra. Sem React e sem rede, porque é a parte que
 * mais fácil erra e a que mais importa acertar — um percentil errado é uma
 * afirmação errada sobre a pessoa.
 *
 * O QUE ESTES NÚMEROS SIGNIFICAM:
 * Tudo aqui descreve o gosto de quem avaliou. "Acima da média" quer dizer que
 * esta pessoa deu a este rosto uma nota maior do que as outras pessoas deram
 * ao MESMO rosto. Não é uma medida do fenótipo, e a interface precisa dizer
 * isso junto do número.
 */

import type { FaceGender } from "@/constants/attractiveness";
import { RATING_MAX, RATING_MIN } from "@/constants/attractiveness";

export interface RatingInput {
  phenotype: string;
  gender: FaceGender;
  rating: number;
}

export interface SampleStat {
  phenotype: string;
  gender: FaceGender;
  voters: number;
  mean_rating: number;
}

export interface PhenotypeScore {
  phenotype: string;
  /** Média das notas que a pessoa deu a este fenótipo (um ou dois rostos). */
  score: number;
  /** 0–100, só para o tamanho da barra. */
  percent: number;
  /** Média da amostra no mesmo recorte, ou null se ninguém mais avaliou. */
  sampleMean: number | null;
  /** score - sampleMean, ou null. Positivo = gosta mais que a média. */
  delta: number | null;
  /** Quantas pessoas avaliaram estes rostos, a menor contagem do recorte. */
  sampleVoters: number;
}

const key = (phenotype: string, gender: FaceGender) => `${phenotype}::${gender}`;

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * Agrupa as notas por fenótipo. Quem escolheu "both" avaliou dois rostos do
 * mesmo fenótipo; o fenótipo entra com a média dos dois, para que a ordem do
 * top 5 não dependa de quantos rostos a pessoa viu.
 */
export const scoreByPhenotype = (
  ratings: RatingInput[],
  sample: SampleStat[]
): PhenotypeScore[] => {
  const sampleByFace = new Map(sample.map((s) => [key(s.phenotype, s.gender), s]));
  const grouped = new Map<string, RatingInput[]>();

  for (const rating of ratings) {
    const list = grouped.get(rating.phenotype) ?? [];
    list.push(rating);
    grouped.set(rating.phenotype, list);
  }

  const scores: PhenotypeScore[] = [];

  for (const [phenotype, list] of grouped) {
    const score = mean(list.map((r) => r.rating));

    // A média da amostra é comparada rosto a rosto: se a pessoa avaliou só a
    // versão feminina, comparar com uma média que inclui a masculina seria
    // comparar coisas diferentes.
    const matched = list
      .map((r) => sampleByFace.get(key(r.phenotype, r.gender)))
      .filter((s): s is SampleStat => Boolean(s) && s.voters > 0);

    const sampleMean = matched.length > 0 ? mean(matched.map((s) => s.mean_rating)) : null;
    const sampleVoters = matched.length > 0 ? Math.min(...matched.map((s) => s.voters)) : 0;

    scores.push({
      phenotype,
      score,
      percent: ((score - RATING_MIN) / (RATING_MAX - RATING_MIN)) * 100,
      sampleMean,
      delta: sampleMean === null ? null : score - sampleMean,
      sampleVoters,
    });
  }

  // Empate resolvido pelo nome, para a lista não trocar de ordem a cada visita.
  return scores.sort((a, b) => b.score - a.score || a.phenotype.localeCompare(b.phenotype));
};

/**
 * Em que percentil a média desta pessoa cai, dentro das médias das outras.
 *
 * Definição usada: a porcentagem da amostra com média MENOR que a desta
 * pessoa, mais metade dos empates (o percentil "midrank"). Sem a metade dos
 * empates, quem dá exatamente a média mais comum apareceria no percentil 0.
 *
 * Devolve null quando a amostra é pequena demais para a conta significar algo
 * — quem decide o limite é quem chama, com SAMPLE_THRESHOLD.
 */
export const percentileOf = (value: number, distribution: number[]): number | null => {
  if (distribution.length === 0) return null;

  let below = 0;
  let equal = 0;
  for (const other of distribution) {
    if (other < value) below += 1;
    else if (other === value) equal += 1;
  }

  return Math.round(((below + equal / 2) / distribution.length) * 100);
};

/** A frase do percentil, já no sentido certo. */
export const percentileSentence = (percentile: number): string => {
  if (percentile >= 60) return `You rate faces more generously than ${percentile}% of people here.`;
  if (percentile <= 40) return `You rate faces more strictly than ${100 - percentile}% of people here.`;
  return "You rate faces about as generously as everyone else here.";
};

/** Média geral das notas de uma pessoa. É o número que vai ao percentil. */
export const overallMean = (ratings: RatingInput[]): number => mean(ratings.map((r) => r.rating));

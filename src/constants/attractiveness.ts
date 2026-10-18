/**
 * CATÁLOGO DA ESCALA DE ATRAÇÃO (attractiveness.ts)
 *
 * Os 38 fenótipos que a página /attraction apresenta, um por rosto, em duas
 * versões (masculina e feminina). A lista vem das pastas de referência do
 * humanphenotypes.com, organizadas por região — cada pasta tem um composto
 * feminino, um masculino, uma miniatura e um mapa de distribuição.
 *
 * POR QUE UMA LISTA PRÓPRIA, E NÃO `PHENOTYPE_ENTRIES`:
 * A taxonomia tem 266 entradas entre grupos e subgrupos. Pedir uma nota para
 * cada uma seria um questionário de centenas de passos que ninguém termina.
 * Aqui ficam só os grupos principais que têm rosto de referência — 38 passos
 * no modo "um gênero", o que uma pessoa conclui em poucos minutos.
 *
 * `taxonomyName` liga cada entrada de volta ao vocabulário gravado em `votes`,
 * para que as notas de atração possam ser cruzadas com as classificações.
 * Em três casos o nome da pasta é um subgrupo e o grupo é outro:
 * Khoid e Sanid vivem em Capoid, e Pacifid é subgrupo de Pacificid.
 *
 * AS IMAGENS NÃO SÃO AS DE REFERÊNCIA. Os compostos do humanphenotypes.com
 * serviram de ponto de partida para rostos sintéticos (img2img, Realistic
 * Vision 5.1, força 0.38); nenhum composto é publicado. Um rosto que faltar em
 * PUBLISHED_FACES cai no retrato vazio do `FacePhoto`.
 *
 * COMO OS ROSTOS FORAM GERADOS — a página compara fenótipos, então tudo que
 * não é fenótipo ficou igual entre os 76:
 *   - mesma semente, mesmos passos, mesma força e mesmo prompt; só muda o
 *     descritor de população e o sexo;
 *   - mesma idade pedida (jovem adulto), expressão neutra, sem maquiagem,
 *     camiseta cinza lisa e o MESMO fundo cinza (a pessoa é recortada e
 *     assentada nele depois da geração);
 *   - o descritor de população é obrigatório: sem ele o modelo puxou todo
 *     rosto para o mesmo rosto europeu claro, e Sinid, Khoid, Bambutid e
 *     Australid perdiam tom de pele e traços. O negativo proíbe adereços
 *     (cocar, contas, pintura, traje típico) para o descritor não virar fantasia;
 *   - um rosto só é refeito por defeito técnico, nunca para ficar mais ou
 *     menos atraente.
 *
 * O Ainuid não tem compostos na pasta (só mapa e miniatura); os dois vieram
 * anexados à parte e a miniatura ainuids.jpg confirma que são o mesmo rosto.
 */

import type { Continent } from "./regions";

export interface PhenotypeFace {
  /** Nome exibido e chave gravada em `attraction_ratings.phenotype`. */
  name: string;
  /** Grupo principal da taxonomia de voto. Igual a `name` na maioria dos casos. */
  taxonomyName: string;
  /** Região da navegação a que a pasta de referência pertence. */
  region: Continent;
  /** Base dos arquivos em /phenotype-faces (ex.: "amazonid" -> amazonid-m.webp). */
  slug: string;
}

export const PHENOTYPE_FACES: PhenotypeFace[] = [
  // Americas
  { name: "Amazonid", taxonomyName: "Amazonid", region: "Americas", slug: "amazonid" },
  { name: "Andid", taxonomyName: "Andid", region: "Americas", slug: "andid" },
  { name: "Centralid", taxonomyName: "Centralid", region: "Americas", slug: "centralid" },
  { name: "Eskimid", taxonomyName: "Eskimid", region: "Americas", slug: "eskimid" },
  { name: "Lagid", taxonomyName: "Lagid", region: "Americas", slug: "lagid" },
  { name: "Margid", taxonomyName: "Margid", region: "Americas", slug: "margid" },
  { name: "Pacifid", taxonomyName: "Pacificid", region: "Americas", slug: "pacifid" },
  { name: "Patagonid", taxonomyName: "Patagonid", region: "Americas", slug: "patagonid" },
  { name: "Silvid", taxonomyName: "Silvid", region: "Americas", slug: "silvid" },

  // Africa
  { name: "Bambutid", taxonomyName: "Bambutid", region: "Africa", slug: "bambutid" },
  { name: "Bantuid", taxonomyName: "Bantuid", region: "Africa", slug: "bantuid" },
  { name: "Congolid", taxonomyName: "Congolid", region: "Africa", slug: "congolid" },
  { name: "Ethiopid", taxonomyName: "Ethiopid", region: "Africa", slug: "ethiopid" },
  { name: "Khoid", taxonomyName: "Khoid", region: "Africa", slug: "khoid" },
  { name: "Nilotid", taxonomyName: "Nilotid", region: "Africa", slug: "nilotid" },
  { name: "Sanid", taxonomyName: "Sanid", region: "Africa", slug: "sanid" },
  { name: "Sudanid", taxonomyName: "Sudanid", region: "Africa", slug: "sudanid" },

  // Asia
  { name: "Ainuid", taxonomyName: "Ainuid", region: "Asia", slug: "ainuid" },
  { name: "Indid", taxonomyName: "Indid", region: "Asia", slug: "indid" },
  { name: "Indo Melanid", taxonomyName: "Indo Melanid", region: "Asia", slug: "indo-melanid" },
  { name: "Negritid", taxonomyName: "Negritid", region: "Asia", slug: "negritid" },
  { name: "Sibirid", taxonomyName: "Sibirid", region: "Asia", slug: "sibirid" },
  { name: "Sinid", taxonomyName: "Sinid", region: "Asia", slug: "sinid" },
  { name: "South Mongolid", taxonomyName: "South Mongolid", region: "Asia", slug: "south-mongolid" },
  { name: "Tungid", taxonomyName: "Tungid", region: "Asia", slug: "tungid" },
  { name: "Veddid", taxonomyName: "Veddid", region: "Asia", slug: "veddid" },

  // Europe
  { name: "Alpinid", taxonomyName: "Alpinid", region: "Europe", slug: "alpinid" },
  { name: "Dinarid", taxonomyName: "Dinarid", region: "Europe", slug: "dinarid" },
  { name: "East Europid", taxonomyName: "East Europid", region: "Europe", slug: "east-europid" },
  { name: "Lappid", taxonomyName: "Lappid", region: "Europe", slug: "lappid" },
  { name: "Mediterranid", taxonomyName: "Mediterranid", region: "Europe", slug: "mediterranid" },
  { name: "Nordid", taxonomyName: "Nordid", region: "Europe", slug: "nordid" },

  // Middle East
  { name: "Armenoid", taxonomyName: "Armenoid", region: "Middle East", slug: "armenoid" },
  { name: "Orientalid", taxonomyName: "Orientalid", region: "Middle East", slug: "orientalid" },
  { name: "Turanid", taxonomyName: "Turanid", region: "Middle East", slug: "turanid" },

  // Oceania
  { name: "Australid", taxonomyName: "Australid", region: "Oceania", slug: "australid" },
  { name: "Melanesid", taxonomyName: "Melanesid", region: "Oceania", slug: "melanesid" },
  { name: "Polynesid", taxonomyName: "Polynesid", region: "Oceania", slug: "polynesid" },
];

export type FaceGender = "male" | "female";

/** O que a pessoa escolhe antes de começar. */
export const FACE_SET_OPTIONS = ["female", "male", "both"] as const;
export type FaceSet = (typeof FACE_SET_OPTIONS)[number];

export const FACE_SET_LABELS: Record<FaceSet, string> = {
  female: "Women",
  male: "Men",
  both: "Both",
};

/**
 * Rostos sintéticos publicados, por `slug-gender`. Os 76 existem; para tirar
 * um do ar (defeito, troca), filtre-o aqui e o cartão volta ao retrato vazio.
 *
 * Os arquivos vivem em /phenotype-faces/{slug}-{m|f}.webp.
 */
export const PUBLISHED_FACES = new Set<string>(
  PHENOTYPE_FACES.flatMap(({ slug }) => [`${slug}-female`, `${slug}-male`])
);

/** URL do rosto sintético, ou null quando ainda não existe. */
export const faceUrl = (slug: string, gender: FaceGender): string | null => {
  const key = `${slug}-${gender}`;
  if (!PUBLISHED_FACES.has(key)) return null;
  return `/phenotype-faces/${slug}-${gender === "male" ? "m" : "f"}.webp`;
};

/**
 * A ESCALA. Sete passos, com o ponto neutro no meio, porque uma escala par
 * força um lado e uma mais longa não acrescenta precisão que alguém consiga
 * usar de forma consistente num rosto.
 *
 * O valor gravado é 1–7; os rótulos existem só para a interface.
 */
export const RATING_MIN = 1;
export const RATING_MAX = 7;
export const RATING_NEUTRAL = 4;

export const RATING_LABELS: Record<number, string> = {
  1: "Not at all",
  2: "Barely",
  3: "A little",
  4: "Neutral",
  5: "Somewhat",
  6: "Very",
  7: "Extremely",
};

/** Quantos votantes distintos a amostra precisa antes de mostrar percentil. */
export const SAMPLE_THRESHOLD = 10;

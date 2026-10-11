/**
 * OS DEZ TRAÇOS FÍSICOS (traits.ts)
 *
 * Uma fonte só para o voto, a página do perfil e a landing. Cada opção tem
 * dois nomes:
 *
 *   value — o texto gravado em `votes.classification`. Não pode mudar sem
 *           migrar os votos existentes.
 *   label — o nome de exibição, em palavras comuns; o termo técnico, quando
 *           existe, vai em `sub` e aparece em itálico.
 *
 * A ordem das opções é a ordem da escala (de um extremo ao outro): é ela que
 * define a posição de cada faixa no "trait strip".
 */

export interface TraitOption {
  value: string;
  label: string;
  sub?: string;
}

export interface TraitDef {
  /** `votes.characteristic_type` */
  key: string;
  title: string;
  /** Rótulo curto sob a faixa do cromossomo na página do perfil. */
  short: string;
  help: string;
  /** Rótulos dos dois extremos da escala. */
  ends: [string, string];
  options: TraitOption[];
  /**
   * Quando `sub` é um qualificador ("Wavy, medium") e não um termo técnico,
   * ele faz parte do nome curto da opção.
   */
  subIsQualifier?: boolean;
}

export const TRAITS: TraitDef[] = [
  {
    key: "Skin Color",
    title: "Skin color",
    short: "skin",
    help: "Judge the face, not the lighting.",
    ends: ["pale", "black"],
    options: [
      { value: "Pale", label: "Pale" },
      { value: "Fair", label: "Fair" },
      { value: "Light brown", label: "Light brown" },
      { value: "Olive Skin", label: "Olive" },
      { value: "Medium brown", label: "Medium brown" },
      { value: "Dark brown", label: "Dark brown" },
      { value: "Black", label: "Black" },
    ],
  },
  {
    key: "Hair Color",
    title: "Hair color",
    short: "hair",
    help: "Natural color if you can tell.",
    ends: ["light blonde", "black"],
    options: [
      { value: "Light Blonde", label: "Light blonde" },
      { value: "Blonde", label: "Blonde" },
      { value: "Dark Blonde", label: "Dark blonde" },
      { value: "Red", label: "Red" },
      { value: "Light Brown", label: "Light brown" },
      { value: "Brown", label: "Brown" },
      { value: "Dark Brown", label: "Dark brown" },
      { value: "Black", label: "Black" },
    ],
  },
  {
    key: "Hair Texture",
    title: "Hair texture",
    short: "texture",
    help: "Pick the closest match.",
    ends: ["straight", "kinky"],
    subIsQualifier: true,
    options: [
      { value: "Straight (Fine/Thin)", label: "Straight", sub: "fine" },
      { value: "Straight (Medium)", label: "Straight", sub: "medium" },
      { value: "Straight (Coarse)", label: "Straight", sub: "coarse" },
      { value: "Wavy (Fine/Thin)", label: "Wavy", sub: "fine" },
      { value: "Wavy (Medium)", label: "Wavy", sub: "medium" },
      { value: "Wavy (Coarse)", label: "Wavy", sub: "coarse" },
      { value: "Curly (Loose)", label: "Curly", sub: "loose" },
      { value: "Curly (Tight)", label: "Curly", sub: "tight" },
      { value: "Kinky (Soft)", label: "Kinky", sub: "soft" },
      { value: "Kinky (Wiry)", label: "Kinky", sub: "wiry" },
    ],
  },
  {
    key: "Head Type",
    title: "Head type",
    short: "head",
    help: "Length of the skull, seen from above.",
    ends: ["very long", "very short"],
    options: [
      { value: "Hyperdolichocephalic (Very Long)", label: "Very long", sub: "hyperdolichocephalic" },
      { value: "Dolichocephalic (Long)", label: "Long", sub: "dolichocephalic" },
      { value: "Mesocephalic (Medium)", label: "Medium", sub: "mesocephalic" },
      { value: "Brachycephalic (Short)", label: "Short", sub: "brachycephalic" },
      { value: "Hyperbrachycephalic (Very Short)", label: "Very short", sub: "hyperbrachycephalic" },
    ],
  },
  {
    key: "Body Type",
    title: "Body type",
    short: "body",
    help: "Only if the body is visible. Otherwise, skip.",
    ends: ["ectomorph", "endomorph"],
    options: [
      { value: "Ectomorph", label: "Ectomorph", sub: "slender" },
      { value: "Mesomorph", label: "Mesomorph", sub: "muscular" },
      { value: "Endomorph", label: "Endomorph", sub: "rounded" },
    ],
  },
  {
    key: "Nasal Breadth",
    title: "Nasal breadth",
    short: "nose",
    help: "Width of the nose relative to its height.",
    ends: ["very narrow", "very wide"],
    options: [
      { value: "Hyperleptorrhine (very narrow)", label: "Very narrow", sub: "hyperleptorrhine" },
      { value: "Leptorrhine (narrow)", label: "Narrow", sub: "leptorrhine" },
      { value: "Mesorrhine (medium-wide)", label: "Medium", sub: "mesorrhine" },
      { value: "Platyrrhine (wide)", label: "Wide", sub: "platyrrhine" },
      { value: "Hyperplatyrrhine (very wide)", label: "Very wide", sub: "hyperplatyrrhine" },
    ],
  },
  {
    key: "Facial Breadth",
    title: "Facial breadth",
    short: "face",
    help: "Height of the face relative to its width.",
    ends: ["long", "broad"],
    options: [
      { value: "Leptoprosop (Long)", label: "Long", sub: "leptoprosop" },
      { value: "Mesoprosop (Medium)", label: "Medium", sub: "mesoprosop" },
      { value: "Euryprosop (Broad)", label: "Broad", sub: "euryprosop" },
    ],
  },
  {
    key: "Jaw Type",
    title: "Jaw type",
    short: "jaw",
    help: "Seen in profile: where the jaw sits.",
    ends: ["backward", "projecting"],
    options: [
      { value: "Retrognathous (Backward)", label: "Backward", sub: "retrognathous" },
      { value: "Orthognathous (Straight)", label: "Straight", sub: "orthognathous" },
      { value: "Prognathous (Projecting)", label: "Projecting", sub: "prognathous" },
    ],
  },
  {
    key: "Eye Color",
    title: "Eye color",
    short: "eyes",
    help: "Look at the iris, not the shadow around it.",
    ends: ["light blue", "black"],
    options: [
      { value: "Light-blue", label: "Light blue" },
      { value: "Blue", label: "Blue" },
      { value: "Dark-blue", label: "Dark blue" },
      { value: "Gray", label: "Gray" },
      { value: "Green", label: "Green" },
      { value: "Hazel", label: "Hazel" },
      { value: "Light-brown", label: "Light brown" },
      { value: "Medium-brown", label: "Medium brown" },
      { value: "Dark-brown", label: "Dark brown" },
      { value: "Black-brown", label: "Black-brown" },
      { value: "Black", label: "Black" },
    ],
  },
  {
    key: "Head Breadth",
    title: "Head breadth",
    short: "breadth",
    help: "Size of the head relative to the body.",
    ends: ["small", "large"],
    options: [
      { value: "Small-headed", label: "Small" },
      { value: "Medium-headed", label: "Medium" },
      { value: "Large-headed", label: "Large" },
    ],
  },
];

export const TRAIT_KEYS = TRAITS.map((trait) => trait.key);

const TRAIT_BY_KEY = new Map(TRAITS.map((trait) => [trait.key, trait]));

export const traitByKey = (key: string): TraitDef | undefined => TRAIT_BY_KEY.get(key);

/** Nome de exibição de um valor gravado; o próprio valor quando desconhecido. */
export const traitOptionLabel = (key: string, value: string): string => {
  const trait = TRAIT_BY_KEY.get(key);
  const option = trait?.options.find((item) => item.value === value);
  if (!option) return value;
  return option.sub && trait?.subIsQualifier ? `${option.label}, ${option.sub}` : option.label;
};

/** As características de classificação, que ficam no braço curto. */
export const CLASSIFICATION_KEYS = [
  "Primary Geographic",
  "Secondary Geographic",
  "Tertiary Geographic",
  "Primary Phenotype",
  "Secondary Phenotype",
  "Tertiary Phenotype",
] as const;

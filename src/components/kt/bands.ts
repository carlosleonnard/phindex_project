/**
 * FAIXAS (bands.ts)
 *
 * O vocabulário do ideograma: cores das faixas e geradores de gradiente com
 * paradas duras. Um cromossomo é uma cápsula com faixas; aqui as faixas viram
 * `linear-gradient` com transições instantâneas, o que dispensa um elemento por
 * faixa nos casos estáticos.
 *
 * Regra do sistema: toda faixa carrega um dado — uma fatia de votos, um nível
 * de consenso, uma etapa. Faixas decorativas só onde desenham anatomia real.
 */

export const KT = {
  paper: "#F9FAFB",
  sheet: "#FFFFFF",
  wash: "#F0F4F4",
  wash2: "#E8EEEF",
  seg: "#E3ECEE",
  rule: "#DCE0E5",
  ink: "#192A43",
  slate: "#304A50",
  body: "#4F6772",
  mute: "#6C8C93",
  teal: "#287A8A",
  glow: "#349DB2",
  deep: "#001F23",
  deep2: "#0A363D",
  b25: "#C9DEE2",
  b50: "#94BCC5",
  b75: "#5E9BA7",
} as const;

/** Gradiente de paradas duras a partir de pares [cor, fim em %]. */
export const bandGradient = (stops: Array<[string, number]>, direction = "90deg"): string =>
  `linear-gradient(${direction},${stops.map(([color, end]) => `${color} 0 ${end}%`).join(",")})`;

/** Faixas de largura igual, uma por cor. */
export const equalBands = (colors: string[], direction = "90deg"): string =>
  bandGradient(
    colors.map((color, index) => [color, Number((((index + 1) / colors.length) * 100).toFixed(3))]),
    direction
  );

/** Divisórias finas a cada 100/n % — sobrepostas às faixas. */
export const bandSeparators = (n: number, color: string = KT.sheet, width = 1): string => {
  const step = (100 / n).toFixed(4);
  return `repeating-linear-gradient(90deg,transparent 0 calc(${step}% - ${width}px),${color} calc(${step}% - ${width}px) ${step}%)`;
};

/** Hachura de "sem votos ainda". */
export const HATCH = `repeating-linear-gradient(45deg,${KT.sheet} 0 4px,${KT.rule} 4px 5px)`;
export const HATCH_SOFT = `repeating-linear-gradient(45deg,${KT.sheet} 0 4px,${KT.wash2} 4px 5px)`;

/**
 * Tom de uma opção na faixa de traço, pela fatia de votos que recebeu:
 * 0 · abaixo de 10 · abaixo de 25 · abaixo de 45 · 45 ou mais.
 */
export const shareShade = (pct: number): string => {
  if (pct <= 0) return KT.sheet;
  if (pct < 10) return KT.b25;
  if (pct < 25) return KT.b50;
  if (pct < 45) return KT.b75;
  return KT.ink;
};

/**
 * Nível de consenso de uma característica: assentado (60%+), inclinado
 * (45–59%) ou dividido (abaixo de 45%). `null` quando ninguém votou.
 */
export const consensusShade = (pct: number | null): string | null => {
  if (pct === null || Number.isNaN(pct)) return null;
  if (pct >= 60) return KT.ink;
  if (pct >= 45) return KT.b75;
  return KT.b50;
};

/** Tons por posição num ranking (1º mais escuro), para barras empilhadas. */
export const RANK_SHADES = [KT.ink, KT.b75, KT.b50, KT.b25];

/** Tom de um jogo pela precisão: 80%+ · 60–79 · 40–59 · abaixo de 40. */
export const accuracyShade = (pct: number): string => {
  if (pct >= 80) return KT.ink;
  if (pct >= 60) return KT.b75;
  if (pct >= 40) return KT.b50;
  return KT.b25;
};

/**
 * Faixas decorativas do ideograma do herói e da espinha da landing — anatomia
 * de um cromossomo, não dados.
 */
export const DECOR = {
  heroP: bandGradient([
    [KT.sheet, 7], [KT.b50, 11], [KT.sheet, 17], [KT.ink, 24], [KT.sheet, 29], [KT.b25, 33],
    [KT.sheet, 41], [KT.b75, 49], [KT.sheet, 55], [KT.ink, 63], [KT.sheet, 68], [KT.b50, 75],
    [KT.sheet, 83], [KT.b75, 90], [KT.sheet, 93], [KT.teal, 100],
  ]),
  heroQ: bandGradient([
    [KT.teal, 4], [KT.sheet, 9], [KT.ink, 15], [KT.sheet, 19], [KT.b25, 24], [KT.sheet, 31],
    [KT.b75, 38], [KT.sheet, 41], [KT.b50, 46], [KT.sheet, 53], [KT.ink, 61], [KT.sheet, 66],
    [KT.b25, 70], [KT.sheet, 76], [KT.b75, 83], [KT.sheet, 87], [KT.ink, 92], [KT.sheet, 100],
  ]),
  spineP: bandGradient(
    [[KT.sheet, 10], [KT.b50, 18], [KT.sheet, 28], [KT.ink, 40], [KT.sheet, 52], [KT.b75, 64], [KT.sheet, 82], [KT.teal, 100]],
    "180deg"
  ),
  spineQ: bandGradient(
    [
      [KT.teal, 1.5], [KT.sheet, 5], [KT.ink, 8], [KT.sheet, 12], [KT.b25, 15], [KT.sheet, 20],
      [KT.b75, 24], [KT.sheet, 28], [KT.b50, 31], [KT.sheet, 37], [KT.ink, 41], [KT.sheet, 45],
      [KT.b25, 49], [KT.sheet, 54], [KT.b75, 59], [KT.sheet, 62], [KT.ink, 66], [KT.sheet, 71],
      [KT.b50, 75], [KT.sheet, 80], [KT.b75, 85], [KT.sheet, 88], [KT.ink, 92], [KT.sheet, 100],
    ],
    "180deg"
  ),
  miniP: bandGradient([[KT.sheet, 30], [KT.ink, 55], [KT.sheet, 75], [KT.teal, 100]]),
  miniQ: bandGradient([[KT.teal, 12], [KT.sheet, 35], [KT.b75, 55], [KT.sheet, 70], [KT.ink, 86], [KT.sheet, 100]]),
};

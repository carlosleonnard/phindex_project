/**
 * O VOTO, PASSO A PASSO (VoteModal.tsx)
 *
 * Doze perguntas, uma por vez, e um cromossomo no topo que se preenche faixa
 * a faixa. O braço curto são as três respostas obrigatórias — região,
 * fenótipo geral e fenótipo específico —, o braço longo os dez traços, que se
 * pode pular. Tocar numa faixa volta à pergunta.
 *
 * PRIMÁRIO, SECUNDÁRIO, TERCIÁRIO. Um rosto pode mostrar traços de até três
 * regiões e três fenótipos, então região e fenótipo aceitam até três
 * escolhas, em ordem de força: a primeira é a que aparece mais forte e é a
 * única obrigatória; a segunda e a terceira são opcionais. Completar uma
 * posição passa para a seguinte.
 *
 * GERAL → ESPECÍFICO, NA MESMA PERGUNTA. Tocar num grupo (Nordid) abre os
 * subtipos DELE; escolhido o subtipo, a pergunta passa para a 2ª posição —
 * grupo, subtipo — e depois para a 3ª. Grupos sem subtipos (Khoid, Hadza…) já
 * são a resposta específica. Na 2ª e na 3ª posição o subtipo é opcional.
 *
 * O QUE SE GRAVA. Uma linha por posição em Primary/Secondary/Tertiary
 * Phenotype, como antes: o subtipo quando escolhido, senão o grupo. O nível
 * geral sai do subtipo pela taxonomia (cada subtipo pertence a um grupo só),
 * então o banco não muda e os votos antigos continuam valendo.
 *
 * A leitura da comunidade fica escondida até o voto ser enviado — para não
 * puxar a resposta — e só então aparece a comparação: onde você concordou com
 * a maioria e onde leu diferente.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GEOGRAPHIC_OPTIONS, PHENOTYPE_GROUPS, phenotypeGroupOf, subgroupsOf } from "@/constants/taxonomy";
import { CONTINENT_ORDER, continentOf, type Continent } from "@/constants/regions";
import { TRAITS, traitOptionLabel } from "@/constants/traits";
import { toGeneralShares, toSpecificShares } from "@/lib/phenotype-levels";
import { CenButton } from "@/components/kt/Centromere";
import { FacePhoto, REGION_HEX, RegionDot, SC } from "@/components/kt/Misc";
import { KT } from "@/components/kt/bands";
import { cn } from "@/lib/utils";

interface VoteShareLike {
  classification: string;
  count: number;
  percentage: number;
}

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Grava os votos (chaves gravadas, não as internas); devolve false se o voto principal falhou. */
  onSubmit: (votes: Record<string, string>) => Promise<boolean | void> | boolean | void;
  /** Depois da comparação, ao fechar — a página recarrega a leitura. */
  onFinished?: () => void;
  existingVotes?: Record<string, string>;
  profileId: string;
  /** A leitura atual, usada só na comparação depois do envio. */
  community?: {
    geographic: Record<string, VoteShareLike[]>;
    phenotype: Record<string, VoteShareLike[]>;
    physical: Array<{ name: string; votes: Array<{ option: string; count: number }> }>;
  };
  profileImages?: {
    frontImage: string;
    profileImage?: string;
    profileName: string;
    ancestry?: string;
  };
}

type StepKind = "region" | "phenotype" | "trait";
type BandKind = "region" | "general" | "specific" | "trait";

/** Uma tela do modal. */
interface Step {
  kind: StepKind;
  key: string;
  title: string;
  help: string;
}

/** Uma faixa do cromossomo e uma linha da revisão: uma resposta. */
interface Band {
  kind: BandKind;
  key: string;
  title: string;
  /** A tela onde essa resposta é dada. */
  step: number;
}

/** Posições, em ordem de força. */
const RANKS = [0, 1, 2] as const;
const RANK_LABEL = ["1st", "2nd", "3rd"];

/** Gravadas no banco. */
const REGION_KEYS = ["Primary Geographic", "Secondary Geographic", "Tertiary Geographic"];
const PHENOTYPE_KEYS = ["Primary Phenotype", "Secondary Phenotype", "Tertiary Phenotype"];
/** Só do modal: o banco recebe um nome por posição em PHENOTYPE_KEYS. */
const GENERAL_KEYS = ["Primary General", "Secondary General", "Tertiary General"];
const SPECIFIC_KEYS = ["Primary Specific", "Secondary Specific", "Tertiary Specific"];

const STEPS: Step[] = [
  {
    kind: "region",
    key: "Primary Geographic",
    title: "Region",
    help: "Where does this face most likely come from? Pick the closest sub-region; if it mixes, add a second and third.",
  },
  {
    kind: "phenotype",
    key: "Primary Phenotype",
    title: "Phenotype",
    help: "Pick the group this face reads as most strongly, then the subtype within it. If it shows traits of other groups, add them second and third.",
  },
  ...TRAITS.map((trait) => ({
    kind: "trait" as const,
    key: trait.key,
    title: trait.title,
    help: trait.help,
  })),
];

/** Três faixas no braço curto — as três respostas obrigatórias —, dez no longo. */
const BANDS: Band[] = [
  { kind: "region", key: "Primary Geographic", title: "Region", step: 0 },
  { kind: "general", key: "Primary General", title: "General phenotype", step: 1 },
  { kind: "specific", key: "Primary Specific", title: "Specific phenotype", step: 1 },
  ...TRAITS.map((trait, index) => ({ kind: "trait" as const, key: trait.key, title: trait.title, step: 2 + index })),
];
const SHORT_ARM = 3;

const REVIEW = STEPS.length;
const DONE = STEPS.length + 1;

const BAND = {
  answered: KT.ink,
  current: KT.glow,
  skipped: KT.rule,
  pending: KT.sheet,
  match: KT.ink,
  differs: KT.b50,
};

/** Votos gravados → chaves do modal: o nome de cada posição vira grupo + subtipo. */
const fromStored = (stored: Record<string, string>): Record<string, string> => {
  const out = Object.fromEntries(Object.entries(stored).filter(([, value]) => Boolean(value)));
  PHENOTYPE_KEYS.forEach((key, rank) => {
    const value = out[key];
    delete out[key];
    if (!value) return;
    const group = phenotypeGroupOf(value);
    out[GENERAL_KEYS[rank]] = group;
    if (group.toLowerCase() !== value.toLowerCase()) out[SPECIFIC_KEYS[rank]] = value;
  });
  return out;
};

/** Chaves do modal → votos gravados: o subtipo quando há, senão o grupo. */
const toStored = (votes: Record<string, string>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(votes)) {
    if (GENERAL_KEYS.includes(key) || SPECIFIC_KEYS.includes(key) || !value) continue;
    out[key] = value;
  }
  GENERAL_KEYS.forEach((key, rank) => {
    const group = votes[key];
    if (group) out[PHENOTYPE_KEYS[rank]] = votes[SPECIFIC_KEYS[rank]] || group;
  });
  return out;
};

/** O subtipo de uma posição: o escolhido, ou o próprio grupo quando ele não tem subtipos. */
const specificValue = (votes: Record<string, string>, rank: number): string | null => {
  const group = votes[GENERAL_KEYS[rank]];
  if (!group) return null;
  if (subgroupsOf(group).length === 0) return group;
  return votes[SPECIFIC_KEYS[rank]] ?? null;
};

const isStepAnswered = (item: Step, votes: Record<string, string>) =>
  item.kind === "phenotype" ? specificValue(votes, 0) !== null : Boolean(votes[item.key]);

const isBandAnswered = (band: Band, votes: Record<string, string>) =>
  band.kind === "specific" ? specificValue(votes, 0) !== null : Boolean(votes[band.key]);

/**
 * O que uma posição do fenótipo mostra ao abrir: os subtipos, quando o grupo
 * já foi escolhido e falta o subtipo; senão a lista de grupos.
 */
const levelFor = (votes: Record<string, string>, rank: number): "group" | "subtype" => {
  const group = votes[GENERAL_KEYS[rank]];
  return group && subgroupsOf(group).length > 0 && !votes[SPECIFIC_KEYS[rank]] ? "subtype" : "group";
};

const optionRow = (selected: boolean) =>
  cn(
    "mb-2 flex min-h-[54px] w-full items-center gap-3.5 rounded-full border-[1.5px] py-2 pl-4 pr-[18px] text-left font-[inherit] text-[17px] leading-[1.2] transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-45",
    selected ? "border-kt-ink bg-kt-ink text-kt-paper" : "border-kt-rule bg-white text-kt-ink hover:border-kt-b50"
  );

/** Glifo de posição na escala: a banda da opção acesa entre as demais. */
const ScaleGlyph = ({ index, count, selected }: { index: number; count: number; selected: boolean }) => {
  const from = ((index / count) * 100).toFixed(2);
  const to = (((index + 1) / count) * 100).toFixed(2);
  const base = selected ? KT.ink : KT.sheet;
  const mark = selected ? KT.glow : KT.ink;
  return (
    <span
      aria-hidden="true"
      className="block h-[11px] w-8 shrink-0 box-border rounded-full border border-current"
      style={{ background: `linear-gradient(90deg,${base} 0 ${from}%,${mark} 0 ${to}%,${base} 0 100%)` }}
    />
  );
};

const PhenotypeGlyph = ({ selected }: { selected: boolean }) => (
  <span
    aria-hidden="true"
    className="block h-[11px] w-8 shrink-0 box-border rounded-full border border-current"
    style={{
      background: selected
        ? `linear-gradient(90deg,${KT.ink} 0 30%,${KT.glow} 0 60%,${KT.ink} 0 100%)`
        : `linear-gradient(90deg,${KT.sheet} 0 30%,${KT.b50} 0 60%,${KT.sheet} 0 100%)`,
    }}
  />
);

/**
 * As três posições de uma pergunta. A segunda só abre depois da primeira, a
 * terceira depois da segunda — a mesma ordem de força do voto.
 */
const RankTabs = ({
  label,
  active,
  onSelect,
  valueOf,
  captionOf,
  disabledOf,
}: {
  label: string;
  active: number;
  onSelect: (rank: number) => void;
  valueOf: (rank: number) => string | null;
  captionOf: (rank: number) => string;
  disabledOf: (rank: number) => boolean;
}) => (
  <div role="tablist" aria-label={label} className="grid grid-cols-3 gap-1.5">
    {RANKS.map((rank) => {
      const value = valueOf(rank);
      const selected = active === rank;
      return (
        <button
          key={rank}
          type="button"
          role="tab"
          aria-selected={selected}
          disabled={disabledOf(rank)}
          onClick={() => onSelect(rank)}
          className={cn(
            "flex min-h-[54px] min-w-0 flex-col items-start justify-center gap-0.5 rounded-[14px] border-[1.5px] px-3 py-1.5 text-left font-[inherit] transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-40",
            selected ? "border-kt-ink bg-white" : "border-kt-rule bg-kt-paper hover:border-kt-b50"
          )}
        >
          <span className="w-full truncate font-sc text-[12px] tracking-[0.06em] text-kt-teal">{captionOf(rank)}</span>
          <span className={cn("w-full truncate text-[15px] leading-[1.2]", value ? "text-kt-ink" : "italic text-kt-body")}>
            {value ?? (rank === 0 ? "choose" : "optional")}
          </span>
        </button>
      );
    })}
  </div>
);

export const VoteModal = ({
  isOpen,
  onClose,
  onSubmit,
  onFinished,
  existingVotes = {},
  profileId,
  community,
  profileImages,
}: VoteModalProps) => {
  const storageKey = `pendingVotes_${profileId}`;
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [step, setStep] = useState(0);
  /** Qual posição (1ª, 2ª, 3ª) a pergunta atual está editando. */
  const [rank, setRank] = useState(0);
  /** No fenótipo: a lista de grupos, ou os subtipos do grupo da posição. */
  const [level, setLevel] = useState<"group" | "subtype">("group");
  const [continent, setContinent] = useState<Continent>("Africa");
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const advanceTimer = useRef<number>();

  // Abre com os votos já gravados e, por cima, o rascunho local. Rascunhos de
  // antes do voto em dois níveis ainda trazem "Primary Phenotype": fromStored
  // traduz os dois formatos.
  useEffect(() => {
    if (!isOpen) return;
    let saved: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw);
    } catch {
      saved = {};
    }
    const merged = { ...fromStored(existingVotes), ...fromStored(saved) };
    setVotes(merged);
    setStep(0);
    setContinent(continentOf(merged["Primary Geographic"]) ?? "Africa");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(votes));
    } catch {
      // Sem armazenamento local, o rascunho só não sobrevive a um recarregamento.
    }
  }, [votes, storageKey]);

  // Cada pergunta abre na 1ª posição, com a busca limpa; no fenótipo, nos
  // subtipos se a 1ª ficou com grupo e sem subtipo.
  useEffect(() => {
    setRank(0);
    setQuery("");
    setLevel(levelFor(votes, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  const answeredCount = BANDS.filter((band) => isBandAnswered(band, votes)).length;
  const primariesDone = STEPS.slice(0, 2).every((item) => isStepAnswered(item, votes));

  const unskip = (key: string) =>
    setSkipped((previous) => {
      if (!previous.has(key)) return previous;
      const next = new Set(previous);
      next.delete(key);
      return next;
    });

  const setVote = (key: string, value: string) => {
    setVotes((previous) => {
      const next = { ...previous, [key]: value };
      if (!value) delete next[key];
      return next;
    });
    unskip(key);
  };

  /**
   * Completar uma posição passa para a seguinte (1ª → 2ª → 3ª), para a 2ª e
   * a 3ª aparecerem sem ninguém procurar a aba; na 3ª, fica. No fenótipo, a
   * posição nova abre na lista de grupos, com a busca limpa.
   */
  const advanceFrom = (position: number) => {
    if (position >= RANKS.length - 1) return;
    setRank(position + 1);
    setLevel("group");
    setQuery("");
  };

  const chooseRegion = (position: number, value: string) => {
    setVote(REGION_KEYS[position], value);
    advanceFrom(position);
  };

  /**
   * Tocar num grupo abre os subtipos dele, na mesma posição. Trocar o grupo
   * apaga o subtipo anterior, que pertencia ao outro grupo. Um grupo sem
   * subtipos já completa a posição.
   */
  const chooseGeneral = (position: number, group: string) => {
    setVotes((previous) => {
      if (previous[GENERAL_KEYS[position]] === group) return previous;
      const next = { ...previous, [GENERAL_KEYS[position]]: group };
      delete next[SPECIFIC_KEYS[position]];
      return next;
    });
    setQuery("");
    if (subgroupsOf(group).length > 0) setLevel("subtype");
    else advanceFrom(position);
  };

  const chooseSpecific = (position: number, subgroup: string) => {
    setVote(SPECIFIC_KEYS[position], subgroup);
    advanceFrom(position);
  };

  /** Na 2ª e na 3ª o subtipo é opcional: fica só o grupo, e a pergunta segue. */
  const keepGroupOnly = (position: number) => {
    setVotes((previous) => {
      const next = { ...previous };
      delete next[SPECIFIC_KEYS[position]];
      return next;
    });
    advanceFrom(position);
  };

  /**
   * Tira a escolha de uma posição opcional. As de baixo sobem uma casa, para
   * não sobrar uma 3ª sem 2ª; no fenótipo, o subtipo sobe junto com o grupo.
   */
  const removeRank = (kind: StepKind, position: number) => {
    setVotes((previous) => {
      const next = { ...previous };
      const columns = kind === "region" ? [REGION_KEYS] : [GENERAL_KEYS, SPECIFIC_KEYS];
      for (const keys of columns) {
        for (let index = position; index < keys.length - 1; index++) {
          if (next[keys[index + 1]]) next[keys[index]] = next[keys[index + 1]];
          else delete next[keys[index]];
        }
        delete next[keys[keys.length - 1]];
      }
      return next;
    });
    setLevel("group");
  };

  /** Próxima pergunta sem resposta, ou a revisão. */
  const nextOpen = (from: number, current: Record<string, string>) => {
    for (let index = from; index < STEPS.length; index++) {
      if (!isStepAnswered(STEPS[index], current) && !skipped.has(STEPS[index].key)) return index;
    }
    return REVIEW;
  };

  const pickTrait = (key: string, value: string) => {
    setVote(key, value);
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      setStep((current) => nextOpen(current + 1, { ...votes, [key]: value }));
    }, 200);
  };

  const skip = () => {
    const key = STEPS[step].key;
    setSkipped((previous) => new Set(previous).add(key));
    setStep((current) => nextOpen(current + 1, votes));
  };

  /** Resposta da comunidade antes deste voto, por resposta. */
  const communityTop = (band: Band): string | null => {
    if (!community) return null;
    if (band.kind === "region") return community.geographic["Primary Geographic"]?.[0]?.classification ?? null;
    if (band.kind === "general")
      return toGeneralShares(community.phenotype["Primary Phenotype"])[0]?.classification ?? null;
    if (band.kind === "specific")
      return toSpecificShares(community.phenotype["Primary Phenotype"])[0]?.classification ?? null;
    const list = community.physical.find((entry) => entry.name === band.key)?.votes ?? [];
    const top = [...list].sort((a, b) => b.count - a.count)[0];
    return top?.option ?? null;
  };

  /** As três posições de uma resposta do braço curto, como texto. */
  const bandValues = (band: Band): Array<string | null> => {
    if (band.kind === "region") return REGION_KEYS.map((key) => votes[key] ?? null);
    if (band.kind === "general") return GENERAL_KEYS.map((key) => votes[key] ?? null);
    if (band.kind === "specific") return RANKS.map((position) => specificValue(votes, position));
    return [votes[band.key] ?? null];
  };

  const summary = BANDS.map((band) => {
    const values = bandValues(band);
    const yours = values[0];
    const top = communityTop(band);
    const label = (value: string) => (band.kind === "trait" ? traitOptionLabel(band.key, value) : value);
    return {
      key: band.key,
      title: band.title,
      yours: yours ? label(yours) : null,
      also: values.slice(1).filter((value): value is string => Boolean(value)),
      community: top ? label(top) : null,
      match: Boolean(yours && top && yours === top),
      firstVote: Boolean(yours && !top),
    };
  });
  const comparable = summary.filter((row) => row.yours && row.community);
  const matches = comparable.filter((row) => row.match).length;

  const bandColor = (index: number) => {
    const band = BANDS[index];
    if (step === DONE) {
      const row = summary[index];
      if (!row.yours) return BAND.skipped;
      if (!row.community) return BAND.answered;
      return row.match ? BAND.match : BAND.differs;
    }
    if (band.step === step) return BAND.current;
    if (isBandAnswered(band, votes)) return BAND.answered;
    if (skipped.has(band.key)) return BAND.skipped;
    return BAND.pending;
  };

  const handleSubmit = async () => {
    if (!primariesDone || submitting) return;
    setSubmitting(true);
    try {
      const result = await onSubmit(toStored(votes));
      if (result === false) return;
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignorado
      }
      setStep(DONE);
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    if (step === DONE) onFinished?.();
    onClose();
  };

  const current = step < STEPS.length ? STEPS[step] : null;

  /** Grupos para a posição atual; a busca acha o grupo também pelo nome de um subtipo. */
  const generalResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PHENOTYPE_GROUPS.flatMap((group) => {
      if (!needle || group.toLowerCase().includes(needle)) return [{ group, via: null as string | null }];
      const via = subgroupsOf(group).find((name) => name.toLowerCase().includes(needle));
      return via ? [{ group, via }] : [];
    });
  }, [query]);

  // Trocar de aba: na região, o continente da escolha daquela posição; no
  // fenótipo, os subtipos se a posição tem grupo e falta o subtipo.
  const selectRank = (position: number) => {
    setRank(position);
    setQuery("");
    if (current?.kind === "region") {
      const chosen = continentOf(votes[REGION_KEYS[position]]);
      if (chosen) setContinent(chosen);
    }
    if (current?.kind === "phenotype") setLevel(levelFor(votes, position));
  };

  const progressLeft =
    step === DONE
      ? `All ${BANDS.length} bands · your read vs. the community`
      : step === REVIEW
        ? `Review · ${BANDS.length} bands`
        : `${STEPS[step].title} · ${step + 1} of ${STEPS.length}`;

  /** Em que posição um valor já está, para não escolher o mesmo duas vezes. */
  const takenAt = (keys: string[], value: string) => keys.findIndex((key, position) => position !== rank && votes[key] === value);

  const activeGroup = votes[GENERAL_KEYS[rank]];
  const activeSubgroups = activeGroup ? subgroupsOf(activeGroup) : [];
  const rankKeys = current?.kind === "region" ? REGION_KEYS : GENERAL_KEYS;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex h-[100dvh] max-w-[480px] flex-col gap-0 overflow-hidden border-kt-rule bg-kt-paper p-0 text-kt-ink sm:h-[min(860px,92vh)] [&>button]:hidden">
        <DialogTitle className="sr-only">Your read of {profileImages?.profileName ?? "this face"}</DialogTitle>
        <DialogDescription className="sr-only">
          Answer region and phenotype — the group, then the subtype within it — with up to three choices each, the
          first required; then up to ten physical traits. The community read stays hidden until you submit.
        </DialogDescription>

        {/* Cabeçalho */}
        <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-kt-rule pl-4 pr-1.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="block h-[38px] w-[38px] shrink-0 overflow-hidden rounded-[3px] bg-kt-wash">
              <FacePhoto src={profileImages?.frontImage} alt="" width={560} height={700} />
            </span>
            <div className="min-w-0">
              <p className="m-0 truncate text-[17px] leading-[1.15] text-kt-ink">{profileImages?.profileName}</p>
              <SC as="p" className="m-0 text-[13px] text-kt-body">
                your read
              </SC>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent text-kt-ink hover:bg-kt-wash2"
          >
            <X className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden="true" />
          </button>
        </header>

        {/* Cromossomo de progresso: uma faixa por resposta */}
        <div className="shrink-0 px-4 pb-3 pt-4">
          <div className="relative flex h-6">
            {[BANDS.slice(0, SHORT_ARM), BANDS.slice(SHORT_ARM)].map((arm, armIndex) => (
              <div
                key={armIndex}
                className={cn(
                  "box-border flex overflow-hidden rounded-full border-[1.5px] border-kt-ink",
                  armIndex === 0 ? "flex-[0_0_24%]" : "flex-1"
                )}
              >
                {arm.map((band, offset) => {
                  const index = armIndex === 0 ? offset : offset + SHORT_ARM;
                  return (
                    <button
                      key={band.key}
                      type="button"
                      aria-label={`Go to ${band.title}`}
                      disabled={step === DONE}
                      onClick={() => setStep(band.step)}
                      className="h-full flex-1 border-0 p-0 transition-colors"
                      style={{
                        background: bandColor(index),
                        borderLeft: offset > 0 ? `1px solid ${KT.b25}` : undefined,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3 text-[14px] text-kt-body">
            <span>
              {current ? (
                <>
                  <span className="text-[17px] font-medium text-kt-ink">{current.title}</span> · {step + 1} of{" "}
                  {STEPS.length}
                </>
              ) : (
                progressLeft
              )}
            </span>
            {step < REVIEW && <span>{answeredCount} answered</span>}
          </div>
        </div>

        {/* Pergunta */}
        {current && (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Sem cabeçalho visível: o nome da pergunta está na linha de
                progresso, e o espaço vai para a lista. Título e ajuda
                continuam para leitores de tela. */}
            <h2 className="sr-only">{current.title}</h2>
            <p className="sr-only">{current.help}</p>

            {/* Posições: 1ª obrigatória, 2ª e 3ª opcionais */}
            {current.kind !== "trait" && (
              <div className="shrink-0 px-4 pb-2.5">
                <RankTabs
                  label={`${current.title} choices`}
                  active={rank}
                  onSelect={selectRank}
                  valueOf={(position) =>
                    current.kind === "region" ? votes[REGION_KEYS[position]] ?? null : specificValue(votes, position)
                  }
                  captionOf={(position) =>
                    current.kind === "phenotype" && votes[GENERAL_KEYS[position]]
                      ? `${RANK_LABEL[position]} · ${votes[GENERAL_KEYS[position]]}`
                      : `${RANK_LABEL[position]}${position === 0 ? " · required" : ""}`
                  }
                  disabledOf={(position) => position > 0 && !votes[rankKeys[position - 1]]}
                />
                {rank > 0 && votes[rankKeys[rank]] && (
                  <button
                    type="button"
                    onClick={() => removeRank(current.kind, rank)}
                    className="mt-1.5 min-h-[32px] border-0 bg-transparent p-0 font-[inherit] text-[14px] text-kt-teal underline underline-offset-4"
                  >
                    remove {RANK_LABEL[rank]} choice
                  </button>
                )}
              </div>
            )}

            {current.kind === "region" && (
              <div
                role="group"
                aria-label="Continent"
                className="shrink-0 overflow-x-auto whitespace-nowrap px-4 pb-2.5 [scrollbar-width:none] sm:flex sm:flex-wrap sm:gap-y-2 sm:whitespace-normal [&::-webkit-scrollbar]:hidden"
              >
                {CONTINENT_ORDER.map((item) => {
                  const active = item === continent;
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setContinent(item)}
                      className={cn(
                        "mr-2 inline-flex min-h-10 items-center gap-[7px] rounded-full border px-3.5 font-[inherit] text-[16px]",
                        active ? "border-kt-ink bg-kt-ink text-kt-paper" : "border-kt-rule bg-white text-kt-slate"
                      )}
                    >
                      <RegionDot continent={item} size={7} ring={active} />
                      {item}
                    </button>
                  );
                })}
              </div>
            )}

            {current.kind === "phenotype" && level === "group" && (
              <div className="shrink-0 px-4 pb-2.5">
                <label htmlFor="pheno-search" className="sr-only">
                  Search phenotype groups
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-[15px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-kt-body"
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                  <input
                    id="pheno-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search a group, or one of its subtypes"
                    className="h-[46px] w-full rounded-full border border-kt-rule bg-white pl-[42px] pr-4 font-[inherit] text-[17px] text-kt-ink placeholder:text-kt-mute focus-visible:border-kt-teal focus-visible:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Nos subtipos: voltar aos grupos e, na 2ª e 3ª, seguir sem subtipo */}
            {current.kind === "phenotype" && level === "subtype" && activeGroup && (
              <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2.5">
                <button
                  type="button"
                  onClick={() => setLevel("group")}
                  className="inline-flex min-h-[44px] items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] text-[16px] text-kt-teal hover:text-kt-ink"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  change group
                </button>
                {rank > 0 && (
                  <button
                    type="button"
                    onClick={() => keepGroupOnly(rank)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] text-[16px] text-kt-teal hover:text-kt-ink"
                  >
                    skip subtype
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-1">
              {current.kind === "region" &&
                GEOGRAPHIC_OPTIONS[continent].map((option) => {
                  const selected = votes[REGION_KEYS[rank]] === option;
                  const taken = takenAt(REGION_KEYS, option);
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      disabled={taken >= 0}
                      onClick={() => chooseRegion(rank, option)}
                      className={optionRow(selected)}
                    >
                      <span
                        aria-hidden="true"
                        className="block h-[11px] w-8 shrink-0 box-border rounded-full border border-current"
                        style={{ background: REGION_HEX[continent] }}
                      />
                      <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                        <span>{option}</span>
                        {taken >= 0 && <SC className="text-[12px]">{RANK_LABEL[taken]}</SC>}
                      </span>
                    </button>
                  );
                })}

              {current.kind === "phenotype" &&
                level === "group" &&
                (generalResults.length === 0 ? (
                  <p className="mx-1 mt-2 text-[16px] text-kt-body">No group matches “{query}”. Try a shorter name.</p>
                ) : (
                  generalResults.map(({ group, via }) => {
                    const selected = votes[GENERAL_KEYS[rank]] === group;
                    const taken = takenAt(GENERAL_KEYS, group);
                    const count = subgroupsOf(group).length;
                    return (
                      <button
                        key={group}
                        type="button"
                        aria-pressed={selected}
                        disabled={taken >= 0}
                        onClick={() => chooseGeneral(rank, group)}
                        className={optionRow(selected)}
                      >
                        <PhenotypeGlyph selected={selected} />
                        <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span>{group}</span>
                            <span className="text-[14px] italic opacity-[.82]">
                              {via ? `includes ${via}` : count > 0 ? `${count} subtypes` : "no subtypes"}
                            </span>
                          </span>
                          {taken >= 0 && <SC className="text-[12px]">{RANK_LABEL[taken]}</SC>}
                        </span>
                      </button>
                    );
                  })
                ))}

              {current.kind === "phenotype" && level === "subtype" && activeGroup && (
                <>
                  <SC as="p" className="mx-1 mb-2 mt-1 text-[13px] text-kt-body">
                    subtypes within {activeGroup}
                  </SC>
                  {activeSubgroups.map((subgroup) => {
                    const selected = votes[SPECIFIC_KEYS[rank]] === subgroup;
                    return (
                      <button
                        key={subgroup}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => chooseSpecific(rank, subgroup)}
                        className={optionRow(selected)}
                      >
                        <PhenotypeGlyph selected={selected} />
                        <span>{subgroup}</span>
                      </button>
                    );
                  })}
                </>
              )}

              {current.kind === "trait" &&
                (() => {
                  const trait = TRAITS.find((item) => item.key === current.key)!;
                  return trait.options.map((option, index) => {
                    const selected = votes[trait.key] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => pickTrait(trait.key, option.value)}
                        className={optionRow(selected)}
                      >
                        <ScaleGlyph index={index} count={trait.options.length} selected={selected} />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span>{option.label}</span>
                          {option.sub && <span className="text-[14px] italic opacity-[.82]">{option.sub}</span>}
                        </span>
                      </button>
                    );
                  });
                })()}
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-kt-rule bg-kt-paper px-4 pb-[18px] pt-2.5">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                className="inline-flex min-h-[44px] items-center gap-1.5 border-0 bg-transparent px-1.5 font-[inherit] text-[17px] text-kt-ink disabled:opacity-40"
              >
                <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                back
              </button>
              {current.kind === "trait" ? (
                <button
                  type="button"
                  onClick={skip}
                  className="min-h-[44px] rounded-full border-[1.5px] border-kt-teal bg-transparent px-[18px] font-[inherit] text-[17px] text-kt-teal"
                >
                  skip this trait
                </button>
              ) : (
                <CenButton
                  size="sm"
                  disabled={!isStepAnswered(current, votes)}
                  onClick={() => setStep((value) => nextOpen(value + 1, votes))}
                >
                  next
                </CenButton>
              )}
            </footer>
          </div>
        )}

        {/* Revisão e comparação */}
        {!current && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2">
              <SC as="p" className="m-0 text-[14px] text-kt-teal">
                {step === DONE ? "read complete" : "review"}
              </SC>
              <h2 className="mb-0 mt-0.5 text-[34px] font-medium leading-[1.05] tracking-[-0.015em] text-kt-ink">
                {step === DONE ? "Your read is in." : "Your read, before it goes in."}
              </h2>
              <p className="mb-0 mt-2 text-[17px] leading-[1.45] text-kt-body">
                {step === DONE ? (
                  comparable.length > 0 ? (
                    <>
                      You matched the community on{" "}
                      <strong className="font-semibold text-kt-ink">
                        {matches} of {comparable.length}
                      </strong>{" "}
                      answers. Dark bands agree with the majority; pale ones don’t.
                    </>
                  ) : (
                    "Yours are among the first votes on this face — the community read starts with you."
                  )
                ) : primariesDone ? (
                  "Tap any band to change an answer. Skipped traits stay empty."
                ) : (
                  "The first choice of region and phenotype — group and subtype — is required. Tap their bands to answer them."
                )}
              </p>
              <ul className="m-0 mt-4 list-none p-0">
                {summary.map((row, index) => (
                  <li
                    key={row.key}
                    className="grid grid-cols-[14px_minmax(0,1fr)_auto] items-baseline gap-2.5 border-t border-kt-rule py-[9px]"
                  >
                    <span
                      aria-hidden="true"
                      className="block h-2 w-3.5 box-border rounded-full border border-kt-ink"
                      style={{ background: bandColor(index) === BAND.current ? BAND.pending : bandColor(index) }}
                    />
                    <button
                      type="button"
                      disabled={step === DONE}
                      onClick={() => setStep(BANDS[index].step)}
                      className="min-w-0 border-0 bg-transparent p-0 text-left font-[inherit] disabled:cursor-default"
                    >
                      <span className="block text-[16px] leading-[1.25] text-kt-ink">{row.title}</span>
                      {row.also.length > 0 && (
                        <span className="block text-[13px] text-kt-body">then {row.also.join(", ")}</span>
                      )}
                      {step === DONE && row.yours && (
                        <span className="block text-[13px] italic text-kt-body">
                          {row.firstVote
                            ? "first vote on this question"
                            : row.match
                              ? "matches the community"
                              : `community: ${row.community}`}
                        </span>
                      )}
                    </button>
                    <span className="text-right text-[15px] text-kt-ink">{row.yours ?? <em className="text-kt-body">skipped</em>}</span>
                  </li>
                ))}
              </ul>
            </div>
            <footer className="flex shrink-0 flex-col items-stretch gap-2.5 border-t border-kt-rule px-4 pb-[18px] pt-3">
              {step === DONE ? (
                <CenButton size="md" fullWidth onClick={close}>
                  see the community read
                </CenButton>
              ) : (
                <>
                  <CenButton size="md" fullWidth disabled={!primariesDone || submitting} onClick={handleSubmit}>
                    {submitting ? "sending…" : "submit your read"}
                  </CenButton>
                  <button
                    type="button"
                    onClick={() => setStep(STEPS.length - 1)}
                    className="min-h-[44px] border-0 bg-transparent font-[inherit] text-[16px] text-kt-teal underline underline-offset-4"
                  >
                    back to the questions
                  </button>
                </>
              )}
            </footer>
          </div>
        )}

        <span className="sr-only" aria-live="polite">
          {progressLeft}
        </span>
      </DialogContent>
    </Dialog>
  );
};

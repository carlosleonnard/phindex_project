/**
 * O VOTO, PASSO A PASSO (VoteModal.tsx)
 *
 * Doze perguntas, uma por vez, e um cromossomo no topo que se preenche faixa a
 * faixa: o braço curto são as duas obrigatórias (região e fenótipo), o braço
 * longo os dez traços, que se pode pular. Tocar numa faixa volta à pergunta.
 *
 * A leitura da comunidade fica escondida até o voto ser enviado — para não
 * puxar a resposta — e só então aparece a comparação: onde você concordou com
 * a maioria e onde leu diferente.
 *
 * Os valores gravados são os mesmos de antes (taxonomy.ts e traits.ts); os
 * rótulos de exibição usam palavras comuns e o termo técnico em itálico. As
 * segundas e terceiras escolhas de região e fenótipo continuam disponíveis,
 * como campos opcionais nas duas primeiras perguntas.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GEOGRAPHIC_OPTIONS, PHENOTYPE_ENTRIES, PHENOTYPE_GROUPS, ALL_SUBREGIONS } from "@/constants/taxonomy";
import { CONTINENT_ORDER, continentOf, type Continent } from "@/constants/regions";
import { TRAITS, traitOptionLabel } from "@/constants/traits";
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
  /** Grava os votos; devolve false se o voto principal falhou. */
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

interface Step {
  kind: StepKind;
  key: string;
  title: string;
  short: string;
  help: string;
}

const STEPS: Step[] = [
  {
    kind: "region",
    key: "Primary Geographic",
    title: "Region",
    short: "region",
    help: "Where does this face most likely come from? Pick the closest sub-region.",
  },
  {
    kind: "phenotype",
    key: "Primary Phenotype",
    title: "Phenotype",
    short: "phenotype",
    help: "Pick the group this face reads as most strongly.",
  },
  ...TRAITS.map((trait) => ({
    kind: "trait" as const,
    key: trait.key,
    title: trait.title,
    short: trait.short,
    help: trait.help,
  })),
];

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

const optionRow = (selected: boolean) =>
  cn(
    "mb-2 flex min-h-[54px] w-full items-center gap-3.5 rounded-full border-[1.5px] py-2 pl-4 pr-[18px] text-left font-[inherit] text-[17px] leading-[1.2] transition-colors",
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

const OptionalSelect = ({
  id,
  label,
  value,
  options,
  onChange,
  grouped,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  grouped?: Array<{ group: string; items: string[] }>;
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="font-sc text-[13px] tracking-[0.06em] text-kt-body">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full appearance-none rounded-full border border-kt-rule bg-white px-4 font-[inherit] text-[16px] text-kt-ink"
    >
      <option value="">none</option>
      {grouped
        ? grouped.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.items.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </optgroup>
          ))
        : options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
    </select>
  </div>
);

const PHENOTYPE_GROUPED = PHENOTYPE_GROUPS.map((group) => ({
  group,
  items: PHENOTYPE_ENTRIES.filter((entry) => entry.group === group).map((entry) => entry.name),
}));

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
  const [continent, setContinent] = useState<Continent>("Africa");
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const advanceTimer = useRef<number>();

  // Abre com os votos já gravados e, por cima, o rascunho local.
  useEffect(() => {
    if (!isOpen) return;
    let saved: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw);
    } catch {
      saved = {};
    }
    const merged = Object.fromEntries(
      Object.entries({ ...existingVotes, ...saved }).filter(([, value]) => Boolean(value))
    );
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

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  const answeredCount = STEPS.filter((item) => votes[item.key]).length;
  const primariesDone = Boolean(votes["Primary Geographic"] && votes["Primary Phenotype"]);

  const setVote = (key: string, value: string) => {
    setVotes((previous) => {
      const next = { ...previous, [key]: value };
      if (!value) delete next[key];
      // Trocar a escolha principal invalida as seguintes (mesma regra de antes).
      if (key === "Primary Geographic") {
        delete next["Secondary Geographic"];
        delete next["Tertiary Geographic"];
      } else if (key === "Primary Phenotype") {
        delete next["Secondary Phenotype"];
        delete next["Tertiary Phenotype"];
      } else if (key === "Secondary Geographic" && !value) {
        delete next["Tertiary Geographic"];
      } else if (key === "Secondary Phenotype" && !value) {
        delete next["Tertiary Phenotype"];
      }
      return next;
    });
    setSkipped((previous) => {
      if (!previous.has(key)) return previous;
      const next = new Set(previous);
      next.delete(key);
      return next;
    });
  };

  /** Próxima pergunta sem resposta, ou a revisão. */
  const nextOpen = (from: number, current: Record<string, string>) => {
    for (let index = from; index < STEPS.length; index++) {
      if (!current[STEPS[index].key] && !skipped.has(STEPS[index].key)) return index;
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

  /** Resposta da comunidade antes deste voto, por característica. */
  const communityTop = (key: string): string | null => {
    if (!community) return null;
    if (key === "Primary Geographic") return community.geographic[key]?.[0]?.classification ?? null;
    if (key === "Primary Phenotype") return community.phenotype[key]?.[0]?.classification ?? null;
    const list = community.physical.find((item) => item.name === key)?.votes ?? [];
    const top = [...list].sort((a, b) => b.count - a.count)[0];
    return top?.option ?? null;
  };

  const summary = STEPS.map((item) => {
    const yours = votes[item.key];
    const top = communityTop(item.key);
    const label = (value: string) => (item.kind === "trait" ? traitOptionLabel(item.key, value) : value);
    return {
      key: item.key,
      title: item.title,
      yours: yours ? label(yours) : null,
      community: top ? label(top) : null,
      match: Boolean(yours && top && yours === top),
      firstVote: Boolean(yours && !top),
    };
  });
  const comparable = summary.filter((row) => row.yours && row.community);
  const matches = comparable.filter((row) => row.match).length;

  const bandColor = (index: number) => {
    const item = STEPS[index];
    if (step === DONE) {
      const row = summary[index];
      if (!row.yours) return BAND.skipped;
      if (!row.community) return BAND.answered;
      return row.match ? BAND.match : BAND.differs;
    }
    if (index === step) return BAND.current;
    if (votes[item.key]) return BAND.answered;
    if (skipped.has(item.key)) return BAND.skipped;
    return BAND.pending;
  };

  const handleSubmit = async () => {
    if (!primariesDone || submitting) return;
    setSubmitting(true);
    try {
      const result = await onSubmit(votes);
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

  const phenotypeResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return PHENOTYPE_GROUPS.map((name) => ({ name, group: name, isGroup: true }));
    return PHENOTYPE_ENTRIES.filter(
      (entry) => entry.name.toLowerCase().includes(needle) || entry.group.toLowerCase().includes(needle)
    ).slice(0, 80);
  }, [query]);

  const progressLeft =
    step === DONE
      ? "All 12 bands · your read vs. the community"
      : step === REVIEW
        ? "Review · 12 bands"
        : `Band ${step + 1} of 12 · ${step < 2 ? "short arm" : "long arm"}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex h-[100dvh] max-w-[480px] flex-col gap-0 overflow-hidden border-kt-rule bg-kt-paper p-0 text-kt-ink sm:h-[min(860px,92vh)] [&>button]:hidden">
        <DialogTitle className="sr-only">Your read of {profileImages?.profileName ?? "this face"}</DialogTitle>
        <DialogDescription className="sr-only">
          Answer region and phenotype, then up to ten physical traits. The community read stays hidden until you
          submit.
        </DialogDescription>

        {/* Cabeçalho */}
        <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-kt-rule pl-4 pr-1.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="block h-[38px] w-[38px] shrink-0 overflow-hidden rounded-[3px] bg-kt-wash">
              <FacePhoto src={profileImages?.frontImage} alt="" />
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

        {/* Cromossomo de progresso */}
        <div className="shrink-0 px-4 pb-3 pt-4">
          <div className="relative flex h-6">
            {[STEPS.slice(0, 2), STEPS.slice(2)].map((arm, armIndex) => (
              <div
                key={armIndex}
                className={cn(
                  "box-border flex overflow-hidden rounded-full border-[1.5px] border-kt-ink",
                  armIndex === 0 ? "flex-[0_0_18%]" : "flex-1"
                )}
              >
                {arm.map((item, offset) => {
                  const index = armIndex === 0 ? offset : offset + 2;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-label={`Go to ${item.title}`}
                      disabled={step === DONE}
                      onClick={() => setStep(index)}
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
          <div className="mt-2 flex justify-between gap-3 text-[14px] text-kt-body">
            <span>{progressLeft}</span>
            {step < REVIEW && <span>{answeredCount} answered</span>}
          </div>
        </div>

        {/* Pergunta */}
        {current && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-4 pb-3 pt-1.5">
              <SC as="p" className="m-0 text-[14px] text-kt-teal">
                {step < 2 ? `p${step + 1} · short arm · required` : `q${step - 1} · long arm · optional`}
              </SC>
              <h2 className="mb-0 mt-0.5 text-[32px] font-medium leading-[1.05] tracking-[-0.015em] text-kt-ink">
                {current.title}
              </h2>
              <p className="mb-0 mt-1.5 text-[16px] italic leading-[1.4] text-kt-body">{current.help}</p>
              {step === 0 && (
                <p className="mb-0 mt-2.5 rounded-[3px] border border-dashed border-kt-b50 px-3 py-2 text-[14px] leading-[1.4] text-kt-slate">
                  The community read stays hidden until you finish, so it can’t sway your answers.
                </p>
              )}
            </div>

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

            {current.kind === "phenotype" && (
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
                    placeholder="Search groups and subgroups"
                    className="h-[46px] w-full rounded-full border border-kt-rule bg-white pl-[42px] pr-4 font-[inherit] text-[17px] text-kt-ink placeholder:text-kt-mute focus-visible:border-kt-teal focus-visible:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-1">
              {current.kind === "region" &&
                GEOGRAPHIC_OPTIONS[continent].map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={votes["Primary Geographic"] === option}
                    onClick={() => setVote("Primary Geographic", option)}
                    className={optionRow(votes["Primary Geographic"] === option)}
                  >
                    <span
                      aria-hidden="true"
                      className="block h-[11px] w-8 shrink-0 box-border rounded-full border border-current"
                      style={{ background: REGION_HEX[continent] }}
                    />
                    {option}
                  </button>
                ))}

              {current.kind === "phenotype" &&
                (phenotypeResults.length === 0 ? (
                  <p className="mx-1 mt-2 text-[16px] text-kt-body">No group matches “{query}”. Try a shorter name.</p>
                ) : (
                  phenotypeResults.map((entry) => {
                    const selected = votes["Primary Phenotype"] === entry.name;
                    return (
                      <button
                        key={`${entry.group}-${entry.name}`}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setVote("Primary Phenotype", entry.name)}
                        className={optionRow(selected)}
                      >
                        <span
                          aria-hidden="true"
                          className="block h-[11px] w-8 shrink-0 box-border rounded-full border border-current"
                          style={{
                            background: selected
                              ? `linear-gradient(90deg,${KT.ink} 0 30%,${KT.glow} 0 60%,${KT.ink} 0 100%)`
                              : `linear-gradient(90deg,${KT.sheet} 0 30%,${KT.b50} 0 60%,${KT.sheet} 0 100%)`,
                          }}
                        />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span>{entry.name}</span>
                          {!entry.isGroup && <span className="text-[14px] italic opacity-[.82]">{entry.group}</span>}
                        </span>
                      </button>
                    );
                  })
                ))}

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

              {/* Escolhas secundária e terciária, opcionais */}
              {current.kind === "region" && votes["Primary Geographic"] && (
                <div className="mt-3 grid gap-3 border-t border-kt-rule pt-3">
                  <OptionalSelect
                    id="second-region"
                    label="also reads as (optional)"
                    value={votes["Secondary Geographic"] ?? ""}
                    options={ALL_SUBREGIONS.filter((option) => option !== votes["Primary Geographic"])}
                    onChange={(value) => setVote("Secondary Geographic", value)}
                  />
                  {votes["Secondary Geographic"] && (
                    <OptionalSelect
                      id="third-region"
                      label="third choice (optional)"
                      value={votes["Tertiary Geographic"] ?? ""}
                      options={ALL_SUBREGIONS.filter(
                        (option) => option !== votes["Primary Geographic"] && option !== votes["Secondary Geographic"]
                      )}
                      onChange={(value) => setVote("Tertiary Geographic", value)}
                    />
                  )}
                </div>
              )}
              {current.kind === "phenotype" && votes["Primary Phenotype"] && (
                <div className="mt-3 grid gap-3 border-t border-kt-rule pt-3">
                  <OptionalSelect
                    id="second-phenotype"
                    label="also reads as (optional)"
                    value={votes["Secondary Phenotype"] ?? ""}
                    options={[]}
                    grouped={PHENOTYPE_GROUPED.map((group) => ({
                      group: group.group,
                      items: group.items.filter((item) => item !== votes["Primary Phenotype"]),
                    }))}
                    onChange={(value) => setVote("Secondary Phenotype", value)}
                  />
                  {votes["Secondary Phenotype"] && (
                    <OptionalSelect
                      id="third-phenotype"
                      label="third choice (optional)"
                      value={votes["Tertiary Phenotype"] ?? ""}
                      options={[]}
                      grouped={PHENOTYPE_GROUPED.map((group) => ({
                        group: group.group,
                        items: group.items.filter(
                          (item) => item !== votes["Primary Phenotype"] && item !== votes["Secondary Phenotype"]
                        ),
                      }))}
                      onChange={(value) => setVote("Tertiary Phenotype", value)}
                    />
                  )}
                </div>
              )}
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
                  disabled={!votes[current.key]}
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
                  "Region and phenotype are required. Tap their bands to answer them."
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
                      onClick={() => setStep(index)}
                      className="min-w-0 border-0 bg-transparent p-0 text-left font-[inherit] disabled:cursor-default"
                    >
                      <span className="block text-[16px] leading-[1.25] text-kt-ink">{row.title}</span>
                      {step === DONE && row.yours && (
                        <span className="block text-[13px] italic text-kt-body">
                          {row.firstVote
                            ? "first vote on this trait"
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

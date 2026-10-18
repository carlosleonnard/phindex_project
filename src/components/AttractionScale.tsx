/**
 * ESCALA DE ATRAÇÃO (AttractionScale.tsx)
 *
 * Três etapas numa página só:
 *   setup  — quais rostos (femininos, masculinos ou os dois) e quantos
 *   rate   — um rosto por vez, em ordem aleatória e sem rótulo, nota de 1 a 7
 *   result — o nome de cada fenótipo ao lado do rosto, top 5 e comparação
 *
 * O QUE ESTA PÁGINA MEDE, E O QUE NÃO MEDE:
 * O gosto de quem está olhando. Os rostos são sintéticos: cada um é uma
 * ilustração de um padrão, não uma pessoa, e nenhum deles existe. Uma média
 * alta diz que as pessoas deste site acharam aquele rosto atraente — não diz
 * nada sobre quem vive em região nenhuma. A interface repete isso no começo e
 * no resultado, porque é a leitura errada mais provável.
 *
 * Por isso a página também é `noindex`: é uma ferramenta pessoal para quem já
 * está no site, não material para a busca classificar.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CenButton, outlineCapsule } from "@/components/kt/Centromere";
import { FacePhoto, SC } from "@/components/kt/Misc";
import { SegmentedCapsule } from "@/components/kt/RegionFilter";
import { LoginModal } from "@/components/LoginModal";
import {
  FACE_SET_LABELS,
  FACE_SET_OPTIONS,
  PHENOTYPE_FACES,
  RATING_LABELS,
  RATING_MAX,
  RATING_MIN,
  SAMPLE_THRESHOLD,
  faceUrl,
  type FaceGender,
  type FaceSet,
  type PhenotypeFace,
} from "@/constants/attractiveness";
import { useAuth } from "@/hooks/use-auth";
import {
  useFaceStats,
  useMyRatings,
  useRateFace,
  useSampleSize,
  useVoterMeans,
} from "@/hooks/use-attraction";
import {
  overallMean,
  percentileOf,
  percentileSentence,
  scoreByPhenotype,
  type RatingInput,
} from "@/lib/attraction-result";
import { cn } from "@/lib/utils";

type Stage = "setup" | "rate" | "result";

/** O cinza em que os 76 rostos foram assentados (198, 200, 202). */
const FACE_BACKDROP = "#C6C8CA";

/** As opcoes do seletor, tipadas aqui para o generico do capsule inferir FaceSet. */
const SET_CHOICES: Array<{ value: FaceSet; label: string }> = FACE_SET_OPTIONS.map((option) => ({
  value: option,
  label: FACE_SET_LABELS[option],
}));

interface Card {
  face: PhenotypeFace;
  gender: FaceGender;
}

/**
 * QUANTOS ROSTOS. A conta é em fenótipos, não em cartões: no "both" cada
 * fenótipo sorteado entra com os dois rostos. Sortear cartões soltos deixaria
 * um fenótipo representado só pela versão feminina e outro só pela masculina,
 * e o ranking passaria a medir preferência de sexo em vez de fenótipo.
 */
const SESSION_LENGTHS = ["quick", "medium", "full"] as const;
type SessionLength = (typeof SESSION_LENGTHS)[number];

const PHENOTYPES_PER_SESSION: Record<SessionLength, number> = {
  quick: 10,
  medium: 20,
  full: PHENOTYPE_FACES.length,
};

const deckSize = (set: FaceSet, length: SessionLength) =>
  PHENOTYPES_PER_SESSION[length] * (set === "both" ? 2 : 1);

/** Fisher–Yates: toda ordem tem a mesma chance. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * O baralho da sessão: sorteia os fenótipos e embaralha os cartões.
 *
 * ORDEM ALEATÓRIA, SEM RÓTULO. A ordem por região entregava o fenótipo (quem
 * via cinco rostos da África seguidos sabia o que estava avaliando) e fazia o
 * cansaço do fim cair sempre nas mesmas regiões. Embaralhada, a ordem muda a
 * cada sessão e o efeito de ordem se espalha por igual entre os fenótipos da
 * amostra. No "both" os dois rostos do mesmo fenótipo também se separam.
 */
const buildDeck = (set: FaceSet, length: SessionLength): Card[] => {
  const picked = shuffle(PHENOTYPE_FACES).slice(0, PHENOTYPES_PER_SESSION[length]);
  const cards = picked.flatMap((face): Card[] =>
    set === "both"
      ? [
          { face, gender: "female" },
          { face, gender: "male" },
        ]
      : [{ face, gender: set as FaceGender }]
  );
  return shuffle(cards);
};

const RATING_STEPS = Array.from(
  { length: RATING_MAX - RATING_MIN + 1 },
  (_, index) => RATING_MIN + index
);

/** A régua de 1 a 7. Teclado: as setas andam, os números 1–7 marcam direto. */
const RatingScale = ({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number) => void;
}) => (
  <div
    role="radiogroup"
    aria-label="How attractive do you find this face?"
    className="grid grid-cols-4 gap-2 sm:grid-cols-7"
  >
    {RATING_STEPS.map((step) => {
      const active = value === step;
      return (
        <button
          key={step}
          type="button"
          role="radio"
          aria-checked={active}
          aria-label={`${step} — ${RATING_LABELS[step]}`}
          onClick={() => onChange(step)}
          className={cn(
            "flex min-h-[64px] w-full flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] px-1.5 py-2",
            "font-[inherit] text-[20px] transition-colors",
            active
              ? "border-kt-ink bg-kt-ink text-white"
              : "border-kt-rule bg-kt-sheet text-kt-ink hover:border-kt-teal hover:bg-kt-wash"
          )}
        >
          <span>{step}</span>
          <SC className={cn("text-[11px]", active ? "text-kt-b25" : "text-kt-mute")}>
            {RATING_LABELS[step]}
          </SC>
        </button>
      );
    })}
  </div>
);

/** Uma linha do resultado: barra da nota e, se houver amostra, a diferença. */
const ScoreRow = ({
  rank,
  phenotype,
  faces,
  score,
  percent,
  delta,
  sampleVoters,
  highlight,
}: {
  rank: number;
  phenotype: string;
  /** Os rostos que a pessoa avaliou deste fenótipo: o nome só aparece aqui, no fim. */
  faces: Card[];
  score: number;
  percent: number;
  delta: number | null;
  sampleVoters: number;
  highlight: boolean;
}) => {
  // A diferença só aparece com amostra suficiente. Abaixo disso o número
  // existe mas não significa nada, e mostrá-lo seria inventar precisão.
  const comparable = delta !== null && sampleVoters >= SAMPLE_THRESHOLD;
  const above = comparable && delta > 0.15;
  const below = comparable && delta < -0.15;

  return (
    <li className="flex items-center gap-3 border-b border-kt-rule py-3 last:border-b-0 sm:gap-4">
      <SC className={cn("w-7 shrink-0 text-[14px]", highlight ? "text-kt-ink" : "text-kt-mute")}>
        {rank}
      </SC>

      <span className="flex shrink-0 gap-1">
        {faces.map((item) => (
          <span
            key={item.gender}
            className="block h-[50px] w-10 overflow-hidden rounded-md"
            style={{ backgroundColor: FACE_BACKDROP }}
          >
            <FacePhoto
              src={faceUrl(item.face.slug, item.gender)}
              alt={`${item.gender === "female" ? "Female" : "Male"} ${phenotype} face`}
              width={40}
              height={50}
            />
          </span>
        ))}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className={cn("truncate text-[17px]", highlight ? "text-kt-ink" : "text-kt-body")}>
            {phenotype}
          </span>
          <span className="shrink-0 font-sc text-[14px] tracking-[0.06em] text-kt-body">
            {score.toFixed(1)}
          </span>
        </div>

        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-kt-wash2">
          <div
            className={cn("h-full rounded-full", highlight ? "bg-kt-ink" : "bg-kt-b75")}
            style={{ width: `${Math.max(percent, 2)}%` }}
          />
        </div>

        {comparable && (
          <SC className="mt-1.5 block text-[12px] text-kt-mute">
            {above && `You like this more than the average here (+${delta.toFixed(1)})`}
            {below && `You like this less than the average here (${delta.toFixed(1)})`}
            {!above && !below && "About the same as the average here"}
          </SC>
        )}
      </div>
    </li>
  );
};

/** O aviso que acompanha todo número desta página. */
const ReadingNote = () => (
  <p className="m-0 rounded-xl border border-kt-rule bg-kt-wash px-4 py-3 text-[14px] leading-relaxed text-kt-body">
    These numbers describe <strong className="font-semibold text-kt-ink">your taste</strong>, not the
    people behind any label. Every face here is synthetic — an illustration of a pattern, not a
    person — and a high score only means you liked how that illustration looked.
  </p>
);

export const AttractionScale = () => {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("setup");
  const [faceSet, setFaceSet] = useState<FaceSet>("both");
  const [length, setLength] = useState<SessionLength>("full");
  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  /**
   * As notas da sessão ficam no cliente enquanto a pessoa avalia. Gravar é um
   * efeito paralelo: se a rede falhar num cartão, a sessão continua e o
   * resultado sai do estado local — o que se perde é o histórico, não a visita.
   */
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const { data: faceStats = [] } = useFaceStats();
  const { data: voterMeans = [] } = useVoterMeans();
  const { data: sampleSize = 0 } = useSampleSize();
  const { data: myRatings = [] } = useMyRatings(user?.id);
  const rateFace = useRateFace(user?.id);

  const cardKey = (card: Card) => `${card.face.name}::${card.gender}`;
  const card = deck[index];
  const current = card ? answers[cardKey(card)] ?? null : null;

  const ratings: RatingInput[] = useMemo(
    () =>
      deck
        .map((item) => ({
          phenotype: item.face.name,
          gender: item.gender,
          rating: answers[cardKey(item)],
        }))
        .filter((item): item is RatingInput => typeof item.rating === "number"),
    [answers, deck]
  );

  const scores = useMemo(() => scoreByPhenotype(ratings, faceStats), [ratings, faceStats]);

  // Os rostos avaliados por fenótipo, feminino antes do masculino, para o
  // resultado mostrar ao lado de cada nome o rosto que a pessoa viu.
  const ratedFaces = useMemo(() => {
    const byPhenotype = new Map<string, Card[]>();
    for (const item of deck) {
      if (typeof answers[cardKey(item)] !== "number") continue;
      byPhenotype.set(item.face.name, [...(byPhenotype.get(item.face.name) ?? []), item]);
    }
    for (const list of byPhenotype.values()) list.sort((a, b) => a.gender.localeCompare(b.gender));
    return byPhenotype;
  }, [answers, deck]);

  const myMean = ratings.length > 0 ? overallMean(ratings) : 0;
  // O percentil precisa de gente suficiente para a posição significar algo.
  const percentile =
    sampleSize >= SAMPLE_THRESHOLD && voterMeans.length > 0
      ? percentileOf(myMean, voterMeans)
      : null;

  const answered = ratings.length;
  const progress = deck.length === 0 ? 0 : (answered / deck.length) * 100;

  const record = (rating: number) => {
    if (!card) return;
    setAnswers((prev) => ({ ...prev, [cardKey(card)]: rating }));

    // Grava em segundo plano. Quem não entrou avalia do mesmo jeito; o
    // resultado aparece igual, só não fica salvo nem entra na amostra.
    if (user) {
      rateFace.mutate({ phenotype: card.face.name, gender: card.gender, rating });
    }

    if (index < deck.length - 1) setIndex(index + 1);
    else setStage("result");
  };

  // Cada início sorteia de novo: fenótipos e ordem mudam a cada sessão.
  const start = () => {
    setDeck(buildDeck(faceSet, length));
    setAnswers({});
    setIndex(0);
    setStage("rate");
  };

  const restart = () => {
    setAnswers({});
    setIndex(0);
    setStage("setup");
  };

  // Voltar com notas dadas pede confirmação: um clique errado no rosto 50 não
  // pode apagar a sessão inteira.
  const backToStart = () => (answered > 0 ? setLeaveOpen(true) : restart());

  // ETAPA 1 — escolher o conjunto de rostos.
  if (stage === "setup") {
    const size = deckSize(faceSet, length);
    const minutes = Math.max(1, Math.round((size * 4) / 60));
    // Tipadas aqui pelo mesmo motivo de SET_CHOICES (o genérico do capsule).
    const lengthChoices: Array<{ value: SessionLength; label: string }> = SESSION_LENGTHS.map((value) => ({
      value,
      label: value === "full" ? `All ${deckSize(faceSet, value)}` : String(deckSize(faceSet, value)),
    }));

    return (
      <>
        <header className="max-w-[62ch]">
          <SC as="h2" className="m-0 text-[13px] text-kt-mute">
            Attraction scale
          </SC>
          <h1 className="mb-3 mt-2 text-[34px] leading-[1.15] text-kt-ink">
            Which faces do you find attractive?
          </h1>
          <p className="m-0 text-[17px] leading-relaxed text-kt-body">
            You will see one face at a time and rate it from 1 to 7. The faces come in random
            order and without labels — you find out which phenotype each one represents at the
            end, along with your ranking, your top five, and how your taste compares with
            everyone else who has done this.
          </p>
        </header>

        <div className="mt-8 rounded-2xl border border-kt-rule bg-kt-sheet p-6">
          <SC as="h2" className="m-0 text-[13px] text-kt-mute">
            Faces to show
          </SC>
          <div className="mt-3">
            {/* O argumento de tipo fica no array, nao em <SegmentedCapsule<FaceSet>>:
                argumento de tipo explicito em elemento JSX quebra o parser do
                lovable-tagger, que roda so em dev — o build passava e a pagina
                nao abria no servidor local. */}
            <SegmentedCapsule
              label="Which faces to show"
              value={faceSet}
              onChange={(value) => setFaceSet(value)}
              options={SET_CHOICES}
            />
          </div>

          <SC as="h2" className="mb-0 mt-6 text-[13px] text-kt-mute">
            How many faces
          </SC>
          <div className="mt-3">
            <SegmentedCapsule
              label="How many faces to rate"
              value={length}
              onChange={(value) => setLength(value)}
              options={lengthChoices}
            />
          </div>
          <p className="mb-0 mt-4 text-[15px] text-kt-body">
            {size} faces · about {minutes} {minutes === 1 ? "minute" : "minutes"}
          </p>

          <div className="mt-6">
            <CenButton size="lg" onClick={start}>
              Start rating
            </CenButton>
          </div>

          {!user && (
            <p className="mb-0 mt-4 text-[14px] text-kt-mute">
              You can do this without an account.{" "}
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="border-0 bg-transparent p-0 font-[inherit] text-[14px] text-kt-teal underline"
              >
                Sign in
              </button>{" "}
              to save your result and be counted in the sample.
            </p>
          )}
        </div>

        <div className="mt-6 max-w-[62ch]">
          <ReadingNote />
        </div>

        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  // ETAPA 2 — um rosto por vez.
  if (stage === "rate" && card) {
    return (
      <>
        <div className="mx-auto max-w-[560px]">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={backToStart}
              className="inline-flex min-h-[36px] items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] text-[15px] text-kt-teal transition-colors hover:text-kt-ink"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Back to start
            </button>
            <SC className="text-[13px] text-kt-mute">
              Face {index + 1} of {deck.length} · {answered} rated
            </SC>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-kt-wash2">
            <div
              className="h-full rounded-full bg-kt-teal transition-[width] duration-300 ease-kt"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-kt-rule bg-kt-sheet">
            {/* Altura limitada: com aspect-[4/5] puro o retrato empurrava a
                régua de notas para fora da tela em 1280x800, e a pessoa tinha
                de rolar a cada rosto para conseguir votar.
                A LARGURA sai da altura (0,8 × altura) para o quadro continuar
                4:5: limitar só a altura com largura cheia deixava o quadro
                deitado, e o object-cover cortava o rosto da testa ao nariz.
                As laterais levam o mesmo cinza do fundo dos rostos, então o
                retrato parece um fundo de estúdio contínuo.
                No celular o retrato usa 40% da altura: com 52% a segunda
                linha da régua (5, 6, 7) ficava atrás da barra de navegação. */}
            <div className="flex justify-center" style={{ backgroundColor: FACE_BACKDROP }}>
              <div className="aspect-[4/5] w-[min(100%,calc(min(40svh,420px)*0.8))] sm:w-[min(100%,calc(min(52vh,420px)*0.8))]">
                <FacePhoto
                  src={faceUrl(card.face.slug, card.gender)}
                  alt={`AI-generated ${card.gender} face, ${index + 1} of ${deck.length}`}
                  width={336}
                  height={420}
                />
              </div>
            </div>

            <div className="border-t border-kt-rule px-5 py-3.5">
              {/* Sem nome nem região durante a avaliação: o rótulo puxa a nota
                  (quem lê "Nordid" ou "Bantuid" reage à palavra antes do
                  rosto), e a região entrega o fenótipo. O nome aparece no
                  resultado, ao lado do rosto; o alt da imagem também não diz. */}
              <SC className="block text-[12px] text-kt-mute">AI-generated face · not a real person</SC>
            </div>
          </div>

          <div className="mt-6">
            <RatingScale value={current} onChange={record} />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setIndex(Math.max(0, index - 1))}
              disabled={index === 0}
              className={cn(
                "min-h-[44px] rounded-full border-[1.5px] border-kt-rule bg-kt-sheet px-5",
                "font-[inherit] text-[16px] text-kt-body transition-colors hover:border-kt-ink",
                "disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              Previous
            </button>

            {/* Pular guarda a ausência de nota: um rosto sem opinião não deve
                virar um 4, que entraria na média como se fosse neutro. */}
            <button
              type="button"
              onClick={() =>
                index < deck.length - 1 ? setIndex(index + 1) : setStage("result")
              }
              className="border-0 bg-transparent p-0 font-[inherit] text-[16px] text-kt-teal underline"
            >
              Skip this face
            </button>

            {answered > 0 && (
              <button
                type="button"
                onClick={() => setStage("result")}
                className={cn(
                  "min-h-[44px] rounded-full border-[1.5px] border-kt-ink bg-kt-sheet px-5",
                  "font-[inherit] text-[16px] text-kt-ink transition-colors hover:bg-kt-wash"
                )}
              >
                See result
              </button>
            )}
          </div>
        </div>

        <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
          <AlertDialogContent className="w-[calc(100vw-24px)] max-w-[440px] gap-0 border-kt-rule bg-kt-paper p-0 text-kt-ink shadow-[0_24px_60px_-30px_rgba(25,42,67,.45)] sm:rounded-[3px]">
            <div className="px-7 pb-6 pt-7">
              <SC as="p" className="m-0 text-[14px] text-kt-teal">
                attraction scale
              </SC>
              <AlertDialogTitle className="mt-1 text-[30px] font-medium leading-[1.08] tracking-[-0.015em] text-kt-ink">
                Back to the start?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2.5 text-[17px] leading-[1.55] text-kt-body">
                You've rated {answered} {answered === 1 ? "face" : "faces"} in this session.{" "}
                {user
                  ? "Those ratings are already saved to your account, but this session's result starts over."
                  : "Going back discards them along with this session's result."}
              </AlertDialogDescription>
            </div>
            <div className="flex flex-col-reverse gap-2.5 border-t border-kt-rule px-7 py-4 sm:flex-row sm:justify-end">
              <AlertDialogCancel className={outlineCapsule("mt-0 h-11 font-[inherit] text-[17px] hover:text-kt-teal")}>
                keep rating
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={restart}
                className={cn(
                  "inline-flex h-11 items-center justify-center rounded-full border-0 bg-kt-ink px-6 font-[inherit] text-[17px] text-kt-paper",
                  "transition-colors hover:bg-kt-teal focus-visible:ring-2 focus-visible:ring-kt-teal/40"
                )}
              >
                back to start
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ETAPA 3 — o resultado.
  const top5 = scores.slice(0, 5);
  const rest = scores.slice(5);
  const strongest = scores.filter((s) => s.delta !== null && s.sampleVoters >= SAMPLE_THRESHOLD);
  const mostAbove = strongest.length > 0 ? strongest.reduce((a, b) => (b.delta > a.delta ? b : a)) : null;
  const mostBelow = strongest.length > 0 ? strongest.reduce((a, b) => (b.delta < a.delta ? b : a)) : null;

  return (
    <>
      <header className="max-w-[62ch]">
        <SC as="h2" className="m-0 text-[13px] text-kt-mute">
          Your result
        </SC>
        <h1 className="mb-3 mt-2 text-[34px] leading-[1.15] text-kt-ink">
          What you find attractive
        </h1>
        <p className="m-0 text-[17px] leading-relaxed text-kt-body">
          You rated {answered} {answered === 1 ? "face" : "faces"}. Your average rating was{" "}
          <strong className="font-semibold text-kt-ink">{myMean.toFixed(1)}</strong> out of{" "}
          {RATING_MAX}. Below, each face you rated sits next to the phenotype it represents.
        </p>
      </header>

      {answered === 0 ? (
        <div className="mt-8 rounded-2xl border border-kt-rule bg-kt-sheet p-6">
          <p className="m-0 text-[17px] text-kt-body">
            You skipped every face, so there is nothing to rank yet.
          </p>
          <div className="mt-5">
            <CenButton onClick={restart}>Start over</CenButton>
          </div>
        </div>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-kt-rule bg-kt-sheet p-6">
            <SC as="h2" className="m-0 text-[13px] text-kt-mute">
              Your top five
            </SC>
            <ol className="m-0 mt-3 list-none p-0">
              {top5.map((score, position) => (
                <ScoreRow
                  key={score.phenotype}
                  rank={position + 1}
                  phenotype={score.phenotype}
                  faces={ratedFaces.get(score.phenotype) ?? []}
                  score={score.score}
                  percent={score.percent}
                  delta={score.delta}
                  sampleVoters={score.sampleVoters}
                  highlight
                />
              ))}
            </ol>
          </section>

          <section className="mt-6 rounded-2xl border border-kt-rule bg-kt-sheet p-6">
            <SC as="h2" className="m-0 text-[13px] text-kt-mute">
              How you compare
            </SC>

            {percentile === null ? (
              // Sem amostra não há comparação. Dizer isso é mais honesto do que
              // mostrar um percentil calculado sobre três pessoas.
              <p className="mb-0 mt-3 text-[16px] leading-relaxed text-kt-body">
                Not enough people have done this yet to place you against the sample. The
                comparison appears once {SAMPLE_THRESHOLD} people have taken it —{" "}
                {sampleSize} {sampleSize === 1 ? "has" : "have"} so far.
              </p>
            ) : (
              <>
                <p className="mb-0 mt-3 text-[16px] leading-relaxed text-kt-body">
                  {percentileSentence(percentile)}
                </p>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-[40px] leading-none text-kt-ink">{percentile}</span>
                  <SC className="text-[13px] text-kt-mute">
                    percentile · {voterMeans.length} people compared
                  </SC>
                </div>

                {mostAbove && mostAbove.delta > 0.15 && (
                  <p className="mb-0 mt-4 text-[16px] leading-relaxed text-kt-body">
                    Compared with everyone else, you are most above average on{" "}
                    <strong className="font-semibold text-kt-ink">{mostAbove.phenotype}</strong>
                    {mostBelow && mostBelow.delta < -0.15 && (
                      <>
                        , and most below average on{" "}
                        <strong className="font-semibold text-kt-ink">{mostBelow.phenotype}</strong>
                      </>
                    )}
                    .
                  </p>
                )}
              </>
            )}
          </section>

          {rest.length > 0 && (
            <section className="mt-6 rounded-2xl border border-kt-rule bg-kt-sheet p-6">
              <SC as="h2" className="m-0 text-[13px] text-kt-mute">
                Everything else you rated
              </SC>
              <ol className="m-0 mt-3 list-none p-0">
                {rest.map((score, position) => (
                  <ScoreRow
                    key={score.phenotype}
                    rank={position + 6}
                    phenotype={score.phenotype}
                    faces={ratedFaces.get(score.phenotype) ?? []}
                    score={score.score}
                    percent={score.percent}
                    delta={score.delta}
                    sampleVoters={score.sampleVoters}
                    highlight={false}
                  />
                ))}
              </ol>
            </section>
          )}

          <div className="mt-6 max-w-[62ch]">
            <ReadingNote />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <CenButton onClick={restart}>Start over</CenButton>
            {!user && (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className={cn(
                  "min-h-[44px] rounded-full border-[1.5px] border-kt-ink bg-kt-sheet px-5",
                  "font-[inherit] text-[16px] text-kt-ink transition-colors hover:bg-kt-wash"
                )}
              >
                Sign in to save this
              </button>
            )}
            <Link to="/community" className="text-[16px] text-kt-teal underline">
              Back to the community
            </Link>
          </div>
        </>
      )}

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
};

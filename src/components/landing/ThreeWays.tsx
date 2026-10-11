/**
 * "READ OTHERS. GET READ. PLAY." (ThreeWays.tsx)
 *
 * A metade de baixo da landing. As três entradas do produto penduradas numa
 * "espinha" de cromossomo vertical: cada linha é um locus marcado por uma sonda
 * teal, com o texto à esquerda e a demonstração à direita.
 *
 *   01 Read others  — um rosto gerado por IA com uma leitura de exemplo
 *                     (fenótipo, região e três traços em faixas de escala).
 *   02 Get read     — a forma do resultado que a pessoa recebe ao postar.
 *   03 Play         — uma rodada do jogo montada com outro rosto gerado por IA.
 *
 * Nenhuma demonstração mostra uma pessoa real: os rostos em /examples foram
 * gerados pelo StyleGAN2 (thispersondoesnotexist.com), sem autor humano e
 * portanto em domínio público; o nome é inventado e os votos são ilustrativos.
 *
 * Fecha com a atividade mais recente da comunidade.
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useRecentActivity } from "@/hooks/use-recent-activity";
import { traitByKey, traitOptionLabel } from "@/constants/traits";
import { CONTINENT_ORDER } from "@/constants/regions";
import { ConsensusMeter, TraitStrip } from "@/components/kt/Meters";
import { CenButton, ArrowLinkInner } from "@/components/kt/Centromere";
import { FacePhoto, InitialsAvatar, SC, timeAgo } from "@/components/kt/Misc";
import { DECOR, HATCH, bandSeparators, equalBands, KT } from "@/components/kt/bands";

const TRAIT_PREVIEW = ["Skin Color", "Eye Color", "Hair Texture"];

/** A pessoa (fictícia) da leitura de exemplo e os votos, contados como num perfil de verdade. */
const EXAMPLE_READ = {
  name: "Silvia Marino",
  votes: 40,
  region: "Southern Europe",
  phenotypes: { "Gracile Mediterranid": 22, Litorid: 11, "West Alpinid": 4, "Trans Mediterranid": 3 },
  traits: {
    "Skin Color": { Fair: 18, "Light brown": 11, "Olive Skin": 9, Pale: 2 },
    "Eye Color": { "Medium-brown": 21, "Dark-brown": 10, "Light-brown": 6, Hazel: 3 },
    "Hair Texture": { "Wavy (Medium)": 19, "Straight (Medium)": 9, "Wavy (Fine/Thin)": 8, "Curly (Loose)": 4 },
  } as Record<string, Record<string, number>>,
};

const ranked = (counts: Record<string, number>) => Object.entries(counts).sort((a, b) => b[1] - a[1]);
const total = (counts: Record<string, number>) => Object.values(counts).reduce((sum, count) => sum + count, 0);

const EXAMPLE_TRAITS = TRAIT_PREVIEW.map((key) => {
  const trait = traitByKey(key)!;
  const counts = EXAMPLE_READ.traits[key];
  const voters = total(counts);
  const [topValue, topCount] = ranked(counts)[0];
  return {
    key,
    title: trait.title.toLowerCase(),
    shares: trait.options.map((option) => ((counts[option.value] ?? 0) / voters) * 100),
    top: traitOptionLabel(key, topValue).split(",")[0],
    pct: Math.round((topCount / voters) * 100),
  };
});

/** Sonda e linha de chamada que ligam a espinha ao título da linha. */
const Locus = () => (
  <>
    <span
      aria-hidden="true"
      className="absolute top-[58px] h-3.5 w-3.5 rounded-full bg-kt-teal shadow-[0_0_0_4px_rgba(40,122,138,.22)] motion-safe:animate-probe"
      style={{ left: "calc(-1 * var(--gap) - var(--spine) / 2 - 7px)" }}
    />
    <span
      aria-hidden="true"
      className="absolute top-[64px] border-t border-kt-teal"
      style={{
        left: "calc(-1 * var(--gap) - var(--spine) / 2 + 11px)",
        width: "calc(var(--gap) + var(--spine) / 2 - 19px)",
      }}
    />
  </>
);

const Row = ({
  number,
  title,
  children,
  demo,
  last = false,
}: {
  number: string;
  title: string;
  children: ReactNode;
  demo: ReactNode;
  last?: boolean;
}) => (
  <article
    className={`relative col-start-2 flex flex-wrap gap-x-[clamp(32px,4vw,64px)] gap-y-7 border-t border-kt-rule pt-11 ${last ? "pb-2" : "pb-11"}`}
  >
    <Locus />
    <div className="max-w-[390px] flex-[1_1_260px]">
      <p className="m-0 text-[20px] italic leading-[1.3] text-kt-teal">{number}</p>
      <h3 className="mb-0 mt-1 text-[clamp(30px,3.2vw,42px)] font-medium leading-[1.05] tracking-[-0.015em] text-kt-ink">
        {title}
      </h3>
      {children}
    </div>
    <div className="min-w-0 flex-[999_1_440px]">{demo}</div>
  </article>
);

/** A demonstração de "Read others": um rosto gerado por IA e uma leitura de exemplo. */
const ReadDemo = () => {
  const phenoVoters = total(EXAMPLE_READ.phenotypes);
  const [[first, firstCount], [second, secondCount]] = ranked(EXAMPLE_READ.phenotypes);
  const agreement = Math.round((firstCount / phenoVoters) * 100);

  return (
    <article aria-label="Example profile card" className="flex flex-wrap overflow-hidden rounded-[3px] border border-kt-rule bg-white">
      <div className="relative min-h-[300px] flex-[1_1_210px] overflow-hidden bg-kt-paper">
        <span className="absolute inset-0">
          <FacePhoto src="/examples/ai-face-read.webp" alt={EXAMPLE_READ.name} />
        </span>
      </div>
      <div className="flex min-w-0 flex-[2_1_300px] flex-col gap-[18px] px-6 pb-[22px] pt-[22px]">
        <div className="flex items-baseline justify-between gap-3 font-sc text-[14px] tracking-[0.06em] text-kt-body">
          <span className="truncate">example profile</span>
          <span className="shrink-0 text-kt-teal">{EXAMPLE_READ.votes} votes</span>
        </div>
        <div>
          <h4 className="m-0 text-[26px] font-semibold leading-[1.1] text-kt-ink">{EXAMPLE_READ.name}</h4>
          <p className="mb-0 mt-1 text-[16px] italic text-kt-body">The votes shown are illustrative.</p>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-2.5">
            <SC className="text-[14px] text-kt-slate">phenotype</SC>
            <span className="text-[14px] text-kt-body">{agreement}% agree</span>
          </div>
          <ConsensusMeter
            agreement={agreement}
            runnerUp={(secondCount / phenoVoters) * 100}
            height={14}
            className="mt-2"
          />
          <div className="mt-[9px] flex flex-wrap gap-x-[18px] gap-y-1 text-[17px] text-kt-ink">
            <span>
              <em className="text-kt-teal">1</em> {first}
            </span>
            <span className="text-kt-body">
              <em>2</em> {second}
            </span>
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2.5">
          <SC className="text-[14px] text-kt-slate">region</SC>
          <span className="text-[17px] text-kt-ink">{EXAMPLE_READ.region}</span>
        </div>
        {/* Numa coluna estreita a faixa desce para a linha de baixo, em vez de
            ser espremida entre o nome do traço e o valor. */}
        <div className="flex flex-col gap-[11px] border-t border-kt-rule pt-4 [container-type:inline-size]">
          {EXAMPLE_TRAITS.map((trait) => (
            <div
              key={trait.key}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 [@container(min-width:392px)]:grid-cols-[112px_minmax(0,1fr)_136px]"
            >
              <SC className="whitespace-nowrap text-[14px] text-kt-slate">{trait.title}</SC>
              <TraitStrip
                shares={trait.shares}
                height={11}
                className="col-span-2 row-start-2 [@container(min-width:392px)]:col-span-1 [@container(min-width:392px)]:row-start-auto"
              />
              <span className="text-right text-[15px] text-kt-ink">
                {trait.top} <span className="text-kt-body">{trait.pct}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};

/** A forma do resultado de "Get read" — exemplo, marcado como tal. */
const GetReadDemo = ({ onAdd }: { onAdd: () => void }) => {
  const traitColors = [KT.ink, KT.b75, KT.b50, KT.ink, KT.b25, KT.b75];
  const qBackground = `${bandSeparators(10)},${equalBands([...traitColors, "transparent", "transparent", "transparent", "transparent"])},${HATCH}`;

  return (
    <div className="flex flex-wrap gap-[22px] rounded-[3px] border border-kt-rule bg-white p-[22px]">
      <div className="flex flex-[1_1_220px] gap-3">
        {["front photo", "side photo"].map((label) => (
          <button
            key={label}
            type="button"
            onClick={onAdd}
            className="flex min-h-[210px] flex-1 flex-col items-center justify-center gap-2.5 rounded-[3px] border-[1.5px] border-dashed border-kt-b50 bg-kt-paper font-sc text-[16px] tracking-[0.05em] text-kt-teal transition-colors hover:bg-kt-wash"
          >
            <Plus className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-[2_1_280px] flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-1">
          <SC className="text-[16px] font-semibold text-kt-ink">your read</SC>
          <span className="text-[14px] italic text-kt-body">example of what you receive</span>
        </div>
        <div aria-hidden="true">
          <div className="flex h-[22px]">
            <div
              className="box-border flex-[0_0_22%] rounded-full border-[1.5px] border-kt-ink"
              style={{ background: `linear-gradient(90deg,${KT.ink} 0 calc(50% - 1px),${KT.sheet} 0 50%,${KT.b75} 0 100%)` }}
            />
            <div className="box-border flex-1 rounded-full border-[1.5px] border-kt-ink" style={{ background: qBackground }} />
          </div>
          <div className="mt-2 flex text-[13px] italic text-kt-body">
            <span className="box-border flex-[0_0_22%] pl-2">p · who</span>
            <span className="flex-1 pl-2.5">q · ten traits</span>
          </div>
        </div>
        <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-[18px] gap-y-2 text-[17px] text-kt-ink">
          <dt className="pt-0.5 font-sc text-[14px] tracking-[0.06em] text-kt-slate">region</dt>
          <dd className="m-0">the sub-region most voters pick</dd>
          <dt className="pt-0.5 font-sc text-[14px] tracking-[0.06em] text-kt-slate">phenotype</dt>
          <dd className="m-0">the group your face reads as</dd>
          <dt className="pt-0.5 font-sc text-[14px] tracking-[0.06em] text-kt-slate">traits</dt>
          <dd className="m-0">
            ten of them <span className="text-kt-body">· each settles as votes agree</span>
          </dd>
        </dl>
        <CenButton size="sm" onClick={onAdd} className="self-start">
          post your photo
        </CenButton>
      </div>
    </div>
  );
};

/** Uma rodada do jogo montada com um rosto gerado por IA. */
const PlayDemo = () => (
  <div className="flex flex-wrap gap-[22px] rounded-[3px] bg-kt-deep p-[22px] text-kt-wash">
    <div className="relative min-h-[250px] flex-[1_1_210px] overflow-hidden rounded-sm bg-kt-wash">
      <span className="absolute inset-0">
        <FacePhoto src="/examples/ai-face-game.webp" alt="A face to classify in this round" />
      </span>
      <span className="absolute left-2.5 top-2.5 rounded-full bg-kt-deep px-2.5 pb-1 pt-[3px] font-sc text-[13px] leading-[1.3] tracking-[0.06em] text-kt-wash">
        round 1 of 3
      </span>
    </div>
    <div className="flex min-w-0 flex-[2_1_280px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <SC className="text-[15px] text-kt-b50">origin game · region level</SC>
        <span
          aria-hidden="true"
          className="block h-2.5 w-28 shrink-0 box-border rounded-full border border-kt-b50"
          style={{
            background: `${bandSeparators(3, KT.deep)},linear-gradient(90deg,${KT.glow} 0 33.33%,transparent 0 100%)`,
          }}
        />
      </div>
      <p className="m-0 text-[27px] leading-[1.15] text-kt-paper">Where is this face from?</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(132px,100%),1fr))] gap-2.5">
        {CONTINENT_ORDER.map((continent, index) => (
          <Link
            key={continent}
            to="/game?level=easy"
            className="flex min-h-[46px] items-center gap-2.5 rounded-full border border-kt-b50/45 pl-2 pr-3.5 text-[17px] text-kt-wash no-underline transition-colors hover:border-kt-b50 hover:bg-kt-deep2"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kt-deep2 font-sc text-[14px] text-kt-b50">
              {String.fromCharCode(97 + index)}
            </span>
            {continent}
          </Link>
        ))}
      </div>
      <Link
        to="/game?level=easy"
        className="group inline-flex min-h-[44px] items-center gap-2 text-[18px] text-kt-b50 underline decoration-1 underline-offset-[5px]"
      >
        <ArrowLinkInner>start a round</ArrowLinkInner>
      </Link>
    </div>
  </div>
);

const LatestStrip = () => {
  const { data: activity = [], isLoading } = useRecentActivity(4);

  return (
    <div className="mt-[clamp(48px,6vw,80px)] border-t-[1.5px] border-kt-ink pt-[26px]">
      <div className="mb-3.5 flex items-baseline justify-between gap-4">
        <h3 className="m-0 font-sc text-[17px] font-semibold tracking-[0.06em] text-kt-ink">latest in the index</h3>
        <Link to="/community" className="text-[16px] text-kt-teal">
          see the community
        </Link>
      </div>
      {isLoading ? (
        <div className="h-14 animate-pulse rounded-[3px] bg-white" aria-hidden="true" />
      ) : activity.length === 0 ? (
        <p className="m-0 text-[16px] text-kt-body">No activity yet. Be the first to classify a face.</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-x-7 gap-y-1 p-0">
          {activity.map((item) => (
            <li key={item.id}>
              <Link
                to={item.kind === "comment" ? `/user-profile/${item.profileSlug}` : `/member/${item.userId}`}
                className="flex items-center gap-3 py-2.5 text-kt-ink no-underline"
              >
                <InitialsAvatar name={item.nickname} />
                <span className="min-w-0 flex-1 text-[16px] leading-[1.35]">
                  <strong className="font-semibold">{item.nickname}</strong>{" "}
                  {item.kind === "comment" ? (
                    <>
                      commented on <em>{item.profileName}</em>
                    </>
                  ) : (
                    "joined Phindex"
                  )}
                  <span className="block text-[14px] text-kt-body">{timeAgo(item.created_at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const ThreeWays = ({ onAdd }: { onAdd: () => void }) => (
  <section aria-labelledby="ways-title" className="border-y border-kt-rule bg-kt-wash">
    <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,4.4vw,64px)] py-[clamp(64px,8vw,112px)]">
      <div className="mb-[clamp(28px,4vw,48px)] flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
        <h2
          id="ways-title"
          className="m-0 text-[clamp(38px,5vw,68px)] font-medium leading-none tracking-[-0.022em] text-kt-ink"
        >
          Read others. <em className="text-kt-teal">Get read.</em> Play.
        </h2>
        <p className="m-0 max-w-[36ch] text-[18px] text-kt-body">
          Three ways into the index. Browse freely — you only need an account to vote or post.
        </p>
      </div>

      <div className="grid grid-cols-[var(--spine)_minmax(0,1fr)] gap-x-[var(--gap)] [--gap:48px] [--spine:20px] max-[760px]:[--gap:22px] max-[760px]:[--spine:12px]">
        <div aria-hidden="true" className="col-start-1 row-span-3 row-start-1 flex flex-col pb-10 pt-[30px]">
          <div className="box-border flex-[0_0_15%] rounded-full border-[1.5px] border-kt-ink" style={{ background: DECOR.spineP }} />
          <div className="box-border flex-1 rounded-full border-[1.5px] border-kt-ink" style={{ background: DECOR.spineQ }} />
        </div>

        <Row
          number="01"
          title="Read others"
          demo={<ReadDemo />}
        >
          <p className="mb-0 mt-4 text-[18px] leading-[1.55] text-kt-body">
            Open any face in the index and see how the community read it: the region, the phenotype and ten physical
            traits, each with its share of the vote.
          </p>
          <Link
            to="/explore"
            className="group mt-3.5 inline-flex min-h-[44px] items-center gap-2 text-[18px] text-kt-teal underline decoration-1 underline-offset-[5px]"
          >
            <ArrowLinkInner>explore the index</ArrowLinkInner>
          </Link>
        </Row>

        <Row number="02" title="Get read" demo={<GetReadDemo onAdd={onAdd} />}>
          <p className="mb-0 mt-4 text-[18px] leading-[1.55] text-kt-body">
            Post your photo and let the community classify it. Your result builds up band by band, as the votes come in
            and start to agree.
          </p>
        </Row>

        <Row number="03" title="Play the game" demo={<PlayDemo />} last>
          <p className="mb-0 mt-4 text-[18px] leading-[1.55] text-kt-body">
            Guess where a face is from with nothing but the face. Three levels — region, sub-region, phenotype — and a
            score you can compare.
          </p>
        </Row>
      </div>

      <LatestStrip />
    </div>
  </section>
);

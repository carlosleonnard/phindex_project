/**
 * A LEITURA DA COMUNIDADE (CommunityRead.tsx)
 *
 * O resumo de um perfil como um cromossomo de treze faixas:
 *
 *   braço curto (p) — quem o rosto parece ser: região, fenótipo geral (o
 *                     grupo) e fenótipo específico (o subtipo);
 *   braço longo (q) — o que o rosto mostra: os dez traços, na ordem do voto.
 *
 * O tom de cada faixa é o consenso daquela característica: assentado (60%+),
 * inclinado (45–59%), dividido (abaixo de 45%) ou hachurado sem votos.
 */

import { TRAITS } from "@/constants/traits";
import { HATCH, KT, consensusShade } from "@/components/kt/bands";
import { Swatch } from "@/components/kt/Meters";
import { SC } from "@/components/kt/Misc";

export interface ReadBand {
  label: string;
  /** Consenso 0–100; null sem votos. */
  agreement: number | null;
}

const bandBackground = (agreement: number | null) => consensusShade(agreement) ?? HATCH;

const Arm = ({ bands, className, style }: { bands: ReadBand[]; className?: string; style?: React.CSSProperties }) => (
  <div
    className={`box-border flex overflow-hidden rounded-full border-[1.5px] border-kt-ink ${className ?? ""}`}
    style={style}
  >
    {bands.map((band, index) => (
      <span
        key={band.label}
        className="block h-full flex-1"
        style={{
          background: bandBackground(band.agreement),
          borderLeft: index > 0 ? `1.5px solid ${KT.sheet}` : undefined,
        }}
      />
    ))}
  </div>
);

export const CommunityRead = ({
  region,
  general,
  specific,
  traits,
  voters,
}: {
  region: number | null;
  general: number | null;
  specific: number | null;
  /** Consenso de cada traço, na ordem de TRAITS. */
  traits: Array<number | null>;
  voters: number;
}) => {
  const pBands: ReadBand[] = [
    { label: "region", agreement: region },
    { label: "general", agreement: general },
    { label: "specific", agreement: specific },
  ];
  const qBands: ReadBand[] = TRAITS.map((trait, index) => ({ label: trait.short, agreement: traits[index] ?? null }));
  const all = [...pBands, ...qBands];
  const settled = all.filter((band) => band.agreement !== null && band.agreement >= 60).length;
  const leaning = all.filter((band) => band.agreement !== null && band.agreement >= 45 && band.agreement < 60).length;
  const split = all.filter((band) => band.agreement !== null && band.agreement < 45).length;
  const empty = all.filter((band) => band.agreement === null).length;

  return (
    <section
      aria-labelledby="read-title"
      className="mt-9 rounded-[3px] border border-kt-rule bg-white px-[clamp(18px,2.4vw,30px)] pb-6 pt-[26px]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5">
        <h2 id="read-title" className="m-0 text-[30px] font-medium leading-[1.15] text-kt-ink">
          The community read
        </h2>
        <SC className="text-[14px] text-kt-body">
          {voters} {voters === 1 ? "voter" : "voters"}
        </SC>
      </div>

      <div
        role="img"
        aria-label={`Read of this profile as a chromosome: region, general phenotype and specific phenotype on the short arm, ten physical traits on the long arm. ${settled} settled, ${leaning} leaning, ${split} split, ${empty} without votes.`}
        className="mt-6"
      >
        <div className="flex h-[34px]">
          <Arm bands={pBands} className="h-full flex-[0_0_24%]" />
          <Arm bands={qBands} className="h-full flex-1" />
        </div>
        <div aria-hidden="true" className="mt-2 flex text-[12px] italic leading-[1.2] text-kt-body">
          <div className="flex flex-[0_0_24%]">
            {pBands.map((band) => (
              <span key={band.label} className="flex-1 truncate text-center">
                {band.label}
              </span>
            ))}
          </div>
          <div className="flex flex-1">
            {qBands.map((band) => (
              <span key={band.label} className="flex-1 truncate text-center">
                {band.label}
              </span>
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="mt-1.5 flex font-sc text-[12px] tracking-[0.06em] text-kt-teal">
          <span className="flex-[0_0_24%] border-t border-kt-b50 pt-1 text-center">p · who</span>
          <span className="ml-1.5 flex-1 border-t border-kt-b50 pt-1 text-center">q · what the face shows</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-[22px] gap-y-2 border-t border-kt-rule pt-4 text-[15px] text-kt-slate">
        <span className="inline-flex items-center gap-2">
          <Swatch color={KT.ink} /> settled, 60% or more
        </span>
        <span className="inline-flex items-center gap-2">
          <Swatch color={KT.b75} /> leaning, 45–59%
        </span>
        <span className="inline-flex items-center gap-2">
          <Swatch color={KT.b50} /> split, under 45%
        </span>
        <span className="inline-flex items-center gap-2">
          <Swatch background={`repeating-linear-gradient(45deg,#FFFFFF 0 3px,#DCE0E5 3px 4px)`} /> no votes yet
        </span>
      </div>
    </section>
  );
};

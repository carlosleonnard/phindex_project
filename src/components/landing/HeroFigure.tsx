/**
 * FIGURA DO HERÓI (HeroFigure.tsx)
 *
 * A faixa de rostos como "vista ampliada" de um trecho de cromossomo:
 * cantos de registro em volta da arte, linhas de zoom que convergem para uma
 * janela no ideograma, a régua de bandas (p22…q36) e a legenda "fig. 1".
 *
 * As faixas aparecem da esquerda para a direita uma vez, ao carregar.
 */

import { HeroFaces } from "./HeroFaces";
import { SpecimenFrame } from "@/components/kt/Misc";
import { DECOR } from "@/components/kt/bands";

export const HeroFigure = () => (
  <figure className="m-0 min-w-0 flex-[999_1_560px] motion-safe:animate-rise [animation-delay:.28s]">
    <SpecimenFrame padding={18}>
      <HeroFaces alt="Six faces seen from the front, side by side, in the Phindex teal duotone" />
    </SpecimenFrame>

    <svg
      aria-hidden="true"
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      className="mb-1.5 block h-[clamp(36px,4vw,60px)] w-full overflow-visible"
    >
      <polygon points="0,0 100,0 66,60 52,60" fill="#287A8A" fillOpacity="0.06" />
      <line x1="0" y1="0" x2="52" y2="60" stroke="#287A8A" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line x1="100" y1="0" x2="66" y2="60" stroke="#287A8A" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>

    <div aria-hidden="true" className="relative flex h-5">
      <div
        className="box-border flex-[0_0_36%] rounded-full border-[1.5px] border-kt-ink motion-safe:animate-band-in"
        style={{ background: DECOR.heroP }}
      />
      <div
        className="box-border flex-1 rounded-full border-[1.5px] border-kt-ink motion-safe:animate-band-in [animation-delay:.75s]"
        style={{ background: DECOR.heroQ }}
      />
      <span className="absolute -bottom-1.5 -top-1.5 left-[52%] box-border w-[14%] rounded-md border-2 border-kt-teal" />
    </div>

    <div aria-hidden="true" className="mt-2.5 flex text-[13px] italic text-kt-body">
      <div className="box-border flex flex-[0_0_36%] justify-between px-2.5">
        <span>p22</span>
        <span>p15</span>
        <span>p13</span>
        <span>p11</span>
      </div>
      <div className="flex flex-1 justify-between px-2.5">
        <span>q11</span>
        <span>q21</span>
        <span>q22</span>
        <span>q31</span>
        <span>q34</span>
        <span>q36</span>
      </div>
    </div>

    <figcaption className="mt-[18px] flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-[16px] leading-normal text-kt-body">
      <span className="font-sc font-semibold tracking-[0.05em] text-kt-ink">fig. 1</span>
      <span>
        <em className="text-kt-ink">One species, endless readings.</em> Every face in the index is classified by the
        people who look at it.
      </span>
    </figcaption>
  </figure>
);

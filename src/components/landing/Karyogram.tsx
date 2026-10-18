/**
 * CARIÓTIPO HUMANO (Karyogram.tsx)
 *
 * Os cromossomos 1–22, X e Y, alinhados pelo centrômero, com comprimentos em
 * escala (GRCh38: ~0,85 px por megabase). As faixas são ilustrativas — o
 * desenho de G-banding real tem centenas delas.
 *
 * Quatro "sondas" acendem genes ligados a traços votados no site:
 *   2q12  EDAR       — textura do cabelo
 *   5p13  SLC45A2    — pigmentação da pele
 *   15q13 HERC2/OCA2 — cor dos olhos
 *   16q24 MC1R       — cabelo ruivo
 */

import { cn } from "@/lib/utils";

const D = { bg: "#0A363D", b1: "#1E6370", b2: "#287A8A", glow: "#349DB2", light: "#94BCC5" };

const stops = (list: Array<[string, number]>) =>
  `linear-gradient(180deg,${list.map(([color, end]) => `${color} 0 ${end}%`).join(",")})`;

const P = {
  A: stops([[D.bg, 12], [D.light, 21], [D.bg, 34], [D.b2, 45], [D.bg, 58], [D.light, 69], [D.bg, 86], [D.glow, 100]]),
  B: stops([[D.bg, 18], [D.b2, 30], [D.bg, 46], [D.light, 60], [D.bg, 84], [D.glow, 100]]),
  C: stops([[D.bg, 8], [D.light, 16], [D.bg, 26], [D.b1, 36], [D.bg, 48], [D.b2, 58], [D.bg, 72], [D.light, 81], [D.bg, 90], [D.glow, 100]]),
  S: stops([[D.bg, 40], [D.b2, 70], [D.glow, 100]]),
};

const Q = {
  A: stops([[D.glow, 6], [D.bg, 14], [D.light, 22], [D.bg, 31], [D.b2, 38], [D.bg, 47], [D.light, 57], [D.bg, 63], [D.b1, 70], [D.bg, 78], [D.light, 87], [D.bg, 100]]),
  B: stops([[D.glow, 5], [D.bg, 12], [D.b2, 20], [D.bg, 29], [D.light, 40], [D.bg, 48], [D.b1, 54], [D.bg, 63], [D.light, 72], [D.bg, 81], [D.b2, 89], [D.bg, 100]]),
  C: stops([[D.glow, 7], [D.bg, 15], [D.light, 27], [D.bg, 35], [D.b1, 43], [D.bg, 52], [D.b2, 61], [D.bg, 69], [D.light, 79], [D.bg, 92], [D.b1, 100]]),
};

interface Chromosome {
  label: string;
  p: number;
  q: number;
  pBands: string;
  qBands: string;
  probe?: { arm: "p" | "q"; top: string };
}

const CHROMOSOMES: Chromosome[] = [
  { label: "1", p: 105, q: 107, pBands: P.A, qBands: Q.A },
  { label: "2", p: 80, q: 126, pBands: P.B, qBands: Q.B, probe: { arm: "q", top: "10%" } },
  { label: "3", p: 77, q: 91, pBands: P.C, qBands: Q.C },
  { label: "4", p: 43, q: 119, pBands: P.A, qBands: Q.B },
  { label: "5", p: 41, q: 113, pBands: P.B, qBands: Q.C, probe: { arm: "p", top: "70%" } },
  { label: "6", p: 51, q: 94, pBands: P.C, qBands: Q.A },
  { label: "7", p: 51, q: 84, pBands: P.A, qBands: Q.C },
  { label: "8", p: 38, q: 85, pBands: P.B, qBands: Q.A },
  { label: "9", p: 37, q: 81, pBands: P.C, qBands: Q.B },
  { label: "10", p: 34, q: 80, pBands: P.A, qBands: Q.A },
  { label: "11", p: 45, q: 69, pBands: P.B, qBands: Q.B },
  { label: "12", p: 30, q: 83, pBands: P.C, qBands: Q.C },
  { label: "13", p: 15, q: 82, pBands: P.S, qBands: Q.A },
  { label: "14", p: 15, q: 76, pBands: P.S, qBands: Q.B },
  { label: "15", p: 16, q: 71, pBands: P.S, qBands: Q.C, probe: { arm: "q", top: "11%" } },
  { label: "16", p: 31, q: 45, pBands: P.A, qBands: Q.A, probe: { arm: "q", top: "93%" } },
  { label: "17", p: 21, q: 49, pBands: P.B, qBands: Q.B },
  { label: "18", p: 16, q: 53, pBands: P.S, qBands: Q.C },
  { label: "19", p: 22, q: 28, pBands: P.C, qBands: Q.A },
  { label: "20", p: 24, q: 31, pBands: P.A, qBands: Q.B },
  { label: "21", p: 10, q: 29, pBands: P.S, qBands: Q.C },
  { label: "22", p: 13, q: 30, pBands: P.S, qBands: Q.A },
  { label: "X", p: 52, q: 81, pBands: P.B, qBands: Q.B },
  { label: "Y", p: 9, q: 40, pBands: P.S, qBands: Q.C },
];

const Probe = ({ top }: { top: string }) => (
  <span
    className="absolute left-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-kt-paper shadow-[0_0_0_3px_rgba(52,157,178,.55)] motion-safe:animate-probe"
    style={{ top }}
  />
);

export const PROBES = [
  { locus: "2q12", gene: "EDAR", trait: "hair texture" },
  { locus: "5p13", gene: "SLC45A2", trait: "skin color" },
  { locus: "15q13", gene: "HERC2", trait: "eye color" },
  { locus: "16q24", gene: "MC1R", trait: "red hair" },
];

export const Karyogram = ({ className }: { className?: string }) => (
  <div
    role="img"
    aria-label="Ideograms of human chromosomes 1 to 22, X and Y, drawn to scale, with four genes linked to visible traits highlighted"
    className={cn("flex items-start justify-between gap-1 [--kw:clamp(7px,1.05vw,15px)]", className)}
  >
    {CHROMOSOMES.map((chromosome) => (
      <div key={chromosome.label} className="flex flex-col items-center">
        <div className="flex h-[106px] items-end">
          <div
            className="relative box-border rounded-full border border-kt-b50/60"
            style={{ width: "var(--kw)", height: chromosome.p, background: chromosome.pBands }}
          >
            {chromosome.probe?.arm === "p" && <Probe top={chromosome.probe.top} />}
          </div>
        </div>
        <div className="flex h-[128px] items-start">
          <div
            className="relative box-border rounded-full border border-kt-b50/60"
            style={{ width: "var(--kw)", height: chromosome.q, background: chromosome.qBands }}
          >
            {chromosome.probe?.arm === "q" && <Probe top={chromosome.probe.top} />}
          </div>
        </div>
        <span className={cn("mt-2.5 text-[13px]", chromosome.probe ? "text-kt-paper" : "text-kt-b50")}>
          {chromosome.label}
        </span>
      </div>
    ))}
  </div>
);

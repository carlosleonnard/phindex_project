/**
 * 404 (NotFound.tsx)
 *
 * Uma deleção cromossômica: o ideograma perde um trecho do braço longo —
 * del(404) — e o título explica. Cabeçalho mínimo, sem sidebar: quem chega
 * aqui precisa de uma saída, não de navegação completa.
 */

import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { Wordmark } from "@/components/kt/Mark";
import { CenLink } from "@/components/kt/Centromere";
import { SC } from "@/components/kt/Misc";
import { KT, bandGradient } from "@/components/kt/bands";

const P_ARM = bandGradient([
  [KT.sheet, 9], [KT.b50, 15], [KT.sheet, 24], [KT.ink, 34], [KT.sheet, 44],
  [KT.b75, 55], [KT.sheet, 68], [KT.b25, 76], [KT.sheet, 90], [KT.teal, 100],
]);
const Q_PROXIMAL = bandGradient([
  [KT.teal, 6], [KT.sheet, 16], [KT.ink, 28], [KT.sheet, 38], [KT.b25, 48], [KT.sheet, 62], [KT.b75, 76], [KT.sheet, 100],
]);
const Q_DISTAL = bandGradient([
  [KT.sheet, 8], [KT.ink, 17], [KT.sheet, 27], [KT.b50, 36], [KT.sheet, 50], [KT.b75, 63], [KT.sheet, 74], [KT.ink, 82], [KT.sheet, 100],
]);

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-kt-paper text-kt-ink">
      <Helmet>
        <title>Page Not Found | Phindex</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <header className="border-b border-kt-rule">
        <div className="mx-auto flex min-h-[72px] max-w-[1312px] items-center justify-between gap-4 px-[clamp(16px,4.4vw,64px)]">
          <Wordmark />
          <Link to="/explore" className="text-[17px] text-kt-teal">
            search the index
          </Link>
        </div>
      </header>

      <main className="mx-auto box-border w-full max-w-[1312px] flex-auto px-[clamp(16px,4.4vw,64px)] py-[clamp(48px,7vw,96px)]">
        <SC as="p" className="m-0 text-[17px] text-kt-teal">
          error 404
        </SC>

        <figure className="m-0 mt-7 max-w-[980px]">
          <div
            role="img"
            aria-label="A chromosome ideogram with a segment of its long arm missing"
            className="relative mt-[46px] flex h-[30px] items-center"
          >
            <div className="box-border h-full flex-[0_0_28%] rounded-full border-[1.5px] border-kt-ink" style={{ background: P_ARM }} />
            <div
              className="box-border h-full flex-[0_0_24%] rounded-l-full rounded-r-[2px] border-[1.5px] border-kt-ink"
              style={{ background: Q_PROXIMAL }}
            />
            <div
              className="mx-2.5 box-border h-full flex-[0_0_14%] rounded-[2px] border-[1.5px] border-dashed border-kt-b50 motion-safe:animate-drift"
              style={{ background: `repeating-linear-gradient(45deg,transparent 0 5px,${KT.wash2} 5px 6px)` }}
            />
            <div
              className="box-border h-full flex-auto rounded-l-[2px] rounded-r-full border-[1.5px] border-kt-ink"
              style={{ background: Q_DISTAL }}
            />
            <span
              aria-hidden="true"
              className="absolute bottom-[calc(100%+10px)] left-[calc(52%+10px)] flex w-[14%] flex-col items-center"
            >
              <span className="whitespace-nowrap text-[20px] italic leading-none text-kt-ink">del(404)</span>
              <span className="mt-1.5 box-border h-[9px] w-full border-[1.5px] border-b-0 border-kt-teal" />
            </span>
          </div>
          <div aria-hidden="true" className="mt-2.5 flex text-[13px] italic text-kt-body">
            <div className="box-border flex flex-[0_0_28%] justify-between px-2.5">
              <span>p23</span>
              <span className="max-sm:hidden">p15</span>
              <span>p11</span>
            </div>
            <div className="box-border flex flex-[0_0_24%] justify-between px-2.5">
              <span>q11</span>
              <span className="max-sm:hidden">q14</span>
              <span>q16</span>
            </div>
            <div className="mx-2.5 flex-[0_0_14%] whitespace-nowrap text-center text-kt-teal max-sm:text-[11px]">q21–q24</div>
            <div className="flex flex-auto justify-between px-2.5">
              <span>q25</span>
              <span className="max-sm:hidden">q31</span>
              <span>q35</span>
            </div>
          </div>
        </figure>

        <h1 className="mb-0 mt-[clamp(40px,5vw,64px)] max-w-[15ch] text-[clamp(46px,6.4vw,92px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
          This page has a <em className="text-kt-teal">deletion.</em>
        </h1>
        <p className="mb-0 mt-[18px] max-w-[46ch] text-[20px] leading-[1.55] text-kt-body">
          The address you followed points to a band that isn’t there. It may have moved, or it never existed.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3.5">
          <CenLink to="/" size="lg">
            back to the index
          </CenLink>
          <Link to="/game" className="text-[18px] text-kt-teal">
            or play a round while you’re here
          </Link>
        </div>
        <p className="mb-0 mt-10 max-w-[62ch] border-t border-kt-rule pt-3.5 text-[15px] text-kt-body">
          Followed a link from inside Phindex? <Link to="/contact">Tell us which one</Link> and we’ll repair it.
        </p>
      </main>

      <footer className="border-t border-kt-rule">
        <div className="mx-auto flex max-w-[1312px] flex-wrap justify-between gap-x-6 gap-y-2.5 px-[clamp(16px,4.4vw,64px)] py-[22px] text-[15px] text-kt-body">
          <SC as="p" className="m-0 tracking-[0.08em]">
            discover / compare / vote
          </SC>
          <p className="m-0">© {new Date().getFullYear()} Phindex</p>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;

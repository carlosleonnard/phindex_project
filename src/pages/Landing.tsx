/**
 * LANDING PÚBLICA (Landing.tsx)
 *
 * A primeira tela de quem ainda não entrou. Quem tem sessão vai direto para o
 * feed (ver Home.tsx).
 *
 *   1. HERÓI       — a proposta em duas frases, a definição de "fenótipo" como
 *                    nota de rodapé (muita gente chega sem saber a palavra) e a
 *                    figura dos rostos ampliados a partir de um cromossomo.
 *   2. TRÊS ENTRADAS — ler os outros, ser lido e jogar, cada uma demonstrada
 *                    com um exemplo (rostos gerados por IA, nenhuma pessoa
 *                    real), e a atividade recente.
 */

import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { LoginModal } from "@/components/LoginModal";
import { AddProfileModal } from "@/components/AddProfileModal";
import { HeroFigure } from "@/components/landing/HeroFigure";
import { ThreeWays } from "@/components/landing/ThreeWays";
import { Wordmark } from "@/components/kt/Mark";
import { CenLink, ArrowLinkInner } from "@/components/kt/Centromere";
import { DECOR } from "@/components/kt/bands";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Phindex - Phenotype Index",
  url: "https://www.phenotypeindex.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.phenotypeindex.com/explore?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const NAV_LINKS = [
  { label: "community", to: "/community" },
  { label: "explore", to: "/explore" },
  { label: "game", to: "/game" },
  { label: "about", to: "/faq" },
];

const navLinkClass = cn(
  "relative text-kt-slate no-underline transition-colors hover:text-kt-teal",
  "after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-kt-teal",
  "after:transition-transform after:duration-300 after:ease-kt hover:after:scale-x-100"
);

const Landing = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const handleAdd = () => (user ? setAddOpen(true) : setLoginOpen(true));

  return (
    <div className="flex min-h-screen flex-col bg-kt-paper text-[18px] leading-normal text-kt-ink">
      <Helmet>
        <title>Phindex - Phenotype Index | Discover Your Phenotype, Classify Your World</title>
        <meta
          name="description"
          content="Compare and vote on human phenotypes from around the world. Post your photo, see how the community reads your phenotype, and play the guessing game."
        />
        <meta
          name="keywords"
          content="phenotype, phenotype index, ancestry, physical traits, phenotype classification, human diversity, what is my phenotype"
        />
        <link rel="canonical" href="https://www.phenotypeindex.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Phindex - Discover Your Phenotype. Classify Your World." />
        <meta property="og:description" content="Discover, compare and vote on human phenotypes from around the world." />
        <meta property="og:image" content="https://www.phenotypeindex.com/og-default.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://www.phenotypeindex.com" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content="Phindex - Discover Your Phenotype. Classify Your World." />
        <meta name="twitter:description" content="Discover, compare and vote on human phenotypes from around the world." />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/og-default.png" />
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>

      {/* ══ NAV ══════════════════════════════════════════════════════════ */}
      <header className="relative z-20 border-b border-kt-rule">
        <nav
          aria-label="Main"
          className="mx-auto flex h-[76px] w-full max-w-[1440px] items-center justify-between gap-3 px-[clamp(16px,4.4vw,64px)] sm:gap-6"
        >
          <Wordmark logoClassName="h-[26px] sm:h-8" />

          <div className="hidden items-center gap-[34px] font-sc text-[18px] tracking-[0.04em] md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* No celular o botão encolhe para caber ao lado do logo e do menu, até 320px. */}
          <div className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <Link
                to="/community"
                className="inline-flex h-10 items-center whitespace-nowrap rounded-full border-[1.5px] border-kt-teal px-4 font-sc text-[16px] tracking-[0.04em] text-kt-teal no-underline transition-colors hover:bg-kt-teal/[0.06] sm:h-11 sm:px-5 sm:text-[18px]"
              >
                your feed
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="inline-flex h-10 items-center whitespace-nowrap rounded-full border-[1.5px] border-kt-teal bg-transparent px-4 font-sc text-[16px] tracking-[0.04em] text-kt-teal transition-colors hover:bg-kt-teal/[0.06] sm:h-11 sm:px-5 sm:text-[18px]"
              >
                log in
              </button>
            )}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent text-kt-ink md:hidden"
            >
              {menuOpen ? (
                <X className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden="true" />
              ) : (
                <Menu className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <ul className="m-0 list-none border-t border-kt-rule bg-kt-paper px-[clamp(16px,4.4vw,64px)] py-2 md:hidden">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[48px] items-center font-sc text-[19px] tracking-[0.04em] text-kt-slate no-underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <main className="flex-1">
        {/* ══ HERÓI ══════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="hero-title"
          className="mx-auto w-full max-w-[1440px] px-[clamp(16px,4.4vw,64px)] pb-[clamp(64px,8vw,112px)] pt-[clamp(36px,5vw,64px)]"
        >
          <p className="mb-7 mt-0 flex items-center gap-3.5 font-sc text-[17px] tracking-[0.05em] text-kt-teal motion-safe:animate-rise">
            <span aria-hidden="true" className="flex h-[9px] w-[46px] shrink-0">
              <span className="box-border flex-[0_0_38%] rounded-full border border-kt-ink" style={{ background: DECOR.miniP }} />
              <span className="box-border flex-1 rounded-full border border-kt-ink" style={{ background: DECOR.miniQ }} />
            </span>
            classified by people, trait by trait
          </p>

          <h1
            id="hero-title"
            className="m-0 text-balance text-[clamp(46px,8.2vw,118px)] font-medium leading-[0.93] tracking-[-0.028em] text-kt-ink motion-safe:animate-rise [animation-delay:.08s]"
          >
            Discover your phenotype.
            <sup className="relative top-[0.4em] ml-[0.08em] align-top text-[0.2em] tracking-normal">
              <a href="#definition" aria-label="Definition of phenotype" className="text-kt-teal no-underline">
                1
              </a>
            </sup>
            <br />
            <em className="font-medium italic text-kt-teal">Classify your world.</em>
          </h1>

          <div className="mt-[clamp(40px,4.5vw,64px)] flex flex-wrap items-start gap-x-[clamp(32px,5vw,72px)] gap-y-12">
            <div className="max-w-[420px] flex-[1_1_300px] motion-safe:animate-rise [animation-delay:.18s]">
              <div id="definition" className="border-t-[1.5px] border-kt-ink pt-4">
                <p className="m-0 text-[17px] leading-[1.55] text-kt-slate">
                  <span className="mr-[5px] align-super text-[12px] text-kt-teal">1</span>
                  <strong className="font-bold text-kt-ink">phe·no·type</strong>{" "}
                  <span className="text-kt-body">/ˈfiː.nə.taɪp/</span> <em>noun.</em> The traits you can see: skin, hair,
                  eyes, the architecture of a face. Genes and environment write it. People read it.
                </p>
              </div>
              <p className="mb-0 mt-7 max-w-[34ch] text-[20px] leading-[1.55] text-kt-body">
                Compare and vote on human phenotypes from around the world. See the diversity. Find your place.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3.5">
                <CenLink to="/community" size="lg">
                  join the community
                </CenLink>
                <Link
                  to="/game"
                  className="group inline-flex min-h-[48px] items-center gap-2.5 text-[20px] text-kt-teal underline decoration-1 underline-offset-[6px]"
                >
                  <ArrowLinkInner size={20}>play the game</ArrowLinkInner>
                </Link>
              </div>
            </div>

            <HeroFigure />
          </div>
        </section>

        {/* ══ TRÊS ENTRADAS ══════════════════════════════════════════════ */}
        <ThreeWays onAdd={handleAdd} />
      </main>

      <footer className="border-t border-kt-b50/20 bg-kt-deep text-kt-b50">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-[clamp(16px,4.4vw,64px)] py-7 text-[15px]">
          <p className="m-0 flex gap-3 font-sc text-[15px] tracking-[0.08em]">
            <span>discover</span>
            <span aria-hidden="true" className="text-kt-teal">
              /
            </span>
            <span>compare</span>
            <span aria-hidden="true" className="text-kt-teal">
              /
            </span>
            <span>vote</span>
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/faq" className="text-kt-b50">
              FAQ
            </Link>
            <Link to="/contact" className="text-kt-b50">
              Contact
            </Link>
            <Link to="/leaderboard" className="text-kt-b50">
              Leaderboard
            </Link>
          </nav>
          <p className="m-0">© {new Date().getFullYear()} Phindex. All rights reserved.</p>
        </div>
      </footer>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      <AddProfileModal
        triggerExternal={addOpen}
        onTriggerExternalChange={setAddOpen}
        initialIsAnonymous={true}
        lockIsAnonymous
      />
    </div>
  );
};

export default Landing;

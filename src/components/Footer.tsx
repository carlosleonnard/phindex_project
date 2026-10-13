/**
 * RODAPÉ (Footer.tsx)
 *
 * Os três verbos do produto, na ordem em que acontecem, e os links de ajuda.
 * A landing tem a sua versão escura, que continua a faixa final da página.
 *
 * Sobre, Privacidade e Termos ficam aqui porque é onde se procura por eles —
 * e porque um site que classifica rostos precisa dizer quem o mantém.
 */

import { Link } from "react-router-dom";

const LINKS = [
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/contact", label: "Contact" },
];

export const Footer = () => (
  <footer className="border-t border-kt-rule">
    <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-baseline justify-between gap-x-6 gap-y-2.5 px-[clamp(16px,4.4vw,64px)] py-[22px] text-[15px] text-kt-body">
      <p className="m-0 font-sc tracking-[0.08em]">discover / compare / vote</p>
      <nav aria-label="Site information" className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span>© {new Date().getFullYear()} Phindex</span>
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="text-kt-body">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  </footer>
);

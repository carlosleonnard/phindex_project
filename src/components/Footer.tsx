/**
 * RODAPÉ (Footer.tsx)
 *
 * Os três verbos do produto, na ordem em que acontecem, e os links de ajuda.
 * A landing tem a sua versão escura, que continua a faixa final da página.
 */

import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="border-t border-kt-rule">
    <div className="mx-auto flex w-full max-w-[1440px] flex-wrap justify-between gap-x-6 gap-y-2.5 px-[clamp(16px,4.4vw,64px)] py-[22px] text-[15px] text-kt-body">
      <p className="m-0 font-sc tracking-[0.08em]">discover / compare / vote</p>
      <p className="m-0">
        © {new Date().getFullYear()} Phindex ·{" "}
        <Link to="/faq" className="text-kt-body">
          FAQ
        </Link>{" "}
        ·{" "}
        <Link to="/contact" className="text-kt-body">
          Contact
        </Link>
      </p>
    </div>
  </footer>
);

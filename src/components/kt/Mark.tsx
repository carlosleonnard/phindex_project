/**
 * MARCA (Mark.tsx)
 *
 * `Wordmark` é o logo original do Phindex: o nome em serifa com o X desenhado
 * como um cromossomo. No modo compacto, abaixo de `sm`, entra o emblema (o Φ
 * sobre o rosto), como no cabeçalho mobile de antes do redesenho.
 *
 * Os dois estão nas cores do site — letras e partes escuras em kt.ink, o verde
 * original em kt.teal — e em ~3× o tamanho de uso. Os arquivos originais
 * continuam em src/assets (phindex-logo.png e mobile-logo.png).
 *
 * `ChromosomeMark` é um X duplicado em SVG — as duas cromátides cruzadas, uma
 * teal e uma tinta, com duas faixas cada.
 */

import { Link } from "react-router-dom";
import phindexLogo from "@/assets/phindex-logo-blue.png";
import phindexEmblem from "@/assets/phindex-emblem-blue.png";
import { cn } from "@/lib/utils";

export const ChromosomeMark = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 26 26"
    aria-hidden="true"
    className={cn("shrink-0", className)}
  >
    <g transform="rotate(-22 13 13)">
      <rect x="10" y="1" width="6" height="24" rx="3" fill="#287A8A" />
      <rect x="10" y="7" width="6" height="1.6" fill="#F9FAFB" />
      <rect x="10" y="17" width="6" height="2.4" fill="#F9FAFB" />
    </g>
    <g transform="rotate(22 13 13)">
      <rect x="10" y="1" width="6" height="24" rx="3" fill="#192A43" />
      <rect x="10" y="5.5" width="6" height="2" fill="#F9FAFB" />
      <rect x="10" y="18.5" width="6" height="1.6" fill="#F9FAFB" />
    </g>
  </svg>
);

interface WordmarkProps {
  to?: string;
  /** Altura do logo, em classes (a largura acompanha a proporção). */
  logoClassName?: string;
  /** Abaixo de `sm`, troca o logo pelo emblema. */
  compact?: boolean;
  className?: string;
}

export const Wordmark = ({ to = "/", logoClassName = "h-[30px]", compact = false, className }: WordmarkProps) => (
  <Link to={to} aria-label="Phindex, home" className={cn("flex shrink-0 items-center no-underline", className)}>
    {compact && (
      <img src={phindexEmblem} alt="" width={94} height={120} draggable={false} className="h-9 w-auto sm:hidden" />
    )}
    <img
      src={phindexLogo}
      alt=""
      width={546}
      height={104}
      draggable={false}
      className={cn("block w-auto max-w-none", logoClassName, compact && "hidden sm:block")}
    />
  </Link>
);

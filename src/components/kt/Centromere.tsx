/**
 * BOTÃO CENTRÔMERO (Centromere.tsx)
 *
 * A ação principal de cada tela. Duas cápsulas encostadas — o braço do rótulo e
 * o braço da seta — formam a "cintura" de um cromossomo. No hover, os braços se
 * afastam alguns pixels, como cromátides se separando.
 *
 * Uma por tela. Ações secundárias são cápsulas contornadas ou links.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type CenSize = "sm" | "md" | "lg";
type CenTone = "light" | "dark";

interface CenBaseProps {
  children: ReactNode;
  size?: CenSize;
  tone?: CenTone;
  icon?: "arrow" | "plus";
  fullWidth?: boolean;
  className?: string;
}

const SIZES: Record<CenSize, { height: number; label: string; icon: number }> = {
  sm: { height: 44, label: "pl-5 pr-4 text-[17px]", icon: 18 },
  md: { height: 52, label: "pl-[26px] pr-[22px] text-[19px]", icon: 20 },
  lg: { height: 58, label: "pl-[30px] pr-[26px] text-[20px]", icon: 22 },
};

const TONES: Record<CenTone, { label: string; arm: string }> = {
  light: { label: "bg-kt-teal text-white", arm: "bg-kt-ink text-white" },
  dark: { label: "bg-kt-paper text-kt-deep", arm: "bg-kt-glow text-kt-deep" },
};

const CenInner = ({ children, size = "md", tone = "light", icon = "arrow", fullWidth }: CenBaseProps) => {
  const metrics = SIZES[size];
  const colors = TONES[tone];
  const Icon = icon === "plus" ? Plus : ArrowRight;

  return (
    <>
      <span
        className={cn(
          "flex items-center whitespace-nowrap rounded-full font-medium leading-none",
          metrics.label,
          colors.label,
          fullWidth && "flex-1 justify-center"
        )}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          "transition-transform duration-350 ease-kt group-hover:translate-x-[5px]",
          "motion-reduce:transition-none motion-reduce:group-hover:translate-x-0",
          colors.arm
        )}
        style={{ width: metrics.height }}
      >
        <Icon size={metrics.icon} strokeWidth={1.75} />
      </span>
    </>
  );
};

const wrapperClass = (fullWidth?: boolean, className?: string) =>
  cn(
    "group inline-flex shrink-0 items-stretch rounded-full no-underline",
    "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:opacity-50",
    fullWidth && "flex w-full",
    className
  );

interface CenLinkProps extends CenBaseProps {
  to: string;
  "aria-label"?: string;
  onClick?: () => void;
}

/** Centrômero que navega (link de verdade: abre em nova aba, mostra o destino). */
export const CenLink = ({ to, size = "md", fullWidth, className, onClick, ...rest }: CenLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    aria-label={rest["aria-label"]}
    className={wrapperClass(fullWidth, className)}
    style={{ height: SIZES[size].height }}
  >
    <CenInner size={size} fullWidth={fullWidth} {...rest} />
  </Link>
);

/** Centrômero para destinos fora do app (mailto:, links externos). */
export const CenAnchor = ({ href, size = "md", fullWidth, className, ...rest }: CenBaseProps & { href: string }) => (
  <a href={href} className={wrapperClass(fullWidth, className)} style={{ height: SIZES[size].height }}>
    <CenInner size={size} fullWidth={fullWidth} {...rest} />
  </a>
);

type CenButtonProps = CenBaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** Centrômero que executa uma ação. */
export const CenButton = forwardRef<HTMLButtonElement, CenButtonProps>(
  ({ children, size = "md", tone, icon, fullWidth, className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(wrapperClass(fullWidth, className), "border-0 bg-transparent p-0 font-[inherit]")}
      style={{ height: SIZES[size].height }}
      {...props}
    >
      <CenInner size={size} tone={tone} icon={icon} fullWidth={fullWidth}>
        {children}
      </CenInner>
    </button>
  )
);
CenButton.displayName = "CenButton";

/** Cápsula contornada — a ação secundária. */
export const outlineCapsule = (extra?: string) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-kt-teal bg-transparent",
    "px-5 text-kt-teal no-underline transition-colors duration-200 hover:bg-kt-teal/[0.06]",
    "disabled:cursor-not-allowed disabled:opacity-50",
    extra
  );

/** Link sublinhado com seta que avança no hover. */
export const ArrowLinkInner = ({ children, size = 18 }: { children: ReactNode; size?: number }) => (
  <>
    {children}
    <ArrowRight
      size={size}
      strokeWidth={1.75}
      aria-hidden="true"
      className="transition-transform duration-300 ease-kt group-hover:translate-x-1"
    />
  </>
);

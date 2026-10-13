/**
 * BOTÃO DE ENTRAR (LoginButton.tsx)
 *
 * A mesma cápsula no cabeçalho do app e no da landing: tinta, com o ícone de
 * entrada, que vira teal ao passar o mouse. Antes era um contorno teal fino,
 * fácil de confundir com um link. Abaixo de 380px o ícone sai para o botão
 * caber ao lado do logo e do menu.
 */

import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export const LoginButton = ({
  onClick,
  disabled,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-0 bg-kt-ink pl-4 pr-5 font-sc text-[18px] tracking-[0.04em] text-kt-paper",
      "transition-colors duration-200 hover:bg-kt-teal disabled:opacity-50",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kt-teal/40 focus-visible:ring-offset-2",
      "max-sm:h-10 max-sm:pl-3.5 max-sm:pr-4 max-sm:text-[16px]",
      className
    )}
  >
    <LogIn className="h-[18px] w-[18px] max-[379px]:hidden" strokeWidth={1.8} aria-hidden="true" />
    log in
  </button>
);

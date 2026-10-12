/**
 * CONFIRMAÇÃO DE SAÍDA (LogoutDialog.tsx)
 *
 * Sair é um clique fácil de dar sem querer — o item fica ao lado de
 * "Settings" no menu da conta e no fim da gaveta do celular. A pergunta diz o
 * que muda (votar, comentar e jogar pedem login) e o que não muda (o que a
 * pessoa já fez continua na conta), para que a decisão seja informada.
 *
 * O diálogo continua aberto enquanto a sessão é encerrada e só fecha quando a
 * saída termina; `onLoggedOut` deixa quem abriu fechar o próprio menu depois.
 */

import { useState, type MouseEvent } from "react";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { outlineCapsule } from "@/components/kt/Centromere";
import { SC } from "@/components/kt/Misc";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const LogoutDialog = ({
  open,
  onOpenChange,
  onLoggedOut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoggedOut?: () => void;
}) => {
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);

  const confirm = async (event: MouseEvent) => {
    // Sem isto o AlertDialog fecharia antes de a sessão terminar.
    event.preventDefault();
    setPending(true);
    try {
      await signOut();
      onOpenChange(false);
      onLoggedOut?.();
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent className="w-[calc(100vw-24px)] max-w-[440px] gap-0 border-kt-rule bg-kt-paper p-0 text-kt-ink shadow-[0_24px_60px_-30px_rgba(25,42,67,.45)] sm:rounded-[3px]">
        <div className="px-7 pb-6 pt-7">
          <span
            aria-hidden="true"
            className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-kt-wash text-kt-teal"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <SC as="p" className="m-0 text-[14px] text-kt-teal">
            your account
          </SC>
          <AlertDialogTitle className="mt-1 text-[30px] font-medium leading-[1.08] tracking-[-0.015em] text-kt-ink">
            Log out of Phindex?
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2.5 text-[17px] leading-[1.55] text-kt-body">
            Your votes, saved faces and game scores stay with your account. While you’re logged out you can still
            browse, but voting, commenting and the daily game wait until you’re back.
          </AlertDialogDescription>
        </div>
        <div className="flex flex-col-reverse gap-2.5 border-t border-kt-rule px-7 py-4 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            disabled={pending}
            className={outlineCapsule("mt-0 h-11 font-[inherit] text-[17px] hover:text-kt-teal")}
          >
            stay logged in
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={pending}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-full border-0 bg-kt-ink px-6 font-[inherit] text-[17px] text-kt-paper",
              "transition-colors hover:bg-kt-teal focus-visible:ring-2 focus-visible:ring-kt-teal/40 disabled:opacity-60"
            )}
          >
            {pending ? "logging out…" : "log out"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * ENTRAR (LoginModal.tsx)
 *
 * O login é só com Google. O modal diz para que serve a conta — votar,
 * postar a própria foto, jogar — antes de pedir o clique, e o botão do Google
 * segue o desenho do site: cápsula com contorno tinta, o "G" colorido como
 * única cor de fora da paleta (é a marca do Google, não decoração).
 *
 * O cadastro por e-mail continua no código (handleEmailAuth), sem interface.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LogoImage } from "@/components/kt/Mark";
import { SC } from "@/components/kt/Misc";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PERKS = [
  "Vote on any face, trait by trait.",
  "Post your own photo and see how the community reads you.",
  "Play the daily game and climb the leaderboard.",
];

const GoogleMark = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sem interface por enquanto: o login é só com Google.
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        onOpenChange(false);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-[440px] gap-0 p-0 text-kt-ink">
        <div className="px-7 pb-7 pt-8">
          <LogoImage className="h-7" />
          <SC as="p" className="mb-0 mt-6 text-[14px] text-kt-teal">
            join the index
          </SC>
          <DialogTitle className="mt-1 text-[30px] font-medium leading-[1.08] tracking-[-0.015em] text-kt-ink">
            Log in to vote, post and play
          </DialogTitle>
          <DialogDescription className="mb-0 mt-2 text-[17px] leading-[1.5] text-kt-body">
            Browsing is free and open. An account lets you take part:
          </DialogDescription>

          <ul className="m-0 mt-4 list-none p-0">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-baseline gap-3 border-t border-kt-rule py-2.5 text-[16px] leading-[1.45] text-kt-ink last:border-b">
                <span aria-hidden="true" className="relative top-[-1px] h-2 w-2 shrink-0 rounded-full bg-kt-teal" />
                {perk}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className={cn(
              "mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-kt-ink bg-white px-6 font-[inherit] text-[18px] text-kt-ink",
              "transition-colors duration-200 hover:bg-kt-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kt-teal/40 focus-visible:ring-offset-2",
              "disabled:cursor-wait disabled:opacity-60"
            )}
          >
            <GoogleMark />
            {loading ? "Opening Google…" : "Continue with Google"}
          </button>
          <p className="mb-0 mt-3 text-center text-[14px] italic text-kt-body">
            New here? The same button creates your account.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

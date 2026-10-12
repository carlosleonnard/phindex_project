/**
 * MENU DA CONTA (UserMenuPopover.tsx)
 *
 * O avatar no cabeçalho abre a página de membro, as configurações e a saída.
 * "Log out" pede confirmação (LogoutDialog); o diálogo vive fora do popover,
 * que fecha ao abri-lo — se ficasse dentro, sumiria junto com ele.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LogoutDialog } from "@/components/LogoutDialog";
import { supabase } from "@/integrations/supabase/client";

interface UserMenuPopoverProps {
  user: any;
}

interface UserProfile {
  nickname: string;
  avatar_url: string;
}

const itemClass =
  "flex min-h-11 w-full items-center gap-3 rounded-full border-0 bg-transparent px-3.5 text-left font-[inherit] text-[16px] text-kt-slate no-underline transition-colors hover:bg-kt-wash2 hover:text-kt-ink";

export const UserMenuPopover = ({ user }: UserMenuPopoverProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data } = await supabase.from("profiles").select("nickname, avatar_url").eq("id", user.id).single();

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

  const initials = (profile?.nickname || "u").slice(0, 2).toLowerCase();

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Your account"
            className="relative ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent p-0"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.nickname || "User"} />
              <AvatarFallback className="bg-kt-ink font-sc text-[15px] tracking-[0.04em] text-kt-paper">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 rounded-[3px] border-kt-rule bg-kt-paper p-0 text-kt-ink" align="end">
          <div className="flex items-center gap-3 border-b border-kt-rule px-4 py-3.5">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url || undefined} alt="" />
              <AvatarFallback className="bg-kt-ink font-sc text-[14px] tracking-[0.04em] text-kt-paper">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[17px] leading-tight text-kt-ink">{profile?.nickname || "Member"}</p>
              <p className="m-0 truncate text-[13px] text-kt-body">{user.email}</p>
            </div>
          </div>

          <nav aria-label="Account" className="flex flex-col gap-0.5 p-1.5">
            <Link to={`/member/${user.id}`} onClick={() => setMenuOpen(false)} className={itemClass}>
              <UserRound className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
              Your member page
            </Link>
            <Link to="/settings" onClick={() => setMenuOpen(false)} className={itemClass}>
              <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setConfirmLogout(true);
              }}
              className={itemClass}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
              Log out
            </button>
          </nav>
        </PopoverContent>
      </Popover>

      <LogoutDialog open={confirmLogout} onOpenChange={setConfirmLogout} />
    </>
  );
};

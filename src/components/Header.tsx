/**
 * CABEÇALHO DO APLICATIVO (Header.tsx)
 *
 * Barra fixa no topo de todas as páginas internas: marca, busca no índice,
 * a ação de adicionar um rosto, notificações e conta.
 *
 * A busca procura no índice inteiro (nomes, países, fenótipos e regiões) e
 * mostra até seis rostos enquanto se digita; Enter leva ao Explore com o termo,
 * onde estão os filtros. A tecla "/" põe o foco no campo.
 *
 * No mobile o menu lateral vira uma gaveta aberta pelo botão de menu; criar,
 * alertas e conta também estão na barra inferior.
 */

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Menu, Search, X } from "lucide-react";
import { AddProfileModal } from "./AddProfileModal";
import { LoginModal } from "./LoginModal";
import { NotificationBell } from "./NotificationBell";
import { UserMenuPopover } from "./UserMenuPopover";
import { LoginButton } from "./LoginButton";
import { SidebarNav } from "./AppSidebar";
import { Wordmark } from "@/components/kt/Mark";
import { CenButton } from "@/components/kt/Centromere";
import { FacePhoto, SC } from "@/components/kt/Misc";
import { useAuth } from "@/hooks/use-auth";
import { useIndexProfiles } from "@/hooks/use-index";
import { cn } from "@/lib/utils";

const BellTrigger = forwardRef<
  HTMLButtonElement,
  { unreadCount: number } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ unreadCount, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} new` : "Notifications"}
    className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent text-kt-ink transition-colors hover:bg-kt-wash2"
    {...props}
  >
    <Bell className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden="true" />
    {unreadCount > 0 && (
      <span
        aria-hidden="true"
        className="absolute right-[11px] top-[10px] h-2 w-2 rounded-full bg-kt-teal shadow-[0_0_0_2px_#F9FAFB]"
      />
    )}
  </button>
));
BellTrigger.displayName = "BellTrigger";

const SearchBox = () => {
  const navigate = useNavigate();
  const { profiles } = useIndexProfiles();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];
    return profiles
      .filter((profile) =>
        [profile.name, profile.country, profile.most_voted_phenotype, profile.most_voted_geographic, profile.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 6);
  }, [profiles, term]);

  // "/" foca a busca, como em qualquer índice.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    setOpen(false);
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : "/explore");
  };

  return (
    <form role="search" onSubmit={submit} className="mx-auto min-w-0 max-w-[520px] flex-1">
      <label htmlFor="site-search" className="sr-only">
        Search the index
      </label>
      <div ref={boxRef} className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-kt-body"
          strokeWidth={1.7}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="site-search"
          type="search"
          autoComplete="off"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search names, countries, phenotypes"
          className={cn(
            "h-11 w-full rounded-full border border-kt-rule bg-white pl-11 pr-11 font-[inherit] text-[17px] text-kt-ink",
            "placeholder:text-kt-mute focus-visible:border-kt-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kt-teal/30"
          )}
        />
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 hidden min-w-5 -translate-y-1/2 rounded border border-kt-rule bg-kt-paper px-1.5 text-center font-[inherit] text-[13px] text-kt-body md:block"
        >
          /
        </kbd>

        {open && term.trim() && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[3px] border border-kt-rule bg-white shadow-[0_18px_40px_-24px_rgba(25,42,67,.45)]">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-[15px] text-kt-body">No face matches “{term.trim()}”.</p>
            ) : (
              <ul>
                {results.map((profile) => (
                  <li key={profile.id} className="border-b border-kt-rule last:border-b-0">
                    <Link
                      to={`/user-profile/${profile.slug}`}
                      onClick={() => {
                        setOpen(false);
                        setTerm("");
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 text-kt-ink no-underline hover:bg-kt-wash"
                    >
                      <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-[3px] bg-kt-wash">
                        <FacePhoto src={profile.front_image_url} alt="" width={96} height={120} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] leading-tight">{profile.name}</span>
                        <SC className="block truncate text-[13px] text-kt-body">
                          {(profile.category === "User Profiles" ? "community" : profile.category).toLowerCase()}
                          {profile.country ? ` · ${profile.country.toLowerCase()}` : ""}
                        </SC>
                      </span>
                      {profile.most_voted_phenotype && (
                        <span className="hidden shrink-0 text-[14px] text-kt-body sm:inline">{profile.most_voted_phenotype}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="submit"
              className="flex w-full items-center justify-between border-0 border-t border-kt-rule bg-kt-paper px-4 py-2.5 text-left font-[inherit] text-[15px] text-kt-teal hover:bg-kt-wash"
            >
              See all results in Explore
              <span aria-hidden="true" className="font-sc text-[13px] text-kt-body">enter</span>
            </button>
          </div>
        )}
      </div>
    </form>
  );
};

export const Header = ({ showSearch = true }: { showSearch?: boolean }) => {
  const { user, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A gaveta fecha com Esc e trava a rolagem do fundo enquanto aberta.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-kt-rule bg-kt-paper">
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center gap-3 px-[clamp(16px,4.4vw,64px)] sm:gap-7">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="-ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-kt-ink hover:bg-kt-wash2 lg:hidden"
          >
            <Menu className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden="true" />
          </button>

          <Wordmark compact />

          {showSearch ? <SearchBox /> : <div className="flex-1" />}

          <div className="flex shrink-0 items-center gap-1.5">
            <CenButton
              size="sm"
              icon="plus"
              className="mr-1.5 hidden lg:inline-flex"
              onClick={() => (user ? setAddOpen(true) : setLoginOpen(true))}
            >
              add a face
            </CenButton>

            {user && (
              <NotificationBell renderTrigger={(unreadCount) => <BellTrigger unreadCount={unreadCount} />} />
            )}

            {user ? (
              <UserMenuPopover user={user} />
            ) : (
              <LoginButton onClick={() => setLoginOpen(true)} disabled={loading} />
            )}
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 border-0 bg-kt-deep/40"
          />
          <div className="absolute inset-y-0 left-0 w-[min(320px,86vw)] overflow-y-auto border-r border-kt-rule bg-kt-paper px-4 pb-10 pt-4">
            <div className="mb-5 flex items-center justify-between pl-2">
              <Wordmark logoClassName="h-[26px]" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent text-kt-ink hover:bg-kt-wash2"
              >
                <X className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <AddProfileModal triggerExternal={addOpen} onTriggerExternalChange={setAddOpen} />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
};

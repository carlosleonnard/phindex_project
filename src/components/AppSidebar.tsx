/**
 * MENU LATERAL (AppSidebar.tsx)
 *
 * Navegação persistente em telas largas, no fluxo da página (não fixa): três
 * grupos, do mais usado ao menos — destinos principais, recortes do acervo
 * (regiões e categorias) e suporte.
 *
 * O item ativo vira uma cápsula tinta. As regiões levam o ponto da sua cor, os
 * únicos pontos não-teal da navegação. Das doze categorias, cinco aparecem; as
 * demais abrem sob demanda — a menos que a ativa esteja escondida, caso em que a
 * lista já nasce aberta.
 *
 * `SidebarNav` é reaproveitado pela gaveta do mobile, no cabeçalho.
 */

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bookmark, Compass, Gamepad2, Heart, LogOut, Trophy, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { CONTINENT_ORDER, CONTINENT_META } from "@/constants/regions";
import { CATEGORY_OPTIONS, CATEGORY_SLUG_MAP } from "@/constants/categories";
import { RegionDot } from "@/components/kt/Misc";
import { LogoutDialog } from "@/components/LogoutDialog";
import { cn } from "@/lib/utils";

/**
 * O feed aponta para /community, não para "/": na raiz o visitante sem sessão
 * recebe a landing, e a navegação precisa mantê-lo dentro do produto.
 */
const PRIMARY_NAV = [
  { Icon: Users, name: "Community", path: "/community" },
  { Icon: Compass, name: "Explore", path: "/explore" },
  { Icon: Gamepad2, name: "Guess the phenotype", path: "/game", badge: "daily" },
  { Icon: Heart, name: "Attractiveness scale", path: "/attraction" },
  { Icon: Trophy, name: "Leaderboard", path: "/leaderboard" },
  { Icon: Bookmark, name: "Saved", path: "/saved" },
];

const CATEGORIES = ["Community", ...CATEGORY_OPTIONS];

/** As que ficam sempre visíveis, na ordem do layout. */
const PINNED_CATEGORIES = ["Community", "Pop Culture", "Music and Entertainment", "Sciences", "Sports"];

const SUPPORT_NAV = [
  { name: "Phenotype flow", path: "/phenotype-flow" },
  { name: "Help & FAQ", path: "/faq" },
  { name: "Contact", path: "/contact" },
];

const categorySlug = (name: string) =>
  CATEGORY_SLUG_MAP[name] || name.toLowerCase().replace(/\s+/g, "-");

const rowClass = (active: boolean) =>
  cn(
    "flex min-h-[44px] items-center gap-3 rounded-full px-4 no-underline transition-colors duration-200",
    active ? "bg-kt-ink text-kt-paper" : "text-kt-slate hover:bg-kt-wash2"
  );

const GroupLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-1.5 mt-8 pl-4 font-sc text-[14px] font-semibold tracking-[0.07em] text-kt-body first:mt-0">
    {children}
  </h2>
);

export const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isCategoryActive = (name: string) => location.pathname === `/category/${categorySlug(name)}`;
  const hiddenActive = CATEGORIES.filter((name) => !PINNED_CATEGORIES.includes(name)).some(isCategoryActive);
  const expanded = showAll || hiddenActive;
  const visibleCategories = expanded ? CATEGORIES : PINNED_CATEGORIES;

  return (
    <div className="text-[16px]">
      <nav aria-label="Primary">
        <ul className="flex flex-col gap-0.5">
          {PRIMARY_NAV.map(({ Icon, name, path, badge }) => {
            // Com sessão, "/" também mostra o feed.
            const active = location.pathname === path || (path === "/community" && location.pathname === "/");
            return (
              <li key={path}>
                <Link
                  to={path}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={rowClass(active)}
                >
                  <Icon className="h-[19px] w-[19px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
                  <span className="min-w-0 flex-1 py-1.5 leading-[1.2]">{name}</span>
                  {badge && !active && (
                    <span className="shrink-0 rounded-full border border-kt-b50 px-[7px] font-sc text-[12px] tracking-[0.06em] text-kt-teal">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <GroupLabel>regions</GroupLabel>
      <ul className="flex flex-col">
        {CONTINENT_ORDER.map((continent) => {
          const path = `/region/${CONTINENT_META[continent].slug}`;
          const active = location.pathname === path;
          return (
            <li key={continent}>
              <Link to={path} onClick={onNavigate} aria-current={active ? "page" : undefined} className={rowClass(active)}>
                <RegionDot continent={continent} ring={active} />
                {continent}
              </Link>
            </li>
          );
        })}
      </ul>

      <GroupLabel>categories</GroupLabel>
      <ul className="flex flex-col">
        {visibleCategories.map((name) => {
          const active = isCategoryActive(name);
          return (
            <li key={name}>
              <Link
                to={`/category/${categorySlug(name)}`}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={rowClass(active)}
              >
                {name}
              </Link>
            </li>
          );
        })}
        {!hiddenActive && (
          <li>
            <button
              type="button"
              onClick={() => setShowAll((open) => !open)}
              aria-expanded={expanded}
              className="flex min-h-[44px] w-full items-center rounded-full border-0 bg-transparent px-4 text-left font-[inherit] text-[16px] italic text-kt-teal hover:bg-kt-wash2"
            >
              {expanded ? "fewer categories" : `all ${CATEGORIES.length} categories`}
            </button>
          </li>
        )}
      </ul>

      <GroupLabel>support</GroupLabel>
      <ul className="flex flex-col">
        {SUPPORT_NAV.map(({ name, path }) => {
          const active = location.pathname === path;
          return (
            <li key={path}>
              <Link to={path} onClick={onNavigate} aria-current={active ? "page" : undefined} className={rowClass(active)}>
                {name}
              </Link>
            </li>
          );
        })}
        {user && (
          <li>
            <button
              type="button"
              // Na gaveta do celular, ela só fecha depois que a saída termina.
              onClick={() => setConfirmLogout(true)}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-full border-0 bg-transparent px-4 text-left font-[inherit] text-[16px] text-kt-body hover:bg-kt-wash2"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
              Log out
            </button>
          </li>
        )}
      </ul>

      <LogoutDialog open={confirmLogout} onOpenChange={setConfirmLogout} onLoggedOut={onNavigate} />
    </div>
  );
};

export const AppSidebar = () => (
  <aside aria-label="Sections" className="hidden w-[212px] shrink-0 lg:block">
    <SidebarNav />
  </aside>
);

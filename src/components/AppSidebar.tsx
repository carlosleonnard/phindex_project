/**
 * SIDEBAR (AppSidebar.tsx)
 *
 * Navegação persistente em telas largas. Três grupos, do mais usado ao menos:
 * destinos principais, recortes do acervo (regiões e categorias) e suporte.
 *
 * As regiões trazem um ponto colorido — os únicos pontos não-teal da
 * navegação, que servem para achar a linha sem ler o rótulo.
 *
 * As categorias são doze; mostrar todas empurrava suporte para fora da
 * primeira tela. Quatro ficam visíveis e o resto abre sob demanda — a menos
 * que a categoria ativa esteja entre as escondidas, caso em que a lista já
 * nasce aberta para a página atual aparecer marcada.
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { CONTINENT_ORDER, CONTINENT_META } from "@/constants/regions";
import { CATEGORY_SLUG_MAP } from "@/constants/categories";
import { cn } from "@/lib/utils";
import {
  Users,
  Film,
  Music,
  Palette,
  Brain,
  Microscope,
  Trophy,
  Briefcase,
  Building,
  Skull,
  Church,
  Shield,
  GitBranch,
  HelpCircle,
  LogOut,
  Mail,
  Award,
  Gamepad2,
  Home,
  Compass,
  Bookmark,
  ChevronDown,
} from "lucide-react";

/** Destinos de descoberta, espelhando a bottom nav do mobile. */
const PRIMARY_NAV = [
  { Icon: Home, name: "Home", path: "/" },
  { Icon: Compass, name: "Explore", path: "/explore" },
  { Icon: Gamepad2, name: "Guess the phenotype", path: "/game", badge: "DAILY" },
  { Icon: Award, name: "Leaderboard", path: "/leaderboard" },
  { Icon: Bookmark, name: "Saved", path: "/saved" },
];

/** As quatro primeiras aparecem sempre; as demais ficam atrás de "Show all". */
const CATEGORIES = [
  { Icon: Users, name: "Community" },
  { Icon: Film, name: "Pop Culture" },
  { Icon: Building, name: "Politics" },
  { Icon: Shield, name: "Military" },
  { Icon: Music, name: "Music and Entertainment" },
  { Icon: Palette, name: "Arts" },
  { Icon: Brain, name: "Philosophy" },
  { Icon: Microscope, name: "Sciences" },
  { Icon: Trophy, name: "Sports" },
  { Icon: Briefcase, name: "Business" },
  { Icon: Skull, name: "Criminals" },
  { Icon: Church, name: "Religion" },
];

const VISIBLE_CATEGORIES = 4;

const SUPPORT_NAV = [
  { Icon: GitBranch, name: "Phenotype flow", path: "/phenotype-flow" },
  { Icon: HelpCircle, name: "Help & FAQ", path: "/faq" },
  { Icon: Mail, name: "Contact", path: "/contact" },
];

/** Rótulo de grupo. Discreto por definição: organiza sem competir com os itens. */
const GroupLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
    {children}
  </h3>
);

/**
 * Uma linha de navegação. O estado ativo é marcado por fundo + cor + peso, não
 * só por cor: quem não distingue teal de cinza ainda vê onde está.
 */
const NavRow = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  badge,
  dot,
}: {
  icon?: typeof Home;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: string;
  dot?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      isActive
        ? "bg-primary/10 font-semibold text-primary"
        : "text-foreground hover:bg-muted/70"
    )}
  >
    {Icon && (
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          isActive ? "text-primary" : "text-primary/70 group-hover:text-primary"
        )}
      />
    )}

    {dot && (
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: `hsl(${dot})` }}
      />
    )}

    <span className="min-w-0 flex-1 truncate text-[15px]">{label}</span>

    {badge && (
      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
        {badge}
      </span>
    )}
  </button>
);

export const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [showAllCategories, setShowAllCategories] = useState(false);

  const categorySlug = (name: string) =>
    CATEGORY_SLUG_MAP[name] || name.toLowerCase().replace(/\s+/g, "-");

  const isCategoryActive = (name: string) =>
    location.pathname === `/category/${categorySlug(name)}`;

  // Uma categoria escondida e ativa força a lista aberta: a página atual
  // precisa aparecer marcada mesmo sem o usuário ter clicado em "Show all".
  const hiddenActive = CATEGORIES.slice(VISIBLE_CATEGORIES).some((category) =>
    isCategoryActive(category.name)
  );
  const categoriesExpanded = showAllCategories || hiddenActive;
  const visibleCategories = categoriesExpanded
    ? CATEGORIES
    : CATEGORIES.slice(0, VISIBLE_CATEGORIES);

  return (
    <div className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-80 lg:block">
      <nav
        aria-label="Main"
        className="h-full overflow-y-auto overscroll-contain border-r border-border/60 bg-card px-4 py-5 scrollbar-hide"
      >
        <ul className="space-y-0.5">
          {PRIMARY_NAV.map((item) => (
            <li key={item.path}>
              <NavRow
                icon={item.Icon}
                label={item.name}
                badge={item.badge}
                isActive={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            </li>
          ))}
        </ul>

        <Separator className="my-5" />

        <section>
          <GroupLabel>Regions</GroupLabel>
          <ul className="space-y-0.5">
            {CONTINENT_ORDER.map((continent) => {
              const meta = CONTINENT_META[continent];
              return (
                <li key={continent}>
                  <NavRow
                    label={continent}
                    dot={meta.dot}
                    isActive={location.pathname === `/region/${meta.slug}`}
                    onClick={() => navigate(`/region/${meta.slug}`)}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <Separator className="my-5" />

        <section>
          <GroupLabel>Categories</GroupLabel>
          <ul className="space-y-0.5">
            {visibleCategories.map((category) => (
              <li key={category.name}>
                <NavRow
                  icon={category.Icon}
                  label={category.name}
                  isActive={isCategoryActive(category.name)}
                  onClick={() => navigate(`/category/${categorySlug(category.name)}`)}
                />
              </li>
            ))}
          </ul>

          {!hiddenActive && (
            <button
              type="button"
              onClick={() => setShowAllCategories((open) => !open)}
              aria-expanded={categoriesExpanded}
              className="mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronDown
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                  categoriesExpanded && "rotate-180"
                )}
              />
              {categoriesExpanded ? "Show less" : `Show all ${CATEGORIES.length}`}
            </button>
          )}
        </section>

        <Separator className="my-5" />

        <section className="pb-4">
          <GroupLabel>Support</GroupLabel>
          <ul className="space-y-0.5">
            {SUPPORT_NAV.map((item) => (
              <li key={item.path}>
                <NavRow
                  icon={item.Icon}
                  label={item.name}
                  isActive={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                />
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" />
                Log out
              </button>
            </li>
          </ul>
        </section>
      </nav>
    </div>
  );
};

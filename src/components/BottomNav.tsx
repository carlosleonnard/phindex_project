/**
 * NAVEGAÇÃO INFERIOR MOBILE (BottomNav.tsx)
 *
 * Barra fixa de cinco destinos no mobile, conforme o wireframe:
 * Home · Explore · Adicionar · Saved · Perfil
 *
 * Substitui o menu hambúrguer como caminho principal — as ações mais usadas
 * ficam ao alcance do polegar em vez de escondidas atrás de um toque extra.
 */

import { Home, Search, Plus, Heart, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AddProfileModal } from "./AddProfileModal";
import { LoginModal } from "./LoginModal";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  /** Exige login; sem sessão, abre o modal de autenticação. */
  requiresAuth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: Heart, label: "Saved", path: "/saved", requiresAuth: true },
  { icon: User, label: "Profile", path: "/settings", requiresAuth: true },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleNavigate = (item: NavItem) => {
    if (item.requiresAuth && !user) {
      setIsLoginOpen(true);
      return;
    }
    navigate(item.path);
  };

  const handleAdd = () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    setIsAddOpen(true);
  };

  // Os dois primeiros itens à esquerda do botão central, os dois últimos à direita.
  const renderItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    return (
      <button
        key={item.path}
        type="button"
        onClick={() => handleNavigate(item)}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-full flex-1 flex-col items-center justify-center gap-0.5",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <item.icon className={cn("h-5 w-5", isActive && "fill-current/10")} />
        <span className="text-[11px] leading-none">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16 items-stretch">
          {NAV_ITEMS.slice(0, 2).map(renderItem)}

          {/* Ação central de criar — elevada para leitura imediata. */}
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={handleAdd}
              aria-label="Add a profile"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_12px_hsl(var(--primary)/0.35)] transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {NAV_ITEMS.slice(2).map(renderItem)}
        </div>
      </nav>

      <AddProfileModal
        triggerExternal={isAddOpen}
        onTriggerExternalChange={setIsAddOpen}
      />
      <LoginModal open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
};

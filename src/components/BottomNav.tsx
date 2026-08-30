/**
 * NAVEGAÇÃO INFERIOR MOBILE (BottomNav.tsx)
 *
 * Barra fixa de cinco destinos no mobile:
 * Home · Explore · Adicionar · Alerts · Profile
 *
 * A barra superior no mobile ficou só com logo e menu sanduíche, então as
 * ações que antes moravam lá (criar, notificações, perfil/login) vivem aqui,
 * ao alcance do polegar. O resto da navegação está no menu sanduíche.
 */

import { Home, Search, Plus, Bell, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { forwardRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AddProfileModal } from "./AddProfileModal";
import { LoginModal } from "./LoginModal";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  /** Exige login; sem sessão, abre o modal de autenticação. */
  requiresAuth?: boolean;
}

const LEFT_ITEMS: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Explore", path: "/explore" },
];

const PROFILE_ITEM: NavItem = {
  icon: User,
  label: "Profile",
  path: "/settings",
  requiresAuth: true,
};

/** Classes compartilhadas por todos os itens da barra. */
const itemClass = (isActive: boolean) =>
  cn(
    "flex h-full flex-1 flex-col items-center justify-center gap-0.5",
    "transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
  );

/**
 * Item de notificações — precisa de ref encaminhada para servir de trigger
 * do popover do NotificationBell.
 */
const AlertsTrigger = forwardRef<
  HTMLButtonElement,
  { unreadCount: number } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ unreadCount, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={
      unreadCount > 0 ? `Alerts, ${unreadCount} unread` : "Alerts"
    }
    className={cn(itemClass(false), "relative")}
    {...props}
  >
    <span className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </span>
    <span className="text-[11px] leading-none">Alerts</span>
  </button>
));
AlertsTrigger.displayName = "AlertsTrigger";

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

  const renderItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    return (
      <button
        key={item.path}
        type="button"
        onClick={() => handleNavigate(item)}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className={itemClass(isActive)}
      >
        <item.icon className={cn("h-5 w-5", isActive && "fill-current/10")} />
        <span className="text-[11px] leading-none">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Espaçador: reserva no fluxo a altura da barra fixa, para que o
          conteúdo no fim da página nunca fique escondido atrás dela. */}
      <div
        aria-hidden
        className="h-16 lg:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      />

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16 items-stretch">
          {LEFT_ITEMS.map(renderItem)}

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

          {/* Alertas: o popover só existe logado; deslogado, leva ao login. */}
          {user ? (
            <NotificationBell
              align="end"
              side="top"
              renderTrigger={(unreadCount) => (
                <AlertsTrigger unreadCount={unreadCount} />
              )}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              aria-label="Alerts"
              className={itemClass(false)}
            >
              <Bell className="h-5 w-5" />
              <span className="text-[11px] leading-none">Alerts</span>
            </button>
          )}

          {renderItem(PROFILE_ITEM)}
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

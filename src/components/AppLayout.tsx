/**
 * MOLDURA DAS PÁGINAS INTERNAS (AppLayout.tsx)
 *
 * Cabeçalho fixo, uma coluna central de até 1.312 px com o menu lateral no
 * fluxo (não fixo) e a página ao lado, rodapé e a barra inferior do mobile.
 * Todas as páginas internas passam por aqui, para que margens, larguras e o
 * menu sejam os mesmos em todo o site.
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Header } from "./Header";
import { AppSidebar } from "./AppSidebar";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  /** Mostra o menu lateral em telas largas. */
  sidebar?: boolean;
  /** Mostra a busca no cabeçalho (o Explore tem a sua própria). */
  showSearch?: boolean;
  mainClassName?: string;
}

export const AppLayout = ({ children, sidebar = true, showSearch = true, mainClassName }: AppLayoutProps) => (
  <div className="flex min-h-screen flex-col bg-kt-paper text-kt-ink">
    <Header showSearch={showSearch} />
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 items-start gap-10 px-[clamp(16px,4.4vw,64px)] pb-16 pt-[30px]">
      {sidebar && <AppSidebar />}
      <main className={cn("min-w-0 flex-1", mainClassName)}>{children}</main>
    </div>
    <Footer />
    <BottomNav />
  </div>
);

/** Trilha de navegação em texto: "Discover / Categories / Sports". */
export const Crumbs = ({ items }: { items: Array<{ label: string; to?: string }> }) => (
  <nav aria-label="Breadcrumb" className="text-[15px] text-kt-body">
    <ol className="m-0 flex list-none flex-wrap gap-x-2.5 gap-y-1.5 p-0">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2.5">
            {item.to && !last ? (
              <Link to={item.to} className="text-kt-body">
                {item.label}
              </Link>
            ) : (
              <span aria-current={last ? "page" : undefined} className={last ? "text-kt-ink" : undefined}>
                {item.label}
              </span>
            )}
            {!last && (
              <span aria-hidden="true" className="text-kt-b50">
                /
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

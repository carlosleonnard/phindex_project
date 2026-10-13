/**
 * PÁGINAS DE TEXTO (Prose.tsx)
 *
 * Sobre, Privacidade e Termos são páginas longas de leitura, não telas de
 * produto: uma coluna estreita, seções numeradas e o cabeçalho padrão do
 * site. Este arquivo guarda a moldura para que as três fiquem iguais.
 *
 * `updated` é a data de revisão — numa política, saber quando mudou importa
 * tanto quanto o texto.
 */

import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/AppLayout";
import { SC } from "@/components/kt/Misc";

const SITE = "https://www.phenotypeindex.com";

export const ProsePage = ({
  eyebrow,
  title,
  intro,
  path,
  metaTitle,
  metaDescription,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  /** Caminho sem domínio, ex. "/about". */
  path: string;
  metaTitle: string;
  metaDescription: string;
  /** Data da última revisão, já formatada. Omitida na página Sobre. */
  updated?: string;
  children: ReactNode;
}) => (
  <AppLayout>
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={`${SITE}${path}`} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={`${SITE}${path}`} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Phindex - Phenotype Index" />
      <meta property="og:image" content={`${SITE}/og-phindex-faces.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@phenotypeindex" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={`${SITE}/og-phindex-faces.png`} />
    </Helmet>

    <SC as="p" className="m-0 text-[16px] text-kt-teal">
      {eyebrow}
    </SC>
    <h1 className="mb-0 mt-1 text-[clamp(44px,5.4vw,78px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
      {title}
    </h1>
    <div className="mt-[22px] max-w-[68ch] border-t-[1.5px] border-kt-ink pt-4">
      <p className="m-0 text-[19px] leading-[1.6] text-kt-slate">{intro}</p>
      {updated && (
        <SC as="p" className="mb-0 mt-3 text-[14px] text-kt-body">
          last updated {updated}
        </SC>
      )}
    </div>

    <div className="mt-9 max-w-[68ch]">{children}</div>
  </AppLayout>
);

/** Uma seção da página, com o título que também serve de âncora. */
export const ProseSection = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section aria-labelledby={`${id}-title`} className="border-t border-kt-rule pt-6 [&+&]:mt-9">
    <h2 id={`${id}-title`} className="mb-3 mt-0 text-[27px] font-medium leading-[1.15] text-kt-ink">
      {title}
    </h2>
    <div className="space-y-3.5 text-[17px] leading-[1.65] text-kt-body [&_a]:text-kt-teal [&_strong]:font-semibold [&_strong]:text-kt-ink">
      {children}
    </div>
  </section>
);

/** Lista com marcadores no tom do site. */
export const ProseList = ({ items }: { items: ReactNode[] }) => (
  <ul className="m-0 list-none space-y-2 p-0">
    {items.map((item, index) => (
      <li key={index} className="flex gap-3">
        <span aria-hidden="true" className="relative top-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-kt-b50" />
        <span className="min-w-0">{item}</span>
      </li>
    ))}
  </ul>
);

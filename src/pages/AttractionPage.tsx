/**
 * PÁGINA DA ESCALA DE ATRAÇÃO (AttractionPage.tsx)
 *
 * `noindex, follow`: isto é uma ferramenta pessoal para quem já está no site.
 * Uma página que ranqueia rótulos de fenótipo por atração, aberta pela busca
 * sem o contexto do resto do site, é lida como uma afirmação sobre grupos de
 * pessoas — que é o contrário do que ela mede. O `follow` mantém os links
 * internos valendo.
 *
 * POR QUE O useEffect, E NÃO SÓ O HELMET:
 * O index.html traz um <meta name="robots" content="index, follow…"> estático
 * sem `data-rh`, então o Helmet não o substitui: ele acrescenta um segundo
 * meta e o primeiro é o que vale. Marcar o estático com `data-rh` resolveria
 * aqui e quebraria o resto do site — o Helmet passa a gerenciar a tag e a
 * remove em toda página que não declara robots, deixando as outras 20 páginas
 * sem a diretiva (verificado: `n: 0` em /, /explore e /game).
 *
 * Então a página tira a tag estática enquanto está montada e a devolve ao
 * sair. O header `X-Robots-Tag` do vercel.json é a defesa real para o
 * crawler; isto mantém o DOM coerente para quem inspeciona a página.
 */

import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/AppLayout";
import { AttractionScale } from "@/components/AttractionScale";

const useSuppressStaticRobots = () => {
  useEffect(() => {
    const tag = document.querySelector('meta[name="robots"]:not([data-rh])');
    if (!tag) return;
    const parent = tag.parentNode;
    const sibling = tag.nextSibling;
    parent?.removeChild(tag);
    return () => {
      parent?.insertBefore(tag, sibling);
    };
  }, []);
};

const AttractionPage = () => {
  useSuppressStaticRobots();

  return (
    <AppLayout>
      <Helmet>
        <title>Attraction Scale | Phindex</title>
        <meta
          name="description"
          content="Rate synthetic faces from 1 to 7 and see your own ranking, your top five, and how your taste compares with everyone else on Phindex."
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://www.phenotypeindex.com/attraction" />
      </Helmet>

      <AttractionScale />
    </AppLayout>
  );
};

export default AttractionPage;

/**
 * ARTE DO HERÓI (HeroFaces.tsx)
 *
 * A faixa de rostos frontais do topo da landing.
 *
 * É uma imagem fixa, não uma composição de perfis do banco: seis rostos lado a
 * lado como exemplo do que o Phindex classifica. A foto original é colorida;
 * foi passada para o mesmo degradê da arte anterior (do teal-tinta #0e272a ao
 * quase branco #d6e4e8), com os mesmos níveis para os seis — ajustar cada
 * rosto separadamente falsearia a relação entre os tons de pele — e cortada
 * em seis placas do mesmo tamanho, que unificam fundos de origens diferentes.
 *
 * No celular a fileira ficaria pequena demais e vira uma grade 3 × 2. Os
 * arquivos são servidos de /public em WebP, com fallback PNG da fileira.
 */

interface HeroFacesProps {
  /**
   * Texto alternativo. A arte é decorativa por padrão: a manchete ao lado já
   * diz o que a página é.
   */
  alt?: string;
}

export const HeroFaces = ({ alt = "" }: HeroFacesProps) => (
  <picture>
    <source media="(max-width: 639px)" srcSet="/hero-faces-grid.webp" type="image/webp" width={832} height={752} />
    <source srcSet="/hero-faces.webp" type="image/webp" width={1672} height={372} />
    <img
      src="/hero-faces.png"
      alt={alt}
      // A arte do topo é o LCP provável da landing: carrega cedo e com
      // prioridade, sem lazy.
      {...({ fetchpriority: "high" } as { fetchpriority: string })}
      decoding="async"
      width={1672}
      height={372}
      className="h-auto w-full select-none"
      draggable={false}
    />
  </picture>
);

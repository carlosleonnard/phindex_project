/**
 * SUBCATEGORIAS (subcategories.ts)
 *
 * A lista vive em categories.ts, junto das categorias que ela indexa. Este
 * arquivo apenas reexporta, mantendo o caminho de import usado pelos
 * formulários e pela página de categoria.
 *
 * Duas cópias da mesma lista foi como as categorias novas (Criminals,
 * Religion, Military) acabaram faltando no sitemap — uma fonte só evita isso.
 */

export { SUBCATEGORIES as SUBCATEGORIES_BY_CATEGORY } from "./categories";

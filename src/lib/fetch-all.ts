/**
 * BUSCA PAGINADA (fetch-all.ts)
 *
 * O PostgREST corta cada resposta em 1.000 linhas. Agregados calculados no
 * cliente (contagem de votos, consenso, distribuição por região) perdiam votos
 * em silêncio quando a consulta passava desse teto. Este helper repete a
 * consulta em janelas de 1.000 até a última página vir incompleta.
 */

const PAGE_SIZE = 1000;

interface PageResult<T> {
  data: T[] | null;
  error: { message: string; code?: string } | null;
}

/**
 * @param page recebe o intervalo [from, to] e devolve a consulta já com
 *             `.range(from, to)` aplicado — inclusive a ordenação, que precisa
 *             ser estável para as janelas não se sobreporem.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<{ data: T[]; error: PageResult<T>["error"] }> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error };

    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  return { data: rows, error: null };
}

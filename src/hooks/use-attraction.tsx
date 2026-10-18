/**
 * DADOS DA ESCALA DE ATRAÇÃO (use-attraction.tsx)
 *
 * Cinco hooks pequenos em vez de um hook de sessão: a sessão (qual cartão,
 * quais notas) vive no componente, porque é estado de interface e se perde no
 * recarregamento de propósito. Aqui fica só o que vem do banco.
 *
 *   useFaceStats   — média da amostra por rosto, para o "acima/abaixo da média"
 *   useVoterMeans  — a distribuição das médias pessoais, para o percentil
 *   useSampleSize  — quantas PESSOAS participaram
 *   useMyRatings   — as notas que esta pessoa já deu, para voltar e corrigir
 *   useRateFace    — grava uma nota (upsert: reavaliar corrige, não duplica)
 *
 * CONTAR PESSOAS, NÃO LINHAS. Uma sessão de "both" grava 76 linhas. Em `votes`
 * ler linha como votante inflou a contagem 34 vezes e a conclusão foi parar
 * num relatório; aqui o número de participantes vem de uma view que faz
 * COUNT(DISTINCT user_id), nunca de um .length do lado do cliente.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FaceGender } from "@/constants/attractiveness";
import type { RatingInput, SampleStat } from "@/lib/attraction-result";

/** As views não estão nos tipos gerados do Supabase; o cast para na borda. */
const db = supabase as unknown as {
  from: (table: string) => {
    select: (columns: string) => Promise<{ data: unknown; error: unknown }> & {
      eq: (column: string, value: string) => Promise<{ data: unknown; error: unknown }>;
      maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
    };
    upsert: (
      rows: unknown,
      options: { onConflict: string }
    ) => Promise<{ data: unknown; error: unknown }>;
  };
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Média e número de avaliadores de cada rosto.
 *
 * Um rosto com um ou dois avaliadores não tem média que sirva de comparação,
 * então `voters` sai junto e quem monta a tela decide a partir de quantos a
 * comparação vale.
 */
export const useFaceStats = () =>
  useQuery({
    queryKey: ["attraction", "face-stats"],
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<SampleStat[]> => {
      const { data, error } = await db
        .from("attraction_face_stats")
        .select("phenotype, gender, voters, mean_rating");
      if (error) throw error;

      return ((data ?? []) as Array<Record<string, unknown>>)
        .map((row) => ({
          phenotype: String(row.phenotype),
          gender: String(row.gender) as FaceGender,
          voters: Number(row.voters ?? 0),
          mean_rating: toNumber(row.mean_rating) ?? 0,
        }))
        .filter((row) => row.voters > 0);
    },
  });

/**
 * As médias pessoais de quem já participou, uma por pessoa e sem id.
 * É a distribuição contra a qual o percentil é calculado.
 */
export const useVoterMeans = () =>
  useQuery({
    queryKey: ["attraction", "voter-means"],
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await db
        .from("attraction_voter_means")
        .select("mean_rating");
      if (error) throw error;

      return ((data ?? []) as Array<Record<string, unknown>>)
        .map((row) => toNumber(row.mean_rating))
        .filter((value): value is number => value !== null);
    },
  });

/** Quantas pessoas participaram. COUNT(DISTINCT user_id), feito no banco. */
export const useSampleSize = () =>
  useQuery({
    queryKey: ["attraction", "sample-size"],
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<number> => {
      const { data, error } = await db
        .from("attraction_sample_size")
        .select("voters")
        .maybeSingle();
      if (error) throw error;
      return toNumber((data as Record<string, unknown> | null)?.voters) ?? 0;
    },
  });

/** As notas que esta pessoa já deu, para a sessão começar de onde parou. */
export const useMyRatings = (userId?: string) =>
  useQuery({
    queryKey: ["attraction", "my-ratings", userId],
    enabled: Boolean(userId),
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<RatingInput[]> => {
      const { data, error } = await db
        .from("attraction_ratings")
        .select("phenotype, gender, rating")
        .eq("user_id", userId as string);
      if (error) throw error;

      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        phenotype: String(row.phenotype),
        gender: String(row.gender) as FaceGender,
        rating: Number(row.rating),
      }));
    },
  });

/**
 * Grava uma nota. O upsert na chave (user, phenotype, gender) faz com que
 * voltar e corrigir sobrescreva a nota em vez de criar uma segunda linha.
 *
 * Os agregados não são invalidados a cada cartão: numa sessão de 76 notas
 * seriam 76 refetches de três views, e a média da amostra não precisa estar
 * fresca durante a avaliação — ela é lida no resultado.
 */
export const useRateFace = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phenotype, gender, rating }: RatingInput) => {
      if (!userId) throw new Error("not signed in");
      const { error } = await db.from("attraction_ratings").upsert(
        [{ user_id: userId, phenotype, gender, rating }],
        { onConflict: "user_id,phenotype,gender" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attraction", "my-ratings", userId] });
    },
    // Uma nota que não gravou não interrompe a sessão: o resultado sai do
    // estado local de qualquer forma, e o cartão seguinte já está na tela.
    onError: (error) => console.error("Error saving attraction rating:", error),
  });
};

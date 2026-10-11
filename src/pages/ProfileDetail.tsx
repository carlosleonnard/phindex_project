/**
 * ROTA ANTIGA DE PERFIL (/profile/:id)
 *
 * O perfil tem uma página só: /user-profile/:slug. Links antigos (e os que
 * ainda apontam pelo id, como os comentários na página de membro) chegam aqui,
 * descobrem o slug e são redirecionados.
 */

import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: slug, isLoading, error } = useQuery({
    queryKey: ["profile-slug", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_profiles").select("slug").eq("id", id!).single();
      if (error) throw error;
      return data?.slug ?? null;
    },
  });

  if (isLoading) {
    return (
      <AppLayout sidebar={false}>
        <div aria-busy="true" className="h-64 animate-pulse rounded-[3px] bg-kt-wash" />
      </AppLayout>
    );
  }

  if (error || !slug) return <Navigate to="/404" replace />;

  return <Navigate to={`/user-profile/${slug}`} replace />;
}

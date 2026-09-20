/**
 * CARD DE FENÓTIPO (PhenotypeCard.tsx)
 *
 * Unidade central do feed. Mostra o rosto, como a comunidade classificou e o
 * convite para votar.
 *
 * Os dois fenótipos mais votados aparecem juntos (1º e 2º) porque a
 * classificação raramente é unânime — o segundo lugar é informação, não ruído.
 * Um perfil sem votos não mostra chips vazios: mostra o convite para ser o
 * primeiro a classificar, que é a ação que falta ali.
 *
 * Suporta duas densidades:
 * - "feed"  : card do feed principal da home
 * - "grid"  : card médio para grades multi-coluna (Explore, Saved)
 */

import { useRef, useState, useCallback, memo } from "react";
import { Heart, MessageSquare, Sparkles, Vote, ArrowRight, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSavedProfileIds, useToggleSaved } from "@/hooks/use-saved-profiles";
import type { FeedProfile } from "@/hooks/use-profile-feed";

interface PhenotypeCardProps {
  profile: FeedProfile;
  variant?: "feed" | "grid";
  /** Prioriza o carregamento das primeiras imagens visíveis. */
  priority?: boolean;
}

/** Chip de classificação. O primeiro lugar é sólido; o segundo, discreto. */
const PhenotypeChip = ({ rank, label }: { rank: number; label: string }) => (
  <span
    className={cn(
      "inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
      rank === 1
        ? "bg-primary/10 font-medium text-primary"
        : "bg-muted text-muted-foreground"
    )}
  >
    <span className="shrink-0 text-[10px] tabular-nums opacity-70">{rank}º</span>
    <span className="truncate">{label}</span>
  </span>
);

const PhenotypeCardComponent = ({
  profile,
  variant = "feed",
  priority = false,
}: PhenotypeCardProps) => {
  const navigate = useNavigate();
  const { savedIds } = useSavedProfileIds();
  const toggleSaved = useToggleSaved();

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [burst, setBurst] = useState(false);
  const lastTapRef = useRef(0);

  const isSaved = savedIds.has(profile.id);
  const isFeed = variant === "feed";

  const openProfile = useCallback(() => {
    navigate(`/user-profile/${profile.slug}`);
  }, [navigate, profile.slug]);

  /** O contador de comentários leva direto à seção de comentários do perfil. */
  const openComments = useCallback(() => {
    navigate(`/user-profile/${profile.slug}#comments`);
  }, [navigate, profile.slug]);

  const handleSave = useCallback(() => {
    if (!isSaved) {
      // A animação só dispara ao salvar, não ao remover.
      setBurst(true);
      window.setTimeout(() => setBurst(false), 600);
    }
    toggleSaved.mutate({ profileId: profile.id, isSaved });
  }, [isSaved, toggleSaved, profile.id]);

  /** Double tap na imagem salva o perfil (microinteração do brief). */
  const handleImageClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      handleSave();
      return;
    }
    lastTapRef.current = now;
    // Um clique simples navega, mas só depois da janela do duplo toque.
    window.setTimeout(() => {
      if (lastTapRef.current !== 0) {
        lastTapRef.current = 0;
        openProfile();
      }
    }, 300);
  }, [handleSave, openProfile]);

  const phenotypes = profile.top_phenotypes ?? [];

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card",
        "shadow-[0_1px_2px_hsl(var(--primary)/0.05),0_6px_20px_-14px_hsl(var(--primary)/0.2)]",
        "transition-[box-shadow,transform] duration-300 ease-out",
        "hover:shadow-[0_2px_4px_hsl(var(--primary)/0.07),0_18px_44px_-20px_hsl(var(--primary)/0.3)]",
        "motion-safe:hover:-translate-y-0.5"
      )}
    >
      {/* IMAGEM */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open ${profile.name}`}
        onClick={handleImageClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProfile();
          }
        }}
        className={cn(
          "relative block w-full cursor-pointer overflow-hidden bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          isFeed ? "aspect-[4/3]" : "aspect-[640/607]"
        )}
      >
        {/* Placeholder enquanto a imagem carrega, evitando salto de layout. */}
        {!imageLoaded && !imageFailed && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-secondary" />
        )}

        {imageFailed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary text-muted-foreground">
            <EyeOff className="h-6 w-6 opacity-50" />
            <span className="text-sm">Image unavailable</span>
          </div>
        ) : (
          <img
            src={profile.front_image_url}
            alt={profile.name}
            loading={priority ? "eager" : "lazy"}
            // React 18 repassa este atributo em minúsculas; o camelCase só é
            // reconhecido a partir do React 19.
            {...{ fetchpriority: priority ? "high" : "auto" }}
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
            className={cn(
              "h-full w-full object-cover transition-[transform,opacity,filter] duration-500 ease-out",
              "motion-safe:group-hover:scale-[1.03]",
              imageLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
            )}
          />
        )}

        {/* Perfis da comunidade são anônimos por escolha de quem postou; o
            selo explica por que não há nome de pessoa ali. */}
        {profile.is_anonymous && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-phindex-dark/85 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm">
            <EyeOff className="h-3 w-3" />
            Anonymous
          </span>
        )}

        {/* Salvar fica sobre a foto, no canto oposto ao selo. */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleSave();
          }}
          aria-label={
            isSaved ? `Remove ${profile.name} from saved` : `Save ${profile.name}`
          }
          aria-pressed={isSaved}
          className={cn(
            "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full",
            "bg-card/90 shadow-sm ring-1 ring-inset ring-border/50 backdrop-blur-sm",
            "transition-[color,background-color,transform] duration-200",
            "hover:scale-105 hover:bg-card",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isSaved ? "text-rose-500" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("h-[18px] w-[18px]", isSaved && "fill-current")} />
        </button>

        {/* Confirmação visual do duplo toque. */}
        {burst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart className="h-24 w-24 fill-white text-white drop-shadow-lg motion-safe:animate-[saveBurst_600ms_cubic-bezier(0.22,1,0.36,1)]" />
          </div>
        )}
      </div>

      {/* CORPO */}
      <div className={cn("flex flex-1 flex-col gap-3", isFeed ? "p-4" : "p-3.5")}>
        <h3
          className={cn(
            "truncate font-semibold text-foreground",
            isFeed ? "text-[17px]" : "text-base"
          )}
          title={profile.name}
        >
          {profile.name}
        </h3>

        {/* Classificação, ou o convite quando ainda não há nenhuma. */}
        <div className="flex min-h-[28px] flex-wrap items-center gap-1.5">
          {phenotypes.length > 0 ? (
            phenotypes.map((phenotype, index) => (
              <PhenotypeChip key={phenotype} rank={index + 1} label={phenotype} />
            ))
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-500">
              <Sparkles className="h-3 w-3" />
              Be the first to classify
            </span>
          )}
        </div>

        {/* RODAPÉ: o que a comunidade já fez, e o que falta você fazer. */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          {/* Votos e comentários são contadores clicáveis, com destinos
              diferentes: votos abrem o perfil, comentários abrem o perfil já
              na seção de comentários. Ambos aparecem mesmo em zero — um perfil
              sem comentário nenhum mostra "0", e não um espaço vazio que não
              explica se falta gente ou falta a funcionalidade. */}
          <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openProfile();
              }}
              title={`${profile.vote_count} ${profile.vote_count === 1 ? "vote" : "votes"}`}
              className="inline-flex items-center gap-1.5 rounded-full px-1.5 py-1 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <Vote className="h-3.5 w-3.5" />
              <span className="font-medium tabular-nums text-foreground">
                {profile.vote_count}
              </span>
              <span className="sr-only">
                {profile.vote_count === 1 ? "vote" : "votes"}
              </span>
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openComments();
              }}
              title={`${profile.comment_count} ${profile.comment_count === 1 ? "comment" : "comments"}`}
              className="inline-flex items-center gap-1.5 rounded-full px-1.5 py-1 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="font-medium tabular-nums text-foreground">
                {profile.comment_count}
              </span>
              <span className="sr-only">
                {profile.comment_count === 1 ? "comment" : "comments"}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openProfile();
            }}
            className="group/vote inline-flex shrink-0 items-center gap-1 rounded-full text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Vote
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/vote:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
};

export const PhenotypeCard = memo(
  PhenotypeCardComponent,
  (previous, next) =>
    previous.profile.id === next.profile.id &&
    previous.profile.vote_count === next.profile.vote_count &&
    previous.profile.save_count === next.profile.save_count &&
    previous.profile.comment_count === next.profile.comment_count &&
    previous.profile.most_voted_phenotype === next.profile.most_voted_phenotype &&
    previous.variant === next.variant
);

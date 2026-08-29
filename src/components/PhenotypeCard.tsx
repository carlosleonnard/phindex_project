/**
 * CARD DE FENÓTIPO (PhenotypeCard.tsx)
 *
 * Unidade central do feed social. Exibe o rosto em destaque, o fenótipo e a
 * região mais votados, e a action bar: salvar e ver detalhes.
 *
 * Suporta duas densidades:
 * - "feed"  : card grande de coluna única (home)
 * - "grid"  : card médio para grades multi-coluna (Explore, Saved)
 */

import { useRef, useState, useCallback, memo } from "react";
import { Heart, Search, Vote } from "lucide-react";
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

/** Um botão da action bar. Alvo de toque de 44px mesmo com o ícone menor. */
const ActionButton = ({
  icon: Icon,
  label,
  count,
  showCount = true,
  active,
  activeClass,
  onClick,
}: {
  icon: typeof Heart;
  label: string;
  count?: number;
  /** Nos cards de grade o número é omitido: os quatro ícones já ocupam a largura. */
  showCount?: boolean;
  active?: boolean;
  activeClass?: string;
  onClick: (event: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    title={label}
    className={cn(
      // min-w-0 + flex-1 deixam os quatro botões caberem em cards estreitos
      // sem que o último seja cortado; a altura de 44px é preservada.
      "group/action inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-1.5",
      "text-muted-foreground transition-colors duration-200",
      "hover:bg-primary/10 hover:text-primary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
      active && activeClass
    )}
  >
    <Icon
      className={cn(
        "h-[18px] w-[18px] transition-transform duration-200 group-hover/action:scale-110",
        active && "fill-current"
      )}
    />
    {showCount && typeof count === "number" && count > 0 && (
      <span className="text-sm tabular-nums">{count}</span>
    )}
  </button>
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

  const phenotype = profile.most_voted_phenotype;
  const region = profile.most_voted_geographic;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card",
        "shadow-[0_1px_2px_hsl(var(--primary)/0.06),0_8px_24px_-12px_hsl(var(--primary)/0.18)]",
        "transition-[box-shadow,transform] duration-300 ease-out",
        "hover:shadow-[0_2px_4px_hsl(var(--primary)/0.08),0_16px_40px_-16px_hsl(var(--primary)/0.28)]",
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
          isFeed ? "aspect-[4/5] sm:aspect-[640/607]" : "aspect-[640/607]"
        )}
      >
        {/* Placeholder enquanto a imagem carrega, evitando salto de layout. */}
        {!imageLoaded && !imageFailed && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-secondary" />
        )}

        {imageFailed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary text-muted-foreground">
            <Search className="h-6 w-6 opacity-50" />
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

        {/* Véu inferior que garante contraste do selo sobre qualquer foto. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent"
        />

        {/* Selo de votos */}
        {profile.vote_count > 0 && (
          <div className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-white backdrop-blur-sm">
            <Vote className="h-3.5 w-3.5" />
            <span className="text-sm tabular-nums">{profile.vote_count}</span>
          </div>
        )}

        {/* Confirmação visual do duplo toque. */}
        {burst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart className="h-24 w-24 fill-white text-white drop-shadow-lg motion-safe:animate-[saveBurst_600ms_cubic-bezier(0.22,1,0.36,1)]" />
          </div>
        )}
      </div>

      {/* CORPO */}
      <div className={cn("flex flex-col gap-3", isFeed ? "p-4 sm:p-5" : "p-3.5")}>
        <div className="min-w-0">
          <h3
            className={cn(
              "truncate font-semibold text-foreground",
              isFeed ? "text-lg" : "text-base"
            )}
            title={profile.name}
          >
            {profile.name}
          </h3>

          {/* Fenótipo • Região — a linha de identidade do brief. */}
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {phenotype || region ? (
              <>
                {phenotype && <span className="text-primary">{phenotype}</span>}
                {phenotype && region && <span aria-hidden="true"> · </span>}
                {region}
              </>
            ) : (
              "Not classified yet"
            )}
          </p>
        </div>

        {/* ACTION BAR */}
        <div className="-mx-1 flex items-center gap-0.5 border-t border-border/60 pt-1">
          <ActionButton
            icon={Heart}
            label={isSaved ? `Remove ${profile.name} from saved` : `Save ${profile.name}`}
            count={profile.save_count + (isSaved ? 1 : 0)}
            showCount={isFeed}
            active={isSaved}
            activeClass="text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
            onClick={(event) => {
              event.stopPropagation();
              handleSave();
            }}
          />

          <ActionButton
            icon={Search}
            label={`View ${profile.name} in detail`}
            onClick={(event) => {
              event.stopPropagation();
              openProfile();
            }}
          />
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
    previous.profile.most_voted_phenotype === next.profile.most_voted_phenotype &&
    previous.variant === next.variant
);

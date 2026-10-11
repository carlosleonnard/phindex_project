/**
 * CARTÃO DE PERFIL (PhenotypeCard.tsx)
 *
 * A unidade das grades do site, em duas densidades:
 *
 *   "feed" — o cartão grande da home: foto 4:3, como a comunidade leu o rosto
 *            (medidor de consenso + os dois fenótipos mais votados) e o convite
 *            para votar. Duplo toque na foto salva o perfil.
 *   "grid" — o cartão compacto de categoria, região, explore e salvos: foto no
 *            formato padrão do índice (640:607) e uma linha de leitura.
 *
 * Um rosto sem voto nenhum não mostra medidor vazio: mostra a hachura de "ainda
 * não lido" e o convite para ser o primeiro.
 */

import { memo, useCallback, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSavedProfileIds, useToggleSaved } from "@/hooks/use-saved-profiles";
import { LOW_VOTE_THRESHOLD } from "@/hooks/use-index";
import type { FeedProfile } from "@/hooks/use-profile-feed";
import { ConsensusMeter, NoVotesBar, VoteProgress } from "@/components/kt/Meters";
import { CenLink } from "@/components/kt/Centromere";
import { FacePhoto, SC } from "@/components/kt/Misc";

interface PhenotypeCardProps {
  profile: FeedProfile;
  variant?: "feed" | "grid";
  /** Prioriza o carregamento das primeiras imagens visíveis. */
  priority?: boolean;
  /** Termo de busca a destacar no nome, país e fenótipo. */
  highlight?: string;
}

/** Destaca as ocorrências de `term` com <mark>. */
export const highlightText = (text: string, term?: string): ReactNode => {
  const needle = term?.trim();
  if (!needle) return text;
  const lower = text.toLowerCase();
  const query = needle.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let index = lower.indexOf(query);
  while (index !== -1) {
    if (index > cursor) parts.push(text.slice(cursor, index));
    parts.push(<mark key={index}>{text.slice(index, index + needle.length)}</mark>);
    cursor = index + needle.length;
    index = lower.indexOf(query, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts.length > 0 ? parts : text;
};

/** "46% agree", "split · 38%", "clear · 71%". */
export const agreementLabel = (agreement: number | null): string => {
  if (agreement === null) return "";
  if (agreement >= 70) return `clear · ${agreement}%`;
  if (agreement < 45) return `split · ${agreement}%`;
  return `${agreement}% agree`;
};

/** O rótulo de origem do cartão: categoria (ou "community") e país. */
export const originLabel = (profile: FeedProfile, withCategory = false): string => {
  const isCommunity = profile.category === "User Profiles";
  const kind = isCommunity ? "community" : (profile.subcategory || profile.category || "").toLowerCase();
  const country = (profile.country || "").toLowerCase();
  if (withCategory) return [kind, country].filter(Boolean).join(" · ");
  return country || kind;
};

const SaveButton = ({ profile, saved, onToggle }: { profile: FeedProfile; saved: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      onToggle();
    }}
    aria-label={saved ? `Remove ${profile.name} from saved` : `Save ${profile.name}`}
    aria-pressed={saved}
    className={cn(
      "absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-200",
      saved ? "border-kt-ink bg-kt-ink text-kt-paper" : "border-kt-rule bg-white text-kt-slate hover:text-kt-ink"
    )}
  >
    <Heart className={cn("h-[18px] w-[18px]", saved && "fill-current")} strokeWidth={1.6} aria-hidden="true" />
  </button>
);

const PhenotypeCardComponent = ({ profile, variant = "feed", priority = false, highlight }: PhenotypeCardProps) => {
  const navigate = useNavigate();
  const { savedIds } = useSavedProfileIds();
  const toggleSaved = useToggleSaved();
  const [burst, setBurst] = useState(false);
  const lastTapRef = useRef(0);

  const isSaved = savedIds.has(profile.id);
  const href = `/user-profile/${profile.slug}`;
  const isAnonymous = profile.is_anonymous || profile.category === "User Profiles";
  const votes = profile.vote_count;
  const [first, second] = profile.top_phenotypes ?? [];

  const handleSave = useCallback(() => {
    if (!isSaved) {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 600);
    }
    toggleSaved.mutate({ profileId: profile.id, isSaved });
  }, [isSaved, toggleSaved, profile.id]);

  /** Duplo toque na foto salva; um toque simples abre, depois da janela. */
  const handleImageClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      handleSave();
      return;
    }
    lastTapRef.current = now;
    window.setTimeout(() => {
      if (lastTapRef.current !== 0) {
        lastTapRef.current = 0;
        navigate(href);
      }
    }, 300);
  }, [handleSave, navigate, href]);

  if (variant === "grid") {
    const needsVotes = votes < LOW_VOTE_THRESHOLD;
    return (
      <article className="group/card flex flex-col overflow-hidden rounded-[3px] border border-kt-rule bg-white transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(25,42,67,.35)] motion-reduce:hover:translate-y-0">
        <Link
          to={href}
          aria-label={`Open ${profile.name}${needsVotes ? ", needs votes" : ""}`}
          className="relative block aspect-[640/607] overflow-hidden bg-kt-wash"
        >
          <FacePhoto src={profile.front_image_url} alt="" priority={priority} />
          {needsVotes && (
            <span className="absolute left-2.5 top-2.5 rounded-full border border-kt-b50 bg-white px-2.5 pb-1 pt-[3px] font-sc text-[13px] leading-[1.3] tracking-[0.05em] text-kt-teal">
              needs votes
            </span>
          )}
        </Link>
        <div className="flex flex-1 flex-col gap-[9px] px-4 py-3.5">
          <SC as="p" className="m-0 truncate text-[13px] text-kt-body">
            {highlightText(originLabel(profile, true), highlight)}
          </SC>
          <h3 className="-mt-1 mb-0 text-[18px] font-semibold leading-[1.2]">
            <Link to={href} className="text-kt-ink no-underline">
              {highlightText(profile.name, highlight)}
            </Link>
          </h3>

          {votes >= LOW_VOTE_THRESHOLD && profile.agreement !== null ? (
            <>
              <ConsensusMeter agreement={profile.agreement} height={8} thin tick={false} />
              <p className="m-0 flex justify-between gap-2 text-[15px]">
                <span className="truncate">{highlightText(first ?? "", highlight)}</span>
                <span className="text-kt-body">{profile.agreement}%</span>
              </p>
            </>
          ) : (
            <>
              <VoteProgress count={votes} height={8} />
              <p className="m-0 flex justify-between gap-2 text-[15px]">
                <span className="truncate">
                  {votes} of {LOW_VOTE_THRESHOLD} votes
                  {first && (
                    <span className="text-kt-body">
                      {" · "}
                      {highlightText(first, highlight)} so far
                    </span>
                  )}
                </span>
                <Link to={href} className="shrink-0 font-sc text-[15px] tracking-[0.05em] text-kt-teal">
                  vote
                </Link>
              </p>
            </>
          )}

          <p className="mb-0 mt-auto border-t border-kt-rule pt-[9px] text-[14px] text-kt-body">
            {votes} {votes === 1 ? "vote" : "votes"} · {profile.comment_count}{" "}
            {profile.comment_count === 1 ? "comment" : "comments"}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="group/card relative flex flex-col overflow-hidden rounded-[3px] border border-kt-rule bg-white transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(25,42,67,.35)] motion-reduce:hover:translate-y-0">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open ${profile.name}`}
        onClick={handleImageClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate(href);
          }
        }}
        className="relative block aspect-[4/3] cursor-pointer overflow-hidden bg-kt-wash"
      >
        <FacePhoto src={profile.front_image_url} alt="" priority={priority} />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 pb-1 pt-[3px] font-sc text-[13px] leading-[1.3] tracking-[0.05em]",
            isAnonymous ? "bg-kt-ink text-kt-paper" : "border border-kt-rule bg-white text-kt-ink"
          )}
        >
          {isAnonymous ? "anonymous" : (profile.subcategory || profile.category || "").toLowerCase()}
        </span>
        {burst && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart className="h-24 w-24 fill-white text-white drop-shadow-lg motion-safe:animate-[saveBurst_600ms_cubic-bezier(0.22,1,0.36,1)]" />
          </span>
        )}
      </div>
      <SaveButton profile={profile} saved={isSaved} onToggle={handleSave} />

      <div className="flex flex-1 flex-col gap-3.5 px-[18px] pb-3.5 pt-4">
        <div className="flex justify-between gap-2.5 font-sc text-[13px] tracking-[0.06em] text-kt-body">
          <span className="truncate">{originLabel(profile)}</span>
          <span className={votes > 0 ? "text-kt-teal" : undefined}>
            {votes > 0 ? `${votes} ${votes === 1 ? "vote" : "votes"}` : "no votes yet"}
          </span>
        </div>
        <h3 className="-mt-1 mb-0 truncate text-[22px] font-semibold leading-[1.15]" title={profile.name}>
          <Link to={href} className="text-kt-ink no-underline">
            {profile.name}
          </Link>
        </h3>

        {votes > 0 && profile.agreement !== null ? (
          <div>
            <ConsensusMeter agreement={profile.agreement} />
            <div className="mt-[9px] flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-[16px]">
              {first && (
                <span>
                  <em className="text-kt-teal">1</em> {first}
                </span>
              )}
              {second && (
                <span className="text-kt-body">
                  <em>2</em> {second}
                </span>
              )}
              <span className="ml-auto text-[14px] text-kt-body">{agreementLabel(profile.agreement)}</span>
            </div>
          </div>
        ) : (
          <div>
            <NoVotesBar />
            <p className="mb-0 mt-[9px] text-[16px] text-kt-body">No one has read this face yet.</p>
          </div>
        )}

        {votes > 0 ? (
          <div className="mt-auto flex items-center gap-4 border-t border-kt-rule pt-3 text-[15px] text-kt-body">
            <span>{profile.save_count} saved</span>
            <Link to={`${href}#comments`} className="text-kt-body">
              {profile.comment_count} {profile.comment_count === 1 ? "comment" : "comments"}
            </Link>
            <Link
              to={href}
              className="ml-auto inline-flex min-h-9 items-center rounded-full border-[1.5px] border-kt-teal px-3.5 font-sc text-[15px] tracking-[0.05em] text-kt-teal no-underline transition-colors hover:bg-kt-teal/[0.06]"
            >
              vote
            </Link>
          </div>
        ) : (
          <CenLink to={href} size="sm" className="mt-auto self-start">
            be the first to vote
          </CenLink>
        )}
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
    previous.variant === next.variant &&
    previous.highlight === next.highlight
);

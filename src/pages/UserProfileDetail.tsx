/**
 * PÁGINA DO PERFIL (UserProfileDetail.tsx)
 *
 * À esquerda, as fotos (frente e lado) e a ficha do perfil. À direita:
 *
 *   1. Cabeçalho e ações — votar, salvar, compartilhar (e editar/apagar para
 *      quem criou o perfil ou é admin).
 *   2. A leitura da comunidade — o cromossomo de doze faixas.
 *   3. Classificação — região e fenótipo em detalhe (braço curto).
 *   4. Dez traços — uma faixa de escala por traço (braço longo).
 *   5. Blind read — voto × palpite às cegas no jogo.
 *   6. Comentários.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Heart, Share2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AppLayout, Crumbs } from "@/components/AppLayout";
import { CommentsSection } from "@/components/CommentsSection";
import { VoteModal } from "@/components/VoteModal";
import { LoginModal } from "@/components/LoginModal";
import { EditUserProfileModal } from "@/components/EditUserProfileModal";
import { CommunityRead } from "@/components/profile/CommunityRead";
import { BlindRead, Classification, TraitTable } from "@/components/profile/ReadSections";
import { CenButton } from "@/components/kt/Centromere";
import { FacePhoto, SC, timeAgo } from "@/components/kt/Misc";
import { useUserProfiles } from "@/hooks/use-user-profiles";
import { getCategorySlug } from "@/constants/categories";
import { TRAITS } from "@/constants/traits";
import { useAuth } from "@/hooks/use-auth";
import { useVoting } from "@/hooks/use-voting";
import { useComments } from "@/hooks/use-comments";
import { usePhysicalVoting } from "@/hooks/use-physical-voting";
import { useGeographicVoting } from "@/hooks/use-geographic-voting";
import { useGeographicVoteCounts } from "@/hooks/use-geographic-vote-counts";
import { useProfileCreator } from "@/hooks/use-profile-creator";
import { useSavedProfileIds, useToggleSaved } from "@/hooks/use-saved-profiles";
import { useIndexProfiles } from "@/hooks/use-index";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

const PHYSICAL_KEYS = TRAITS.map((trait) => trait.key);
const CLASSIFICATION_KEYS = [
  "Primary Geographic",
  "Secondary Geographic",
  "Tertiary Geographic",
  "Primary Phenotype",
  "Secondary Phenotype",
  "Tertiary Phenotype",
];

export default function UserProfileDetail() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { getProfileBySlug, deleteProfile } = useUserProfiles();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [photo, setPhoto] = useState<"front" | "side">("front");

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["user-profile", slug],
    queryFn: () => getProfileBySlug(slug!),
    enabled: !!slug,
  });

  // Votantes distintos do perfil.
  const { data: totalVoteCount = 0 } = useQuery({
    queryKey: ["total-votes", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { data, error } = await supabase.from("votes").select("user_id").eq("profile_id", profile.id);
      if (error) {
        console.error("Error counting voters:", error);
        return 0;
      }
      return new Set(data?.map((vote) => vote.user_id) || []).size;
    },
    enabled: !!profile?.id,
  });

  const { hasUserVoted, userVote } = useVoting(profile?.id || "");
  const { comments: realComments, addComment, likeComment, deleteComment } = useComments(profile?.id || "");
  const {
    characteristics: physicalCharacteristics,
    userVotes: physicalUserVotes,
    castVote: castPhysicalVote,
  } = usePhysicalVoting(profile?.id || "");
  const { userGeographicVotes, castGeographicVote, refetchVotes: refetchGeographicVotes } = useGeographicVoting(
    profile?.id || ""
  );
  const { geographicVotes, phenotypeVotes, refetchVoteCounts } = useGeographicVoteCounts(profile?.id || "");
  const { data: profileCreator } = useProfileCreator(profile?.id || "");
  const { savedIds } = useSavedProfileIds();
  const toggleSaved = useToggleSaved();
  const { profiles: indexProfiles } = useIndexProfiles();

  /** Chegando com #comments, rola até os comentários depois que eles existem. */
  const didScrollToComments = useRef(false);
  useEffect(() => {
    if (location.hash !== "#comments" || isLoading || !profile) return;
    if (didScrollToComments.current) return;
    didScrollToComments.current = true;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelector("[data-comments-section]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash, isLoading, profile]);

  /** Consenso por característica: a fatia da opção mais votada. */
  const read = useMemo(() => {
    const top = (list?: { percentage: number }[]) =>
      list && list.length > 0 ? Math.round(Math.max(...list.map((item) => item.percentage))) : null;
    const traits = TRAITS.map((trait) => {
      const votes = physicalCharacteristics.find((item) => item.name === trait.key)?.votes ?? [];
      const total = votes.reduce((sum, vote) => sum + vote.count, 0);
      if (total === 0) return null;
      return Math.round((Math.max(...votes.map((vote) => vote.count)) / total) * 100);
    });
    return {
      region: top(geographicVotes["Primary Geographic"]),
      phenotype: top(phenotypeVotes["Primary Phenotype"]),
      traits,
    };
  }, [geographicVotes, phenotypeVotes, physicalCharacteristics]);

  if (isLoading) {
    return (
      <AppLayout sidebar={false}>
        <div className="flex flex-wrap gap-x-[72px] gap-y-12 pt-12" aria-busy="true">
          <div className="aspect-[4/5] w-full max-w-[470px] animate-pulse rounded-[3px] bg-kt-wash" />
          <div className="min-w-0 flex-1 space-y-4">
            <div className="h-4 w-48 animate-pulse rounded-[3px] bg-kt-wash" />
            <div className="h-14 w-2/3 animate-pulse rounded-[3px] bg-kt-wash" />
            <div className="h-40 animate-pulse rounded-[3px] bg-kt-wash" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !profile) {
    return <Navigate to="/404" replace />;
  }

  const isOwner = user?.id === profile.user_id;
  const canEdit = isOwner || isAdmin;
  const isCommunity = profile.category === "User Profiles";
  const categoryPath = `/category/${isCommunity ? "community" : getCategorySlug(profile.category)}`;
  const categoryLabel = isCommunity ? "Community" : profile.category;
  const isSaved = savedIds.has(profile.id);
  const saveCount = indexProfiles.find((item) => item.id === profile.id)?.save_count ?? 0;
  const hasUserVotedAny =
    hasUserVoted || Object.keys(userGeographicVotes).length > 0 || Object.keys(physicalUserVotes).length > 0;
  const creatorName = profileCreator?.creatorName || "a member";
  const addedOn = new Date(profileCreator?.createdAt || profile.created_at);

  const handleDelete = async () => {
    try {
      await deleteProfile.mutateAsync({ profileId: profile.id, isAdmin });
      navigate("/");
    } catch (deleteError) {
      console.error("Error deleting profile:", deleteError);
    }
  };

  const handleShare = async () => {
    const url = `https://www.phenotypeindex.com/user-profile/${profile.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile.name} | Phindex`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "The profile link is on your clipboard." });
    } catch {
      // Cancelar o diálogo de compartilhamento não é um erro.
    }
  };

  const handleVote = () => (user ? setShowVoteModal(true) : setLoginOpen(true));

  const photos = [
    { key: "front" as const, src: profile.front_image_url, label: "fig. a · front" },
    ...(profile.profile_image_url
      ? [{ key: "side" as const, src: profile.profile_image_url, label: "fig. b · side" }]
      : []),
  ];
  const current = photos.find((item) => item.key === photo) ?? photos[0];

  const profileUrl = `https://www.phenotypeindex.com/user-profile/${profile.slug}`;
  const ogDescription = `View ${profile.name}'s phenotype classification on Phindex. Ancestry: ${profile.ancestry}. Country: ${profile.country}. Vote on physical characteristics and compare phenotypes.`;
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    nationality: profile.country,
    image: profile.front_image_url,
    url: profileUrl,
    description: ogDescription,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.phenotypeindex.com" },
      { "@type": "ListItem", position: 2, name: profile.category, item: `https://www.phenotypeindex.com${categoryPath}` },
      { "@type": "ListItem", position: 3, name: profile.name, item: profileUrl },
    ],
  };

  const facts: Array<[string, string]> = [
    ["category", isCommunity ? "Community · anonymous" : [profile.category, profile.subcategory].filter(Boolean).join(" · ")],
    ["country", profile.country],
    ["known ancestry", profile.ancestry],
    ["gender", profile.gender],
    ["height", profile.height ? `${profile.height} m` : ""],
    ["added", `${addedOn.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} by ${creatorName}`],
  ].filter(([, value]) => Boolean(value)) as Array<[string, string]>;

  return (
    <AppLayout sidebar={false}>
      <Helmet>
        <title>{`${profile.name} Phenotype Profile | Phindex - Phenotype Index`}</title>
        <meta name="description" content={ogDescription} />
        <meta
          name="keywords"
          content={`${profile.name} phenotype, ${profile.name} ancestry, ${profile.name} physical traits, ${profile.country} phenotype`}
        />
        <link rel="canonical" href={profileUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${profile.name} | Phindex - Phenotype Index`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={profile.front_image_url} />
        <meta property="og:image:width" content="800" />
        <meta property="og:image:height" content="800" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:url" content={profileUrl} />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content={`${profile.name} | Phindex`} />
        <meta name="twitter:description" content={`View ${profile.name}'s phenotype profile on Phindex.`} />
        <meta name="twitter:image" content={profile.front_image_url} />
        <script type="application/ld+json">{JSON.stringify(personSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Crumbs items={[{ label: "Discover", to: "/community" }, { label: categoryLabel, to: categoryPath }, { label: profile.name }]} />

      <div className="mt-7 flex flex-wrap items-start gap-x-[clamp(40px,5vw,72px)] gap-y-12">
        {/* ── FOTOS E FICHA ───────────────────────────────────────────── */}
        <div className="min-w-0 max-w-[470px] flex-[1_1_340px]">
          <figure className="m-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-kt-wash">
              <FacePhoto src={current.src} alt={`${profile.name}, ${current.key} photo`} priority />
              <span className="absolute bottom-3 right-3 rounded-full border border-kt-rule bg-white px-2.5 pb-1 pt-[3px] font-sc text-[13px] leading-[1.3] tracking-[0.06em] text-kt-slate">
                {current.label}
              </span>
            </div>
          </figure>
          {photos.length > 1 && (
            <div role="group" aria-label="Photos" className="mt-3 flex gap-3">
              {photos.map((item) => {
                const active = item.key === current.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={`Show ${item.key} photo`}
                    aria-pressed={active}
                    onClick={() => setPhoto(item.key)}
                    className={cn(
                      "relative h-[92px] w-[76px] overflow-hidden rounded-[3px] bg-kt-wash p-0",
                      active ? "border-2 border-kt-ink" : "border border-kt-rule"
                    )}
                  >
                    <FacePhoto src={item.src} alt="" />
                  </button>
                );
              })}
            </div>
          )}
          <dl className="mb-0 mt-7 grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2.5 border-t-[1.5px] border-kt-ink pt-[18px] text-[16px]">
            {facts.map(([term, value]) => (
              <div key={term} className="contents">
                <dt className="pt-px font-sc text-[14px] tracking-[0.06em] text-kt-body">{term}</dt>
                <dd className="m-0 break-words text-kt-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── LEITURA ─────────────────────────────────────────────────── */}
        <div className="min-w-0 flex-[999_1_560px]">
          <SC as="p" className="m-0 text-[15px] text-kt-teal">
            {isCommunity ? "community profile" : `${profile.category.toLowerCase()} profile`}
          </SC>
          <h1 className="mb-0 mt-1.5 break-words text-[clamp(44px,5vw,68px)] font-medium leading-none tracking-[-0.022em] text-kt-ink">
            {profile.name}
          </h1>
          <p className="mb-0 mt-2.5 text-[18px] italic text-kt-body">
            Posted by {creatorName} · {profile.country} · {timeAgo(profile.created_at)}
          </p>

          <div className="mt-[26px] flex flex-wrap items-center gap-3">
            <CenButton size="md" onClick={handleVote}>
              {user ? (hasUserVotedAny ? "change your vote" : "vote on this face") : "log in to vote"}
            </CenButton>
            <button
              type="button"
              aria-pressed={isSaved}
              onClick={() => (user ? toggleSaved.mutate({ profileId: profile.id, isSaved }) : setLoginOpen(true))}
              className={cn(
                "inline-flex h-[52px] items-center gap-2 rounded-full border-[1.5px] px-5 font-[inherit] text-[18px] transition-colors",
                isSaved ? "border-kt-ink bg-kt-ink text-kt-paper" : "border-kt-teal bg-transparent text-kt-teal hover:bg-kt-teal/[0.06]"
              )}
            >
              <Heart className={cn("h-[18px] w-[18px]", isSaved && "fill-current")} strokeWidth={1.6} aria-hidden="true" />
              {isSaved ? "saved" : "save"}
              <span className={isSaved ? "text-kt-b50" : "text-kt-body"}>{saveCount}</span>
            </button>
            <button
              type="button"
              aria-label="Share this profile"
              onClick={handleShare}
              className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border border-kt-rule bg-white text-kt-slate hover:text-kt-ink"
            >
              <Share2 className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
            </button>
            {canEdit && (
              <div className="flex items-center gap-4 pl-1 text-[16px]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="min-h-[44px] border-0 bg-transparent p-0 font-[inherit] text-kt-teal underline underline-offset-4"
                >
                  edit
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="min-h-[44px] border-0 bg-transparent p-0 font-[inherit] text-destructive underline underline-offset-4"
                    >
                      delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Its votes and comments go with it. This can’t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          <div data-voting-section>
            <CommunityRead region={read.region} phenotype={read.phenotype} traits={read.traits} voters={totalVoteCount} />
            <Classification geographic={geographicVotes} phenotype={phenotypeVotes} />
            <TraitTable characteristics={physicalCharacteristics} />
            <BlindRead
              profileId={profile.id}
              geographic={geographicVotes["Primary Geographic"] ?? []}
              phenotype={phenotypeVotes["Primary Phenotype"] ?? []}
            />
          </div>

          <div data-comments-section id="comments">
            <CommentsSection
              profileId={profile.id}
              onAddComment={addComment}
              onLikeComment={likeComment}
              onDeleteComment={deleteComment}
              currentUserId={user?.id}
              comments={realComments}
            />
          </div>
        </div>
      </div>

      {showVoteModal && user && (
        <VoteModal
          isOpen={showVoteModal}
          onClose={() => setShowVoteModal(false)}
          profileId={profile.id}
          existingVotes={{
            "Primary Phenotype": userVote || "",
            ...physicalUserVotes,
            ...userGeographicVotes,
          }}
          community={{
            geographic: geographicVotes,
            phenotype: phenotypeVotes,
            physical: physicalCharacteristics,
          }}
          profileImages={{
            frontImage: profile.front_image_url,
            profileImage: profile.profile_image_url,
            profileName: profile.name,
            ancestry: profile.ancestry,
          }}
          onSubmit={async (votes) => {
            let mainVoteSuccess = true;
            for (const characteristic of CLASSIFICATION_KEYS) {
              if (votes[characteristic]) {
                const success = await castGeographicVote(characteristic, votes[characteristic]);
                if (characteristic === "Primary Phenotype") mainVoteSuccess = success;
              }
            }
            for (const characteristic of PHYSICAL_KEYS) {
              if (votes[characteristic]) await castPhysicalVote(characteristic, votes[characteristic]);
            }
            await refetchGeographicVotes();
            await refetchVoteCounts();
            return mainVoteSuccess;
          }}
          onFinished={() => window.location.reload()}
        />
      )}

      {showEditModal && (
        <EditUserProfileModal
          profile={profile}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          isAdmin={isAdmin}
        />
      )}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </AppLayout>
  );
}

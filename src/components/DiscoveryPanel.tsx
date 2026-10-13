/**
 * PAINEL DE DESCOBERTA (DiscoveryPanel.tsx)
 *
 * A coluna direita da home, do mais acionável ao menos:
 *
 *   needs your vote  — rostos com menos de dez votos, os mais novos primeiro;
 *                      a faixa de dez bandas mostra quanto falta para o rosto
 *                      ser considerado "lido".
 *   top classifiers  — os melhores do mês no jogo.
 *   recent activity  — comentários e membros novos.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { FeedProfile } from "@/hooks/use-profile-feed";
import { LOW_VOTE_THRESHOLD } from "@/hooks/use-index";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useRecentActivity } from "@/hooks/use-recent-activity";
import { VoteProgress } from "@/components/kt/Meters";
import { FacePhoto, SC, timeAgo } from "@/components/kt/Misc";

interface DiscoveryPanelProps {
  profiles: FeedProfile[];
  isLoading?: boolean;
}

const sheet = "rounded-[3px] border border-kt-rule bg-white p-5";

const PanelTitle = ({ id, children, aside }: { id: string; children: React.ReactNode; aside?: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-2.5">
    <h2 id={id} className="m-0 font-sc text-[17px] font-semibold tracking-[0.06em] text-kt-ink">
      {children}
    </h2>
    {aside}
  </div>
);

export const DiscoveryPanel = ({ profiles, isLoading = false }: DiscoveryPanelProps) => {
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard("month");
  const { data: activity = [], isLoading: activityLoading } = useRecentActivity(3);

  const needsVotes = useMemo(
    () =>
      profiles
        .filter((profile) => profile.vote_count < LOW_VOTE_THRESHOLD)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3),
    [profiles]
  );

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="needs-title" className={sheet}>
        <PanelTitle id="needs-title">needs your vote</PanelTitle>
        <p className="mb-2 mt-1 text-[15px] italic leading-[1.45] text-kt-body">
          Fewer than ten votes. Newest first.
        </p>
        {isLoading ? (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-[52px] animate-pulse rounded-[3px] bg-kt-wash" />
            ))}
          </div>
        ) : needsVotes.length === 0 ? (
          <p className="m-0 border-t border-kt-rule pt-3 text-[15px] text-kt-body">
            Every face has ten votes or more. Nice work.
          </p>
        ) : (
          <ul className="m-0 list-none p-0">
            {needsVotes.map((profile) => (
              <li
                key={profile.id}
                className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 border-t border-kt-rule py-3"
              >
                <span className="block h-[52px] w-[52px] overflow-hidden rounded-[3px] bg-kt-wash">
                  <FacePhoto src={profile.front_image_url} alt="" width={140} height={175} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[16px] leading-tight text-kt-ink">{profile.name}</span>
                  <span className="mt-[3px] block text-[13px] text-kt-body">
                    {profile.vote_count} of {LOW_VOTE_THRESHOLD} votes
                  </span>
                  <VoteProgress count={profile.vote_count} className="mt-[5px]" />
                </span>
                <Link
                  to={`/user-profile/${profile.slug}`}
                  aria-label={`Vote on ${profile.name}`}
                  className="inline-flex min-h-9 items-center rounded-full border-[1.5px] border-kt-teal px-[13px] font-sc text-[15px] tracking-[0.05em] text-kt-teal no-underline hover:bg-kt-teal/[0.06]"
                >
                  vote
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/community?sort=needs-votes" className="mt-1.5 inline-block text-[15px] text-kt-teal">
          all faces that need votes
        </Link>
      </section>

      <section aria-labelledby="top-title" className={sheet}>
        <PanelTitle id="top-title" aside={<span className="text-[14px] italic text-kt-body">this month</span>}>
          top classifiers
        </PanelTitle>
        {leaderboardLoading ? (
          <div className="mt-3 space-y-2" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-8 animate-pulse rounded-[3px] bg-kt-wash" />
            ))}
          </div>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <p className="mb-0 mt-2.5 text-[15px] text-kt-body">No one has played this month yet.</p>
        ) : (
          <ol className="mb-0 mt-2.5 list-none p-0">
            {leaderboard.slice(0, 4).map((entry) => (
              <li
                key={entry.userId}
                className="grid grid-cols-[26px_minmax(0,1fr)_auto] items-baseline gap-2.5 border-t border-kt-rule py-[9px]"
              >
                <span className="text-[20px] italic leading-none text-kt-teal">{entry.rank}</span>
                <Link to={`/member/${entry.userId}`} className="truncate text-[16px] text-kt-ink no-underline">
                  {entry.nickname}
                </Link>
                <span className="text-[14px] text-kt-body">
                  {entry.totalCorrect} / {entry.totalQuestions} correct
                </span>
              </li>
            ))}
          </ol>
        )}
        <Link to="/leaderboard" className="mt-1.5 inline-block text-[15px] text-kt-teal">
          full leaderboard
        </Link>
      </section>

      <section aria-labelledby="act-title" className="px-1 pt-1">
        <h2 id="act-title" className="mb-1.5 mt-0 font-sc text-[17px] font-semibold tracking-[0.06em] text-kt-ink">
          recent activity
        </h2>
        {activityLoading ? (
          <div className="h-24 animate-pulse rounded-[3px] bg-kt-wash" aria-hidden="true" />
        ) : activity.length === 0 ? (
          <p className="m-0 text-[15px] text-kt-body">Quiet for now.</p>
        ) : (
          <ul className="m-0 list-none p-0 text-[15px] leading-[1.4] text-kt-slate">
            {activity.map((item) => (
              <li key={item.id} className="border-t border-kt-rule py-[9px]">
                <Link to={`/member/${item.userId}`} className="font-semibold text-kt-ink no-underline">
                  {item.nickname}
                </Link>{" "}
                {item.kind === "comment" ? (
                  <>
                    commented on{" "}
                    <Link to={`/user-profile/${item.profileSlug}`} className="italic text-kt-slate">
                      {item.profileName}
                    </Link>
                  </>
                ) : (
                  "joined Phindex"
                )}{" "}
                <span className="text-kt-body">· {timeAgo(item.created_at, true)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

/** Leitura compacta do índice, no topo da home. */
export const IndexReadout = ({
  total,
  famous,
  community,
}: {
  total: number;
  famous: number;
  community: number;
}) => {
  const famousShare = total > 0 ? Math.max(8, Math.min(92, (famous / total) * 100)) : 24;
  return (
    <div className="min-w-0 flex-[0_1_340px]">
      <div className="flex items-baseline justify-between gap-3 font-sc text-[14px] tracking-[0.06em] text-kt-body">
        <span>the index today</span>
        <span className="text-kt-ink">{total.toLocaleString("en-US")} profiles</span>
      </div>
      <div aria-hidden="true" className="mt-2 flex h-3.5">
        <span
          className="block box-border rounded-full border-[1.5px] border-kt-ink"
          style={{
            flex: `0 0 ${famousShare}%`,
            background: "linear-gradient(90deg,#192A43 0 70%,#5E9BA7 0 84%,#192A43 0 100%)",
          }}
        />
        <span
          className="block flex-1 box-border rounded-full border-[1.5px] border-kt-ink"
          style={{ background: "linear-gradient(90deg,#94BCC5 0 18%,#FFFFFF 0 24%,#94BCC5 0 51%,#C9DEE2 0 63%,#94BCC5 0 100%)" }}
        />
      </div>
      <div className="mt-2 flex gap-[18px] text-[15px] text-kt-body">
        <span>
          <span className="text-kt-ink">{famous.toLocaleString("en-US")}</span> famous
        </span>
        <span>
          <span className="text-kt-ink">{community.toLocaleString("en-US")}</span> community
        </span>
      </div>
      <SC className="sr-only">
        {famous} famous and {community} community profiles
      </SC>
    </div>
  );
};

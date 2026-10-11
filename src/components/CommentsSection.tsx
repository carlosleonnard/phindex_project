/**
 * COMENTÁRIOS (CommentsSection.tsx)
 *
 * A conversa sobre um rosto. Campo de texto no topo, lista ordenável (recentes
 * ou mais curtidos), respostas recolhidas depois da terceira e um menu por
 * comentário para denunciar ou apagar o próprio.
 *
 * Mostra os cinco primeiros comentários; o resto abre sob demanda.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Flag, Heart, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortTabs } from "@/components/kt/RegionFilter";
import { InitialsAvatar } from "@/components/kt/Misc";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  parent_comment_id?: string | null;
  user_id: string;
  user: {
    nickname: string;
    email: string;
  };
  userVotes?: { [key: string]: string };
  isLiked?: boolean;
  replies?: Comment[];
}

interface CommentsSectionProps {
  profileId: string;
  comments: Comment[];
  onAddComment: (content: string, parentCommentId?: string) => Promise<boolean>;
  onLikeComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  currentUserId?: string;
}

const VISIBLE_COMMENTS = 5;

const CommentMenu = ({
  isOwner,
  onDelete,
  label,
}: {
  isOwner: boolean;
  onDelete: () => void;
  label: string;
}) => {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`More options for ${label}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-kt-body hover:bg-kt-wash2"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-[3px] border-kt-rule">
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/contact")}>
          <Flag className="mr-2 h-3.5 w-3.5" />
          Report
        </DropdownMenuItem>
        {isOwner && (
          <DropdownMenuItem className="cursor-pointer text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const LikeButton = ({ comment, onLike }: { comment: Comment; onLike: () => void }) => (
  <button
    type="button"
    onClick={onLike}
    aria-pressed={!!comment.isLiked}
    aria-label={`${comment.isLiked ? "Unlike" : "Like"} comment, ${comment.likes_count} likes`}
    className={cn(
      "inline-flex min-h-9 items-center gap-1.5 border-0 bg-transparent px-0 font-[inherit] text-[15px]",
      comment.isLiked ? "text-kt-teal" : "text-kt-body hover:text-kt-ink"
    )}
  >
    <Heart className={cn("h-4 w-4", comment.isLiked && "fill-current")} strokeWidth={1.6} aria-hidden="true" />
    {comment.likes_count}
  </button>
);

export const CommentsSection = ({
  comments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  currentUserId,
}: CommentsSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const sortedComments = [...comments].sort((a, b) =>
    sortBy === "top"
      ? b.likes_count - a.likes_count
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const visibleComments = showAll ? sortedComments : sortedComments.slice(0, VISIBLE_COMMENTS);
  const totalCount = comments.reduce((sum, comment) => sum + 1 + (comment.replies?.length ?? 0), 0);

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newComment.trim()) return;
    const success = await onAddComment(newComment.trim());
    if (success) setNewComment("");
  };

  const submitReply = async (event: React.FormEvent, parentId: string) => {
    event.preventDefault();
    if (!replyContent.trim()) return;
    const success = await onAddComment(replyContent.trim(), parentId);
    if (success) {
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  return (
    <section aria-labelledby="comments-title" className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b-[1.5px] border-kt-ink pb-3">
        <div className="flex items-baseline gap-3">
          <h2 id="comments-title" className="m-0 text-[30px] font-medium leading-[1.15] text-kt-ink">
            Comments
          </h2>
          <span className="text-[18px] text-kt-body">{totalCount}</span>
        </div>
        {comments.length > 1 && (
          <SortTabs
            options={[
              { value: "recent", label: "Recent" },
              { value: "top", label: "Most liked" },
            ]}
            value={sortBy}
            onChange={(value) => setSortBy(value)}
            label="Sort comments"
          />
        )}
      </div>

      <form onSubmit={submitComment} className="mt-[18px] flex flex-wrap items-end gap-3">
        <label htmlFor="new-comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="new-comment"
          rows={2}
          value={newComment}
          onChange={(event) => setNewComment(event.target.value)}
          placeholder="What did you read in this face?"
          className="min-w-0 flex-[1_1_320px] resize-y rounded-[3px] border border-kt-rule bg-white px-4 py-3 font-[inherit] text-[17px] leading-[1.45] text-kt-ink placeholder:text-kt-mute focus-visible:border-kt-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kt-teal/30"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="h-12 rounded-full border-0 bg-kt-ink px-[22px] font-[inherit] text-[17px] text-kt-paper transition-opacity disabled:opacity-40"
        >
          post
        </button>
      </form>

      {sortedComments.length === 0 ? (
        <p className="mb-0 mt-6 text-[17px] italic text-kt-body">
          No comments yet. Be the first to say what you read in this face.
        </p>
      ) : (
        <ul className="m-0 mt-2.5 list-none p-0">
          {visibleComments.map((comment) => {
            const replies = [...(comment.replies ?? [])].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            const expanded = expandedThreads.has(comment.id);
            const visibleReplies = expanded ? replies : replies.slice(0, 3);

            return (
              <li key={comment.id} className="border-b border-kt-rule py-[18px]">
                <div id={`comment-${comment.id}`} className="grid grid-cols-[40px_minmax(0,1fr)_auto] gap-x-3.5 transition-colors">
                  <InitialsAvatar name={comment.user.nickname} size={40} />
                  <div className="min-w-0">
                    <p className="m-0 text-[15px] text-kt-body">
                      <Link to={`/member/${comment.user_id}`} className="font-semibold text-kt-ink no-underline">
                        {comment.user.nickname}
                      </Link>
                      {comment.userVotes?.phenotype && (
                        <span className="ml-2 rounded-full border border-kt-b50 px-2 font-sc text-[12px] tracking-[0.05em] text-kt-teal">
                          {comment.userVotes.phenotype}
                        </span>
                      )}{" "}
                      · {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                    <p className="mb-0 mt-1 whitespace-pre-line text-[17px] leading-normal text-kt-ink">{comment.content}</p>
                    <div className="mt-1 flex items-center gap-5">
                      <LikeButton comment={comment} onLike={() => onLikeComment(comment.id)} />
                      <button
                        type="button"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="min-h-9 border-0 bg-transparent p-0 font-[inherit] text-[15px] text-kt-teal"
                      >
                        reply
                      </button>
                    </div>

                    {replyingTo === comment.id && (
                      <form onSubmit={(event) => submitReply(event, comment.id)} className="mt-2.5 flex gap-2.5">
                        <label htmlFor={`reply-${comment.id}`} className="sr-only">
                          Write a reply
                        </label>
                        <input
                          id={`reply-${comment.id}`}
                          autoFocus
                          value={replyContent}
                          onChange={(event) => setReplyContent(event.target.value)}
                          placeholder="Write a reply…"
                          className="h-11 min-w-0 flex-1 rounded-full border border-kt-rule bg-white px-4 font-[inherit] text-[16px] text-kt-ink placeholder:text-kt-mute focus-visible:border-kt-teal focus-visible:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!replyContent.trim()}
                          className="h-11 rounded-full border-0 bg-kt-ink px-[18px] font-[inherit] text-[16px] text-kt-paper disabled:opacity-40"
                        >
                          reply
                        </button>
                      </form>
                    )}

                    {visibleReplies.length > 0 && (
                      <ul className="m-0 mt-3 list-none border-l border-kt-rule p-0 pl-4">
                        {visibleReplies.map((reply) => (
                          <li
                            key={reply.id}
                            id={`comment-${reply.id}`}
                            className="grid grid-cols-[30px_minmax(0,1fr)_auto] gap-x-3 py-2.5"
                          >
                            <InitialsAvatar name={reply.user.nickname} size={30} />
                            <div className="min-w-0">
                              <p className="m-0 text-[14px] text-kt-body">
                                <Link to={`/member/${reply.user_id}`} className="font-semibold text-kt-ink no-underline">
                                  {reply.user.nickname}
                                </Link>{" "}
                                · {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                              </p>
                              <p className="mb-0 mt-0.5 whitespace-pre-line text-[16px] text-kt-ink">{reply.content}</p>
                              <LikeButton comment={reply} onLike={() => onLikeComment(reply.id)} />
                            </div>
                            <CommentMenu
                              isOwner={currentUserId === reply.user_id}
                              onDelete={() => onDeleteComment(reply.id)}
                              label={`reply by ${reply.user.nickname}`}
                            />
                          </li>
                        ))}
                        {replies.length > 3 && (
                          <li>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedThreads((current) => {
                                  const next = new Set(current);
                                  if (next.has(comment.id)) next.delete(comment.id);
                                  else next.add(comment.id);
                                  return next;
                                })
                              }
                              className="min-h-9 border-0 bg-transparent p-0 font-[inherit] text-[15px] text-kt-teal"
                            >
                              {expanded ? "show fewer replies" : `show ${replies.length - 3} more replies`}
                            </button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <CommentMenu
                    isOwner={currentUserId === comment.user_id}
                    onDelete={() => onDeleteComment(comment.id)}
                    label={`comment by ${comment.user.nickname}`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {sortedComments.length > VISIBLE_COMMENTS && (
        <button
          type="button"
          onClick={() => setShowAll((open) => !open)}
          className="mt-3.5 min-h-[44px] rounded-full border-[1.5px] border-kt-teal bg-transparent px-5 font-[inherit] text-[16px] text-kt-teal"
        >
          {showAll ? "show fewer comments" : `show all ${sortedComments.length} comments`}
        </button>
      )}
    </section>
  );
};

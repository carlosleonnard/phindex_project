import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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

export const useComments = (profileId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = async () => {
    try {
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (commentsData) {
        // Check which comments the current user has liked and get like counts
        let userLikes: string[] = [];
        const likeCounts = new Map<string, number>();
        
        if (user) {
          const { data: likesData } = await supabase
            .from('comment_likes')
            .select('comment_id')
            .eq('user_id', user.id);
          
          userLikes = likesData?.map(like => like.comment_id) || [];
        }

        // Get unique user counts for each comment
        const { data: allLikesData } = await supabase
          .from('comment_likes')
          .select('comment_id, user_id');

        if (allLikesData) {
          allLikesData.forEach(like => {
            const current = likeCounts.get(like.comment_id) || 0;
            likeCounts.set(like.comment_id, current);
          });
          
          // Count unique users for each comment
          const uniqueUserCounts = new Map<string, Set<string>>();
          allLikesData.forEach(like => {
            if (!uniqueUserCounts.has(like.comment_id)) {
              uniqueUserCounts.set(like.comment_id, new Set());
            }
            uniqueUserCounts.get(like.comment_id)!.add(like.user_id);
          });
          
          uniqueUserCounts.forEach((userSet, commentId) => {
            likeCounts.set(commentId, userSet.size);
          });
        }

        // Get user votes for this profile to show next to names
        const { data: userVotesData } = await supabase
          .from('votes')
          .select('user_id, classification, characteristic_type')
          .eq('profile_id', profileId);

        const userVotesMap = new Map();
        userVotesData?.forEach(vote => {
          if (!userVotesMap.has(vote.user_id)) {
            userVotesMap.set(vote.user_id, {});
          }
          userVotesMap.get(vote.user_id)[vote.characteristic_type] = vote.classification;
        });

        // Get unique user IDs to fetch profile nicknames securely
        const uniqueUserIds = [...new Set(commentsData.map(c => c.user_id))];
        
        // Fetch profile nicknames using secure RPC
        const profileNicknamesPromises = uniqueUserIds.map(async (userId) => {
          const { data } = await supabase
            .rpc('get_public_profile_nickname', { p_user_id: userId })
            .single();
          return { userId, nickname: data?.nickname || 'User' };
        });
        
        const profileNicknames = await Promise.all(profileNicknamesPromises);
        const profileNicknameMap = new Map(profileNicknames.map(p => [p.userId, p.nickname]));

        const formattedComments: Comment[] = commentsData
          .filter(comment => !comment.parent_comment_id) // Only get top-level comments
          .map(comment => ({
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            likes_count: likeCounts.get(comment.id) || 0,
            parent_comment_id: comment.parent_comment_id,
            user_id: comment.user_id,
            user: {
              nickname: profileNicknameMap.get(comment.user_id) || 'User',
              email: '' // No longer expose emails for security
            },
            userVotes: userVotesMap.get(comment.user_id) || {},
            isLiked: userLikes.includes(comment.id),
            replies: commentsData
              .filter(reply => reply.parent_comment_id === comment.id)
              .map(reply => ({
                id: reply.id,
                content: reply.content,
                created_at: reply.created_at,
                likes_count: likeCounts.get(reply.id) || 0,
                parent_comment_id: reply.parent_comment_id,
                user_id: reply.user_id,
                user: {
                  nickname: profileNicknameMap.get(reply.user_id) || 'User',
                  email: '' // No longer expose emails for security
                },
                userVotes: userVotesMap.get(reply.user_id) || {},
                isLiked: userLikes.includes(reply.id)
              }))
          }));

        setComments(formattedComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string, parentCommentId?: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to comment",
        variant: "destructive",
      });
      return false;
    }

    if (!content.trim()) return false;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          content: content.trim(),
          parent_comment_id: parentCommentId || null
        });

      if (error) throw error;

      // If this is a reply, create a notification for the parent comment owner
      if (parentCommentId) {
        const { data: parentComment } = await supabase
          .from('comments')
          .select('user_id')
          .eq('id', parentCommentId)
          .single();

        if (parentComment && parentComment.user_id !== user.id) {
          // Get the current user's nickname for notification
          const { data: currentUserProfile } = await supabase
            .rpc('get_public_profile_nickname', { p_user_id: user.id })
            .single();
          
          const currentUserNickname = currentUserProfile?.nickname || 'User';
          
          await supabase.rpc('create_notification', {
            target_user_id: parentComment.user_id,
            notification_type: 'reply',
            notification_message: `${currentUserNickname} replied to your comment`,
            target_profile_id: profileId,
            target_comment_id: parentCommentId
          });
        }
      }

      await fetchComments(); // Refresh comments

      toast({
        title: "Comment added!",
        description: "Your comment has been posted successfully",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error commenting",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const likeComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to like",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user has already liked this comment
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .single();

      // Get current comment data
      const { data: commentData } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (!commentData) return;

      if (existingLike) {
        // Unlike the comment
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);

        if (deleteError) throw deleteError;
      } else {
        // Like the comment
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId
          });

        if (insertError) throw insertError;

        // Create notification for comment owner (using nickname for anonymity)
        if (commentData.user_id !== user.id) {
          // Get the current user's nickname for notification
          const { data: currentUserProfile } = await supabase
            .rpc('get_public_profile_nickname', { p_user_id: user.id })
            .single();
          
          const currentUserNickname = currentUserProfile?.nickname || 'User';
          
          await supabase.rpc('create_notification', {
            target_user_id: commentData.user_id,
            notification_type: 'like',
            notification_message: `${currentUserNickname} liked your comment`,
            target_profile_id: profileId,
            target_comment_id: commentId
          });
        }
      }

      // Refresh comments to get updated data
      await fetchComments();
    } catch (error: any) {
      console.error('Error liking comment:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the new function to delete comment and its children
      const { error } = await supabase.rpc('delete_comment_and_children', {
        comment_id_param: commentId
      });

      if (error) throw error;

      await fetchComments(); // Refresh comments

      toast({
        title: "Comment deleted!",
        description: "Your comment has been removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchComments();
  }, [profileId, user]);

  return {
    comments,
    loading,
    addComment,
    likeComment,
    deleteComment
  };
};
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { AppSidebar } from '@/components/AppSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Heart, Trophy, ChevronLeft, CalendarDays, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemberData } from '@/hooks/use-member-data';
import { LEVEL_COLORS, LEVEL_NAMES } from '@/hooks/use-badges';

const MemberProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile, stats, badges, recentComments, likesReceived, isLoading } = useMemberData(userId ?? '');

  if (isLoading) {
    return <MemberProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <AppSidebar />
        <main className="lg:ml-80 pt-16">
          <div className="container mx-auto px-4 py-16 text-center">
            <p className="text-muted-foreground">Member not found.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const initials = profile.nickname?.slice(0, 2).toUpperCase() ?? '??';
  const memberSince = formatDistanceToNow(new Date(profile.created_at), { addSuffix: true });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AppSidebar />
      <main className="lg:ml-80 pt-16">
        <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">

          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {/* Hero card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 ring-2 ring-border">
                  <AvatarImage src={profile.avatar_url ?? ''} alt={profile.nickname} />
                  <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold truncate">{profile.nickname}</h1>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Member {memberSince}</span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <StatPill
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Comments"
                  value={stats?.total_comments ?? recentComments.length}
                />
                <StatPill
                  icon={<Trophy className="h-4 w-4" />}
                  label="Badges"
                  value={badges.length}
                />
                <StatPill
                  icon={<Heart className="h-4 w-4" />}
                  label="Likes received"
                  value={likesReceived.length}
                />
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          {badges.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Badges earned · {badges.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <div className="flex flex-wrap gap-3">
                    {badges.map((ub) => {
                      const levelColor = LEVEL_COLORS[ub.badge.level] ?? LEVEL_COLORS[1];
                      const levelName = LEVEL_NAMES[ub.badge.level] ?? 'Bronze';
                      return (
                        <Tooltip key={ub.badge_id}>
                          <TooltipTrigger asChild>
                            <div className="relative flex flex-col items-center justify-center w-16 h-20 rounded-xl border-2 border-primary/40 bg-gradient-to-b from-primary/5 to-transparent shadow-sm cursor-default">
                              <span className="text-2xl mb-0.5">{ub.badge.icon}</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                                Lv.{ub.badge.level}
                              </span>
                              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r ${levelColor} flex items-center justify-center`}>
                                <span className="text-white text-[8px] font-bold">✓</span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-52">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span>{ub.badge.icon}</span>
                                <span className="font-semibold text-sm">{ub.badge.name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{ub.badge.description}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {levelName} · Level {ub.badge.level}
                              </Badge>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          )}

          {/* Recent Comments */}
          {recentComments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Recent comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentComments.map((comment) => (
                  <div key={comment.id} className="group flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{comment.content}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {(comment.likes_count ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="h-3 w-3" />
                            {comment.likes_count}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/profile/${comment.profile_id}`}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Likes Received */}
          {likesReceived.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Recent likes received
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {likesReceived.map((like) => (
                  <div key={like.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
                      <span className="text-sm text-muted-foreground">Comment liked</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(like.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {badges.length === 0 && recentComments.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                This member hasn't been active yet.
              </CardContent>
            </Card>
          )}

        </div>
      </main>
      <BottomNav />
    </div>
  );
};

const StatPill = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-muted/50 border border-border/40">
    <div className="text-muted-foreground">{icon}</div>
    <span className="text-xl font-bold">{value}</span>
    <span className="text-[11px] text-muted-foreground">{label}</span>
  </div>
);

const MemberProfileSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <AppSidebar />
    <main className="lg:ml-80 pt-16">
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Skeleton className="h-9 w-20" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-5">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </main>
  </div>
);

export default MemberProfile;

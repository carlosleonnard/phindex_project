import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useBadges,
  BADGE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_STAT_KEY,
  LEVEL_COLORS,
  LEVEL_NAMES,
  type BadgeDefinition,
  type BadgeCategory,
} from '@/hooks/use-badges';

export const BadgesSection = () => {
  const {
    badgesByCategory,
    earnedBadgeIds,
    userStats,
    refreshBadges,
    isLoading,
  } = useBadges();

  // Refresh badges on mount
  useEffect(() => {
    refreshBadges.mutate();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Achievements & Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEarned = earnedBadgeIds.size;
  const totalBadges = Object.values(badgesByCategory).flat().length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Achievements & Badges</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {totalEarned} of {totalBadges} badges earned
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-primary">{totalEarned}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Badges</div>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mt-3">
          <div
            className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-500"
            style={{ width: `${totalBadges > 0 ? (totalEarned / totalBadges) * 100 : 0}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {BADGE_CATEGORIES.map(category => {
          const badges = badgesByCategory[category] || [];
          if (badges.length === 0) return null;

          const statKey = CATEGORY_STAT_KEY[category as BadgeCategory];
          const currentValue = userStats?.[statKey] ?? 0;
          const earnedInCategory = badges.filter(b => earnedBadgeIds.has(b.id)).length;

          return (
            <CategoryRow
              key={category}
              category={category as BadgeCategory}
              badges={badges}
              earnedBadgeIds={earnedBadgeIds}
              currentValue={currentValue}
              earnedCount={earnedInCategory}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

interface CategoryRowProps {
  category: BadgeCategory;
  badges: BadgeDefinition[];
  earnedBadgeIds: Set<string>;
  currentValue: number;
  earnedCount: number;
}

const CategoryRow = ({ category, badges, earnedBadgeIds, currentValue, earnedCount }: CategoryRowProps) => {
  const label = CATEGORY_LABELS[category];
  const nextBadge = badges.find(b => !earnedBadgeIds.has(b.id));
  const progressToNext = nextBadge
    ? Math.min((currentValue / nextBadge.threshold) * 100, 100)
    : 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{label}</h3>
          <p className="text-xs text-muted-foreground">
            {earnedCount}/{badges.length} badges
            {nextBadge && (
              <span> · {currentValue}/{nextBadge.threshold} to next</span>
            )}
          </p>
        </div>
        {nextBadge && (
          <div className="w-32">
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <TooltipProvider>
          {badges.map(badge => {
            const isEarned = earnedBadgeIds.has(badge.id);
            return (
              <BadgeCard key={badge.id} badge={badge} isEarned={isEarned} />
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
};

interface BadgeCardProps {
  badge: BadgeDefinition;
  isEarned: boolean;
}

const BadgeCard = ({ badge, isEarned }: BadgeCardProps) => {
  const levelColor = LEVEL_COLORS[badge.level] || LEVEL_COLORS[1];
  const levelName = LEVEL_NAMES[badge.level] || 'Bronze';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`relative flex flex-col items-center justify-center w-16 h-20 rounded-xl border-2 transition-all duration-300 cursor-default ${
            isEarned
              ? 'border-primary/40 bg-gradient-to-b from-primary/5 to-transparent shadow-sm'
              : 'border-border/30 bg-muted/30 opacity-40 grayscale'
          }`}
        >
          <span className="text-2xl mb-0.5">{badge.icon}</span>
          <span className={`text-[9px] font-bold uppercase tracking-wider ${
            isEarned ? 'text-primary' : 'text-muted-foreground'
          }`}>
            Lv.{badge.level}
          </span>
          {isEarned && (
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r ${levelColor} flex items-center justify-center`}>
              <span className="text-white text-[8px] font-bold">✓</span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-52">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span>{badge.icon}</span>
            <span className="font-semibold text-sm">{badge.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{badge.description}</p>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {levelName} · Level {badge.level}
          </Badge>
          {isEarned && (
            <p className="text-[10px] text-green-600 font-medium">Earned!</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

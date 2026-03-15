import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { useLeaderboard, LeaderboardPeriod } from "@/hooks/use-leaderboard";
import { Trophy, Target, Award, Calendar, CalendarDays, Infinity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const periods: { key: LeaderboardPeriod; label: string; icon: React.ReactNode }[] = [
  { key: "week",  label: "This Week",  icon: <CalendarDays className="w-4 h-4" /> },
  { key: "month", label: "This Month", icon: <Calendar className="w-4 h-4" /> },
  { key: "all",   label: "All Time",   icon: <Infinity className="w-4 h-4" /> },
];

const rankIcon = (index: number) => {
  if (index === 0) return <Trophy className="w-7 h-7 text-yellow-500" />;
  if (index === 1) return <Award className="w-6 h-6 text-gray-400" />;
  if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
  return <span className="text-xl font-bold text-muted-foreground w-7 text-center">{index + 1}</span>;
};

const ITEMS_PER_PAGE = 10;

export default function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const [currentPage, setCurrentPage] = useState(1);
  const { data: leaderboard, isLoading } = useLeaderboard(period);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 lg:ml-80 container mx-auto px-4 py-8 mt-16">
          <div className="max-w-3xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
            </div>
            <p className="text-muted-foreground mb-6">
              Top players of the Guess the Origin game.
            </p>

            {/* Period Tabs */}
            <div className="flex gap-2 mb-8 p-1 bg-muted rounded-lg w-fit">
              {periods.map(({ key, label, icon }) => (
                <Button
                  key={key}
                  variant={period === key ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => { setPeriod(key); setCurrentPage(1); }}
                >
                  {icon}
                  {label}
                </Button>
              ))}
            </div>

            {/* List */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center">
                  <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No players in this period yet.</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Be the first to play!</p>
                </CardContent>
              </Card>
            ) : (
              <>
              <div className="space-y-3">
                {leaderboard.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((entry, index) => {
                  const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                  return (
                  <Card
                    key={entry.userId}
                    className={`transition-all hover:shadow-md ${
                      globalIndex === 0
                        ? "border-yellow-500/40 bg-yellow-500/5"
                        : globalIndex === 1
                        ? "border-gray-400/40 bg-gray-400/5"
                        : globalIndex === 2
                        ? "border-amber-600/40 bg-amber-600/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <CardContent className="py-4 px-5">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-8 flex items-center justify-center">
                          {rankIcon(globalIndex)}
                        </div>

                        {/* Player */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base text-foreground truncate">
                            {entry.nickname}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.totalGames} {entry.totalGames === 1 ? "game" : "games"} played
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-5">
                          <div className="text-right hidden sm:block">
                            <p className="text-xl font-bold text-primary">{entry.totalCorrect}</p>
                            <p className="text-xs text-muted-foreground">correct</p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-base font-medium text-foreground">
                              {entry.totalCorrect}/{entry.totalQuestions}
                            </p>
                            <p className="text-xs text-muted-foreground">correct/total</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Target className="w-3.5 h-3.5 text-accent" />
                              <span className="text-base font-semibold text-foreground">
                                {entry.accuracyPercentage}%
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">accuracy</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {leaderboard.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.ceil(leaderboard.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      className="min-w-[36px]"
                      onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === Math.ceil(leaderboard.length / ITEMS_PER_PAGE)}
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    Next
                  </Button>
                </div>
              )}
              </>
            )}

          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

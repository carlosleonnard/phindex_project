import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { Trophy, Target, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useLeaderboard();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Global Leaderboard</h1>
          </div>
          
          <p className="text-muted-foreground mb-8">
            Top players by accuracy across all difficulty levels in the Guess the Origin game.
          </p>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No players yet. Be the first to play!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <Card 
                  key={entry.userId}
                  className={`transition-all hover:shadow-lg ${
                    index === 0 ? 'border-primary/50 bg-primary/5' :
                    index === 1 ? 'border-accent/50 bg-accent/5' :
                    index === 2 ? 'border-muted/50 bg-muted/5' :
                    ''
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        {index === 0 && (
                          <Trophy className="w-8 h-8 text-primary" />
                        )}
                        {index === 1 && (
                          <Award className="w-7 h-7 text-accent" />
                        )}
                        {index === 2 && (
                          <Award className="w-6 h-6 text-muted-foreground" />
                        )}
                        {index > 2 && (
                          <span className="text-2xl font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg text-foreground truncate">
                          {entry.nickname}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.totalGames} game{entry.totalGames !== 1 ? 's' : ''} played
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            <span className="text-2xl font-bold text-primary">
                              {entry.accuracyPercentage}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">accuracy</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">
                            {entry.totalCorrect}/{entry.totalQuestions}
                          </p>
                          <p className="text-xs text-muted-foreground">correct</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

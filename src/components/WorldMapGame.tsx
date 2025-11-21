import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMapGame } from "@/hooks/use-map-game";
import { Loader2, RotateCcw, Trophy, Target, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginModal } from "@/components/LoginModal";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const WorldMapGame = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const {
    currentProfile,
    currentProfileIndex,
    totalProfiles,
    score,
    gameEnded,
    isLoading,
    feedback,
    correctRegion,
    difficulty,
    stats,
    isLoadingStats,
    setDifficulty,
    checkAnswer,
    resetGame,
    skipProfile
  } = useMapGame();

  const handleRegionClick = (region: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please sign in with Google to play the game",
        variant: "destructive",
      });
      setShowLoginModal(true);
      return;
    }
    checkAnswer(region);
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading game...</span>
        </div>
      </Card>
    );
  }

  if (gameEnded) {
    const accuracy = totalProfiles > 0 ? Math.round((score / totalProfiles) * 100) : 0;
    
    return (
      <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/5">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-2">Game Over!</h2>
            <p className="text-xl text-muted-foreground">
              Your Score: <span className="text-primary font-bold text-3xl">{score}</span> / {totalProfiles}
            </p>
            <p className="text-lg text-muted-foreground mt-2">
              Accuracy: <span className="font-semibold text-foreground">{accuracy}%</span>
            </p>
          </div>
          
          {stats && (
            <Card className="p-4 bg-background/50">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Overall Statistics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Games</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalGames}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Overall Accuracy</p>
                  <p className="text-2xl font-bold text-primary">{stats.accuracyPercentage}%</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Total Correct / Questions</p>
                  <p className="text-xl font-semibold text-foreground">
                    {stats.totalCorrect} / {stats.totalQuestions}
                  </p>
                </div>
              </div>
            </Card>
          )}
          
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">
              {score === totalProfiles && "Perfect score! Amazing! 🎉"}
              {score >= totalProfiles * 0.6 && score < totalProfiles && "Great job! 👏"}
              {score < totalProfiles * 0.6 && "Good try! Practice makes perfect! 💪"}
            </p>
          </div>
          <Button onClick={resetGame} size="lg" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!currentProfile) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No profiles available to play</p>
          <Button onClick={resetGame}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/30 w-full max-w-5xl mx-auto">
      <div className="p-4">
        {/* Header with Difficulty Selector */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Guess the Origin
              </h2>
              <p className="text-xs text-muted-foreground">
                Click on the region where this person's phenotype is from
              </p>
              {!user && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg">
                  <LogIn className="h-4 w-4" />
                  <span>Sign in with Google to save your score</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Score: {score} / {totalProfiles}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Profile {currentProfileIndex + 1} of {totalProfiles}
              </p>
            </div>
          </div>

          {/* Difficulty Selector and Stats */}
          <div className="flex items-center justify-between gap-4">
            <Tabs value={difficulty} onValueChange={(value) => setDifficulty(value as 'easy' | 'medium' | 'hard')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="easy" className="text-xs">Easy (3)</TabsTrigger>
                <TabsTrigger value="medium" className="text-xs">Medium (5)</TabsTrigger>
                <TabsTrigger value="hard" className="text-xs">Hard (10)</TabsTrigger>
              </TabsList>
            </Tabs>

            {stats && !isLoadingStats && (
              <div className="flex items-center gap-2 text-xs">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Accuracy:</span>
                <span className="font-semibold text-primary">{stats.accuracyPercentage}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_1fr] gap-4">
          {/* Profile Image */}
          <div className="space-y-2">
            <Card className={`overflow-hidden transition-all duration-300 ${
              feedback === 'correct' ? 'ring-4 ring-green-500' : 
              feedback === 'wrong' ? 'ring-4 ring-red-500' : ''
            }`}>
              <img
                src={currentProfile.front_image_url}
                alt={currentProfile.name}
                className="w-full h-full object-cover aspect-square"
              />
            </Card>
            {feedback && (
              <div className={`text-center text-sm font-semibold ${
                feedback === 'correct' ? 'text-green-600' : 'text-red-600'
              }`}>
                {feedback === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
                {feedback === 'wrong' && correctRegion && (
                  <div className="text-xs mt-1 text-muted-foreground">
                    Correct answer: {correctRegion}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Region Buttons */}
          <div className="flex flex-col gap-2 justify-center">
            <Button
              onClick={() => handleRegionClick('Europe')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Europe
            </Button>
            
            <Button
              onClick={() => handleRegionClick('Africa')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Africa
            </Button>
            
            <Button
              onClick={() => handleRegionClick('Middle East')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Middle East
            </Button>
            
            <Button
              onClick={() => handleRegionClick('Asia')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Asia
            </Button>
            
            <Button
              onClick={() => handleRegionClick('Americas')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Americas
            </Button>
            
            <Button
              onClick={() => handleRegionClick('Oceania')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Oceania
            </Button>

            <Button
              onClick={skipProfile}
              variant="ghost"
              className="w-full mt-2 text-muted-foreground hover:text-foreground"
              disabled={feedback !== null}
            >
              Skip
            </Button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </Card>
  );
};

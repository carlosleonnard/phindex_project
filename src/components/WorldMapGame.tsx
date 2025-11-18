import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMapGame } from "@/hooks/use-map-game";
import { Loader2, RotateCcw, Trophy, Target, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginModal } from "@/components/LoginModal";
import { useState } from "react";

export const WorldMapGame = () => {
  const { user } = useAuth();
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

  const handleAction = (action: () => void) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    action();
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

  if (gameEnded && user) {
    const accuracy = totalProfiles > 0 ? Math.round((score / totalProfiles) * 100) : 0;
    
    return (
      <>
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
        <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      </>
    );
  }

  if (!currentProfile) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No profiles available to play</p>
          <Button onClick={() => handleAction(resetGame)}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/30 max-w-3xl mx-auto relative">
        {!user && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <Card className="p-6 max-w-sm text-center space-y-4">
              <Lock className="h-12 w-12 mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Login Required</h3>
                <p className="text-sm text-muted-foreground">
                  You need to be logged in to play this game
                </p>
              </div>
              <Button onClick={() => setShowLoginModal(true)} className="w-full">
                Login to Play
              </Button>
            </Card>
          </div>
        )}
        
        <div className="p-4">
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Guess the Origin
                </h2>
                <p className="text-xs text-muted-foreground">
                  Click on the region where this person's phenotype is from
                </p>
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

            <div className="flex items-center justify-between gap-4">
              <Tabs value={difficulty} onValueChange={(value) => handleAction(() => setDifficulty(value as 'easy' | 'medium' | 'hard'))}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="easy" className="text-xs">Easy (3)</TabsTrigger>
                  <TabsTrigger value="medium" className="text-xs">Medium (5)</TabsTrigger>
                  <TabsTrigger value="hard" className="text-xs">Hard (10)</TabsTrigger>
                </TabsList>
              </Tabs>

              {stats && !isLoadingStats && user && (
                <div className="flex items-center gap-2 text-xs">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span className="font-semibold text-primary">{stats.accuracyPercentage}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Card className={`overflow-hidden transition-all duration-300 max-w-[250px] mx-auto ${
                feedback === 'correct' ? 'ring-4 ring-green-500' : 
                feedback === 'wrong' ? 'ring-4 ring-red-500' : ''
              }`}>
                <div className="aspect-[3/4] relative">
                  <img
                    src={currentProfile.front_image_url}
                    alt={currentProfile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
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

            <div className="flex flex-col gap-2 justify-center">
              <Button
                onClick={() => handleAction(() => checkAnswer('Europe'))}
                variant="outline"
                className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
                disabled={feedback !== null}
              >
                Europe
              </Button>
              
              <Button
                onClick={() => handleAction(() => checkAnswer('Africa'))}
                variant="outline"
                className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
                disabled={feedback !== null}
              >
                Africa
              </Button>
              
              <Button
                onClick={() => handleAction(() => checkAnswer('Middle East'))}
                variant="outline"
                className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
                disabled={feedback !== null}
              >
                Middle East
              </Button>
              
              <Button
                onClick={() => handleAction(() => checkAnswer('Asia'))}
                variant="outline"
                className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
                disabled={feedback !== null}
              >
                Asia
              </Button>
              
              <Button
                onClick={() => handleAction(() => checkAnswer('Americas'))}
                variant="outline"
                className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
                disabled={feedback !== null}
              >
                Americas
              </Button>
              
              <Button
                onClick={() => handleAction(() => checkAnswer('Oceania'))}
                variant="outline"
                className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
                disabled={feedback !== null}
              >
                Oceania
              </Button>

              <Button
                onClick={() => handleAction(skipProfile)}
                variant="ghost"
                className="w-full mt-2 text-muted-foreground hover:text-foreground"
                disabled={feedback !== null}
              >
                Skip
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </>
  );
};

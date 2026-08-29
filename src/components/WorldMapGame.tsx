import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMapGame, type GamePool } from "@/hooks/use-map-game";
import { Loader2, RotateCcw, Trophy, Target, LogIn, Shuffle, Star, UserRound } from "lucide-react";
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
    correctAnswer,
    difficulty,
    pool,
    stats,
    isLoadingStats,
    options,
    setDifficulty,
    setPool,
    checkAnswer,
    resetGame,
    skipProfile
  } = useMapGame();

  const handleOptionClick = (option: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please sign in with Google to play the game",
        variant: "destructive",
      });
      setShowLoginModal(true);
      return;
    }
    checkAnswer(option);
  };

  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'easy': return 'Select the region where this person\'s phenotype is from';
      case 'medium': return 'Select the general phenotype classification for this person';
      case 'hard': return 'Select the specific phenotype classification for this person';
    }
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
          <p className="mb-1 font-medium text-foreground">
            {pool === 'all'
              ? 'No profiles are ready to play'
              : `No ${pool === 'famous' ? 'famous' : 'community'} profiles are ready to play`}
          </p>
          <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
            A face needs enough votes at this difficulty before it can be used as a
            question. Try another deck or an easier level.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {pool !== 'all' && (
              <Button variant="outline" onClick={() => setPool('all')}>
                Play with everyone
              </Button>
            )}
            {difficulty !== 'easy' && (
              <Button variant="outline" onClick={() => setDifficulty('easy')}>
                Switch to easy
              </Button>
            )}
            <Button onClick={resetGame}>Try again</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/30 w-full">
      {/* Escolha do baralho: quem entra na partida. Fica acima de tudo porque
          é a decisão anterior — define o conjunto antes da dificuldade e da
          pergunta em si. */}
      <div className="border-b border-border/60 bg-muted/30 px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Who you'll see
          </span>
          <Tabs value={pool} onValueChange={(value) => setPool(value as GamePool)}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="all" className="gap-1.5 text-xs">
                <Shuffle className="h-3.5 w-3.5" />
                Everyone
              </TabsTrigger>
              <TabsTrigger value="famous" className="gap-1.5 text-xs">
                <Star className="h-3.5 w-3.5" />
                Famous
              </TabsTrigger>
              <TabsTrigger value="anonymous" className="gap-1.5 text-xs">
                <UserRound className="h-3.5 w-3.5" />
                Community
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="p-5">
        {/* Header with Difficulty Selector */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Guess the {difficulty === 'easy' ? 'Region' : difficulty === 'medium' ? 'General Phenotype' : 'Specific Phenotype'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {getDifficultyLabel()}
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

          {/* Dificuldade e precisão acumulada */}
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={difficulty} onValueChange={(value) => setDifficulty(value as 'easy' | 'medium' | 'hard')}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="easy" className="text-xs">Easy (3)</TabsTrigger>
                <TabsTrigger value="medium" className="text-xs">Medium (5)</TabsTrigger>
                <TabsTrigger value="hard" className="text-xs">Hard (10)</TabsTrigger>
              </TabsList>
            </Tabs>

            {stats && !isLoadingStats && (
              <div className="ml-auto flex items-center gap-2 text-xs">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Accuracy:</span>
                <span className="font-semibold text-primary">{stats.accuracyPercentage}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-[400px_1fr] gap-6 items-start">
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
                {feedback === 'wrong' && correctAnswer && (
                  <div className="text-xs mt-1 text-muted-foreground">
                    Correct answer: {correctAnswer}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Option Buttons (always 6) */}
          <div className="flex flex-col gap-2 justify-center">
            {options.map((option) => (
              <Button
                key={option}
                onClick={() => handleOptionClick(option)}
                variant="outline"
                className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
                disabled={feedback !== null}
              >
                {option}
              </Button>
            ))}

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

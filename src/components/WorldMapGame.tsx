import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMapGame } from "@/hooks/use-map-game";
import { Loader2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export const WorldMapGame = () => {
  const { user } = useAuth();
  const {
    currentProfile,
    currentProfileIndex,
    totalProfiles,
    score,
    gameEnded,
    isLoading,
    feedback,
    checkAnswer,
    resetGame
  } = useMapGame();

  if (!user) {
    return null;
  }

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
    return (
      <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/5">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-2">Game Over!</h2>
            <p className="text-xl text-muted-foreground">
              Your Score: <span className="text-primary font-bold text-3xl">{score}</span> / {totalProfiles}
            </p>
          </div>
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
    <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/30 max-w-3xl mx-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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

        <div className="grid md:grid-cols-2 gap-4">
          {/* Profile Image */}
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
              </div>
            )}
          </div>

          {/* Region Buttons */}
          <div className="flex flex-col gap-2 justify-center">
            <Button
              onClick={() => checkAnswer('Europe')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Europe
            </Button>
            
            <Button
              onClick={() => checkAnswer('Africa')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Africa
            </Button>
            
            <Button
              onClick={() => checkAnswer('Middle East')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Middle East
            </Button>
            
            <Button
              onClick={() => checkAnswer('Asia')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Asia
            </Button>
            
            <Button
              onClick={() => checkAnswer('Americas')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Americas
            </Button>
            
            <Button
              onClick={() => checkAnswer('Oceania')}
              variant="outline"
              className="w-full justify-start text-left hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={feedback !== null}
            >
              Oceania
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

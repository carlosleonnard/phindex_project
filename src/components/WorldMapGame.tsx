import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMapGame } from "@/hooks/use-map-game";
import { Loader2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const WorldMapGame = () => {
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
    <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/30">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Guess the Origin
            </h2>
            <p className="text-sm text-muted-foreground">
              Click on the region where this person's phenotype is from
            </p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Score: {score} / {totalProfiles}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Profile {currentProfileIndex + 1} of {totalProfiles}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Image */}
          <div className="space-y-4">
            <Card className={`overflow-hidden transition-all duration-300 ${
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
              <div className={`text-center text-lg font-semibold ${
                feedback === 'correct' ? 'text-green-600' : 'text-red-600'
              }`}>
                {feedback === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
              </div>
            )}
          </div>

          {/* World Map */}
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 1000 500" className="w-full h-auto max-h-[500px]">
              {/* Europe */}
              <g 
                onClick={() => checkAnswer('Europe')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <rect x="420" y="80" width="120" height="100" fill="hsl(var(--primary))" opacity="0.6" rx="8" />
                <text x="480" y="135" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                  Europe
                </text>
              </g>

              {/* Africa */}
              <g 
                onClick={() => checkAnswer('Africa')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <rect x="420" y="200" width="140" height="150" fill="hsl(var(--primary))" opacity="0.6" rx="8" />
                <text x="490" y="280" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                  Africa
                </text>
              </g>

              {/* Middle East */}
              <g 
                onClick={() => checkAnswer('Middle East')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <rect x="560" y="140" width="130" height="110" fill="hsl(var(--primary))" opacity="0.6" rx="8" />
                <text x="625" y="200" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  Middle East
                </text>
              </g>

              {/* Asia */}
              <g 
                onClick={() => checkAnswer('Asia')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <rect x="690" y="80" width="180" height="180" fill="hsl(var(--primary))" opacity="0.6" rx="8" />
                <text x="780" y="175" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                  Asia
                </text>
              </g>

              {/* Americas */}
              <g 
                onClick={() => checkAnswer('Americas')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <rect x="150" y="100" width="140" height="280" fill="hsl(var(--primary))" opacity="0.6" rx="8" />
                <text x="220" y="245" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                  Americas
                </text>
              </g>

              {/* Oceania */}
              <g 
                onClick={() => checkAnswer('Oceania')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <rect x="780" y="300" width="150" height="100" fill="hsl(var(--primary))" opacity="0.6" rx="8" />
                <text x="855" y="355" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                  Oceania
                </text>
              </g>

              {/* Background ocean */}
              <rect x="0" y="0" width="1000" height="500" fill="hsl(var(--muted))" opacity="0.3" className="-z-10" />
            </svg>
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * LEITURA ÀS CEGAS (BlindReadPanel.tsx)
 *
 * Mostra, lado a lado, as duas formas como um rosto foi classificado:
 *
 *   "Voted"  — a classificação oficial. Quem votou viu o nome, o país e a
 *              ancestralidade declarada antes de decidir.
 *   "Guessed" — o que jogadores responderam vendo só o rosto, dentro de uma
 *              partida, sem saber de quem se tratava.
 *
 * Quando as duas coincidem, o rosto é lido com facilidade. Quando divergem,
 * isso é a informação: o contexto mudou o julgamento.
 *
 * A seção só aparece se houver palpites registrados — sem dados, um painel
 * vazio não diria nada.
 */

import { Eye, Vote, Gamepad2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useProfileGameStats,
  type GameDifficulty,
} from "@/hooks/use-profile-game-stats";
import { cn } from "@/lib/utils";

interface BlindReadPanelProps {
  profileId: string;
  /** Classificação oficial vinda dos votos, exibida como contraponto. */
  votedClassification?: string | null;
}

const DIFFICULTY_LABELS: { value: GameDifficulty; label: string; hint: string }[] = [
  { value: "easy", label: "Region", hint: "Continent-level guesses" },
  { value: "medium", label: "General", hint: "Geographic subregion guesses" },
  { value: "hard", label: "Specific", hint: "Exact phenotype guesses" },
];

export const BlindReadPanel = ({
  profileId,
  votedClassification,
}: BlindReadPanelProps) => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<GameDifficulty>("medium");
  const { stats, isLoading } = useProfileGameStats(profileId, difficulty);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-5" aria-hidden="true">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-4/5 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  const hasGuesses = stats && stats.totalGuesses > 0;

  return (
    <section
      aria-labelledby="blind-read-heading"
      className="rounded-2xl border border-border/60 bg-card p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="blind-read-heading"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <Eye className="h-[18px] w-[18px] text-primary" />
            The blind read
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            How players classified this face in the game, seeing nothing but the
            photo &mdash; no name, no country, no ancestry.
          </p>
        </div>

        {/* Alterna o vocabulário: região, sub-região ou fenótipo específico. */}
        <div
          role="group"
          aria-label="Guess detail level"
          className="flex items-center gap-1 rounded-full bg-muted p-1"
        >
          {DIFFICULTY_LABELS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDifficulty(option.value)}
              aria-pressed={difficulty === option.value}
              title={option.hint}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                difficulty === option.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!hasGuesses ? (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-background/50 p-6 text-center">
          <p className="text-sm text-foreground">
            No one has met this face in the game yet.
          </p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            Play a round and this panel will fill in with how people read it cold.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/game")}
            className="mt-4 gap-1.5 rounded-full"
          >
            <Gamepad2 className="h-4 w-4" />
            Play the game
          </Button>
        </div>
      ) : (
        <>
          {/* AS DUAS LEITURAS, LADO A LADO */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/50 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Vote className="h-3.5 w-3.5" />
                Voted — with context
              </h3>
              <p className="mt-2 truncate text-base font-semibold text-foreground">
                {votedClassification || stats.expectedAnswer || "Not classified"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Voters saw the full profile
              </p>
            </div>

            <div
              className={cn(
                "rounded-xl border p-4",
                stats.divergent
                  ? "border-primary/40 bg-primary/[0.06]"
                  : "border-border/60 bg-background/50"
              )}
            >
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                Guessed — face only
              </h3>
              <p className="mt-2 truncate text-base font-semibold text-foreground">
                {stats.topGuess}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stats.accuracy}% matched the voted classification
              </p>
            </div>
          </div>

          {/* A conclusão em uma frase, para quem não vai ler a distribuição. */}
          <p className="mt-3 text-sm text-muted-foreground">
            {stats.divergent ? (
              <>
                Players read this face as{" "}
                <span className="font-medium text-foreground">{stats.topGuess}</span>{" "}
                more often than its voted classification &mdash; context changes the
                verdict here.
              </>
            ) : (
              <>
                The blind read agrees with the vote. This face is classified
                consistently with or without context.
              </>
            )}
          </p>

          {/* DISTRIBUIÇÃO COMPLETA */}
          <div className="mt-5">
            <h3 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Every answer given ({stats.totalGuesses}{" "}
              {stats.totalGuesses === 1 ? "guess" : "guesses"})
            </h3>

            <ul className="space-y-1.5">
              {stats.distribution.map((entry) => (
                <li key={entry.guess}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-foreground">
                      {entry.guess}
                      {entry.isCorrect && (
                        <span className="ml-1.5 text-xs text-primary">
                          matches the vote
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {entry.percentage}%
                    </span>
                  </div>
                  {/* Barra proporcional; a resposta que bate com o voto é destacada. */}
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-500 ease-out",
                        entry.isCorrect ? "bg-primary" : "bg-muted-foreground/40"
                      )}
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/game")}
            className="mt-4 gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
          >
            Test yourself on other faces
            <ArrowRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </section>
  );
};

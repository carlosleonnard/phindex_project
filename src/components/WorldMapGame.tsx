/**
 * JOGO "GUESS THE PHENOTYPE" (WorldMapGame.tsx)
 *
 * Orquestra as três fases do jogo — preparação, rodada e resultado — sobre o
 * estado de useMapGame. Jogar exige login: o palpite alimenta a "leitura às
 * cegas" de cada perfil e o placar entra no ranking.
 */

import { useEffect, useState } from "react";
import { LoginModal } from "@/components/LoginModal";
import { GameSetup } from "@/components/game/GameSetup";
import { GameRound } from "@/components/game/GameRound";
import { GameResult } from "@/components/game/GameResult";
import { EmptySheet } from "@/components/kt/Listing";
import { useAuth } from "@/hooks/use-auth";
import { useMapGame, type Difficulty } from "@/hooks/use-map-game";

export const WorldMapGame = ({ initialLevel = "medium" }: { initialLevel?: Difficulty }) => {
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const game = useMapGame(initialLevel);

  // Cada fase começa no topo da página.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [game.phase]);

  const play = (level?: Difficulty) => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    game.start(level);
  };

  if (game.isError) {
    return <EmptySheet title="Couldn’t load the game">Check your connection and reload the page.</EmptySheet>;
  }

  return (
    <>
      {game.phase === "setup" && (
        <GameSetup
          level={game.level}
          onLevel={game.setLevel}
          pool={game.pool}
          onPool={game.setPool}
          available={game.available}
          isLoading={game.isLoading}
          loggedIn={!!user}
          userId={user?.id}
          record={game.record}
          onStart={() => play()}
        />
      )}

      {game.phase === "round" && game.current && (
        <GameRound
          level={game.level}
          pool={game.pool}
          faces={game.faces}
          index={game.index}
          current={game.current}
          picks={game.picks}
          picked={game.picked}
          score={game.score}
          onPick={game.pick}
          onSkip={game.skip}
          onNext={game.next}
          onQuit={game.quit}
        />
      )}

      {game.phase === "result" && (
        <GameResult
          level={game.level}
          pool={game.pool}
          faces={game.faces}
          picks={game.picks}
          score={game.score}
          baseRecord={game.baseRecord}
          onPlayAgain={() => play(game.level)}
          onLevel={(level) => play(level)}
        />
      )}

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
};

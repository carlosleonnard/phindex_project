/**
 * PÁGINA DO JOGO (GamePage.tsx)
 *
 * /game?level=easy|medium|hard abre a preparação com o nível já escolhido —
 * é como a landing leva direto ao nível dos continentes.
 */

import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { WorldMapGame } from "@/components/WorldMapGame";
import type { Difficulty } from "@/hooks/use-map-game";

const LEVEL_PARAM: Record<string, Difficulty> = { easy: "easy", medium: "medium", hard: "hard" };

const GamePage = () => {
  const [searchParams] = useSearchParams();
  const initialLevel = LEVEL_PARAM[searchParams.get("level") ?? ""] ?? "medium";

  return (
    <AppLayout>
      <Helmet>
        <title>Guess the Phenotype - Phindex | Test Your Eye for Human Variation</title>
        <meta
          name="description"
          content="Play Guess the Phenotype on Phindex. Place faces by region or name their exact classification across three difficulty levels."
        />
        <link rel="canonical" href="https://www.phenotypeindex.com/game" />
      </Helmet>

      <WorldMapGame initialLevel={initialLevel} />
    </AppLayout>
  );
};

export default GamePage;

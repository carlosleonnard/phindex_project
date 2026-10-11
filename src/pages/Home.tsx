/**
 * PORTA DE ENTRADA DA RAIZ (Home.tsx)
 *
 * A rota "/" atende dois públicos com necessidades opostas:
 *
 *   - visitante  → a landing, que precisa explicar o que é o Phindex;
 *   - usuário    → o feed de descoberta, que já é o produto em uso.
 *
 * Mandar quem já entrou para uma página de captação seria pedir que provasse
 * de novo uma decisão que já tomou; mandar quem chegou agora direto para o
 * feed seria um índice de rostos sem nenhuma explicação.
 *
 * O estado de carregamento existe porque `useAuth` só sabe quem é a pessoa
 * depois de consultar a sessão. Renderizar qualquer uma das duas páginas antes
 * disso produz um piscar: a landing aparece e é substituída pelo feed. O
 * intervalo é de milissegundos, então a tela de espera é deliberadamente
 * neutra — um fundo, nada que chame atenção para si.
 */

import { useAuth } from "@/hooks/use-auth";
import Landing from "./Landing";
import Index from "./Index";

const Home = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  return user ? <Index /> : <Landing />;
};

export default Home;

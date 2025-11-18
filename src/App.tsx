/**
 * ARQUIVO PRINCIPAL DA APLICAÇÃO (App.tsx)
 * 
 * Este arquivo é o componente raiz da aplicação Phindex - uma rede social para classificação
 * de fenótipos físicos. Ele configura todos os providers globais e define o sistema de rotas.
 */

// Importa o sistema de notificações toast (UI feedback para usuário)
import { Toaster } from "@/components/ui/toaster";
// Importa notificações do Sonner (alternativa mais moderna para toasts)
import { Toaster as Sonner } from "@/components/ui/sonner";
// Provider para tooltips (dicas que aparecem ao passar mouse sobre elementos)
import { TooltipProvider } from "@/components/ui/tooltip";
// React Query para gerenciamento de estado assíncrono e cache de dados da API
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Sistema de roteamento do React Router para navegação entre páginas
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Vercel Analytics para monitoramento de visitantes e page views
import { Analytics } from "@vercel/analytics/react";
// Importa todas as páginas da aplicação
import Index from "./pages/Index"; // Página inicial com lista de perfis
import ProfileDetail from "./pages/ProfileDetail"; // Página de detalhes de um perfil específico
import UserProfileDetail from "./pages/UserProfileDetail"; // Página de perfil de usuário
import RegionPage from "./pages/RegionPage"; // Página filtrada por região geográfica
import CategoryPage from "./pages/CategoryPage"; // Página filtrada por categoria
import PhenotypeFlowPage from "./pages/PhenotypeFlowPage"; // Página do fluxo de fenótipos (em construção)
import Settings from "./pages/Settings"; // Página de configurações do usuário
import Contact from "./pages/Contact"; // Página de contato
import FAQ from "./pages/FAQ"; // Página de perguntas frequentes
import NotFound from "./pages/NotFound"; // Página 404 para rotas não encontradas

/**
 * CONFIGURAÇÃO DO CLIENTE REACT QUERY
 * 
 * Cria uma instância do QueryClient que será usado globalmente para:
 * - Cache de dados das APIs
 * - Gerenciamento de estados de loading/error
 * - Invalidação automática de cache
 * - Retry automático em caso de falha
 */
const queryClient = new QueryClient();

/**
 * COMPONENTE PRINCIPAL DA APLICAÇÃO
 * 
 * Define a estrutura hierárquica de providers e rotas da aplicação.
 * A ordem dos providers é importante - cada um envolve os componentes filhos.
 */
const App = () => (
  // Provider para React Query - gerencia todo o estado assíncrono da aplicação
  <QueryClientProvider client={queryClient}>
    {/* Provider para tooltips - permite usar tooltips em qualquer componente filho */}
    <TooltipProvider>
      {/* Sistema de notificações Toast - feedback visual para ações do usuário */}
      <Toaster />
      {/* Sistema Sonner alternativo para notificações mais modernas */}
      <Sonner />
      {/* Vercel Analytics para monitoramento de page views e visitantes */}
      <Analytics />
      {/* Router principal - habilita navegação entre páginas */}
      <BrowserRouter>
        {/* Container de todas as rotas da aplicação */}
        <Routes>
          {/* ROTA INICIAL: Página principal com lista de perfis */}
          <Route path="/" element={<Index />} />
          
          {/* ROTA DINÂMICA: Detalhes de perfil por ID específico */}
          <Route path="/profile/:id" element={<ProfileDetail />} />
          
          {/* ROTA DINÂMICA: Perfil de usuário por slug único */}
          <Route path="/user-profile/:slug" element={<UserProfileDetail />} />
          
          {/* ROTA DINÂMICA: Página filtrada por região geográfica */}
          <Route path="/region/:region" element={<RegionPage />} />
          
          {/* ROTA DINÂMICA: Página filtrada por categoria de fenótipo */}
          <Route path="/category/:category" element={<CategoryPage />} />
          
          {/* ROTA ESTÁTICA: Fluxo de fenótipos (funcionalidade em desenvolvimento) */}
          <Route path="/phenotype-flow" element={<PhenotypeFlowPage />} />
          
          {/* ROTA ESTÁTICA: Configurações do usuário */}
          <Route path="/settings" element={<Settings />} />
          
          {/* ROTA ESTÁTICA: Página de contato */}
          <Route path="/contact" element={<Contact />} />
          
          {/* ROTA ESTÁTICA: Página de perguntas frequentes */}
          <Route path="/faq" element={<FAQ />} />
          
          {/* ROTA CATCH-ALL: Captura qualquer URL não definida acima e mostra 404 */}
          {/* IMPORTANTE: Esta deve sempre ser a última rota para funcionar corretamente */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Exporta o componente App como padrão para ser usado no main.tsx
export default App;

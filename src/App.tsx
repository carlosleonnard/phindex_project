/**
 * ARQUIVO PRINCIPAL DA APLICAÇÃO (App.tsx)
 * 
 * Este arquivo é o componente raiz da aplicação Phindex - uma rede social para classificação
 * de fenótipos físicos. Ele configura todos os providers globais e define o sistema de rotas.
 */

// Importa o sistema de notificações toast (UI feedback para usuário)
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
// Importa notificações do Sonner (alternativa mais moderna para toasts)
import { Toaster as Sonner } from "@/components/ui/sonner";
// Provider para tooltips (dicas que aparecem ao passar mouse sobre elementos)
import { TooltipProvider } from "@/components/ui/tooltip";
// React Query para gerenciamento de estado assíncrono e cache de dados da API
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Sistema de roteamento do React Router para navegação entre páginas
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// Vercel Analytics para monitoramento de visitantes e page views
import { Analytics } from "@vercel/analytics/react";
// Vercel Speed Insights para monitoramento de performance
import { SpeedInsights } from "@vercel/speed-insights/react";
// Importa todas as páginas da aplicação
import Home from "./pages/Home"; // Raiz: landing para visitante, feed para quem entrou

/**
 * As páginas abaixo entram por React.lazy: o bundle era um arquivo único de
 * 908 KB, e quem abria a home baixava também o jogo, as configurações e o
 * resto do site. Home fica estática porque é a primeira tela.
 */
const Index = lazy(() => import("./pages/Index")); // Feed de descoberta, tambem servido em /community
const Explore = lazy(() => import("./pages/Explore")); // Busca e navegação em grade
const Saved = lazy(() => import("./pages/Saved")); // Coleção pessoal de perfis salvos
const ProfileDetail = lazy(() => import("./pages/ProfileDetail")); // Página de detalhes de um perfil específico
const UserProfileDetail = lazy(() => import("./pages/UserProfileDetail")); // Página de perfil de usuário
const RegionPage = lazy(() => import("./pages/RegionPage")); // Página filtrada por região geográfica
const CategoryPage = lazy(() => import("./pages/CategoryPage")); // Página filtrada por categoria
const PhenotypeFlowPage = lazy(() => import("./pages/PhenotypeFlowPage")); // Fluxo de fenótipos
const Settings = lazy(() => import("./pages/Settings")); // Configurações do usuário
const Contact = lazy(() => import("./pages/Contact")); // Página de contato
const FAQ = lazy(() => import("./pages/FAQ")); // Perguntas frequentes
const About = lazy(() => import("./pages/About")); // Quem mantém o site e o que os resultados significam
const Privacy = lazy(() => import("./pages/Privacy")); // O que é guardado e como pedir remoção
const Terms = lazy(() => import("./pages/Terms")); // As regras para publicar e comentar
const Leaderboard = lazy(() => import("./pages/Leaderboard")); // Ranking do jogo
const GamePage = lazy(() => import("./pages/GamePage")); // Guess the phenotype
const AttractionPage = lazy(() => import("./pages/AttractionPage")); // Escala de atração
const MemberProfile = lazy(() => import("./pages/MemberProfile")); // Perfil público de membro
const NotFound = lazy(() => import("./pages/NotFound")); // Página 404

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
      {/* Vercel Speed Insights para monitoramento de performance */}
      <SpeedInsights />
      {/* Router principal - habilita navegação entre páginas */}
      <BrowserRouter>
        {/* Container de todas as rotas da aplicação */}
        {/* Fallback neutro: a troca de rota já é quase instantânea em cache. */}
        <Suspense fallback={<div className="min-h-screen bg-kt-paper" aria-busy="true" />}>
          <Routes>
            {/* ROTA INICIAL: landing pública para visitantes, feed para quem já entrou */}
            <Route path="/" element={<Home />} />

            {/* ROTA ESTÁTICA: o feed de descoberta com endereço próprio.
                A landing manda "join the community" para cá, e quem já tem
                sessão cai no mesmo feed pela raiz — as duas portas levam à
                mesma página, sem depender de estar logado para alcançá-la.
                O item "Community" da navegação também aponta para cá. */}
            <Route path="/community" element={<Index />} />

            {/* ROTA ESTÁTICA: Busca e navegação em grade */}
            <Route path="/explore" element={<Explore />} />

            {/* ROTA ESTÁTICA: Perfis salvos pelo usuário */}
            <Route path="/saved" element={<Saved />} />

            {/* ROTA DINÂMICA: Detalhes de perfil por ID específico */}
            <Route path="/profile/:id" element={<ProfileDetail />} />
          
            {/* ROTA DINÂMICA: Perfil de usuário por slug único */}
            <Route path="/user-profile/:slug" element={<UserProfileDetail />} />
          
            {/* ROTA DINÂMICA: Página filtrada por região geográfica */}
            <Route path="/region/:region" element={<RegionPage />} />
            <Route path="/region" element={<Navigate to="/" replace />} />

            {/* ROTA DINÂMICA: Página filtrada por categoria de fenótipo */}
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/category" element={<Navigate to="/" replace />} />
          
            {/* ROTA ESTÁTICA: Fluxo de fenótipos (funcionalidade em desenvolvimento) */}
            <Route path="/phenotype-flow" element={<PhenotypeFlowPage />} />
          
            {/* ROTA ESTÁTICA: Configurações do usuário */}
            <Route path="/settings" element={<Settings />} />
          
            {/* ROTA ESTÁTICA: Página de contato */}
            <Route path="/contact" element={<Contact />} />
          
            {/* ROTA ESTÁTICA: Página de perguntas frequentes */}
            <Route path="/faq" element={<FAQ />} />

            {/* ROTAS ESTÁTICAS: identidade e políticas */}
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          
            {/* ROTA ESTÁTICA: Leaderboard global */}
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* ROTA ESTÁTICA: Página do Origin Game */}
            <Route path="/game" element={<GamePage />} />

            {/* ROTA ESTÁTICA: Escala de atração (noindex — ver AttractionPage) */}
            <Route path="/attraction" element={<AttractionPage />} />

            {/* ROTA DINÂMICA: Perfil público de membro por userId */}
            <Route path="/member/:userId" element={<MemberProfile />} />
          
            {/* ROTA CATCH-ALL: Captura qualquer URL não definida acima e mostra 404 */}
            {/* IMPORTANTE: Esta deve sempre ser a última rota para funcionar corretamente */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Exporta o componente App como padrão para ser usado no main.tsx
export default App;

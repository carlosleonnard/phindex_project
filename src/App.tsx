import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Suspense, lazy } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";

// Lazy-loaded pages for code splitting
const ProfileDetail = lazy(() => import("./pages/ProfileDetail"));
const UserProfileDetail = lazy(() => import("./pages/UserProfileDetail"));
const RegionPage = lazy(() => import("./pages/RegionPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const PhenotypeFlowPage = lazy(() => import("./pages/PhenotypeFlowPage"));
const Settings = lazy(() => import("./pages/Settings"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Analytics />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/profile/:id" element={<ProfileDetail />} />
            <Route path="/user-profile/:slug" element={<UserProfileDetail />} />
            <Route path="/region/:region" element={<RegionPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/phenotype-flow" element={<PhenotypeFlowPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

/**
 * COMPONENTE DE CABEÇALHO PRINCIPAL (Header.tsx)
 * 
 * Este componente renderiza a barra de navegação fixa no topo da aplicação.
 * Inclui logo, barra de busca, botões de ação e menu de usuário.
 * É exibido em todas as páginas da aplicação.
 */

// Ícones do Lucide React (biblioteca de ícones SVG otimizada)
import { Search, HelpCircle, Settings, LogOut, Menu, Trophy, Film, Music, Palette, Brain, Microscope, Briefcase, Building, Skull, Church, Shield, Users, GitBranch, Mail, Award, Gamepad2, Home, Heart, LogIn } from "lucide-react";
// Componentes de UI reutilizáveis do sistema de design
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Link do React Router para navegação sem reload da página
import { Link } from "react-router-dom";
// Modais específicos da aplicação
import { AddProfileModal } from "./AddProfileModal";    // Modal para criar novos perfis
import { LoginModal } from "./LoginModal";              // Modal de autenticação
import { NotificationBell } from "./NotificationBell";  // Componente de notificações
import { UserMenuPopover } from "./UserMenuPopover";        // Menu do usuário com nickname
// Hook do React para estado local e efeitos
import { useState, useEffect, useRef } from "react";
// Hook customizado para gerenciamento de autenticação
import { useAuth } from "@/hooks/use-auth";
// Hook para gerenciamento de perfis de usuário
import { useUserProfiles } from "@/hooks/use-user-profiles";
// Link para navegação entre páginas
import { useNavigate, useLocation } from "react-router-dom";
// Importa logo mobile
import mobileLogo from "@/assets/mobile-logo.png";
// Mapa de slugs de categoria, compartilhado com o sidebar do desktop
import { CATEGORY_SLUG_MAP } from "@/constants/categories";

/**
 * COMPONENTE HEADER
 * 
 * Renderiza a barra de navegação principal com:
 * - Logo clicável que leva à página inicial
 * - Barra de busca global
 * - Botões de ação (adicionar perfil, ajuda, notificações)
 * - Menu de usuário ou botão de login
 */
export const Header = () => {
  // Estado local para controlar abertura/fechamento do modal de login
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // Estado para controlar abertura/fechamento do sidebar mobile/tablet
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Estados para funcionalidade de busca
  const [searchTerm, setSearchTerm] = useState("");        // Termo digitado pelo usuário
  const [searchResults, setSearchResults] = useState<any[]>([]); // Resultados da busca
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Controla se o dropdown está aberto
  const searchRef = useRef<HTMLDivElement>(null);          // Referência para detectar cliques fora
  
  // Hooks para navegação e dados
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { profiles } = useUserProfiles();
  
  // Check for tablet/mobile breakpoint (anything below 1024px gets mobile layout)
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(window.innerWidth < 1024);
  
  useEffect(() => {
    const handleResize = () => {
      setIsTabletOrMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  /**
   * FUNÇÃO DE BUSCA
   * 
   * Filtra os perfis baseado no termo de busca digitado pelo usuário.
   * Busca por nome do perfil (case insensitive).
   */
  const handleSearch = (term: string) => {
    if (!term.trim() || !profiles) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    
    // Filtra perfis que contenham o termo de busca no nome
    const filtered = profiles.filter(profile => 
      profile.name.toLowerCase().includes(term.toLowerCase())
    ).slice(0, 5); // Limita a 5 resultados
    
    setSearchResults(filtered);
    setIsSearchOpen(filtered.length > 0);
  };
  
  /**
   * EFEITO PARA BUSCA COM DEBOUNCE
   * 
   * Implementa um delay na busca para evitar muitas consultas while typing.
   * Executa a busca 300ms após o usuário parar de digitar.
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, profiles]);
  
  /**
   * EFEITO PARA DETECTAR CLIQUES FORA DO DROPDOWN
   * 
   * Fecha o dropdown de sugestões quando o usuário clica fora dele.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  /**
   * FUNÇÃO PARA NAVEGAR PARA PERFIL
   * 
   * Redireciona o usuário para a página de detalhes do perfil selecionado.
   * Usa o slug do perfil para navegar para a rota /user-profile/.
   */
  const handleProfileSelect = (profile: any) => {
    setSearchTerm("");
    setIsSearchOpen(false);
    navigate(`/user-profile/${profile.slug}`);
  };
  
  /**
   * FUNÇÃO DE LOGOUT
   * 
   * Executa o processo de logout do usuário através do Supabase.
   * Limpa a sessão e redireciona para estado não autenticado.
   */
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        {/* Desktop Header */}
        {!isTabletOrMobile && (
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6 lg:w-80 lg:justify-center">
              <div className="flex items-center gap-3">
                <Link to="/" className="cursor-pointer">
                  <img 
                    src="/phindex-uploads/39fe11bc-0ec1-4dad-8877-0789763891df.png" 
                    alt="Phindex Logo" 
                    className="h-12 object-contain"
                  />
                </Link>
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-8 lg:mr-4">
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Look for famous people, characters, athletes..." 
                  className="pl-12 h-12 bg-muted/30 border-border/30 focus:border-primary/50 rounded-full text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm && setIsSearchOpen(searchResults.length > 0)}
                />
                <Button 
                  size="sm" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-primary hover:shadow-button rounded-full"
                  onClick={() => searchTerm && handleSearch(searchTerm)}
                >
                  Search
                </Button>
                
                {/* DROPDOWN DE SUGESTÕES DE BUSCA */}
                {isSearchOpen && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {searchResults.map((profile, index) => (
                      <div
                        key={profile.id}
                        className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0 flex items-center gap-3"
                        onClick={() => handleProfileSelect(profile)}
                      >
                        {/* Imagem do perfil */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                           <img 
                             src={profile.front_image_url} 
                             alt={profile.name}
                             className="w-full h-full object-cover"
                             style={{ width: '40px', height: '38px' }}
                             onError={(e) => {
                               (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        
                        {/* Informações do perfil */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {profile.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {profile.category} • {profile.country}
                          </p>
                        </div>
                        
                        {/* Anonymous profile indicator */}
                        {profile.is_anonymous && (
                          <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Anonymous
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AddProfileModal />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate('/leaderboard')}
                title="Leaderboard"
              >
                <Trophy className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate('/faq')}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              <NotificationBell />
              
              {user ? (
                <UserMenuPopover user={user} />
              ) : (
                <Button 
                  variant="default" 
                  className="bg-phindex-dark hover:bg-phindex-teal transition-all duration-300 rounded-full px-6"
                  onClick={() => setIsLoginModalOpen(true)}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Login
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Mobile/Tablet Header — apenas menu e logo.
            As ações (busca, criar, alertas, perfil) vivem na bottom nav;
            o resto da navegação está no menu sanduíche. */}
        {isTabletOrMobile && (
          <div className="px-4 h-16 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="cursor-pointer">
              <img
                src={mobileLogo}
                alt="Phindex Logo"
                className="h-8 object-contain"
              />
            </Link>
          </div>
        )}
      </header>

      {/* Mobile/Tablet Sidebar Overlay */}
      {isTabletOrMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className="fixed left-0 top-0 h-full w-80 bg-card border-r border-border overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Close button */}
              <div className="flex justify-end mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  ✕
                </Button>
              </div>
              
              {/* Sidebar content */}
              <MobileSidebarContent
                onNavigate={() => setIsSidebarOpen(false)}
                onRequestLogin={() => {
                  setIsSidebarOpen(false);
                  setIsLoginModalOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <LoginModal 
        open={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen} 
      />
    </>
  );
};

/**
 * COMPONENTE MOBILE SIDEBAR CONTENT
 *
 * Espelha o AppSidebar do desktop: os mesmos destinos principais, regiões,
 * categorias e links de "more info", para que nada só exista no desktop.
 */
const MobileSidebarContent = ({
  onNavigate,
  onRequestLogin,
}: {
  onNavigate: () => void;
  onRequestLogin: () => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const nav = (path: string) => {
    navigate(path);
    onNavigate();
  };

  const regionSlugOf = (region: string) =>
    region.toLowerCase()
      .replace(/\s+/g, '-')
      .replace('á', 'a')
      .replace('é', 'e')
      .replace('í', 'i')
      .replace('ó', 'o')
      .replace('ú', 'u')
      .replace('ã', 'a')
      .replace('õ', 'o')
      .replace('ç', 'c');

  const categorySlugOf = (category: string) =>
    CATEGORY_SLUG_MAP[category] || category.toLowerCase().replace(/\s+/g, '-');

  const handleRegionClick = (region: string) => nav(`/region/${regionSlugOf(region)}`);
  const handleCategoryClick = (category: string) => nav(`/category/${categorySlugOf(category)}`);

  const isRegionActive = (region: string) => location.pathname === `/region/${regionSlugOf(region)}`;
  const isCategoryActive = (category: string) => location.pathname === `/category/${categorySlugOf(category)}`;

  /** Item de navegação com o mesmo tratamento visual do sidebar desktop. */
  const navButton = (
    Icon: typeof Home,
    label: string,
    path: string,
    opts?: { compact?: boolean }
  ) => {
    const isActive = location.pathname === path;
    return (
      <button
        key={path}
        className={`flex items-center w-full text-left rounded-lg transition-colors ${
          opts?.compact ? 'gap-3 px-3 py-2.5' : 'gap-4 p-3'
        } ${
          isActive
            ? 'bg-phindex-teal/10 text-phindex-teal'
            : 'hover:bg-muted/50'
        }`}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => nav(path)}
      >
        <Icon className="h-5 w-5 shrink-0" color={isActive ? undefined : '#007a75'} />
        <span className="text-base">{label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {/* Destinos principais — iguais aos do desktop */}
      <nav aria-label="Discover">
        <div className="space-y-1">
          {navButton(Home, 'Home', '/', { compact: true })}
          {navButton(Search, 'Explore', '/explore', { compact: true })}
          {navButton(Gamepad2, 'Guess the phenotype', '/game', { compact: true })}
          {navButton(Heart, 'Saved', '/saved', { compact: true })}
        </div>
      </nav>

      <div className="border-t border-border/50"></div>

      {/* Phenotype Regions */}
      <div>
        <h3 className="text-xl font-semibold mb-6 text-phindex-dark">PHENOTYPE REGION</h3>
        <div className="grid grid-cols-2 gap-3">
          {["Africa", "Asia", "Europe", "Americas", "Middle East", "Oceania"].map((region) => (
            <Button
              key={region}
              variant={isRegionActive(region) ? "default" : "outline"}
              size="sm"
              className="text-sm py-3 px-4 h-auto whitespace-nowrap overflow-hidden text-ellipsis"
              onClick={() => handleRegionClick(region)}
              title={region}
            >
              {region === "Middle East" ? "M.E" : region}
            </Button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-xl font-semibold mb-6 text-phindex-dark">CATEGORIES</h3>
        <div className="space-y-4">
          {/* Community */}
          <button
            className={`flex items-center gap-4 w-full text-left p-3 rounded-lg transition-colors ${
              isCategoryActive("Community")
                ? "bg-phindex-teal/10 text-phindex-teal border border-phindex-teal/20"
                : "hover:bg-muted/50"
            }`}
            onClick={() => handleCategoryClick("Community")}
          >
            <Users className="h-5 w-5" style={{ color: 'hsl(var(--category-primary))' }} />
            <span className="text-base">Community</span>
          </button>

          <div className="border-t border-border/30 my-4"></div>

          {[
            { Icon: Film, name: "Pop Culture" },
            { Icon: Music, name: "Music and Entertainment" },
            { Icon: Palette, name: "Arts" },
            { Icon: Brain, name: "Philosophy" },
            { Icon: Microscope, name: "Sciences" },
            { Icon: Trophy, name: "Sports" },
            { Icon: Briefcase, name: "Business" },
            { Icon: Building, name: "Politics" },
            { Icon: Skull, name: "Criminals" },
            { Icon: Church, name: "Religion" },
            { Icon: Shield, name: "Military" },
          ].map((category) => {
            const isActive = isCategoryActive(category.name);
            return (
              <button
                key={category.name}
                className={`flex items-center gap-4 w-full text-left p-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-phindex-teal/10 text-phindex-teal border border-phindex-teal/20"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleCategoryClick(category.name)}
              >
                <category.Icon className="h-5 w-5" color="#007a75" />
                <span className="text-base">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border/50"></div>

      {/* More Info */}
      <div>
        <h3 className="text-xl font-semibold mb-6 text-phindex-dark">MORE INFO</h3>
        <div className="space-y-4">
          {navButton(Award, 'Leaderboard', '/leaderboard')}
          {navButton(GitBranch, 'Phenotype Flow', '/phenotype-flow')}
          {navButton(Mail, 'Contact', '/contact')}
          {navButton(HelpCircle, 'FAQ', '/faq')}
          {user && navButton(Settings, 'Settings', '/settings')}

          {user ? (
            <button
              className="flex items-center gap-4 w-full text-left p-3 rounded-lg transition-colors hover:bg-destructive/10 text-destructive hover:text-destructive"
              onClick={() => { signOut(); onNavigate(); }}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-base">Logout</span>
            </button>
          ) : (
            <button
              className="flex items-center gap-4 w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50"
              onClick={onRequestLogin}
            >
              <LogIn className="h-5 w-5" color="#007a75" />
              <span className="text-base">Login</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * COMPONENTE DE CABEÇALHO PRINCIPAL (Header.tsx)
 * 
 * Este componente renderiza a barra de navegação fixa no topo da aplicação.
 * Inclui logo, barra de busca, botões de ação e menu de usuário.
 * É exibido em todas as páginas da aplicação.
 */

// Ícones do Lucide React (biblioteca de ícones SVG otimizada)
import { Search, User, Bell, Plus, HelpCircle, Settings, LogOut, Menu, Trophy } from "lucide-react";
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
// Componentes de avatar para imagem do usuário
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// Popover para menu dropdown do usuário
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// Hook do React para estado local e efeitos
import { useState, useEffect, useRef } from "react";
// Hook customizado para gerenciamento de autenticação
import { useAuth } from "@/hooks/use-auth";
// Hook para gerenciamento de perfis de usuário
import { useUserProfiles } from "@/hooks/use-user-profiles";
// Link para navegação entre páginas
import { useNavigate, useLocation } from "react-router-dom";
// Hook para detectar dispositivos móveis
import { useIsMobile } from "@/hooks/use-mobile";
// Importa logo mobile
import mobileLogo from "@/assets/mobile-logo.png";

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
  // Estado para controlar abertura do modal de adicionar perfil
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  
  // Estados para funcionalidade de busca
  const [searchTerm, setSearchTerm] = useState("");        // Termo digitado pelo usuário
  const [searchResults, setSearchResults] = useState<any[]>([]); // Resultados da busca
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Controla se o dropdown está aberto
  const [isSearchExpanded, setIsSearchExpanded] = useState(false); // Controla expansão da busca no mobile
  const searchRef = useRef<HTMLDivElement>(null);          // Referência para detectar cliques fora
  
  // Hooks para navegação e dados
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { profiles } = useUserProfiles();
  const isMobile = useIsMobile();
  
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

  /**
   * FUNÇÃO PARA ENVIAR BUSCA COM ENTER
   * 
   * Permite buscar pressionando Enter no campo de busca mobile/tablet.
   */
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      handleSearch(searchTerm);
    }
  };

  /**
   * FUNÇÃO PARA ABRIR MODAL DE ADICIONAR PERFIL
   * 
   * Abre o modal de classificação com guidelines e criação de perfis.
   */
  const handleAddProfileClick = () => {
    setIsAddProfileOpen(true);
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

        {/* Mobile/Tablet Header */}
        {isTabletOrMobile && (
          <div className="px-4 h-16 flex items-center justify-between">
            {/* Left side - Menu button and Logo */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="h-8 w-8"
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

            {/* Center - Search (expandable) */}
            <div className="flex-1 mx-4">
              {!isSearchExpanded ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchExpanded(true)}
                  className="w-full h-10 bg-muted/30 rounded-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              ) : (
                <div className="relative" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-10 h-10 bg-muted/30 border-border/30 focus:border-primary/50 rounded-full text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    onBlur={() => {
                      if (!searchTerm) setIsSearchExpanded(false);
                    }}
                    autoFocus
                  />
                  
                  {/* DROPDOWN DE SUGESTÕES DE BUSCA MOBILE */}
                  {isSearchOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {searchResults.map((profile, index) => (
                        <div
                          key={profile.id}
                          className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0 flex items-center gap-3"
                          onClick={() => {
                            handleProfileSelect(profile);
                            setIsSearchExpanded(false);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                             <img 
                               src={profile.front_image_url} 
                               alt={profile.name}
                               className="w-full h-full object-cover"
                               onError={(e) => {
                                 (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate text-sm">
                              {profile.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {profile.category}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right side - Add button, Leaderboard, Notifications, User */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddProfileClick}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/leaderboard')}
                className="h-8 w-8"
                title="Leaderboard"
              >
                <Trophy className="h-4 w-4" />
              </Button>
              
              <NotificationBell />
              
              {user ? (
                <UserMenuPopover user={user} />
              ) : (
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLoginModalOpen(true)}
                  disabled={loading}
                  className="h-8 w-8"
                >
                  <User className="h-4 w-4" />
                </Button>
              )}
            </div>
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
              <MobileSidebarContent onNavigate={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Add Profile Modal - para mobile/tablet controlado externamente */}
      {isTabletOrMobile && (
        <AddProfileModal 
          triggerExternal={isAddProfileOpen}
          onTriggerExternalChange={(value) => setIsAddProfileOpen(value)}
        />
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
 * Renderiza o conteúdo do sidebar mobile com navegação.
 */
const MobileSidebarContent = ({ onNavigate }: { onNavigate: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleRegionClick = (region: string) => {
    const regionSlug = region.toLowerCase()
      .replace(/\s+/g, '-')
      .replace('á', 'a')
      .replace('é', 'e')
      .replace('í', 'i')
      .replace('ó', 'o')
      .replace('ú', 'u')
      .replace('ã', 'a')
      .replace('õ', 'o')
      .replace('ç', 'c');
    
    navigate(`/region/${regionSlug}`);
    onNavigate();
  };

  const handleCategoryClick = (category: string) => {
    const categoryMapping: Record<string, string> = {
      "Community": "community",
      "Pop Culture": "pop-culture",
      "Music and Entertainment": "music-and-entertainment",
      "Arts": "arts",
      "Philosophy": "philosophy",
      "Sciences": "sciences",
      "Sports": "sports",
      "Business": "business",
      "Politics": "politics",
      "Criminals": "criminals",
      "Religion": "religion",
      "Military": "military"
    };
    const categorySlug = categoryMapping[category] || category.toLowerCase().replace(/\s+/g, '-');
    navigate(`/category/${categorySlug}`);
    onNavigate();
  };

  const isRegionActive = (region: string) => {
    const regionSlug = region.toLowerCase()
      .replace(/\s+/g, '-')
      .replace('á', 'a')
      .replace('é', 'e')
      .replace('í', 'i')
      .replace('ó', 'o')
      .replace('ú', 'u')
      .replace('ã', 'a')
      .replace('õ', 'o')
      .replace('ç', 'c');
    
    return location.pathname === `/region/${regionSlug}`;
  };

  const isCategoryActive = (category: string) => {
    const categoryMapping: Record<string, string> = {
      "Community": "community",
      "Pop Culture": "pop-culture",
      "Music and Entertainment": "music-and-entertainment",
      "Arts": "arts",
      "Philosophy": "philosophy",
      "Sciences": "sciences",
      "Sports": "sports",
      "Business": "business",
      "Politics": "politics",
      "Criminals": "criminals",
      "Religion": "religion",
      "Military": "military"
    };
    const categorySlug = categoryMapping[category] || category.toLowerCase().replace(/\s+/g, '-');
    return location.pathname === `/category/${categorySlug}`;
  };

  return (
    <div className="space-y-6">
      {/* Phenotype Regions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-phindex-dark">PHENOTYPE REGION</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Africa", "Asia", "Europe", "Americas",
            "Middle East", "Oceania"
          ].map((region) => (
            <Button
              key={region}
              variant={isRegionActive(region) ? "default" : "outline"}
              size="sm"
              className="text-xs py-2 px-3 h-auto"
              onClick={() => handleRegionClick(region)}
            >
              {region === "Middle East" ? "M.E" : region}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-phindex-dark">CATEGORIES</h3>
        <div className="space-y-2">
          {[
            { icon: "👥", name: "Community" },
            { icon: "🎬", name: "Pop Culture" },
            { icon: "🎵", name: "Music and Entertainment" },
            { icon: "🎨", name: "Arts" },
            { icon: "🧠", name: "Philosophy" },
            { icon: "🔬", name: "Sciences" },
            { icon: "🏆", name: "Sports" },
            { icon: "💼", name: "Business" },
            { icon: "🏛️", name: "Politics" },
            { icon: "🔪", name: "Criminals" },
            { icon: "⛪", name: "Religion" },
            { icon: "🎖️", name: "Military" }
          ].map((category) => (
            <button
              key={category.name}
              className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors text-sm ${
                isCategoryActive(category.name) 
                  ? "bg-phindex-teal/10 text-phindex-teal border border-phindex-teal/20" 
                  : "hover:bg-muted/50"
              }`}
              onClick={() => handleCategoryClick(category.name)}
            >
              <span className="text-base">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* More Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-phindex-dark">MORE INFO</h3>
        <div className="space-y-2">
          <button
            className="flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 text-sm"
            onClick={() => {
              navigate('/leaderboard');
              onNavigate();
            }}
          >
            <span className="text-base">🏆</span>
            <span>Leaderboard</span>
          </button>
          
          <button
            className="flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 text-sm"
            onClick={() => {
              navigate('/phenotype-flow');
              onNavigate();
            }}
          >
            <span className="text-base">🌊</span>
            <span>Phenotype Flow</span>
          </button>
          
          <button
            className="flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 text-sm"
            onClick={() => {
              navigate('/contact');
              onNavigate();
            }}
          >
            <span className="text-base">📧</span>
            <span>Contact</span>
          </button>
          
          <button
            className="flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 text-sm"
            onClick={() => {
              navigate('/faq');
              onNavigate();
            }}
          >
            <span className="text-base">❓</span>
            <span>FAQ</span>
          </button>
          
          <button
            className="flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors hover:bg-destructive/10 text-destructive text-sm"
            onClick={() => {
              signOut();
              onNavigate();
            }}
          >
            <span className="text-base">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
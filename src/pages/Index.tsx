/**
 * PÁGINA INICIAL DA APLICAÇÃO (Index.tsx)
 *
 * Esta é a página principal (home) da aplicação Phindex.
 * Exibe três seções principais:
 * 1. Celebridades populares (mais votadas)
 * 2. Perfis de usuário mais votados
 * 3. Perfis recentes da comunidade
 *
 * Cada seção utiliza carousels horizontais para navegação.
 */

// Ícone de voto da biblioteca Lucide React
import { Vote, Plus } from "lucide-react";
import { useState } from "react";
// Componentes de layout da aplicação
import { Header } from "@/components/Header"; // Cabeçalho fixo
import { Footer } from "@/components/Footer"; // Rodapé
import { AppSidebar } from "@/components/AppSidebar"; // Barra lateral de navegação
import { AddProfileModal } from "@/components/AddProfileModal"; // Modal de criação de perfil
// Hook customizado para gerenciar perfis de usuário
import { useUserProfiles } from "@/hooks/use-user-profiles";
// Componentes de UI do sistema de design
import { Card } from "@/components/ui/card"; // Cards para layout
import { Badge } from "@/components/ui/badge"; // Badges para indicadores
import { Button } from "@/components/ui/button"; // Botões
// Componentes de carousel para navegação horizontal
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator"; // Separadores visuais
// Hook para navegação programática entre páginas
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { profiles: userProfiles, profilesByVotes } = useUserProfiles();
  const [showCelebrityModal, setShowCelebrityModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Mapeamento de códigos de países para códigos de 3 letras
  const countryCodes: Record<string, string> = {
    US: "USA",
    BR: "BRA",
    IN: "IND",
    IL: "ISR",
    ES: "ESP",
    NG: "NGA",
    FR: "FRA",
    DE: "DEU",
    IT: "ITA",
    JP: "JPN",
    CN: "CHN",
    KR: "KOR",
    MX: "MEX",
    CA: "CAN",
    AU: "AUS",
    GB: "GBR",
    RU: "RUS",
    AR: "ARG",
    EG: "EGY",
    ZA: "ZAF",
  };

  const handleRegionClick = (region: string) => {
    // Converter nome da região para URL slug
    const regionSlug = region
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace("á", "a")
      .replace("é", "e")
      .replace("í", "i")
      .replace("ó", "o")
      .replace("ú", "u")
      .replace("ã", "a")
      .replace("õ", "o")
      .replace("ç", "c");

    navigate(`/region/${regionSlug}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 overflow-x-hidden">
      <Header />

      <div className="container px-4 max-w-none">
        <div className="lg:ml-80 pt-20">
          {/* Sidebar */}
          <AppSidebar />

          {/* Main Content */}
          <div className="bg-slate-100">{/* Popular Celebrities Section */}
            <div className="mb-12">
              <div className="relative p-6">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                        <Vote className="h-4 w-4 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">Popular Celebrities</h2>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => setShowCelebrityModal(true)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use Phindex to discover and classify the most voted public figures in our phenotype community
                  </p>

                  <Carousel className="w-full" opts={{ align: "start", loop: false }}>
                    <div className="relative group">
                      <CarouselContent className="ml-0">
                        {(profilesByVotes?.filter((profile) => !profile.is_anonymous) || [])
                          .slice(0, 12)
                          .map((profile, index) => (
                            <CarouselItem key={profile.id} className="pl-1 basis-1/10">
                              <div className="flex-shrink-0 group/item">
                                <div
                                  className="cursor-pointer"
                                  onClick={() => navigate(`/user-profile/${profile.slug}`)}
                                >
                                  <div className="flex flex-col items-center p-1 rounded-lg hover:bg-accent/50 transition-colors">
                                    <div className="relative mb-1">
                                      <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-primary cursor-pointer bg-primary/10 flex items-center justify-center">
                                        <img
                                          src={profile.front_image_url}
                                          alt={profile.name}
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      </div>
                                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Vote className="h-2.5 w-2.5" />
                                        <span className="text-xs">{(profile as any).vote_count || 0}</span>
                                      </div>
                                      <div
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs bg-background/80 px-1 py-0.5 rounded max-w-[9rem] truncate"
                                        title={(profile as any).most_voted_phenotype || ""}
                                      >
                                        {(profile as any).most_voted_phenotype || "—"}
                                      </div>
                                      {index < 3 && (
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                          #{index + 1}
                                        </div>
                                      )}
                                    </div>
                                    <h3 className="font-medium text-foreground mb-0.5 text-center text-xs">
                                      {profile.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-center">{profile.category}</p>
                                  </div>
                                </div>
                              </div>
                            </CarouselItem>
                          ))}
                      </CarouselContent>
                      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background border-0" />
                      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background border-0" />
                    </div>
                  </Carousel>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="px-6 mb-8">
              <Separator className="bg-border" />
            </div>

            {/* Recent Celebrities Section */}
            <div className="mb-12">
              <div className="relative p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                      <Vote className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Recent Celebrities</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Most recently added celebrities to our Phenotype Index
                  </p>

                  <Carousel className="w-full" opts={{ align: "start", loop: false }}>
                    <div className="relative group">
                      <CarouselContent className="ml-0">
                        {(
                          userProfiles
                            ?.filter((profile) => !profile.is_anonymous)
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []
                        )
                          .slice(0, 12)
                          .map((profile, index) => (
                            <CarouselItem key={profile.id} className="pl-1 basis-1/10">
                              <div className="flex-shrink-0 group/item">
                                <div
                                  className="cursor-pointer"
                                  onClick={() => navigate(`/user-profile/${profile.slug}`)}
                                >
                                  <div className="flex flex-col items-center p-1 rounded-lg hover:bg-accent/50 transition-colors">
                                    <div className="relative mb-1">
                                      <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-primary cursor-pointer bg-primary/10 flex items-center justify-center">
                                        <img
                                          src={profile.front_image_url}
                                          alt={profile.name}
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      </div>
                                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Vote className="h-2.5 w-2.5" />
                                        <span className="text-xs">{(profile as any).vote_count || 0}</span>
                                      </div>
                                      <div
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs bg-background/80 px-1 py-0.5 rounded max-w-[9rem] truncate"
                                        title={(profile as any).most_voted_phenotype || ""}
                                      >
                                        {(profile as any).most_voted_phenotype || "—"}
                                      </div>
                                    </div>
                                    <h3 className="font-medium text-foreground mb-0.5 text-center text-xs">
                                      {profile.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-center">{profile.category}</p>
                                  </div>
                                </div>
                              </div>
                            </CarouselItem>
                          ))}
                      </CarouselContent>
                      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background border-0" />
                      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background border-0" />
                    </div>
                  </Carousel>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="px-6 mb-8">
              <Separator className="bg-border" />
            </div>

            {/* Top User Profiles Section */}
            <div className="mb-12">
              <div className="relative p-6">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                        <Vote className="h-4 w-4 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">Top User Profiles</h2>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => setShowUserModal(true)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Most voted user-created profiles in our Phenotype Index
                  </p>

                  <Carousel className="w-full" opts={{ align: "start", loop: false }}>
                    <div className="relative group">
                      <CarouselContent className="ml-0">
                        {(profilesByVotes?.filter((profile) => profile.category === "User Profiles") || [])
                          .slice(0, 12)
                          .map((profile, index) => (
                            <CarouselItem key={profile.id} className="pl-1 basis-1/10">
                              <div className="flex-shrink-0 group/item">
                                <div
                                  className="cursor-pointer"
                                  onClick={() => navigate(`/user-profile/${profile.slug}`)}
                                >
                                  <div className="flex flex-col items-center p-1 rounded-lg hover:bg-accent/50 transition-colors">
                                    <div className="relative mb-1">
                                      <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-primary cursor-pointer bg-primary/10 flex items-center justify-center">
                                        <img
                                          src={profile.front_image_url}
                                          alt={profile.name}
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      </div>
                                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Vote className="h-2.5 w-2.5" />
                                        <span className="text-xs">{(profile as any).vote_count || 0}</span>
                                      </div>
                                      <div
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs bg-background/80 px-1 py-0.5 rounded max-w-[9rem] truncate"
                                        title={(profile as any).most_voted_phenotype || ""}
                                      >
                                        {(profile as any).most_voted_phenotype || "—"}
                                      </div>
                                      {index < 3 && (
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                          #{index + 1}
                                        </div>
                                      )}
                                    </div>
                                    <h3 className="font-medium text-foreground mb-0.5 text-center text-xs">
                                      {profile.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-center">
                                      {(profile as any).most_voted_phenotype || profile.category}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CarouselItem>
                          ))}
                      </CarouselContent>
                      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background border-0" />
                      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background border-0" />
                    </div>
                  </Carousel>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="px-6 mb-8">
              <Separator className="bg-border" />
            </div>

            {/* Recent Profiles Section */}
            <div className="mb-12">
              <div className="relative p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                      <Vote className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Recent Profiles</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Latest community profiles added to the Phenotype Index
                  </p>

                  <Carousel className="w-full" opts={{ align: "start", loop: false }}>
                    <div className="relative group">
                      <CarouselContent className="ml-0">
                        {(userProfiles?.filter((profile) => profile.is_anonymous) || [])
                          .slice(0, 12)
                          .map((profile, index) => (
                            <CarouselItem key={profile.id} className="pl-1 basis-1/10">
                              <div className="flex-shrink-0 group/item">
                                <div
                                  className="cursor-pointer"
                                  onClick={() => navigate(`/user-profile/${profile.slug}`)}
                                >
                                  <div className="flex flex-col items-center p-1 rounded-lg hover:bg-accent/50 transition-colors">
                                    <div className="relative mb-1">
                                      <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-primary cursor-pointer bg-primary/10 flex items-center justify-center">
                                        <img
                                          src={profile.front_image_url}
                                          alt={profile.name}
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      </div>
                                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Vote className="h-2.5 w-2.5" />
                                        <span className="text-xs">{(profile as any).vote_count || 0}</span>
                                      </div>
                                      <div
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs bg-background/80 px-1 py-0.5 rounded max-w-[9rem] truncate"
                                        title={(profile as any).most_voted_phenotype || ""}
                                      >
                                        {(profile as any).most_voted_phenotype || "—"}
                                      </div>
                                    </div>
                                    <h3 className="font-medium text-foreground mb-0.5 text-center text-xs">
                                      {profile.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-center">
                                      {(profile as any).most_voted_phenotype || profile.category}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CarouselItem>
                          ))}
                      </CarouselContent>
                      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background border-0" />
                      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background border-0" />
                    </div>
                  </Carousel>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Modals */}
      <AddProfileModal
        triggerExternal={showCelebrityModal}
        onTriggerExternalChange={setShowCelebrityModal}
        initialIsAnonymous={false}
        lockIsAnonymous={true}
      />
      <AddProfileModal
        triggerExternal={showUserModal}
        onTriggerExternalChange={setShowUserModal}
        initialIsAnonymous={true}
        lockIsAnonymous={true}
      />
    </div>
  );
};

export default Index;

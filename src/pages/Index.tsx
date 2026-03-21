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
import { Helmet } from "react-helmet-async";
import { useState } from "react";
// Componentes de layout da aplicação
import { Header } from "@/components/Header"; // Cabeçalho fixo
import { Footer } from "@/components/Footer"; // Rodapé
import { AppSidebar } from "@/components/AppSidebar"; // Barra lateral de navegação
import { AddProfileModal } from "@/components/AddProfileModal"; // Modal de criação de perfil
import { StatsBanner } from "@/components/StatsBanner"; // Banner de estatísticas
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

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Phindex - Phenotype Index",
    "url": "https://www.phenotypeindex.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.phenotypeindex.com/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 overflow-x-hidden">
      <Helmet>
        <title>Phindex - Phenotype Index | Discover Human Phenotypes, Ancestry &amp; Physical Traits</title>
        <meta name="description" content="Explore and classify human phenotypes from around the world. Discover European, African, Asian, American and Middle Eastern phenotypes. Vote on physical characteristics like skin color, hair texture, eye color, body type and more." />
        <meta name="keywords" content="phenotype, phenotypes, what is my phenotype, european phenotype, african phenotype, asian phenotype, american phenotype, ancestry, genotype, dna, human physical traits, phenotype classification, phenotype index, skin color, hair texture, eye color, body type, facial features, nasal breadth, jaw type, head type" />
        <link rel="canonical" href="https://www.phenotypeindex.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Phindex - Phenotype Index" />
        <meta property="og:description" content="Explore and classify human phenotypes from around the world." />
        <meta property="og:image" content="https://www.phenotypeindex.com/phindex-uploads/39fe11bc-0ec1-4dad-8877-0789763891df.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://www.phenotypeindex.com" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content="Phindex - Phenotype Index" />
        <meta name="twitter:description" content="Explore and classify human phenotypes from around the world." />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/phindex-uploads/39fe11bc-0ec1-4dad-8877-0789763891df.png" />
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>
      <Header />

      <div className="container px-4 max-w-none">
        <div className="lg:ml-80 pt-20">
          {/* Sidebar */}
          <AppSidebar />

          {/* Stats Banner */}
          <StatsBanner />

          {/* Main Content */}
          <div className="bg-slate-100">
            {/* Popular Celebrities Section */}
            <div className="mb-6">
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
                                       <div className="w-36 h-36 rounded-lg overflow-hidden border-2 border-primary cursor-pointer bg-primary/10 flex items-center justify-center">
                                          <img
                                            src={profile.front_image_url}
                                            alt={profile.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover"
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
                                    <h3 className="font-medium text-foreground mb-0.5 text-center text-xs w-36 truncate" title={profile.name}>
                                      {profile.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-center w-36 truncate">{profile.category}</p>
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

            {/* Recent Celebrities Section */}
            <div className="mb-6">
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
                                       <div className="w-36 h-36 rounded-lg overflow-hidden border-2 border-primary cursor-pointer bg-primary/10 flex items-center justify-center">
                                          <img
                                            src={profile.front_image_url}
                                            alt={profile.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover"
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
                                    <h3 className="font-medium text-foreground mb-0.5 text-center text-xs w-36 truncate" title={profile.name}>
                                      {profile.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-center w-36 truncate">{profile.category}</p>
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
            <div className="mb-6">
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
                                       <div className="w-36 h-36 rounded-lg overflow-hidden border-2 border-primary cursor-pointer bg-primary/10 flex items-center justify-center">
                                          <img
                                            src={profile.front_image_url}
                                            alt={profile.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover"
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
                                       <div className="w-36 h-36 rounded-lg overflow-hidden border-2 border-primary cursor-pointer bg-primary/10 flex items-center justify-center">
                                         <img
                                           src={profile.front_image_url}
                                           alt={profile.name}
                                           className="w-full h-full object-cover"
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

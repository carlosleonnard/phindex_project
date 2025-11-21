import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MessageSquare, Vote, BarChart, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { CommentsSection } from "@/components/CommentsSection";
import { Breadcrumbs } from "@/components/Breadcrumbs";

import { VoteModal } from "@/components/VoteModal";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useVoting } from "@/hooks/use-voting";
import { useComments } from "@/hooks/use-comments";
import { usePhysicalVoting } from "@/hooks/use-physical-voting";
import { useGeographicVoting } from "@/hooks/use-geographic-voting";
import { useGeographicVoteCounts } from "@/hooks/use-geographic-vote-counts";
import { PhysicalCharacteristicVoting } from "@/components/PhysicalCharacteristicVoting";
import { useProfileCreator } from "@/hooks/use-profile-creator";

interface Vote {
  classification: string;
  count: number;
  percentage: number;
  category: 'primary' | 'secondary' | 'tertiary';
}

interface CharacteristicVote {
  option: string;
  count: number;
  percentage: number;
}

interface PhysicalCharacteristic {
  name: string;
  votes: CharacteristicVote[];
}

interface Profile {
  id: string;
  name: string;
  age: number;
  gender: string;
  height: string;
  location?: string; // Made optional for privacy - only shown to profile owner
  description?: string; // Made optional for privacy - only shown to profile owner
  frontImage: string;
  sideImage: string;
  phenotype: string;
  hairColor: string;
  hairTexture: string;
  skin: string;
  region: string;
  nasalIndex: string;
  cephalicIndex: string;
  eyeFolds: string;
  likes: number;
  comments: number;
  votes: Vote[];
  physicalCharacteristics: PhysicalCharacteristic[];
  category: string;
}



export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  
  const { user } = useAuth();
  
  // Fetch profile data
  const { data: profile } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });
  
  const { votes: realVotes, castVote, changeVote, hasUserVoted, userVote } = useVoting(id || '');
  const { comments: realComments, addComment, likeComment, deleteComment } = useComments(id || '');
  const { characteristics: physicalCharacteristics, userVotes: physicalUserVotes, castVote: castPhysicalVote } = usePhysicalVoting(id || '');
  const { userGeographicVotes, castGeographicVote, refetchVotes: refetchGeographicVotes } = useGeographicVoting(id || '');
  const { geographicVotes, phenotypeVotes, refetchVoteCounts } = useGeographicVoteCounts(id || '');
  const { data: profileCreator } = useProfileCreator(id || '');


  const isProfileOwner = user && profile && user.id === `user_${profile.id}`;
  
  // Filter sensitive data for non-owners
  const sanitizedProfile = profile ? {
    ...profile,
    location: isProfileOwner ? profile.country : undefined,
    description: isProfileOwner ? profile.ancestry : undefined
  } : null;

  if (!sanitizedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-phindex-dark/20">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Profile not found</h1>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-phindex-dark/20 flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="lg:ml-80 pt-20">
          {/* Sidebar */}
          <AppSidebar />

          {/* Botão de voltar fixo acima do perfil */}
          <div className="mb-6">
            <Breadcrumbs 
              items={[
                { label: 'Profiles', href: '/' },
                { label: sanitizedProfile.name }
              ]}
              className="mb-4"
            />
            <Button 
              onClick={() => navigate("/")} 
              variant="secondary"
              size="sm"
              className="bg-card/95 backdrop-blur-sm border border-border/50 hover:bg-card shadow-lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>

          {/* Main Content */}
          <div>
            {/* Profile Images and Basic Info - Full width */}
            <Card className="bg-gradient-card border-phindex-teal/20 mb-6">
              <CardContent className="p-6">
                <div className="text-center">
                  {/* Carrossel de fotos */}
                  <div className="max-w-md mx-auto mb-4">
                    <Carousel className="w-full">
                      <CarouselContent>
                        <CarouselItem>
                          <div className="text-center">
                            <img 
                              src={sanitizedProfile.front_image_url} 
                              alt={`${sanitizedProfile.name} - frente`}
                              className="w-full max-w-sm mx-auto rounded-lg"
                            />
                            <p className="text-xs text-muted-foreground mt-2">Frente</p>
                          </div>
                        </CarouselItem>
                        <CarouselItem>
                          <div className="text-center">
                            <img 
                              src={sanitizedProfile.profile_image_url || sanitizedProfile.front_image_url} 
                              alt={`${sanitizedProfile.name} - perfil`}
                              className="w-full max-w-sm mx-auto rounded-lg"
                            />
                            <p className="text-xs text-muted-foreground mt-2">Perfil</p>
                          </div>
                        </CarouselItem>
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  </div>
                  <h1 className="text-2xl font-bold text-phindex-teal mb-2">
                    {sanitizedProfile.name}
                  </h1>
                  
                  {/* Pop Culture Badge */}
                  <div className="flex justify-center mb-3">
                    <Badge 
                      variant="secondary" 
                      className="bg-phindex-teal/10 text-phindex-teal hover:bg-phindex-teal/20 cursor-pointer transition-colors"
                      onClick={() => navigate(`/category/${sanitizedProfile.category.toLowerCase().replace(' ', '-')}`)}
                    >
                      {sanitizedProfile.category}
                    </Badge>
                  </div>
                  
                  {/* General Phenotypes - Real Data */}
                  <div className="flex justify-center gap-2 mb-3 flex-wrap">
                    {[
                      { label: '1º', votes: geographicVotes['Primary Geographic'] },
                      { label: '2º', votes: geographicVotes['Secondary Geographic'] },
                      { label: '3º', votes: geographicVotes['Tertiary Geographic'] }
                    ].map((category, index) => {
                      const topVote = category.votes?.[0];
                      if (!topVote) return null;
                      
                      return (
                        <Badge 
                          key={`${category.label}-${topVote.classification}`}
                          variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}
                          className={
                            index === 0 ? "bg-phindex-teal text-white font-medium shadow-md" :
                            index === 1 ? "bg-phindex-teal/60 text-white font-medium" :
                            "bg-phindex-teal/30 text-phindex-teal border-phindex-teal/40 font-medium"
                          }
                        >
                          {category.label} {topVote.classification}
                        </Badge>
                      );
                    }).filter(Boolean)}
                  </div>
                  
                  {/* Phenotype Badges - Real Data */}
                  <div className="flex justify-center gap-2 mb-4 flex-wrap">
                    {[
                      { label: '1º', votes: phenotypeVotes['Primary Phenotype'] },
                      { label: '2º', votes: phenotypeVotes['Secondary Phenotype'] },
                      { label: '3º', votes: phenotypeVotes['Tertiary Phenotype'] }
                    ].map((category, index) => {
                      const topVote = category.votes?.[0];
                      if (!topVote) return null;
                      
                      return (
                        <Badge 
                          key={`${category.label}-${topVote.classification}`}
                          variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}
                          className={
                            index === 0 ? "bg-phindex-teal text-white font-medium shadow-md" :
                            index === 1 ? "bg-phindex-teal/60 text-white font-medium" :
                            "bg-phindex-teal/30 text-phindex-teal border-phindex-teal/40 font-medium"
                          }
                        >
                          {category.label} {topVote.classification}
                        </Badge>
                      );
                    }).filter(Boolean)}
                  </div>
                  
                  <p className="text-muted-foreground mb-2">
                    {sanitizedProfile.gender} • {sanitizedProfile.height}cm • {sanitizedProfile.category}
                  </p>
                  
                  {/* Location - Only show to profile owner */}
                  {sanitizedProfile.location && (
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{sanitizedProfile.location}</span>
                    </div>
                  )}
                  
                  {/* Ancestry Description - Show to everyone now */}
                  {sanitizedProfile.description && (
                    <div className="mb-6 p-3 bg-gradient-to-br from-border/20 to-border/10 border border-border/40 rounded-xl shadow-sm">
                      <div className="p-4 bg-muted/30 rounded-lg text-left">
                        <h3 className="text-sm font-semibold text-phindex-teal mb-2">Ancestralidade Conhecida</h3>
                        <p className="text-sm text-foreground leading-relaxed">
                          {sanitizedProfile.description}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Show ancestry for all users from the profile ancestry */}
                  {!sanitizedProfile.description && profile?.ancestry && (
                    <div className="mb-6 p-3 bg-gradient-to-br from-border/20 to-border/10 border border-border/40 rounded-xl shadow-sm">
                      <div className="p-4 bg-muted/30 rounded-lg text-left">
                        <h3 className="text-sm font-semibold text-phindex-teal mb-2">Ancestralidade Conhecida</h3>
                        <p className="text-sm text-foreground leading-relaxed">
                          {profile.ancestry}
                        </p>
                      </div>
                    </div>
                  )}
                  

                  {/* Created By Information */}
                  <p className="text-xs text-muted-foreground text-center mb-6 -mt-2">
                    Created by <span className="font-medium text-phindex-teal">{profileCreator?.creatorName || 'User'}</span> on {profileCreator?.createdAt ? new Date(profileCreator.createdAt).toLocaleDateString('en-US') : 'Date not available'}
                  </p>
                  
                  <div className="flex justify-center gap-4 mb-6">
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:text-phindex-teal"
                      onClick={() => {
                        const votingSection = document.querySelector('[data-voting-section]');
                        if (votingSection) {
                          votingSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      <Vote className="h-4 w-4 text-phindex-teal" />
                      <span>{realVotes.reduce((sum, vote) => sum + vote.count, 0)} votos</span>
                    </div>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:text-phindex-teal"
                      onClick={() => {
                        const commentsSection = document.querySelector('[data-comments-section]');
                        if (commentsSection) {
                          commentsSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span>{realComments.length} comments</span>
                    </div>
                  </div>

                   <div className="space-y-2">
                     {user ? (
                       hasUserVoted ? (
                          <div className="space-y-2">
                           <Button 
                             onClick={() => setShowVoteModal(true)}
                             className="w-full"
                             variant="outline"
                           >
                             <Users className="mr-2 h-4 w-4" />
                             Alterar voto
                           </Button>
                         </div>
                       ) : (
                         <Button 
                           onClick={() => setShowVoteModal(true)}
                           className="w-full"
                           variant="default"
                         >
                           <Users className="mr-2 h-4 w-4" />
                           Votar
                         </Button>
                       )
                     ) : (
                      <Button 
                        onClick={() => setShowVoteModal(true)}
                        className="w-full"
                        variant="outline"
                        disabled
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Login to vote
                      </Button>
                     )}
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Two-column layout for classifications - Each 50% width */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* General Phenotype Classification */}
              <Card className="bg-gradient-card border-phindex-teal/20">
                <CardHeader>
                  <CardTitle className="text-phindex-teal">General Phenotype Classification</CardTitle>
                </CardHeader>
                 <CardContent className="h-52 overflow-y-auto">
                   <div className="space-y-4">
                     {/* Primary Geographic Classification */}
                     <div className="bg-muted/30 p-3 rounded-lg">
                       <h4 className="text-sm font-semibold text-phindex-teal mb-3">Primary</h4>
                       {geographicVotes['Primary Geographic']?.length > 0 ? (
                         <div className="space-y-2">
                           {geographicVotes['Primary Geographic'].slice(0, 3).map((vote, index) => (
                             <div key={vote.classification} className="space-y-1">
                               <div className="flex items-center justify-between">
                                 <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                                   {vote.classification}
                                 </Badge>
                                 <span className="text-xs">{vote.percentage.toFixed(1)}% ({vote.count})</span>
                               </div>
                               <Progress value={vote.percentage} className="h-1" />
                             </div>
                           ))}
                         </div>
                       ) : (
                         <p className="text-xs text-muted-foreground">Nenhum voto ainda</p>
                       )}
                     </div>

                     {/* Secondary Geographic Classification */}
                     <div className="bg-muted/30 p-3 rounded-lg">
                       <h4 className="text-sm font-semibold text-phindex-teal mb-3">Secondary</h4>
                       {geographicVotes['Secondary Geographic']?.length > 0 ? (
                         <div className="space-y-2">
                           {geographicVotes['Secondary Geographic'].slice(0, 3).map((vote, index) => (
                             <div key={vote.classification} className="space-y-1">
                               <div className="flex items-center justify-between">
                                 <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                                   {vote.classification}
                                 </Badge>
                                 <span className="text-xs">{vote.percentage.toFixed(1)}% ({vote.count})</span>
                               </div>
                               <Progress value={vote.percentage} className="h-1" />
                             </div>
                           ))}
                         </div>
                       ) : (
                         <p className="text-xs text-muted-foreground">Nenhum voto ainda</p>
                       )}
                     </div>

                     {/* Tertiary Geographic Classification */}
                     <div className="bg-muted/30 p-3 rounded-lg">
                       <h4 className="text-sm font-semibold text-phindex-teal mb-3">Tertiary</h4>
                       {geographicVotes['Tertiary Geographic']?.length > 0 ? (
                         <div className="space-y-2">
                           {geographicVotes['Tertiary Geographic'].slice(0, 3).map((vote, index) => (
                             <div key={vote.classification} className="space-y-1">
                               <div className="flex items-center justify-between">
                                 <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                                   {vote.classification}
                                 </Badge>
                                 <span className="text-xs">{vote.percentage.toFixed(1)}% ({vote.count})</span>
                               </div>
                               <Progress value={vote.percentage} className="h-1" />
                             </div>
                           ))}
                         </div>
                       ) : (
                         <p className="text-xs text-muted-foreground">Nenhum voto ainda</p>
                       )}
                     </div>
                   </div>
                 </CardContent>
              </Card>

              {/* Specific Phenotype Classification */}
              <Card className="bg-gradient-card border-phindex-teal/20">
                <CardHeader>
                  <CardTitle className="text-phindex-teal">Specific Phenotype Classification</CardTitle>
                </CardHeader>
                 <CardContent className="h-52 overflow-y-auto">
                   <div className="space-y-4">
                     {/* Primary Phenotype Classification */}
                     <div className="bg-muted/30 p-3 rounded-lg">
                       <h4 className="text-sm font-semibold text-phindex-teal mb-3">Primary</h4>
                       {phenotypeVotes['Primary Phenotype']?.length > 0 ? (
                         <div className="space-y-2">
                           {phenotypeVotes['Primary Phenotype'].slice(0, 3).map((vote, index) => (
                             <div key={vote.classification} className="space-y-1">
                               <div className="flex items-center justify-between">
                                 <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                                   {vote.classification}
                                 </Badge>
                                 <span className="text-xs">{vote.percentage.toFixed(1)}% ({vote.count})</span>
                               </div>
                               <Progress value={vote.percentage} className="h-1" />
                             </div>
                           ))}
                         </div>
                       ) : (
                         <p className="text-xs text-muted-foreground">Nenhum voto ainda</p>
                       )}
                     </div>

                     {/* Secondary Phenotype Classification */}
                     <div className="bg-muted/30 p-3 rounded-lg">
                       <h4 className="text-sm font-semibold text-phindex-teal mb-3">Secondary</h4>
                       {phenotypeVotes['Secondary Phenotype']?.length > 0 ? (
                         <div className="space-y-2">
                           {phenotypeVotes['Secondary Phenotype'].slice(0, 3).map((vote, index) => (
                             <div key={vote.classification} className="space-y-1">
                               <div className="flex items-center justify-between">
                                 <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                                   {vote.classification}
                                 </Badge>
                                 <span className="text-xs">{vote.percentage.toFixed(1)}% ({vote.count})</span>
                               </div>
                               <Progress value={vote.percentage} className="h-1" />
                             </div>
                           ))}
                         </div>
                       ) : (
                         <p className="text-xs text-muted-foreground">Nenhum voto ainda</p>
                       )}
                     </div>

                     {/* Tertiary Phenotype Classification */}
                     <div className="bg-muted/30 p-3 rounded-lg">
                       <h4 className="text-sm font-semibold text-phindex-teal mb-3">Tertiary</h4>
                       {phenotypeVotes['Tertiary Phenotype']?.length > 0 ? (
                         <div className="space-y-2">
                           {phenotypeVotes['Tertiary Phenotype'].slice(0, 3).map((vote, index) => (
                             <div key={vote.classification} className="space-y-1">
                               <div className="flex items-center justify-between">
                                 <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                                   {vote.classification}
                                 </Badge>
                                 <span className="text-xs">{vote.percentage.toFixed(1)}% ({vote.count})</span>
                               </div>
                               <Progress value={vote.percentage} className="h-1" />
                             </div>
                           ))}
                         </div>
                       ) : (
                         <p className="text-xs text-muted-foreground">Nenhum voto ainda</p>
                       )}
                     </div>
                   </div>
                 </CardContent>
              </Card>
            </div>

            {/* Physical Characteristics - Full width */}
            <Card className="bg-gradient-card border-phindex-teal/20 mb-6">
              <CardHeader>
                <CardTitle className="text-phindex-teal">Physical Characteristics</CardTitle>
              </CardHeader>
              <CardContent className="h-96 overflow-y-auto">
                <div className="grid gap-6">
                  {physicalCharacteristics.map((characteristic, index) => (
                    <PhysicalCharacteristicVoting
                      key={index}
                      characteristic={characteristic}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <div data-comments-section>
              <CommentsSection 
                profileId={sanitizedProfile.id}
                onAddComment={addComment}
                onLikeComment={likeComment}
                onDeleteComment={deleteComment}
                currentUserId={user?.id}
                comments={realComments}
              />
            </div>

            {/* Vote Modal */}
            {showVoteModal && user && (
              <VoteModal
                isOpen={showVoteModal}
                onClose={() => setShowVoteModal(false)}
                profileId={sanitizedProfile.id}
                existingVotes={{
                  "Primary Phenotype": userVote || "",
                  ...physicalUserVotes,
                  ...userGeographicVotes
                }}
                 onSubmit={async (votes) => {
                   // Cast geographic and phenotype classification votes
                   const geographicCharacteristics = [
                     'Primary Geographic', 'Secondary Geographic', 'Tertiary Geographic',
                     'Primary Phenotype', 'Secondary Phenotype', 'Tertiary Phenotype'
                   ];
                   
                   let mainVoteSuccess = true;
                   for (const characteristic of geographicCharacteristics) {
                     if (votes[characteristic]) {
                       const success = await castGeographicVote(characteristic, votes[characteristic]);
                       if (characteristic === 'Primary Phenotype') {
                         mainVoteSuccess = success;
                       }
                     }
                   }
                  
                    // Cast physical characteristics votes
                    const physicalCharacteristics = [
                      'Skin Color', 'Hair Color', 'Hair Texture', 'Eye Color',
                      'Head Breadth', 'Head Type', 'Body Type', 'Nasal Breadth',
                      'Facial Breadth', 'Jaw Type'
                    ];
                  
                  for (const characteristic of physicalCharacteristics) {
                    if (votes[characteristic]) {
                      await castPhysicalVote(characteristic, votes[characteristic]);
                    }
                  }
                  
                   // Refresh geographic votes to update any charts
                   await refetchGeographicVotes();
                   await refetchVoteCounts();
                   
                   if (mainVoteSuccess) {
                     setShowVoteModal(false);
                     // Refresh the page to show updated results
                     window.location.reload();
                   }
                }}
              />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

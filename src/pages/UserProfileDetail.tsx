import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit, Trash2, Vote, MessageCircle, Users, MessageSquare, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { CommentsSection } from "@/components/CommentsSection";
import { VoteModal } from "@/components/VoteModal";
import { PhysicalCharacteristicVoting } from "@/components/PhysicalCharacteristicVoting";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useUserProfiles } from "@/hooks/use-user-profiles";
import { useAuth } from "@/hooks/use-auth";
import { useVoting } from "@/hooks/use-voting";
import { useComments } from "@/hooks/use-comments";
import { usePhysicalVoting } from "@/hooks/use-physical-voting";
import { useGeographicVoting } from "@/hooks/use-geographic-voting";
import { useGeographicVoteCounts } from "@/hooks/use-geographic-vote-counts";
import { useProfileCreator } from "@/hooks/use-profile-creator";
import { useState } from "react";
import { EditUserProfileModal } from "@/components/EditUserProfileModal";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";

export default function UserProfileDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { getProfileBySlug, deleteProfile } = useUserProfiles();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-profile', slug],
    queryFn: () => getProfileBySlug(slug!),
    enabled: !!slug,
  });

  // Get total vote count for this profile (unique voters only)
  const { data: totalVoteCount = 0 } = useQuery({
    queryKey: ['total-votes', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      
      const { data, error } = await supabase
        .from('votes')
        .select('user_id')
        .eq('profile_id', profile.slug);
      
      if (error) {
        console.error('Error counting voters:', error);
        return 0;
      }
      
      // Count unique voters
      const uniqueVoters = new Set(data?.map(vote => vote.user_id) || []);
      return uniqueVoters.size;
    },
    enabled: !!profile?.id,
  });

  // Initialize voting and comments hooks
  const { votes: realVotes, castVote, changeVote, hasUserVoted, userVote } = useVoting(profile?.id || '');
  const { comments: realComments, addComment, likeComment, deleteComment } = useComments(profile?.id || '');
  const { characteristics: physicalCharacteristics, userVotes: physicalUserVotes, castVote: castPhysicalVote } = usePhysicalVoting(profile?.id || '');
  const { userGeographicVotes, castGeographicVote, refetchVotes: refetchGeographicVotes } = useGeographicVoting(profile?.id || '');
  const { geographicVotes, phenotypeVotes, refetchVoteCounts } = useGeographicVoteCounts(profile?.id || '');
  const { data: profileCreator } = useProfileCreator(profile?.id || '');
  
  // Calculate total votes for Primary Geographic
  const primaryGeographicTotalVotes = geographicVotes['Primary Geographic']?.reduce((sum, vote) => sum + vote.count, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="text-foreground">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return <Navigate to="/404" replace />;
  }

  const isOwner = user?.id === profile.user_id;
  const canEdit = isOwner || isAdmin;

  // Check if user has voted on any characteristic (geographic, phenotype, or physical)
  const hasUserVotedAny = hasUserVoted || 
    Object.keys(userGeographicVotes).length > 0 || 
    Object.keys(physicalUserVotes).length > 0;

  const handleDelete = async () => {
    try {
      await deleteProfile.mutateAsync(profile.id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  // Preparar imagens para o carrossel
  const images = [
    { src: profile.front_image_url, alt: `${profile.name} - front`, label: "Front" }
  ];
  
  if (profile.profile_image_url) {
    images.push({ 
      src: profile.profile_image_url, 
      alt: `${profile.name} - profile`, 
      label: "Profile"
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-phindex-dark/20 flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="lg:ml-80 pt-20">
          {/* Sidebar */}
          <AppSidebar />

          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs 
              items={[
                { 
                  label: profile.category, 
                  href: `/category/${profile.category.toLowerCase().replace(/\s+/g, '-')}` 
                },
                { label: profile.name }
              ]}
              className="mb-4"
            />
          </div>

          {/* Main Content */}
          <div>
            {/* Profile Images and Basic Info - Full width */}
            <Card className="bg-gradient-card border-phindex-teal/20 mb-6">
              <CardContent className="p-6">
                <div className="text-center">
                  {/* Photo carousel */}
                  <div className="max-w-md mx-auto mb-4">
                    <Carousel className="w-full">
                      <CarouselContent>
                        {images.map((image, index) => (
                          <CarouselItem key={index}>
                            <div className="text-center">
                               <img 
                                 src={image.src} 
                                 alt={image.alt}
                                 className="profile-image-responsive rounded-lg mx-auto"
                               />
                              <p className="text-xs text-muted-foreground mt-2">{image.label}</p>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {images.length > 1 && (
                        <>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                        </>
                      )}
                    </Carousel>
                  </div>
                  <h1 className="text-2xl font-bold text-phindex-teal mb-2">
                    {profile.name}
                  </h1>
                  
                  {/* Category Badge */}
                  <div className="flex justify-center mb-3">
                    <Badge 
                      variant="secondary" 
                      className="bg-phindex-teal/10 text-phindex-teal hover:bg-phindex-teal/20 cursor-pointer transition-colors"
                      onClick={() => navigate('/category/community')}
                    >
                      {profile.category}
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
                      if (!topVote) {
                        return (
                          <Badge 
                            key={category.label}
                            variant="outline"
                            className="bg-muted/10 text-muted-foreground"
                          >
                            {category.label} Undefined
                          </Badge>
                        );
                      }
                      
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
                    })}
                  </div>
                  
                  {/* Phenotype Badges - Real Data */}
                  <div className="flex justify-center gap-2 mb-4 flex-wrap">
                    {[
                      { label: '1º', votes: phenotypeVotes['Primary Phenotype'] },
                      { label: '2º', votes: phenotypeVotes['Secondary Phenotype'] },
                      { label: '3º', votes: phenotypeVotes['Tertiary Phenotype'] }
                    ].map((category, index) => {
                      const topVote = category.votes?.[0];
                      if (!topVote) {
                        return (
                          <Badge 
                            key={category.label}
                            variant="outline"
                            className="bg-muted/10 text-muted-foreground"
                          >
                            {category.label} Undefined
                          </Badge>
                        );
                      }
                      
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
                    })}
                  </div>
                  
                  <p className="text-muted-foreground mb-2">
                    {profile.gender} • {profile.height}m • {profile.country}
                  </p>
                  
                  {/* Ancestry Description - Show to everyone */}
                  {profile.ancestry && (
                    <div className="mb-6 p-3 bg-gradient-to-br from-border/20 to-border/10 border border-border/40 rounded-xl shadow-sm">
                      <div className="p-4 bg-muted/30 rounded-lg text-left">
                        <h3 className="text-sm font-semibold text-phindex-teal mb-2">Known Ancestry</h3>
                        <p className="text-sm text-foreground leading-relaxed">
                          {profile.ancestry}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Created By Information */}
                  <p className="text-xs text-muted-foreground text-center mb-6 -mt-2">
                    Created by <span className="font-medium text-phindex-teal">{profileCreator?.creatorName || 'User'}</span> on {profileCreator?.createdAt ? new Date(profileCreator.createdAt).toLocaleDateString('en-US') : new Date(profile.created_at).toLocaleDateString('en-US')}
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
                       <span>{primaryGeographicTotalVotes} votes</span>
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
                     {canEdit && (
                       <>
                         <div 
                           className="flex items-center gap-2 cursor-pointer hover:text-phindex-teal transition-colors"
                           onClick={() => setShowEditModal(true)}
                         >
                           <Edit className="h-4 w-4 text-phindex-teal" />
                           <span>Edit</span>
                         </div>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <div className="flex items-center gap-2 cursor-pointer hover:text-red-500 transition-colors">
                               <Trash2 className="h-4 w-4 text-red-500" />
                               <span className="text-red-500">Delete</span>
                             </div>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                                <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this profile? This action cannot be undone.
                                </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDelete}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Yes, delete
                                </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       </>
                     )}
                   </div>

                   <div className="space-y-2">
                     {user ? (
                       hasUserVotedAny ? (
                          <div className="space-y-2">
                           <Button 
                             onClick={() => setShowVoteModal(true)}
                             className="w-full"
                             variant="outline"
                           >
                             <Users className="mr-2 h-4 w-4" />
                             Change vote
                           </Button>
                         </div>
                       ) : (
                         <Button 
                           onClick={() => setShowVoteModal(true)}
                           className="w-full"
                           variant="default"
                         >
                           <Users className="mr-2 h-4 w-4" />
                           Vote
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" data-voting-section>
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
                          <p className="text-xs text-muted-foreground">No votes yet</p>
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
                          <p className="text-xs text-muted-foreground">No votes yet</p>
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
                          <p className="text-xs text-muted-foreground">No votes yet</p>
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
                          <p className="text-xs text-muted-foreground">No votes yet</p>
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
                          <p className="text-xs text-muted-foreground">No votes yet</p>
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
                         <p className="text-xs text-muted-foreground">No votes yet</p>
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
                profileId={profile.id}
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
                profileId={profile.id}
                existingVotes={{
                  "Primary Phenotype": userVote || "",
                  ...physicalUserVotes,
                  ...userGeographicVotes
                }}
                profileImages={{
                  frontImage: profile.front_image_url,
                  profileImage: profile.profile_image_url,
                  profileName: profile.name,
                  ancestry: profile.ancestry
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
                      'Skin Color', 'Hair Color', 'Hair Texture', 'Head Breadth', 'Head Type',
                      'Body Type', 'Nasal Breadth', 'Facial Breadth', 'Jaw Type',
                      'Eye Color'
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

      {/* Edit Modal */}
      {showEditModal && (
        <EditUserProfileModal
          profile={profile}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
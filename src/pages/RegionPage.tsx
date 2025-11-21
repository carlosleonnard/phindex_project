import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Globe } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { CommentsSection } from "@/components/CommentsSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGeographicRegionProfiles } from "@/hooks/use-geographic-region-profiles";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";

/**
 * PROFILES BY REGION PAGE
 * 
 * Displays profiles filtered by geographic region based on real data
 * registered in the database.
 */

const RegionPage = () => {
  const { region } = useParams<{ region: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Search for real profiles from database filtered by region based on geographic voting
  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useGeographicRegionProfiles(region);

  /**
   * REGION NAMES MAPPING
   * 
   * Converts URL slugs to region display names.
   */
  const regionNames: Record<string, string> = {
    "africa": "Africa",
    "asia": "Asia", 
    "europe": "Europe",
    "americas": "Americas",
    "middle-east": "Middle East",
    "oceania": "Oceania"
  };

  // Get display name for current region
  const regionKey = region?.toLowerCase() || "";
  const regionDisplayName = regionNames[regionKey] || region;

  /**
   * ERROR HANDLING FOR PROFILE SEARCH
   * 
   * Displays error message if unable to load profiles from database.
   */
  if (profilesError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Error loading profiles</h1>
            <p className="text-muted-foreground mb-4">
              Could not load profiles from this region.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /**
   * REGION VALIDATION
   * 
   * Checks if the URL region is valid before displaying content.
   */
  if (!regionKey || !regionNames[regionKey]) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Region not found</h1>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        <div className="lg:ml-80 pt-20">
          {/* Sidebar */}
          <AppSidebar />

          {/* Breadcrumbs and back button */}
          <div className="mb-6">
            <Breadcrumbs 
              items={[
                { label: 'Regions', href: '/' },
                { label: regionDisplayName || 'Region' }
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
              Back
            </Button>
          </div>

          {/* Main Content */}
          <div>
            <div className="mb-8">
              {/* Back button has already been moved to fixed position at top */}
              
              <h1 className="text-3xl font-bold text-foreground mb-2">{regionDisplayName}</h1>
              <p className="text-muted-foreground">
                Explore {regionDisplayName} profiles
              </p>
            </div>

            {/* Display loading while loading profiles */}
            {profilesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="bg-gradient-card border-border/50 animate-pulse">
                    <CardContent className="p-4">
                      <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Display profiles if not loading */}
            {!profilesLoading && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    {regionDisplayName} Profiles
                  </h2>
                  <Badge variant="secondary" className="px-3 py-1">
                    {profiles?.length || 0} profile{profiles?.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Check if there are profiles to display */}
                {!profiles || profiles.length === 0 ? (
                  <EmptyState
                    icon={Globe}
                    title="No profiles in this region yet"
                    description={`Be the first to add a profile from ${regionDisplayName}. Help build our global phenotype community!`}
                    action={{
                      label: "Add Profile",
                      onClick: () => navigate('/') // User can add from home
                    }}
                    secondaryAction={{
                      label: "Explore Other Regions",
                      onClick: () => navigate('/')
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {profiles.map((profile) => (
                      <Link
                        key={profile.id}
                        to={`/user-profile/${profile.slug}`}
                        className="group block"
                      >
                        <Card className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 group-hover:shadow-lg h-full">
                          <CardContent className="p-4 h-full flex flex-col">
                            <div className="relative overflow-hidden rounded-lg mb-4">
                               <img
                                 src={profile.front_image_url}
                                 alt={profile.name}
                                 className="profile-image-thumbnail rounded-lg transition-transform duration-300 group-hover:scale-105"
                                 onError={(e) => {
                                   e.currentTarget.src = '/placeholder.svg';
                                 }}
                               />
                               <div className="absolute top-2 right-2">
                                 <Badge 
                                   variant={profile.is_anonymous ? "secondary" : "default"} 
                                   className="text-xs"
                                 >
                                   {profile.is_anonymous ? "Anonymous" : "Famous"}
                                 </Badge>
                               </div>
                               {profile.most_voted_specific_phenotype && (
                                 <div className="absolute top-10 right-2">
                                   <Badge variant="secondary" className="text-xs truncate max-w-[100px] bg-accent/50 text-accent-foreground">
                                     {profile.most_voted_specific_phenotype}
                                   </Badge>
                                 </div>
                               )}
                             </div>

                             <div className="space-y-2 flex-1 flex flex-col">
                               <div className="flex items-center gap-2 mb-2">
                                 <span className="text-sm font-medium text-muted-foreground">
                                   {profile.country}
                                 </span>
                               </div>
                               
                               <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                 {profile.name}
                               </h3>
                               
                               <div className="flex items-center justify-between text-xs text-muted-foreground min-h-[20px]">
                                 <span className="flex items-center gap-1 flex-1 truncate">
                                   <span className="w-3 h-3 rounded-full bg-primary/20 flex-shrink-0"></span>
                                   <span className="truncate">{profile.ancestry}</span>
                                 </span>
                                 <span className="flex-shrink-0 ml-2">{profile.height}m</span>
                               </div>

                               <div className="flex items-center justify-between mt-auto">
                                <Badge variant="outline" className="text-xs truncate max-w-[120px]">
                                  {profile.category}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(profile.created_at).toLocaleDateString('en-US')}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default RegionPage;
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Globe, MessageSquare } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { CommentsSection } from "@/components/CommentsSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGeographicRegionProfiles } from "@/hooks/use-geographic-region-profiles";
import { useCommentCounts } from "@/hooks/use-comment-counts";
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

const PROFILES_PER_PAGE = 12;

type ProfileFilter = 'all' | 'famous' | 'user';

const RegionPage = () => {
  const { region } = useParams<{ region: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>('all');

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

  const regionImages: Record<string, string> = {
    "africa": "/region-africa.png",
    "americas": "/region-americas.png",
    "asia": "/region-asia.png",
    "europe": "/region-europe.png",
    "middle-east": "/region-middle-east.png",
    "oceania": "/region-oceania.png",
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

  const regionProfileIds = useMemo(() => (profiles || []).map((p) => p.id), [profiles]);
  const commentCounts = useCommentCounts(regionProfileIds);

  const filteredRegionProfiles = (profiles || []).filter(p => {
    if (profileFilter === 'all') return true;
    if (profileFilter === 'user') return p.category === 'User Profiles';
    return p.category !== 'User Profiles';
  });

  const regionTitle = `${regionDisplayName} Phenotypes | Phindex - Phenotype Index`;
  const regionDescription = `Explore ${regionDisplayName} phenotypes and physical traits. Discover phenotype classifications from ${regionDisplayName}. Vote and compare physical characteristics.`;
  const regionUrl = `https://www.phenotypeindex.com/region/${regionKey}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.phenotypeindex.com" },
      { "@type": "ListItem", "position": 2, "name": regionDisplayName, "item": regionUrl }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{regionTitle}</title>
        <meta name="description" content={regionDescription} />
        <link rel="canonical" href={regionUrl} />
        <meta property="og:title" content={regionTitle} />
        <meta property="og:description" content={regionDescription} />
        <meta property="og:url" content={regionUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={regionTitle} />
        <meta name="twitter:description" content={regionDescription} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
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

          {/* Region Banner */}
          <div className="relative overflow-hidden rounded-2xl mb-8" style={{ minHeight: 220 }}>
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-white" />

            {/* Region image */}
            {regionImages[regionKey] && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 h-[90%] aspect-square">
                <img
                  src={regionImages[regionKey]}
                  alt={`${regionDisplayName} globe`}
                  className="w-full h-full object-contain opacity-80 animate-[bannerZoom_25s_ease-in-out_infinite_alternate]"
                  style={{ filter: 'hue-rotate(54deg) saturate(1.3)' }}
                />
              </div>
            )}

            {/* Gradient overlay for text */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100/95 via-slate-100/70 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-8 flex flex-col justify-center" style={{ minHeight: 220 }}>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight tracking-tight mb-1 animate-[fadeSlideIn_0.8s_ease-out]">
                {regionDisplayName.toUpperCase()}
              </h1>
              <h2 className="text-2xl md:text-3xl font-black text-primary leading-tight tracking-tight mb-3 animate-[fadeSlideIn_0.8s_ease-out_0.15s_both]">
                PHENOTYPES
              </h2>
              <p className="text-slate-500 text-sm max-w-md animate-[fadeSlideIn_0.8s_ease-out_0.3s_both]">
                Explore and classify phenotypes from {regionDisplayName}
              </p>
              <div className="flex items-center gap-3 mt-4 animate-[fadeSlideIn_0.8s_ease-out_0.45s_both]">
                <div className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-lg font-bold text-slate-800 leading-none">{profiles?.length || 0}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Profiles</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div>

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
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    {regionDisplayName} Profiles
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={profileFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setProfileFilter('all'); setCurrentPage(1); }}
                    >
                      All
                    </Button>
                    <Button
                      variant={profileFilter === 'famous' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setProfileFilter('famous'); setCurrentPage(1); }}
                    >
                      Famous People
                    </Button>
                    <Button
                      variant={profileFilter === 'user' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setProfileFilter('user'); setCurrentPage(1); }}
                    >
                      User Profiles
                    </Button>
                  </div>
                </div>

                {/* Check if there are profiles to display */}
                {!filteredRegionProfiles || filteredRegionProfiles.length === 0 ? (
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
                    {filteredRegionProfiles.slice((currentPage - 1) * PROFILES_PER_PAGE, currentPage * PROFILES_PER_PAGE).map((profile) => (
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
                                 alt={`${profile.name} phenotype profile photo`}
                                 loading="lazy"
                                 decoding="async"
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
                               <div className="absolute bottom-2 left-2 bg-phindex-dark text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                 <MessageSquare className="h-3 w-3" />
                                 <span>{commentCounts[profile.id] || 0}</span>
                               </div>
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

                {/* Pagination */}
                {filteredRegionProfiles.length > PROFILES_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.ceil(filteredRegionProfiles.length / PROFILES_PER_PAGE) }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        className="min-w-[36px]"
                        onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === Math.ceil(filteredRegionProfiles.length / PROFILES_PER_PAGE)}
                      onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      Next
                    </Button>
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
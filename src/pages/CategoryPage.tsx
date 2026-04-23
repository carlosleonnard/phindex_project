import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Plus, User, Calendar, Filter, MessageSquare } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { useUserProfiles } from "@/hooks/use-user-profiles";
import { useCommentCounts } from "@/hooks/use-comment-counts";
import { SUBCATEGORIES_BY_CATEGORY } from "@/constants/subcategories";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";

interface Profile {
  id: string;
  name: string;
  age: number;
  location: string;
  imageUrl: string;
  phenotypes: string[];
  likes: number;
  comments: any[];
  votes: any[];
  hasUserVoted: boolean;
  description?: string;
  category: string;
  country: string;
}


const categoryDescriptions: Record<string, string> = {
  "community": "Profiles of anonymous people and regular platform users",
  "pop-culture": "Celebrities, influencers and pop culture personalities", 
  "music-and-entertainment": "Artists, musicians, actors and entertainment professionals",
  "arts": "Visual artists, writers and arts professionals",
  "philosophy": "Philosophers, thinkers and intellectuals",
  "sciences": "Scientists, researchers and academics",
  "sports": "Athletes, sports players and sports professionals", 
  "business": "Entrepreneurs, executives and business leaders",
  "politics": "Politicians, government leaders and political figures",
  "criminals": "Notorious criminals, outlaws and infamous figures",
  "religion": "Religious leaders, theologians and spiritual figures",
  "military": "Military leaders, generals and war heroes"
};

const categoryNames: Record<string, string> = {
  "community": "User Profiles",
  "pop-culture": "Pop Culture",
  "music-and-entertainment": "Music and Entertainment",
  "arts": "Arts",
  "philosophy": "Philosophy",
  "sciences": "Sciences",
  "sports": "Sports",
  "business": "Business",
  "politics": "Politics",
  "criminals": "Criminals",
  "religion": "Religion",
  "military": "Military"
};

const categoryImages: Record<string, string> = {
  "community": "/category-community.svg",
  "pop-culture": "/category-pop-culture.svg",
  "music-and-entertainment": "/category-music-and-entertainment.svg",
  "arts": "/category-arts.svg",
  "philosophy": "/category-philosophy.svg",
  "sciences": "/category-sciences.svg",
  "sports": "/category-sports.svg",
  "business": "/category-business.svg",
  "politics": "/category-politics.svg",
  "criminals": "/category-criminals.svg",
  "religion": "/category-religion.svg",
  "military": "/category-military.svg"
};

const PROFILES_PER_PAGE = 12;

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { profiles, profilesLoading } = useUserProfiles();
  const [currentPage, setCurrentPage] = useState(1);
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [phenotypeFilter, setPhenotypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const categoryName = category ? categoryNames[category] : "Unknown Category";
  const categoryDescription = category ? categoryDescriptions[category] : "Category not found";

  // Map URL category to database category names
  const categoryMapping: Record<string, string> = {
    "community": "User Profiles",
    "pop-culture": "Pop Culture",
    "music-and-entertainment": "Music and Entertainment",
    "arts": "Arts",
    "philosophy": "Philosophy",
    "sciences": "Sciences",
    "sports": "Sports",
    "business": "Business",
    "politics": "Politics",
    "criminals": "Criminals",
    "religion": "Religion",
    "military": "Military"
  };

  // Filter profiles by category
  const categoryProfiles = profiles?.filter(profile => {
    const dbCategoryName = categoryMapping[category || ""];
    return profile.category === dbCategoryName;
  }) || [];

  // Extract unique values for filter dropdowns
  const phenotypes = useMemo(() => {
    const phenos = new Set<string>();
    categoryProfiles.forEach(p => {
      if (p.most_voted_phenotype) phenos.add(p.most_voted_phenotype);
    });
    return Array.from(phenos).sort();
  }, [categoryProfiles]);

  const regions = useMemo(() => {
    const regs = new Set<string>();
    categoryProfiles.forEach(p => {
      if (p.country) regs.add(p.country);
    });
    return Array.from(regs).sort();
  }, [categoryProfiles]);

  // Get subcategories available for this category
  const dbCategoryName = categoryMapping[category || ""];
  const availableSubcategories = dbCategoryName ? (SUBCATEGORIES_BY_CATEGORY[dbCategoryName] || []) : [];

  const categoryProfileIds = useMemo(() => categoryProfiles.map((p) => p.id), [categoryProfiles]);
  const commentCounts = useCommentCounts(categoryProfileIds);

  // Apply additional filters
  const filteredProfiles = categoryProfiles.filter(profile => {
    if (subcategoryFilter && profile.subcategory !== subcategoryFilter) return false;
    if (phenotypeFilter && profile.most_voted_phenotype !== phenotypeFilter) return false;
    if (regionFilter && profile.country !== regionFilter) return false;
    return true;
  });

  if (!category || !categoryNames[category]) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-phindex-dark/20">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Category not found</h1>
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

  const catTitle = `${categoryName} Phenotypes | Phindex`;
  const catDescription = `Browse ${categoryName} phenotype profiles on Phindex. See physical trait classifications and vote on characteristics.`;
  const catUrl = `https://www.phenotypeindex.com/category/${category}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.phenotypeindex.com" },
      { "@type": "ListItem", "position": 2, "name": categoryName, "item": catUrl }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-phindex-dark/20 flex flex-col">
      <Helmet>
        <title>{catTitle}</title>
        <meta name="description" content={catDescription} />
        <link rel="canonical" href={catUrl} />
        <meta property="og:title" content={catTitle} />
        <meta property="og:description" content={catDescription} />
        <meta property="og:url" content={catUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={catTitle} />
        <meta name="twitter:description" content={catDescription} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="lg:ml-80 pt-20">
          {/* Sidebar */}
          <AppSidebar />

          {/* Breadcrumbs and back button */}
          <div className="mb-6">
            <Breadcrumbs 
              items={[
                { label: 'Categories', href: '/' },
                { label: categoryName }
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
            {/* Category Banner */}
            <div className="relative overflow-hidden rounded-2xl mb-8" style={{ minHeight: 220 }}>
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-white" />

              {/* Category image */}
              {category && categoryImages[category] && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 h-[90%] aspect-square">
                  <img
                    src={categoryImages[category]}
                    alt={`${categoryName} icon`}
                    className="w-full h-full object-contain opacity-80 animate-[bannerZoom_25s_ease-in-out_infinite_alternate]"
                  />
                </div>
              )}

              {/* Gradient overlay for text */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-100/95 via-slate-100/70 to-transparent" />

              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col justify-center" style={{ minHeight: 220 }}>
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight tracking-tight mb-1 animate-[fadeSlideIn_0.8s_ease-out]">
                  {categoryName.toUpperCase()}
                </h1>
                <h2 className="text-2xl md:text-3xl font-black text-primary leading-tight tracking-tight mb-3 animate-[fadeSlideIn_0.8s_ease-out_0.15s_both]">
                  PHENOTYPES
                </h2>
                <p className="text-slate-500 text-sm max-w-md animate-[fadeSlideIn_0.8s_ease-out_0.3s_both]">
                  {categoryDescription}
                </p>
                <div className="flex items-center gap-3 mt-4 animate-[fadeSlideIn_0.8s_ease-out_0.45s_both]">
                  <div className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-lg font-bold text-slate-800 leading-none">{filteredProfiles.length}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Profiles</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-8 bg-card/95 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableSubcategories.length > 0 && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Subcategory</label>
                      <select
                        value={subcategoryFilter}
                        onChange={(e) => { setSubcategoryFilter(e.target.value); setCurrentPage(1); }}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">All subcategories</option>
                        {availableSubcategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Specific Phenotype</label>
                    <select
                      value={phenotypeFilter}
                      onChange={(e) => { setPhenotypeFilter(e.target.value); setCurrentPage(1); }}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">All phenotypes</option>
                      {phenotypes.map(ph => (
                        <option key={ph} value={ph}>{ph}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Region</label>
                    <select
                      value={regionFilter}
                      onChange={(e) => { setRegionFilter(e.target.value); setCurrentPage(1); }}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">All regions</option>
                      {regions.map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profiles Grid */}
            {profilesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="bg-gradient-card border-border/50 animate-pulse">
                    <CardContent className="p-4">
                      <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProfiles.length > 0 ? (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProfiles.slice((currentPage - 1) * PROFILES_PER_PAGE, currentPage * PROFILES_PER_PAGE).map((profile) => (
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
                          {profile.most_voted_phenotype && (
                            <div className="absolute top-10 right-2">
                              <Badge variant="secondary" className="text-xs truncate max-w-[100px] bg-accent/50 text-accent-foreground">
                                {profile.most_voted_phenotype}
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

              {/* Pagination */}
              {filteredProfiles.length > PROFILES_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.ceil(filteredProfiles.length / PROFILES_PER_PAGE) }, (_, i) => i + 1).map(page => (
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
                    disabled={currentPage === Math.ceil(filteredProfiles.length / PROFILES_PER_PAGE)}
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    Next
                  </Button>
                </div>
              )}
              </>
            ) : (
              <EmptyState
                icon={Plus}
                title="No profiles in this category yet"
                description={`Be the first to add a ${categoryName.toLowerCase()} profile. Help expand our phenotype database!`}
                action={{
                  label: "Add Profile",
                  onClick: () => navigate('/')
                }}
                secondaryAction={{
                  label: "Browse All Categories",
                  onClick: () => navigate('/')
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
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { ProfileCard } from "@/components/ProfileCard";
import { useUserProfiles } from "@/hooks/use-user-profiles";
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
  "politics": "Politicians, government leaders and political figures"
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
  "politics": "Politics"
};

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { profiles, profilesLoading } = useUserProfiles();

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
    "politics": "Politics"
  };
  
  // Filter profiles by category
  const filteredProfiles = profiles?.filter(profile => {
    const dbCategoryName = categoryMapping[category || ""];
    return profile.category === dbCategoryName;
  }) || [];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-phindex-dark/20 flex flex-col">
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
            {/* Category Header */}
            <Card className="bg-gradient-card border-phindex-teal/20 mb-8">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-phindex-teal/10 text-phindex-teal text-lg px-4 py-2">
                    {categoryName}
                  </Badge>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{filteredProfiles.length} profiles</span>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Category: {categoryName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {categoryDescription}
                </p>
              </CardContent>
            </Card>

            {/* Profiles Grid */}
            {profilesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="bg-gradient-card border-phindex-teal/20">
                    <CardContent className="p-4">
                      <div className="animate-pulse">
                        <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="cursor-pointer transition-transform hover:scale-105 h-full"
                    onClick={() => navigate(`/user-profile/${profile.slug}`)}
                  >
                    <Card className="bg-gradient-card border-phindex-teal/20 overflow-hidden h-full flex flex-col">
                      <div className="relative h-64 flex-shrink-0">
                         <img 
                           src={profile.front_image_url} 
                           alt={profile.name}
                           className="w-full h-full object-cover rounded-t-lg"
                         />
                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1">
                          <span className="text-xs font-medium">{profile.country}</span>
                        </div>
                      </div>
                      <CardContent className="p-4 flex-grow flex flex-col">
                        <h3 className="font-semibold text-foreground mb-1 truncate">{profile.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2 flex-grow">{profile.ancestry}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                          <span>Height: {profile.height}m</span>
                          <span>{profile.gender}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
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
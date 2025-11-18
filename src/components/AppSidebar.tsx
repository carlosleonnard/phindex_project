import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, 
  Film, 
  Music, 
  Palette, 
  Brain, 
  Microscope, 
  Trophy, 
  Briefcase, 
  Building,
  GitBranch,
  HelpCircle,
  LogOut,
  Mail
} from "lucide-react";

export const AppSidebar = () => {
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
      "Politics": "politics"
    };
    const categorySlug = categoryMapping[category] || category.toLowerCase().replace(/\s+/g, '-');
    navigate(`/category/${categorySlug}`);
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
      "Politics": "politics"
    };
    const categorySlug = categoryMapping[category] || category.toLowerCase().replace(/\s+/g, '-');
    return location.pathname === `/category/${categorySlug}`;
  };

  return (
    <div className="w-80 hidden lg:block fixed left-0 top-16 h-screen z-40">
      <div className="bg-card border-r border-border/50 h-full overflow-y-auto pt-6 px-6">
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-6 text-phindex-dark">PHENOTYPE REGION</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                "Africa", "Asia", "Europe", "Americas",
                "Middle East", "Oceania"
              ].map((region) => (
                <Button
                  key={region}
                  variant={isRegionActive(region) ? "default" : "outline"}
                  size="sm"
                  className="text-sm py-3 px-4 h-auto whitespace-nowrap overflow-hidden text-ellipsis"
                  onClick={() => handleRegionClick(region)}
                  title={region}
                >
                  <span className="hidden xl:inline">{region}</span>
                  <span className="xl:hidden">
                    {region === "Middle East" ? "M.E" : 
                     region}
                  </span>
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6 text-phindex-dark">CATEGORIES</h3>
            <div className="space-y-4">
              {/* Community Section */}
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
              
              {/* Separator */}
              <div className="border-t border-border/30 my-4"></div>
              
              {/* Other Categories */}
              {[
                { Icon: Film, name: "Pop Culture" },
                { Icon: Music, name: "Music and Entertainment" },
                { Icon: Palette, name: "Arts" },
                { Icon: Brain, name: "Philosophy" },
                { Icon: Microscope, name: "Sciences" },
                { Icon: Trophy, name: "Sports" },
                { Icon: Briefcase, name: "Business" },
                { Icon: Building, name: "Politics" }
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
                    <category.Icon 
                      className="h-5 w-5" 
                      color="#007a75" 
                    />
                    <span className="text-base">{category.name}</span>
                  </button>
                );
               })}
            </div>
          </div>
          
          {/* Separator */}
          <Separator className="my-6" />
          
          {/* More Info Section */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-phindex-dark">MORE INFO</h3>
            <div className="space-y-4">
              <button
                className="flex items-center gap-4 w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50"
                onClick={() => navigate('/phenotype-flow')}
              >
                <GitBranch className="h-5 w-5" color="#007a75" />
                <span className="text-base">Phenotype Flow</span>
              </button>
              
              
              <button
                className="flex items-center gap-4 w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50"
                onClick={() => navigate('/contact')}
              >
                <Mail className="h-5 w-5" color="#007a75" />
                <span className="text-base">Contact</span>
              </button>
              
              <button
                className="flex items-center gap-4 w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50"
                onClick={() => navigate('/faq')}
              >
                <HelpCircle className="h-5 w-5" color="#007a75" />
                <span className="text-base">FAQ</span>
              </button>
              
              <button
                className="flex items-center gap-4 w-full text-left p-3 rounded-lg transition-colors hover:bg-destructive/10 text-destructive hover:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="h-5 w-5" />
                <span className="text-base">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { Plus, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CountrySelector } from "@/components/CountrySelector";
import { CountrySearchSelector } from "@/components/CountrySearchSelector";
import { GenderSelector } from "@/components/GenderSelector";
import { CategorySelector } from "@/components/CategorySelector";
import { useUserProfiles } from "@/hooks/use-user-profiles";
import { useAuth } from "@/hooks/use-auth";
import { useImageUpload } from "@/hooks/use-image-upload";
import { supabase } from "@/integrations/supabase/client";

interface AddProfileModalProps {
  triggerExternal?: boolean;
  onTriggerExternalChange?: (value: boolean) => void;
  initialIsAnonymous?: boolean | null;
  lockIsAnonymous?: boolean;
}

export const AddProfileModal = ({ triggerExternal = false, onTriggerExternalChange, initialIsAnonymous = null, lockIsAnonymous = false }: AddProfileModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProfile } = useUserProfiles();
  const { uploadImage, isUploading } = useImageUpload();
  const [open, setOpen] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    gender: "",
    category: initialIsAnonymous === true ? "User Profiles" : "",
    height: "",
    ancestry: [] as string[], // Changed to array of countries
    frontImageUrl: "",
    profileImageUrl: "",
    isAnonymous: initialIsAnonymous
  });

  const [dragActive, setDragActive] = useState(false);
  
  // Check for tablet/mobile breakpoint (hide button on screens smaller than 1024px)
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(window.innerWidth < 1024);
  
  useEffect(() => {
    const handleResize = () => {
      setIsTabletOrMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGuidelinesAccept = () => {
    setShowGuidelines(false);
    setOpen(true);
  };

  const handleTriggerClick = () => {
    setShowGuidelines(true);
  };

  // Effect para controlar abertura externa do modal
  useEffect(() => {
    if (triggerExternal) {
      setShowGuidelines(true);
      onTriggerExternalChange?.(false);
    }
  }, [triggerExternal, onTriggerExternalChange]);

  const handleAnonymousChange = (value: string) => {
    const isAnonymous = value === "yes";
    setFormData(prev => ({ 
      ...prev, 
      isAnonymous: isAnonymous,
      category: isAnonymous ? "User Profiles" : ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You need to be logged in to create a profile.');
      return;
    }
    
    // Custom validation with specific error messages
    const missingFields = [];
    if (!formData.name) missingFields.push('Name');
    if (!formData.country) missingFields.push('Country');
    if (!formData.gender) missingFields.push('Gender');
    if (!formData.category) missingFields.push('Category');
    if (!formData.height) missingFields.push('Height');
    if (formData.ancestry.length === 0) missingFields.push('Ancestry');
    if (!formData.frontImageUrl) missingFields.push('Front Image');
    if (formData.isAnonymous === null) missingFields.push('Anonymous status');
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    if (formData.name && formData.country && formData.gender && formData.category && formData.height && formData.ancestry.length > 0 && formData.frontImageUrl && formData.isAnonymous !== null) {
      try {
        const newProfile = await createProfile.mutateAsync({
          name: formData.name,
          country: formData.country,
          gender: formData.gender,
          category: formData.category,
          height: parseFloat(formData.height),
          ancestry: formData.ancestry.join(', '), // Convert array to string
          frontImageUrl: formData.frontImageUrl,
          profileImageUrl: formData.profileImageUrl,
          isAnonymous: formData.isAnonymous
        });

        // Create complete profile record with all form data
        const { data: completeProfileData, error: completeProfileError } = await supabase
          .from('complete_profiles')
          .insert({
            user_id: user.id,
            profile_id: newProfile.id,
            name: formData.name,
            country: formData.country,
            gender: formData.gender,
            category: formData.category,
            height: parseFloat(formData.height),
            ancestry: formData.ancestry.join(', '), // Convert array to string
            is_anonymous: formData.isAnonymous,
            front_image_url: formData.frontImageUrl,
            profile_image_url: formData.profileImageUrl || null,
            description: formData.ancestry.join(', ') // Convert array to string
          });

        if (completeProfileError) {
          console.error('Error creating complete profile record:', completeProfileError);
        }

        // Reset form and close modal
        setFormData({ name: "", country: "", gender: "", category: "", height: "", ancestry: [], frontImageUrl: "", profileImageUrl: "", isAnonymous: null });
        setOpen(false);
        
        // Navigate to the new profile page
        navigate(`/user-profile/${newProfile.slug}`);
        } catch (error) {
        console.error('Error creating profile:', error);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent, imageType: 'front' | 'profile') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const uploadedUrl = await uploadImage(file, imageType);
      
      if (uploadedUrl) {
        setFormData(prev => ({ 
          ...prev, 
          [imageType === 'front' ? 'frontImageUrl' : 'profileImageUrl']: uploadedUrl 
        }));
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'front' | 'profile') => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadedUrl = await uploadImage(file, imageType);
      
      if (uploadedUrl) {
        setFormData(prev => ({ 
          ...prev, 
          [imageType === 'front' ? 'frontImageUrl' : 'profileImageUrl']: uploadedUrl 
        }));
      }
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <>
      {/* Guidelines Modal */}
      <Dialog open={showGuidelines} onOpenChange={setShowGuidelines}>
        {/* Only show trigger button on desktop (screens 1024px and larger) */}
        {!isTabletOrMobile && !triggerExternal && !onTriggerExternalChange && (
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="bg-phindex-teal hover:bg-phindex-teal/90 px-4 py-2 h-9"
              onClick={handleTriggerClick}
            >
              <Plus className="mr-1 h-4 w-4" />
              Classify Now!
            </Button>
          </DialogTrigger>
        )}
        
        <DialogContent className="bg-gradient-card border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Adding Guidelines
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Before adding a profile, please read and agree to the following terms:</p>
              
              <ul className="space-y-2 list-disc list-inside">
                <li>Respect the privacy and rights of people represented in images</li>
                <li>Only use images you have permission to share</li>
                <li>Provide accurate and respectful information about ancestry</li>
                <li>Do not use images of minors without appropriate consent</li>
                <li>Maintain a respectful and inclusive environment</li>
                <li>Classifications should be based on visible characteristics, not stereotypes</li>
              </ul>
              
              <div className="space-y-2 pt-3 border-t border-border">
                <p className="text-xs font-medium text-foreground">
                  Please do your best to check for duplicates, periodically, we will clean out inactive or duplicated profiles
                </p>
                <p className="text-xs">
                  If you would like to remove a profile, please report to contact@phenotypeindex.com
                </p>
              </div>
              
              <p className="text-xs pt-2 border-t border-border">
                By continuing, you agree to follow these guidelines and use the platform responsibly.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowGuidelines(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-gradient-primary hover:shadow-button transition-all duration-300"
              onClick={handleGuidelinesAccept}
            >
              I Agree and Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Creation Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gradient-card border-border/50 max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              New Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Upload de imagens */}
            <div className="space-y-3">
              <Label>Profile Photos</Label>
              <p className="text-xs text-muted-foreground">Front photo is required, profile photo is optional</p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Foto de Frente */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Front Photo *</Label>
                <Card
                  className={`border-2 border-dashed transition-colors p-4 text-center cursor-pointer ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => handleDrop(e, 'front')}
                  onClick={() => document.getElementById('front-image-input')?.click()}
                >
                  <input
                    id="front-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'front')}
                  />
                  {formData.frontImageUrl ? (
                    <div className="relative inline-block">
                        <img 
                          src={formData.frontImageUrl} 
                          alt="Front Preview" 
                          className="w-20 h-19 rounded-lg mx-auto object-cover"
                          style={{ aspectRatio: '640/607' }}
                        />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive hover:bg-destructive/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, frontImageUrl: "" }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {isUploading ? 'Uploading...' : 'Click or drag front photo *'}
                      </p>
                    </div>
                  )}
                </Card>
                </div>

                {/* Foto de Perfil */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Profile Photo</Label>
                <Card
                  className={`border-2 border-dashed transition-colors p-4 text-center cursor-pointer ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => handleDrop(e, 'profile')}
                  onClick={() => document.getElementById('profile-image-input')?.click()}
                >
                  <input
                    id="profile-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'profile')}
                  />
                  {formData.profileImageUrl ? (
                    <div className="relative inline-block">
                        <img 
                          src={formData.profileImageUrl} 
                          alt="Profile Preview" 
                          className="w-20 h-19 rounded-lg mx-auto object-cover"
                          style={{ aspectRatio: '640/607' }}
                        />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive hover:bg-destructive/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, profileImageUrl: "" }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {isUploading ? 'Uploading...' : 'Click or drag profile photo'}
                      </p>
                    </div>
                  )}
                </Card>
                </div>
              </div>
            </div>

            {/* Campo sim/não para perfil anônimo */}
            <div className="space-y-2">
              <Label htmlFor="anonymousSelect">Is this classification for you or for someone you know personally? (Non-famous person) *</Label>
              <select
                id="anonymousSelect"
                value={formData.isAnonymous === true ? "yes" : formData.isAnonymous === false ? "no" : ""}
                onChange={(e) => handleAnonymousChange(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                disabled={lockIsAnonymous}
              >
                <option value="" disabled>Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {/* Informações básicas */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (meters) *</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="3"
                  placeholder="e.g: 1.75"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <CountrySearchSelector
                  selectedCountry={formData.country}
                  onCountryChange={(country) => setFormData(prev => ({ ...prev, country }))}
                  placeholder="Search and select country"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <GenderSelector
                  selectedGender={formData.gender}
                  onGenderChange={(gender) => setFormData(prev => ({ ...prev, gender }))}
                  placeholder="Search and select gender"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <CategorySelector
                  selectedCategory={formData.category}
                  onCategoryChange={(category) => setFormData(prev => ({ ...prev, category }))}
                  placeholder="Search and select category"
                  disabled={formData.isAnonymous === true}
                  isAnonymous={formData.isAnonymous === true}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ancestry">Known Ancestry *</Label>
              <CountrySelector
                selectedCountries={formData.ancestry}
                onCountriesChange={(countries) => setFormData(prev => ({ ...prev, ancestry: countries }))}
                placeholder="Type to search ancestry countries..."
                maxCountries={5}
              />
              <p className="text-xs text-muted-foreground">Select up to 5 groups that represent known ancestry</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-primary hover:shadow-button transition-all duration-300"
                disabled={createProfile.isPending || isUploading}
              >
                {createProfile.isPending || isUploading ? 'Creating...' : 'Add Profile'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
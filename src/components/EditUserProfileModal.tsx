import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CountrySelector } from "@/components/CountrySelector";
import { useUserProfiles, UserProfile } from "@/hooks/use-user-profiles";
import { useImageUpload } from "@/hooks/use-image-upload";

interface EditUserProfileModalProps {
  profile: UserProfile;
  open: boolean;
  onClose: () => void;
}

export const EditUserProfileModal = ({ profile, open, onClose }: EditUserProfileModalProps) => {
  const { updateProfile } = useUserProfiles();
  const { uploadImage, isUploading } = useImageUpload();
  const [formData, setFormData] = useState({
    name: profile.name,
    country: profile.country,
    gender: profile.gender,
    category: profile.category,
    height: profile.height.toString(),
    ancestry: profile.ancestry ? profile.ancestry.split(', ') : [], // Convert string to array
    frontImageUrl: profile.front_image_url,
    profileImageUrl: profile.profile_image_url || "",
    isAnonymous: profile.is_anonymous
  });

  const [dragActive, setDragActive] = useState(false);

  const handleAnonymousChange = (value: string) => {
    const isAnonymous = value === "sim";
    setFormData(prev => ({ 
      ...prev, 
      isAnonymous: isAnonymous,
      category: isAnonymous ? "User Profiles" : prev.category
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        profileData: {
          name: formData.name,
          country: formData.country,
          gender: formData.gender,
          category: formData.category,
          height: parseFloat(formData.height),
          ancestry: formData.ancestry.join(', '), // Convert array to string
          frontImageUrl: formData.frontImageUrl,
          profileImageUrl: formData.profileImageUrl,
          isAnonymous: formData.isAnonymous
        }
      });
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-card border-border/50 max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload de imagens */}
          <div className="space-y-3">
            <Label>Profile Photos</Label>
            <p className="text-xs text-muted-foreground">Front photo is required, profile photo is optional</p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Front Photo */}
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
                  onClick={() => document.getElementById('edit-front-image-input')?.click()}
                >
                  <input
                    id="edit-front-image-input"
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

              {/* Profile Photo */}
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
                  onClick={() => document.getElementById('edit-profile-image-input')?.click()}
                >
                  <input
                    id="edit-profile-image-input"
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

          {/* Anonymous profile yes/no field */}
          <div className="space-y-2">
            <Label htmlFor="anonymousSelect">Is this an anonymous person (not famous)? *</Label>
            <select
              id="anonymousSelect"
              value={formData.isAnonymous === true ? "sim" : formData.isAnonymous === false ? "nao" : ""}
              onChange={(e) => handleAnonymousChange(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="" disabled>Select</option>
              <option value="sim">Yes</option>
              <option value="nao">No</option>
            </select>
          </div>

          {/* Basic information */}
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
                placeholder="e.g.: 1.75"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select country</option>
                <option value="Brasil">Brasil</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="Canadá">Canadá</option>
                <option value="Reino Unido">Reino Unido</option>
                <option value="França">França</option>
                <option value="Alemanha">Alemanha</option>
                <option value="Espanha">Espanha</option>
                <option value="Itália">Itália</option>
                <option value="Portugal">Portugal</option>
                <option value="Argentina">Argentina</option>
                <option value="México">México</option>
                <option value="Chile">Chile</option>
                <option value="Colômbia">Colômbia</option>
                <option value="Peru">Peru</option>
                <option value="Uruguai">Uruguai</option>
                <option value="Venezuela">Venezuela</option>
                <option value="Japão">Japão</option>
                <option value="China">China</option>
                <option value="Coreia do Sul">Coreia do Sul</option>
                <option value="Índia">Índia</option>
                <option value="Austrália">Austrália</option>
                <option value="Nova Zelândia">Nova Zelândia</option>
                <option value="África do Sul">África do Sul</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select</option>
                <option value="Masculino">Male</option>
                <option value="Feminino">Female</option>
                <option value="Outro">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={formData.isAnonymous === true}
                required
              >
                <option value="">Select category</option>
                <option value="User Profiles">User Profiles</option>
                <option value="Pop Culture">Pop Culture</option>
                <option value="Music and Entertainment">Music and Entertainment</option>
                <option value="Arts">Arts</option>
                <option value="Philosophy">Philosophy</option>
                <option value="Sciences">Sciences</option>
                <option value="Sports">Sports</option>
                <option value="Business">Business</option>
                <option value="Politics">Politics</option>
              </select>
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
            <p className="text-xs text-muted-foreground">Select up to 5 countries that represent the known ancestry</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:shadow-button transition-all duration-300"
              disabled={updateProfile.isPending || isUploading}
            >
              {updateProfile.isPending || isUploading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
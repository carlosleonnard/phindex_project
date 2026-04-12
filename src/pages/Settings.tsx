import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BadgesSection } from "@/components/BadgesSection";

const Settings = () => {
  const { user } = useAuth();
  const { uploadImage, isUploading } = useImageUpload();
  const { toast } = useToast();
  
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nicknameError, setNicknameError] = useState("");

  // Load profile data on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profile) {
          setNickname(profile.nickname || "");
          setProfileImage(profile.avatar_url || "");
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // No fallback to Google Auth data - maintain anonymity
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  // Check if nickname is available
  const checkNicknameAvailability = async (nicknameToCheck: string) => {
    if (!nicknameToCheck || nicknameToCheck.length < 3) {
      setNicknameError("Nickname must be at least 3 characters");
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nicknameToCheck)
        .neq('id', user?.id || '');

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.length > 0) {
        setNicknameError("This nickname is already in use");
        return false;
      }

      setNicknameError("");
      return true;
    } catch (error) {
      console.error('Error checking nickname:', error);
      setNicknameError("Error checking nickname");
      return false;
    }
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setNicknameError("");
    
    // Debounce nickname check
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkNicknameAvailability(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Starting image upload:', file.name);
    
    try {
      const imageUrl = await uploadImage(file, 'profile');
      console.log('Returned image URL:', imageUrl);
      
      if (imageUrl) {
        setProfileImage(imageUrl);
        toast({
          title: "Image uploaded",
          description: "The image was uploaded successfully. Click save to apply changes.",
        });
      } else {
        toast({
          title: "Upload error",
          description: "Could not upload image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload error",
        description: "An error occurred while uploading the image. Please try again.",
        variant: "destructive",
      });
    }
    
    // Clear input to allow reselecting the same image
    event.target.value = '';
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate nickname before saving
    if (nickname && !(await checkNicknameAvailability(nickname))) {
      return;
    }

    setIsUpdating(true);
    try {
      // Update profiles table only (no auth metadata for anonymity)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          nickname: nickname,
          avatar_url: profileImage
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Profile updated",
        description: "Your information has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      let errorMessage = "Could not update profile. Please try again.";
      if (error.code === '23505' && error.constraint === 'profiles_nickname_unique') {
        errorMessage = "This nickname is already in use. Choose another one.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <AppSidebar />
        <main className="lg:ml-80 pt-16">
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="p-8 text-center">
                <p>You need to be logged in to access settings.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AppSidebar />
      <main className="lg:ml-80 pt-16">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Loading profile information...</p>
                </div>
              ) : (
                <>
                  {/* Profile Image Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileImage} alt={nickname} />
                      <AvatarFallback className="text-2xl">
                        {nickname ? nickname.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="profile-image-upload"
                        disabled={isUploading}
                      />
                      <Label 
                        htmlFor="profile-image-upload"
                        className="cursor-pointer"
                      >
                        <Button 
                          variant="outline" 
                          className="cursor-pointer" 
                          disabled={isUploading}
                          type="button"
                          asChild
                        >
                          <span>
                            <Camera className="h-4 w-4 mr-2" />
                            {isUploading ? "Uploading..." : "Change Photo"}
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>

                  {/* Nickname Section */}
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => handleNicknameChange(e.target.value)}
                      placeholder="Enter your nickname"
                      className={nicknameError ? "border-destructive" : ""}
                    />
                    {nicknameError && (
                      <div className="flex items-center space-x-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{nicknameError}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Your nickname must be unique and at least 3 characters long. This is the name that appears in comments.
                    </p>
                  </div>

                  {/* Email Section (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      Email cannot be changed through this page.
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={isUpdating || isUploading || !!nicknameError || !nickname.trim()}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          {/* Badges Section */}
          <div className="max-w-2xl mx-auto">
            <BadgesSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
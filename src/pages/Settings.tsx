import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/AppLayout";
import { LoginModal } from "@/components/LoginModal";
import { CenButton, outlineCapsule } from "@/components/kt/Centromere";
import { InitialsAvatar, SC } from "@/components/kt/Misc";
import { EmptySheet } from "@/components/kt/Listing";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Camera, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BadgesSection } from "@/components/BadgesSection";

const Settings = () => {
  const { user } = useAuth();
  const { uploadImage, isUploading } = useImageUpload();
  const { toast } = useToast();
  
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nicknameError, setNicknameError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  // Load profile data on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('nickname, avatar_url, email_notifications')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profile) {
          setNickname(profile.nickname || "");
          setProfileImage(profile.avatar_url || "");
          setEmailNotifications(profile.email_notifications ?? true);
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
          avatar_url: profileImage,
          email_notifications: emailNotifications,
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
      <AppLayout>
        <Helmet>
          <title>Settings | Phindex</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <SC as="p" className="m-0 text-[16px] text-kt-teal">
          your account
        </SC>
        <h1 className="mb-0 mt-1 text-[clamp(48px,5.8vw,84px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
          Settings
        </h1>
        <EmptySheet
          className="mt-8"
          title="Log in to change your settings"
          action={
            <CenButton size="sm" onClick={() => setLoginOpen(true)}>
              log in
            </CenButton>
          }
        >
          Your nickname, photo and email alerts live here.
        </EmptySheet>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </AppLayout>
    );
  }

  const fieldLabel = "font-sc text-[15px] font-semibold tracking-[0.06em] text-kt-slate";

  return (
    <AppLayout>
      <Helmet>
        <title>Settings | Phindex</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <SC as="p" className="m-0 text-[16px] text-kt-teal">
        your account
      </SC>
      <h1 className="mb-0 mt-1 text-[clamp(48px,5.8vw,84px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
        Settings
      </h1>
      <p className="mb-0 mt-3 text-[19px] italic text-kt-body">Your nickname, photo and email alerts.</p>

      <div className="mt-8 grid max-w-[860px] gap-8">
        <section
          aria-labelledby="profile-title"
          className="rounded-[3px] border border-kt-rule bg-white p-[clamp(18px,3vw,32px)]"
        >
          <h2 id="profile-title" className="m-0 text-[30px] font-medium leading-[1.15] text-kt-ink">
            Profile
          </h2>
          {isLoading ? (
            <div className="mt-6 space-y-4" aria-busy="true">
              <div className="h-24 w-24 animate-pulse rounded-full bg-kt-wash" />
              <div className="h-11 animate-pulse rounded-full bg-kt-wash" />
              <div className="h-11 animate-pulse rounded-full bg-kt-wash" />
            </div>
          ) : (
            <div className="mt-6 space-y-7">
              <div className="flex flex-wrap items-center gap-5">
                {profileImage ? (
                  <img src={profileImage} alt="" className="h-24 w-24 shrink-0 rounded-full object-cover" />
                ) : (
                  <InitialsAvatar name={nickname || user.email} size={96} dark />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                    id="profile-image-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="profile-image-upload"
                    className={outlineCapsule(
                      cn("min-h-11 cursor-pointer text-[16px]", isUploading && "pointer-events-none opacity-60")
                    )}
                  >
                    <Camera className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                    {isUploading ? "uploading…" : "change photo"}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="nickname" className={fieldLabel}>
                  nickname
                </label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => handleNicknameChange(e.target.value)}
                  placeholder="Enter your nickname"
                  aria-invalid={!!nicknameError}
                  aria-describedby="nickname-help"
                  className={nicknameError ? "border-destructive" : ""}
                />
                {nicknameError && (
                  <p className="m-0 flex items-center gap-2 text-[15px] text-destructive" role="alert">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    {nicknameError}
                  </p>
                )}
                <p id="nickname-help" className="m-0 text-[15px] text-kt-body">
                  Unique, at least 3 characters. It’s the name that appears on your comments and on the leaderboard.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className={fieldLabel}>
                  email
                </label>
                <Input id="email" value={user.email || ""} disabled className="bg-kt-wash" />
                <p className="m-0 text-[15px] text-kt-body">Email can’t be changed here.</p>
              </div>

              <div className="flex items-start justify-between gap-6 border-t border-kt-rule pt-5">
                <div>
                  <label htmlFor="email-notifications" className={fieldLabel}>
                    email alerts
                  </label>
                  <p className="mb-0 mt-1 max-w-[52ch] text-[15px] text-kt-body">
                    Get an email when someone likes your comment, replies to you, or votes on a face you added.
                  </p>
                </div>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <CenButton
                onClick={handleSave}
                disabled={isUpdating || isUploading || !!nicknameError || !nickname.trim()}
              >
                {isUpdating ? "saving…" : "save changes"}
              </CenButton>
            </div>
          )}
        </section>

        <BadgesSection />
      </div>
    </AppLayout>
  );
};

export default Settings;
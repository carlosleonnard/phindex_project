import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

interface UserMenuPopoverProps {
  user: any;
}

interface UserProfile {
  nickname: string;
  avatar_url: string;
}

export const UserMenuPopover = ({ user }: UserMenuPopoverProps) => {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Your account"
          className="relative ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent p-0"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={profile?.avatar_url || undefined}
              alt={profile?.nickname || "User"}
            />
            <AvatarFallback className="bg-kt-ink font-sc text-[15px] tracking-[0.04em] text-kt-paper">
              {(profile?.nickname || "u").slice(0, 2).toLowerCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 rounded-[3px] border-kt-rule p-0" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={profile?.avatar_url || undefined} 
                alt={profile?.nickname || "User"} 
              />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {profile?.nickname?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.nickname || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-2 space-y-1">
          <Link to={`/member/${user.id}`}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9 px-3">
              <UserRound className="h-4 w-4 mr-2" />
              Your member page
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" size="sm" className="w-full justify-start h-9 px-3">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-8 px-2 text-destructive hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
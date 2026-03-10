import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  message: string;
  profile_id?: string;
  comment_id?: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);

    // Navigate to the profile and scroll to comment if available
    if (notification.profile_id) {
      try {
        // Get the profile slug from profile_id
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('slug')
          .eq('id', notification.profile_id)
          .single();

        if (profileData?.slug) {
          const url = `/user-profile/${profileData.slug}`;
          if (notification.comment_id) {
            // Add comment hash to URL for scrolling
            navigate(`${url}#comment-${notification.comment_id}`);
            
            // Scroll to comment after navigation
            setTimeout(() => {
              const commentElement = document.getElementById(`comment-${notification.comment_id}`);
              if (commentElement) {
                commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add highlight effect
                commentElement.classList.add('bg-primary/10');
                setTimeout(() => {
                  commentElement.classList.remove('bg-primary/10');
                }, 2000);
              }
            }, 100);
          } else {
            navigate(url);
          }
        }
      } catch (error) {
        console.error('Error navigating to profile:', error);
        // Fallback: try to navigate with profile_id directly
        if (notification.profile_id) {
          navigate(`/user-profile/${notification.profile_id}`);
        }
      }
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      setNotifications([]);
      setUnreadCount(0);
      toast({
        title: "Notifications cleared",
        description: "All notifications have been removed.",
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        title: "Error",
        description: "Failed to clear notifications.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for notifications
    if (user) {
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev].slice(0, 10));
            setUnreadCount(prev => prev + 1);
            
            // Show toast for new notification
            toast({
              title: "New notification",
              description: newNotification.message,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, toast]);

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-muted/50">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllNotifications}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="w-full">
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 ${
                  !notification.is_read ? 'bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.created_at).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
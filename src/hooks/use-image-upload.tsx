import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export const useImageUpload = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File, type: 'front' | 'profile'): Promise<string | null> => {
    if (!user) {
      toast.error('You need to be logged in to upload images.');
      return null;
    }

    // Validate file extension against whitelist
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      toast.error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return null;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select only image files.');
      return null;
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 5MB.');
      return null;
    }

    setIsUploading(true);

    try {
      // Use crypto.randomUUID() for a secure, unpredictable filename
      const fileName = `${crypto.randomUUID()}-${type}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        toast.error('Error uploading images. Try again.');
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-profiles')
        .getPublicUrl(data.path);

      toast.success('Image uploaded successfully!');
      return urlData.publicUrl;

    } catch {
      toast.error('Erro inesperado durante o upload.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    if (!user || !imageUrl) return false;

    try {
      // Use URL parsing to safely extract the storage path and prevent path traversal
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        return false;
      }

      // Extract the path after /object/public/user-profiles/
      const pathMatch = parsedUrl.pathname.match(/\/object\/public\/user-profiles\/(.+)$/);
      if (!pathMatch) return false;

      const storagePath = decodeURIComponent(pathMatch[1]);

      // Ensure the path belongs to the current user (prevent path traversal)
      if (!storagePath.startsWith(`${user.id}/`)) return false;

      const { error } = await supabase.storage
        .from('user-profiles')
        .remove([storagePath]);

      if (error) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading
  };
};

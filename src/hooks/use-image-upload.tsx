import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export const useImageUpload = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File, type: 'front' | 'profile'): Promise<string | null> => {
    if (!user) {
      toast.error('You need to be logged in to upload images.');
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
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${type}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error('Error uploading images. Try again.');
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-profiles')
        .getPublicUrl(data.path);

      toast.success('Image uploaded successfully!');
      return urlData.publicUrl;

    } catch (error) {
      console.error('Unexpected error during upload:', error);
      toast.error('Erro inesperado durante o upload.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    if (!user || !imageUrl) return false;

    try {
      // Extract path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('user-profiles')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error during delete:', error);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading
  };
};
import { useState, useCallback } from 'react';
import { storageService, type UploadResult } from '../services/supabase/storage';
import { useUserStore } from '../store';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  result?: UploadResult['data'];
}

export interface UseMediaUploadOptions {
  chatId: string;
  onUploadComplete?: (result: UploadResult['data'], file: File) => void;
  onUploadError?: (error: string, file: File) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
}

export const useMediaUpload = (options: UseMediaUploadOptions) => {
  const { chatId, onUploadComplete, onUploadError, onUploadProgress } = options;
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const currentUser = useUserStore((state) => state.currentUser);

  const generateFileId = useCallback(() => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }, []);

  const updateUploadProgress = useCallback((fileId: string, updates: Partial<UploadProgress>) => {
    setUploads(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], ...updates },
    }));

    const updatedProgress = { ...uploads[fileId], ...updates };
    onUploadProgress?.(updatedProgress);
  }, [uploads, onUploadProgress]);

  const uploadFile = useCallback(async (file: File, compress = true): Promise<string | null> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const fileId = generateFileId();
    const initialProgress: UploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    };

    setUploads(prev => ({ ...prev, [fileId]: initialProgress }));
    setIsUploading(true);

    try {
      // Simulate progress updates (since Supabase doesn't provide real progress)
      updateUploadProgress(fileId, { progress: 25 });

      let result: UploadResult;
      
      // Determine upload type based on file type
      if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        result = await storageService.uploadChatMedia(file, currentUser.uid, chatId, compress);
      } else {
        result = await storageService.uploadChatFile(file, currentUser.uid, chatId);
      }

      updateUploadProgress(fileId, { progress: 75 });

      if (result.error) {
        throw new Error(result.error.message);
      }

      updateUploadProgress(fileId, { 
        progress: 100, 
        status: 'completed',
        result: result.data,
      });

      onUploadComplete?.(result.data, file);
      return fileId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      updateUploadProgress(fileId, { 
        status: 'error', 
        error: errorMessage,
      });

      onUploadError?.(errorMessage, file);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [currentUser, chatId, generateFileId, updateUploadProgress, onUploadComplete, onUploadError]);

  const uploadMultipleFiles = useCallback(async (files: File[], compress = true): Promise<string[]> => {
    const uploadPromises = Array.from(files).map(file => uploadFile(file, compress));
    const results = await Promise.all(uploadPromises);
    return results.filter((id): id is string => id !== null);
  }, [uploadFile]);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const fileId = generateFileId();
    const initialProgress: UploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    };

    setUploads(prev => ({ ...prev, [fileId]: initialProgress }));
    setIsUploading(true);

    try {
      updateUploadProgress(fileId, { progress: 50 });

      const result = await storageService.uploadUserAvatar(file, currentUser.uid);

      if (result.error) {
        throw new Error(result.error.message);
      }

      updateUploadProgress(fileId, { 
        progress: 100, 
        status: 'completed',
        result: result.data,
      });

      onUploadComplete?.(result.data, file);
      return fileId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Avatar upload failed';
      
      updateUploadProgress(fileId, { 
        status: 'error', 
        error: errorMessage,
      });

      onUploadError?.(errorMessage, file);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [currentUser, generateFileId, updateUploadProgress, onUploadComplete, onUploadError]);

  const removeUpload = useCallback((fileId: string) => {
    setUploads(prev => {
      const { [fileId]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearUploads = useCallback(() => {
    setUploads({});
  }, []);

  const getUploadProgress = useCallback((fileId: string): UploadProgress | null => {
    return uploads[fileId] || null;
  }, [uploads]);

  const getAllUploads = useCallback((): UploadProgress[] => {
    return Object.values(uploads);
  }, [uploads]);

  const getCompletedUploads = useCallback((): UploadProgress[] => {
    return Object.values(uploads).filter(upload => upload.status === 'completed');
  }, [uploads]);

  const getFailedUploads = useCallback((): UploadProgress[] => {
    return Object.values(uploads).filter(upload => upload.status === 'error');
  }, [uploads]);

  const retryUpload = useCallback(async (fileId: string, file: File): Promise<string | null> => {
    // Remove the failed upload and try again
    removeUpload(fileId);
    return uploadFile(file);
  }, [removeUpload, uploadFile]);

  return {
    // State
    uploads,
    isUploading,
    
    // Actions
    uploadFile,
    uploadMultipleFiles,
    uploadAvatar,
    removeUpload,
    clearUploads,
    retryUpload,
    
    // Getters
    getUploadProgress,
    getAllUploads,
    getCompletedUploads,
    getFailedUploads,
  };
};
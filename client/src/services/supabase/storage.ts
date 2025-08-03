import { supabase } from '../../config/supabase';
import type { FileObject } from '@supabase/storage-js';

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
  cacheControl?: string;
  contentType?: string;
}

export interface UploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl: string;
  } | null;
  error: Error | null;
}

export interface MediaValidationResult {
  isValid: boolean;
  error?: string;
  compressedFile?: File;
}

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 25 * 1024 * 1024, // 25MB
  document: 50 * 1024 * 1024, // 50MB
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
  ],
} as const;

class SupabaseStorageService {
  private readonly BUCKETS = {
    CHAT_MEDIA: 'chat-media',
    USER_AVATARS: 'user-avatars',
    CHAT_FILES: 'chat-files',
  } as const;

  // Initialize storage buckets
  async initializeBuckets(): Promise<void> {
    const buckets = Object.values(this.BUCKETS);
    
    for (const bucketName of buckets) {
      const { data: existingBucket } = await supabase.storage.getBucket(bucketName);
      
      if (!existingBucket) {
        await supabase.storage.createBucket(bucketName, {
          public: false,
          allowedMimeTypes: [
            ...ALLOWED_FILE_TYPES.image,
            ...ALLOWED_FILE_TYPES.video,
            ...ALLOWED_FILE_TYPES.audio,
            ...ALLOWED_FILE_TYPES.document,
          ],
          fileSizeLimit: Math.max(...Object.values(FILE_SIZE_LIMITS)),
        });
      }
    }
  }

  // Validate file before upload
  validateFile(file: File, type: keyof typeof ALLOWED_FILE_TYPES): MediaValidationResult {
    const allowedTypes = ALLOWED_FILE_TYPES[type];
    const sizeLimit = FILE_SIZE_LIMITS[type];

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed for ${type} files`,
      };
    }

    // Check file size
    if (file.size > sizeLimit) {
      return {
        isValid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(sizeLimit / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    return { isValid: true };
  }

  // Compress image if needed
  async compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Generate unique file path
  private generateFilePath(userId: string, chatId: string, fileName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split('.').pop();
    return `${userId}/${chatId}/${timestamp}_${randomId}.${extension}`;
  }

  // Upload file to storage
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(options.path, options.file, {
          upsert: options.upsert || false,
          cacheControl: options.cacheControl || '3600',
          contentType: options.contentType || options.file.type,
        });

      if (error) {
        return { data: null, error };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path);

      return {
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl: urlData.publicUrl,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  // Upload chat media (images, videos, audio)
  async uploadChatMedia(
    file: File,
    userId: string,
    chatId: string,
    compress = true
  ): Promise<UploadResult> {
    // Determine file type
    let fileType: keyof typeof ALLOWED_FILE_TYPES;
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else if (file.type.startsWith('audio/')) {
      fileType = 'audio';
    } else {
      return {
        data: null,
        error: new Error('Unsupported media type'),
      };
    }

    // Validate file
    const validation = this.validateFile(file, fileType);
    if (!validation.isValid) {
      return {
        data: null,
        error: new Error(validation.error),
      };
    }

    // Compress image if needed
    let fileToUpload = file;
    if (fileType === 'image' && compress) {
      fileToUpload = await this.compressImage(file);
    }

    // Generate path and upload
    const path = this.generateFilePath(userId, chatId, file.name);
    
    return this.uploadFile({
      bucket: this.BUCKETS.CHAT_MEDIA,
      path,
      file: fileToUpload,
    });
  }

  // Upload chat file (documents, archives)
  async uploadChatFile(file: File, userId: string, chatId: string): Promise<UploadResult> {
    // Validate file
    const validation = this.validateFile(file, 'document');
    if (!validation.isValid) {
      return {
        data: null,
        error: new Error(validation.error),
      };
    }

    // Generate path and upload
    const path = this.generateFilePath(userId, chatId, file.name);
    
    return this.uploadFile({
      bucket: this.BUCKETS.CHAT_FILES,
      path,
      file,
    });
  }

  // Upload user avatar
  async uploadUserAvatar(file: File, userId: string): Promise<UploadResult> {
    // Validate file
    const validation = this.validateFile(file, 'image');
    if (!validation.isValid) {
      return {
        data: null,
        error: new Error(validation.error),
      };
    }

    // Compress image
    const compressedFile = await this.compressImage(file, 400, 400, 0.9);
    
    // Generate path and upload
    const path = `${userId}/avatar_${Date.now()}.${file.name.split('.').pop()}`;
    
    return this.uploadFile({
      bucket: this.BUCKETS.USER_AVATARS,
      path,
      file: compressedFile,
      upsert: true,
    });
  }

  // Delete file from storage
  async deleteFile(bucket: string, path: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // List files in a directory
  async listFiles(bucket: string, path: string): Promise<{ data: FileObject[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(path);
      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Get file metadata
  async getFileMetadata(bucket: string, path: string): Promise<{ data: FileObject | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(path.split('/').slice(0, -1).join('/'));
      
      if (error || !data) {
        return { data: null, error };
      }

      const fileName = path.split('/').pop();
      const fileData = data.find(file => file.name === fileName);
      
      return { data: fileData || null, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Generate signed URL for private files
  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<{ data: string | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      
      return { data: data?.signedUrl || null, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Get public URL for public files
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // Create thumbnail for video
  async createVideoThumbnail(file: File): Promise<File | null> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = 1; // Seek to 1 second
      };

      video.onseeked = () => {
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], `${file.name}_thumbnail.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(thumbnailFile);
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });
  }

  // Get file type category
  getFileTypeCategory(mimeType: string): keyof typeof ALLOWED_FILE_TYPES | 'other' {
    if (ALLOWED_FILE_TYPES.image.includes(mimeType)) return 'image';
    if (ALLOWED_FILE_TYPES.video.includes(mimeType)) return 'video';
    if (ALLOWED_FILE_TYPES.audio.includes(mimeType)) return 'audio';
    if (ALLOWED_FILE_TYPES.document.includes(mimeType)) return 'document';
    return 'other';
  }
}

// Export singleton instance
export const storageService = new SupabaseStorageService();
export default storageService;
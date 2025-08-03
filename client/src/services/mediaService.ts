import { storageService } from './supabase/storage';
import type { MediaItem } from '../components/ui/MediaGallery';

export interface MediaFilter {
  chatId?: string;
  userId?: string;
  type?: 'image' | 'video' | 'audio' | 'file';
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, { count: number; size: number }>;
  recentUploads: number; // Last 7 days
}

class MediaService {
  // Get media items for a chat
  async getChatMedia(chatId: string, filter?: Omit<MediaFilter, 'chatId'>): Promise<MediaItem[]> {
    try {
      // This would typically fetch from your database
      // For now, we'll return mock data
      const mockItems: MediaItem[] = [
        {
          id: '1',
          type: 'image',
          url: 'https://via.placeholder.com/300x200',
          fileName: 'screenshot.png',
          size: 1024 * 500, // 500KB
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'user1',
          dimensions: { width: 300, height: 200 },
          mimeType: 'image/png',
        },
        {
          id: '2',
          type: 'video',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          thumbnail: 'https://via.placeholder.com/300x200',
          fileName: 'sample_video.mp4',
          size: 1024 * 1024, // 1MB
          uploadedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          uploadedBy: 'user2',
          dimensions: { width: 1280, height: 720 },
          duration: 30,
          mimeType: 'video/mp4',
        },
      ];

      // Apply filters
      let filteredItems = mockItems;

      if (filter?.type) {
        filteredItems = filteredItems.filter(item => item.type === filter.type);
      }

      if (filter?.dateFrom) {
        filteredItems = filteredItems.filter(item => 
          new Date(item.uploadedAt) >= filter.dateFrom!
        );
      }

      if (filter?.dateTo) {
        filteredItems = filteredItems.filter(item => 
          new Date(item.uploadedAt) <= filter.dateTo!
        );
      }

      if (filter?.userId) {
        filteredItems = filteredItems.filter(item => item.uploadedBy === filter.userId);
      }

      // Apply pagination
      if (filter?.offset) {
        filteredItems = filteredItems.slice(filter.offset);
      }

      if (filter?.limit) {
        filteredItems = filteredItems.slice(0, filter.limit);
      }

      return filteredItems;
    } catch (error) {
      console.error('Error fetching chat media:', error);
      return [];
    }
  }

  // Get media statistics
  async getMediaStats(_chatId?: string): Promise<MediaStats> {
    try {
      // This would typically fetch from your database
      // For now, we'll return mock data
      const mockStats: MediaStats = {
        totalFiles: 25,
        totalSize: 1024 * 1024 * 50, // 50MB
        byType: {
          image: { count: 15, size: 1024 * 1024 * 20 }, // 20MB
          video: { count: 5, size: 1024 * 1024 * 25 }, // 25MB
          audio: { count: 3, size: 1024 * 1024 * 3 }, // 3MB
          file: { count: 2, size: 1024 * 1024 * 2 }, // 2MB
        },
        recentUploads: 8,
      };

      return mockStats;
    } catch (error) {
      console.error('Error fetching media stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        byType: {},
        recentUploads: 0,
      };
    }
  }

  // Download media file
  async downloadMedia(item: MediaItem): Promise<void> {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading media:', error);
      throw new Error('Failed to download file');
    }
  }

  // Delete media file
  async deleteMedia(item: MediaItem): Promise<void> {
    try {
      // Extract bucket and path from URL
      const url = new URL(item.url);
      const pathParts = url.pathname.split('/');
      const bucket = pathParts[pathParts.length - 2];
      const fileName = pathParts[pathParts.length - 1];
      
      const { error } = await storageService.deleteFile(bucket, fileName);
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Share media file
  async shareMedia(item: MediaItem): Promise<void> {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.fileName,
          text: `Check out this ${item.type}`,
          url: item.url,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(item.url);
        // You might want to show a toast notification here
        console.log('Media URL copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing media:', error);
      throw new Error('Failed to share file');
    }
  }

  // Get media file metadata
  async getMediaMetadata(url: string): Promise<{
    dimensions?: { width: number; height: number };
    duration?: number;
    size?: number;
  }> {
    return new Promise((resolve) => {
      const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      const isVideo = url.match(/\.(mp4|webm|ogg|avi|mov)$/i);
      const isAudio = url.match(/\.(mp3|wav|ogg|m4a|webm)$/i);

      if (isImage) {
        const img = new Image();
        img.onload = () => {
          resolve({
            dimensions: { width: img.naturalWidth, height: img.naturalHeight },
          });
        };
        img.onerror = () => resolve({});
        img.src = url;
      } else if (isVideo) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          resolve({
            dimensions: { width: video.videoWidth, height: video.videoHeight },
            duration: video.duration,
          });
        };
        video.onerror = () => resolve({});
        video.src = url;
      } else if (isAudio) {
        const audio = document.createElement('audio');
        audio.onloadedmetadata = () => {
          resolve({
            duration: audio.duration,
          });
        };
        audio.onerror = () => resolve({});
        audio.src = url;
      } else {
        resolve({});
      }
    });
  }

  // Compress image before upload
  async compressImage(
    file: File, 
    maxWidth = 1920, 
    maxHeight = 1080, 
    quality = 0.8
  ): Promise<File> {
    return storageService.compressImage(file, maxWidth, maxHeight, quality);
  }

  // Create video thumbnail
  async createVideoThumbnail(file: File): Promise<File | null> {
    return storageService.createVideoThumbnail(file);
  }

  // Validate file before upload
  validateFile(file: File, type: 'image' | 'video' | 'audio' | 'document') {
    return storageService.validateFile(file, type);
  }

  // Get file type category
  getFileTypeCategory(mimeType: string) {
    return storageService.getFileTypeCategory(mimeType);
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file extension from filename
  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  // Check if file is supported
  isSupportedFile(file: File): boolean {
    const category = this.getFileTypeCategory(file.type);
    return category !== 'other';
  }

  // Get MIME type from file extension
  getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      
      // Videos
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      zip: 'application/zip',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}

// Export singleton instance
export const mediaService = new MediaService();
export default mediaService;
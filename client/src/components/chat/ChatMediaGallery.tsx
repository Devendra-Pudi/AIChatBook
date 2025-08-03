import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Photo,
  VideoLibrary,
  AudioFile,
  InsertDriveFile,
  MoreVert,
  Download,
  Refresh,
} from '@mui/icons-material';
import { MediaGallery, type MediaItem } from '../ui/MediaGallery';
import { mediaService, type MediaFilter } from '../../services/mediaService';
import { useResponsive } from '../../hooks';

export interface ChatMediaGalleryProps {
  chatId: string;
  onMediaDelete?: (item: MediaItem) => void;
  onMediaShare?: (item: MediaItem) => void;
  compact?: boolean;
}

export const ChatMediaGallery: React.FC<ChatMediaGalleryProps> = ({
  chatId,
  onMediaDelete,
  onMediaShare,
  compact = false,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video' | 'audio' | 'file'>('all');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [loading, setLoading] = useState(false);
  // const { isMobile } = useResponsive(); // Commented out for now

  // Load media items
  const loadMediaItems = useCallback(async (type?: MediaFilter['type']) => {
    setLoading(true);
    try {
      const filter: MediaFilter = {
        limit: 50,
        ...(type && type !== 'file' && { type }),
      };
      
      const items = await mediaService.getChatMedia(chatId, filter);
      setMediaItems(items);
    } catch (error) {
      console.error('Error loading media items:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Load media on mount and when type changes
  useEffect(() => {
    const typeFilter = selectedType === 'all' ? undefined : 
                      selectedType === 'file' ? 'document' as const : selectedType;
    loadMediaItems(typeFilter);
  }, [loadMediaItems, selectedType]);

  // Get media counts by type
  const getMediaCounts = useCallback(() => {
    const counts = {
      all: mediaItems.length,
      image: mediaItems.filter(item => item.type === 'image').length,
      video: mediaItems.filter(item => item.type === 'video').length,
      audio: mediaItems.filter(item => item.type === 'audio').length,
      file: mediaItems.filter(item => item.type !== 'image' && item.type !== 'video' && item.type !== 'audio').length,
    };
    return counts;
  }, [mediaItems]);

  const handleTypeSelect = useCallback((type: typeof selectedType) => {
    setSelectedType(type);
    setMenuAnchor(null);
  }, []);

  const handleMediaDownload = useCallback(async (item: MediaItem) => {
    try {
      await mediaService.downloadMedia(item);
    } catch (error) {
      console.error('Error downloading media:', error);
      // You might want to show a toast notification here
    }
  }, []);

  const handleMediaDelete = useCallback(async (item: MediaItem) => {
    try {
      await mediaService.deleteMedia(item);
      // Remove from local state
      setMediaItems(prev => prev.filter(i => i.id !== item.id));
      onMediaDelete?.(item);
    } catch (error) {
      console.error('Error deleting media:', error);
      // You might want to show a toast notification here
    }
  }, [onMediaDelete]);

  const handleMediaShare = useCallback(async (item: MediaItem) => {
    try {
      await mediaService.shareMedia(item);
      onMediaShare?.(item);
    } catch (error) {
      console.error('Error sharing media:', error);
      // You might want to show a toast notification here
    }
  }, [onMediaShare]);

  const handleRefresh = useCallback(() => {
    const typeFilter = selectedType === 'all' ? undefined : 
                      selectedType === 'file' ? 'document' as const : selectedType;
    loadMediaItems(typeFilter);
  }, [loadMediaItems, selectedType]);

  const counts = getMediaCounts();
  const filteredItems = selectedType === 'all' 
    ? mediaItems 
    : selectedType === 'file'
      ? mediaItems.filter(item => item.type !== 'image' && item.type !== 'video' && item.type !== 'audio')
      : mediaItems.filter(item => item.type === selectedType);

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Quick access buttons */}
        <Tooltip title={`Images (${counts.image})`}>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedType('image');
              setGalleryOpen(true);
            }}
            disabled={counts.image === 0}
          >
            <Badge badgeContent={counts.image} color="primary" max={99}>
              <Photo fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title={`Videos (${counts.video})`}>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedType('video');
              setGalleryOpen(true);
            }}
            disabled={counts.video === 0}
          >
            <Badge badgeContent={counts.video} color="primary" max={99}>
              <VideoLibrary fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title={`Audio (${counts.audio})`}>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedType('audio');
              setGalleryOpen(true);
            }}
            disabled={counts.audio === 0}
          >
            <Badge badgeContent={counts.audio} color="primary" max={99}>
              <AudioFile fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title={`Files (${counts.file})`}>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedType('file');
              setGalleryOpen(true);
            }}
            disabled={counts.file === 0}
          >
            <Badge badgeContent={counts.file} color="primary" max={99}>
              <InsertDriveFile fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <MediaGallery
          items={filteredItems}
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          onDownload={handleMediaDownload}
          onDelete={handleMediaDelete}
          onShare={handleMediaShare}
          title={`Chat Media - ${selectedType === 'all' ? 'All' : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          Media Gallery
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={handleRefresh} disabled={loading}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Filter buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <IconButton
          variant={selectedType === 'all' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleTypeSelect('all')}
          sx={{
            bgcolor: selectedType === 'all' ? 'primary.main' : 'transparent',
            color: selectedType === 'all' ? 'white' : 'text.primary',
            '&:hover': {
              bgcolor: selectedType === 'all' ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          All ({counts.all})
        </IconButton>

        <IconButton
          variant={selectedType === 'image' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleTypeSelect('image')}
          disabled={counts.image === 0}
          startIcon={<Photo fontSize="small" />}
          sx={{
            bgcolor: selectedType === 'image' ? 'primary.main' : 'transparent',
            color: selectedType === 'image' ? 'white' : 'text.primary',
            '&:hover': {
              bgcolor: selectedType === 'image' ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          Images ({counts.image})
        </IconButton>

        <IconButton
          variant={selectedType === 'video' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleTypeSelect('video')}
          disabled={counts.video === 0}
          startIcon={<VideoLibrary fontSize="small" />}
          sx={{
            bgcolor: selectedType === 'video' ? 'primary.main' : 'transparent',
            color: selectedType === 'video' ? 'white' : 'text.primary',
            '&:hover': {
              bgcolor: selectedType === 'video' ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          Videos ({counts.video})
        </IconButton>

        <IconButton
          variant={selectedType === 'audio' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleTypeSelect('audio')}
          disabled={counts.audio === 0}
          startIcon={<AudioFile fontSize="small" />}
          sx={{
            bgcolor: selectedType === 'audio' ? 'primary.main' : 'transparent',
            color: selectedType === 'audio' ? 'white' : 'text.primary',
            '&:hover': {
              bgcolor: selectedType === 'audio' ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          Audio ({counts.audio})
        </IconButton>

        <IconButton
          variant={selectedType === 'file' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleTypeSelect('file')}
          disabled={counts.file === 0}
          startIcon={<InsertDriveFile fontSize="small" />}
          sx={{
            bgcolor: selectedType === 'file' ? 'primary.main' : 'transparent',
            color: selectedType === 'file' ? 'white' : 'text.primary',
            '&:hover': {
              bgcolor: selectedType === 'file' ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          Files ({counts.file})
        </IconButton>
      </Box>

      {/* Media grid */}
      {filteredItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading media...' : `No ${selectedType === 'all' ? '' : selectedType + ' '}files found`}
          </Typography>
        </Box>
      ) : (
        <MediaGallery
          items={filteredItems}
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          onDownload={handleMediaDownload}
          onDelete={handleMediaDelete}
          onShare={handleMediaShare}
          title={`Chat Media - ${selectedType === 'all' ? 'All' : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`}
        />
      )}

      {/* Options menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setGalleryOpen(true); setMenuAnchor(null); }}>
          <ListItemIcon>
            <Photo fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open Gallery</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { handleRefresh(); setMenuAnchor(null); }}>
          <ListItemIcon>
            <Refresh fontSize="small" />
          </ListItemIcon>
          <ListItemText>Refresh</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download All</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
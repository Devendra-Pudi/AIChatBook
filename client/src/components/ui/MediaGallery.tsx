import React, { useState, useCallback } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close,
  Download,
  Delete,
  Share,
  MoreVert,
  ZoomIn,
  PlayArrow,
  Image,
  VideoFile,
  AudioFile,
  InsertDriveFile,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { AudioPlayer } from './AudioPlayer';
import type { MediaContent, FileContent } from '../../types';

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  thumbnail?: string;
  fileName: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  mimeType: string;
}

export interface MediaGalleryProps {
  items: MediaItem[];
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
  onDownload?: (item: MediaItem) => void;
  onDelete?: (item: MediaItem) => void;
  onShare?: (item: MediaItem) => void;
  showActions?: boolean;
  title?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <Image />;
    case 'video':
      return <VideoFile />;
    case 'audio':
      return <AudioFile />;
    default:
      return <InsertDriveFile />;
  }
};

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  items,
  open,
  onClose,
  initialIndex = 0,
  onDownload,
  onDelete,
  onShare,
  showActions = true,
  title = "Media Gallery",
}) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const currentItem = items[currentIndex];

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  const handleItemClick = useCallback((index: number) => {
    setCurrentIndex(index);
    setViewMode('detail');
  }, []);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, item: MediaItem) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedItem(item);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setSelectedItem(null);
  }, []);

  const handleAction = useCallback((action: 'download' | 'delete' | 'share', item: MediaItem) => {
    handleMenuClose();
    
    switch (action) {
      case 'download':
        onDownload?.(item);
        break;
      case 'delete':
        onDelete?.(item);
        break;
      case 'share':
        onShare?.(item);
        break;
    }
  }, [onDownload, onDelete, onShare, handleMenuClose]);

  const renderMediaContent = useCallback((item: MediaItem, isFullSize = false) => {
    const commonStyles = {
      width: '100%',
      height: isFullSize ? 'auto' : 200,
      objectFit: 'cover' as const,
      borderRadius: 1,
    };

    switch (item.type) {
      case 'image':
        return (
          <Box
            component="img"
            src={item.url}
            alt={item.fileName}
            sx={{
              ...commonStyles,
              maxHeight: isFullSize ? '70vh' : 200,
              cursor: isFullSize ? 'default' : 'pointer',
            }}
            onClick={isFullSize ? undefined : () => handleItemClick(items.indexOf(item))}
          />
        );

      case 'video':
        return (
          <Box
            component="video"
            src={item.url}
            controls={isFullSize}
            poster={item.thumbnail}
            sx={{
              ...commonStyles,
              maxHeight: isFullSize ? '70vh' : 200,
            }}
            onClick={isFullSize ? undefined : () => handleItemClick(items.indexOf(item))}
          />
        );

      case 'audio':
        return isFullSize ? (
          <AudioPlayer
            src={item.url}
            fileName={item.fileName}
            duration={item.duration}
            showDownload={false}
            showControls={true}
          />
        ) : (
          <Paper
            sx={{
              ...commonStyles,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
              cursor: 'pointer',
            }}
            onClick={() => handleItemClick(items.indexOf(item))}
          >
            <AudioFile sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" align="center" noWrap sx={{ px: 1 }}>
              {item.fileName}
            </Typography>
          </Paper>
        );

      default:
        return (
          <Paper
            sx={{
              ...commonStyles,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
              cursor: 'pointer',
            }}
            onClick={() => handleItemClick(items.indexOf(item))}
          >
            {getFileIcon(item.type)}
            <Typography variant="caption" align="center" noWrap sx={{ px: 1, mt: 1 }}>
              {item.fileName}
            </Typography>
          </Paper>
        );
    }
  }, [items, handleItemClick]);

  const renderGridView = () => (
    <Grid container spacing={2} sx={{ p: 2 }}>
      {items.map((item, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
          <Paper
            sx={{
              position: 'relative',
              overflow: 'hidden',
              '&:hover .media-overlay': {
                opacity: 1,
              },
            }}
          >
            {renderMediaContent(item)}
            
            {/* Overlay with actions */}
            <Box
              className="media-overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: 0,
                transition: 'opacity 0.2s',
                p: 1,
              }}
            >
              {/* Top actions */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {showActions && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, item)}
                    sx={{ color: 'white' }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {/* Bottom info */}
              <Box>
                <Typography variant="caption" sx={{ color: 'white', display: 'block' }} noWrap>
                  {item.fileName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {formatFileSize(item.size)}
                </Typography>
              </Box>
            </Box>

            {/* Type indicator */}
            <Chip
              size="small"
              label={item.type.toUpperCase()}
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                fontSize: '0.6rem',
              }}
            />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  const renderDetailView = () => {
    if (!currentItem) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <IconButton onClick={() => setViewMode('grid')}>
            <ArrowBack />
          </IconButton>
          
          <Typography variant="h6" sx={{ flex: 1, mx: 2 }}>
            {currentItem.fileName}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            {currentIndex + 1} of {items.length}
          </Typography>

          {items.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={handlePrevious}>
                <ArrowBack />
              </IconButton>
              <IconButton onClick={handleNext}>
                <ArrowForward />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Media content */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          {renderMediaContent(currentItem, true)}
        </Box>

        {/* Media info */}
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                File name: {currentItem.fileName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {formatFileSize(currentItem.size)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type: {currentItem.mimeType}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Uploaded: {formatDate(currentItem.uploadedAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                By: {currentItem.uploadedBy}
              </Typography>
              {currentItem.dimensions && (
                <Typography variant="body2" color="text.secondary">
                  Dimensions: {currentItem.dimensions.width} × {currentItem.dimensions.height}
                </Typography>
              )}
              {currentItem.duration && (
                <Typography variant="body2" color="text.secondary">
                  Duration: {Math.floor(currentItem.duration / 60)}:{Math.floor(currentItem.duration % 60).toString().padStart(2, '0')}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' },
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {title}
            </Typography>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {items.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No media files found
                </Typography>
              </Box>
            ) : viewMode === 'grid' ? (
              renderGridView()
            ) : (
              renderDetailView()
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Context menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {onDownload && (
          <MenuItem onClick={() => selectedItem && handleAction('download', selectedItem)}>
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        )}
        
        {onShare && (
          <MenuItem onClick={() => selectedItem && handleAction('share', selectedItem)}>
            <ListItemIcon>
              <Share fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem onClick={() => selectedItem && handleAction('delete', selectedItem)}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
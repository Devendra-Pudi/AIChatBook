import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Close,
  CloudUpload,
  Mic,
  Image,
  VideoFile,
  AudioFile,
  InsertDriveFile,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { FileDropZone } from './FileDropZone';
import { AudioRecorder } from './AudioRecorder';
import { useMediaUpload, type UploadProgress } from '../../hooks/useMediaUpload';
import type { MessageContent } from '../../types';

export interface MediaUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (content: MessageContent) => void;
  chatId: string;
  maxFiles?: number;
  title?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`upload-tabpanel-${index}`}
    aria-labelledby={`upload-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
  </div>
);

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return <Image />;
  }
  if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension || '')) {
    return <VideoFile />;
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'webm'].includes(extension || '')) {
    return <AudioFile />;
  }
  return <InsertDriveFile />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const MediaUploadDialog: React.FC<MediaUploadDialogProps> = ({
  open,
  onClose,
  onUploadComplete,
  chatId,
  maxFiles = 10,
  title = "Upload Media",
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; result: any }>>([]);

  const {
    uploads,
    isUploading,
    uploadFile,
    uploadMultipleFiles,
    removeUpload,
    clearUploads,
    getAllUploads,
    getCompletedUploads,
  } = useMediaUpload({
    chatId,
    onUploadComplete: (result, file) => {
      if (result) {
        setUploadedFiles(prev => [...prev, { file, result }]);
      }
    },
    onUploadError: (error, file) => {
      console.error('Upload error:', error, file);
    },
  });

  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    await uploadMultipleFiles(files);
  }, [uploadMultipleFiles]);

  const handleAudioRecorded = useCallback(async (audioBlob: Blob, duration: number) => {
    const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
      type: audioBlob.type,
      lastModified: Date.now(),
    });
    
    await uploadFile(audioFile);
  }, [uploadFile]);

  const handleSendFiles = useCallback(() => {
    const completedUploads = getCompletedUploads();
    
    if (completedUploads.length === 0) {
      return;
    }

    // Send each completed upload as a separate message
    completedUploads.forEach((upload) => {
      if (upload.result) {
        const uploadedFile = uploadedFiles.find(f => f.file.name === upload.fileName);
        
        if (uploadedFile) {
          const content: MessageContent = {
            media: {
              type: uploadedFile.file.type.startsWith('image/') ? 'image' :
                    uploadedFile.file.type.startsWith('video/') ? 'video' : 'audio',
              url: upload.result.publicUrl,
              fileName: upload.fileName,
              size: uploadedFile.file.size,
              ...(uploadedFile.file.type.startsWith('image/') && {
                dimensions: { width: 0, height: 0 }, // Would need to get actual dimensions
              }),
            },
          };
          
          onUploadComplete(content);
        }
      }
    });

    // Clear uploads and close dialog
    clearUploads();
    setUploadedFiles([]);
    onClose();
  }, [getCompletedUploads, uploadedFiles, onUploadComplete, clearUploads, onClose]);

  const handleClose = useCallback(() => {
    clearUploads();
    setUploadedFiles([]);
    onClose();
  }, [clearUploads, onClose]);

  const handleRemoveUpload = useCallback((fileId: string) => {
    removeUpload(fileId);
    setUploadedFiles(prev => prev.filter(f => f.file.name !== getAllUploads().find(u => u.fileId === fileId)?.fileName));
  }, [removeUpload, getAllUploads]);

  const allUploads = getAllUploads();
  const completedUploads = getCompletedUploads();
  const hasCompletedUploads = completedUploads.length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="upload tabs">
            <Tab
              icon={<CloudUpload />}
              label="Files"
              id="upload-tab-0"
              aria-controls="upload-tabpanel-0"
            />
            <Tab
              icon={<Mic />}
              label="Audio"
              id="upload-tab-1"
              aria-controls="upload-tabpanel-1"
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ p: 2 }}>
              <FileDropZone
                onFilesSelected={handleFilesSelected}
                multiple={true}
                maxFiles={maxFiles}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                showPreview={false}
              />
              
              {/* Upload progress info */}
              {allUploads.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload Progress ({completedUploads.length}/{allUploads.length} completed)
                  </Typography>
                  
                  <List dense>
                    {allUploads.map((upload) => (
                      <ListItem key={upload.fileId}>
                        <ListItemIcon>
                          {upload.status === 'completed' ? (
                            <CheckCircle color="success" />
                          ) : upload.status === 'error' ? (
                            <ErrorIcon color="error" />
                          ) : (
                            getFileIcon(upload.fileName)
                          )}
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={upload.fileName}
                          secondary={
                            <Box>
                              {upload.status === 'uploading' && (
                                <LinearProgress
                                  variant="determinate"
                                  value={upload.progress}
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                              {upload.status === 'error' && (
                                <Typography variant="caption" color="error">
                                  {upload.error}
                                </Typography>
                              )}
                              {upload.status === 'completed' && (
                                <Typography variant="caption" color="success.main">
                                  Upload completed
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveUpload(upload.fileId)}
                            size="small"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Record an audio message to share with the chat.
              </Typography>
              
              <AudioRecorder
                onRecordingComplete={handleAudioRecorded}
                maxDuration={300} // 5 minutes
                disabled={isUploading}
              />
            </Box>
          </TabPanel>
        </Box>

        {/* Upload status */}
        {isUploading && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Alert severity="info">
              Uploading files... Please wait.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSendFiles}
          disabled={!hasCompletedUploads || isUploading}
          startIcon={<CloudUpload />}
        >
          Send Files ({completedUploads.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};
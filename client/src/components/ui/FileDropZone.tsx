import React, { useCallback, useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Alert,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  AttachFile,
  Close,
  Image,
  VideoFile,
  AudioFile,
  InsertDriveFile,
  Error as ErrorIcon,
  CheckCircle,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { storageService, FILE_SIZE_LIMITS } from '../../services/supabase/storage';
import type { UploadProgress } from '../../hooks/useMediaUpload';

export interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  showPreview?: boolean;
  compact?: boolean;
  children?: React.ReactNode;
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  error?: string;
}

const getFileIcon = (file: File) => {
  const type = storageService.getFileTypeCategory(file.type);
  
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  onUploadProgress,
  accept,
  multiple = true,
  maxFiles = 10,
  maxSize,
  disabled = false,
  showPreview = true,
  compact = false,
  children,
}) => {
  const theme = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (maxSize && file.size > maxSize) {
      return `File size ${formatFileSize(file.size)} exceeds limit of ${formatFileSize(maxSize)}`;
    }

    // Check file type limits
    const fileType = storageService.getFileTypeCategory(file.type);
    const typeLimit = FILE_SIZE_LIMITS[fileType as keyof typeof FILE_SIZE_LIMITS];
    
    if (typeLimit && file.size > typeLimit) {
      return `${fileType} files cannot exceed ${formatFileSize(typeLimit)}`;
    }

    // Validate file type if accept is specified
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isAccepted = acceptedTypes.some(acceptedType => {
        if (acceptedType.startsWith('.')) {
          return file.name.toLowerCase().endsWith(acceptedType.toLowerCase());
        }
        return file.type.match(acceptedType.replace('*', '.*'));
      });
      
      if (!isAccepted) {
        return `File type ${file.type} is not accepted`;
      }
    }

    return null;
  }, [maxSize, accept]);

  const createFilePreview = useCallback((file: File): FilePreview => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const error = validateFile(file);
    
    const preview: FilePreview = {
      file,
      id,
      error: error || undefined,
    };

    // Create preview URL for images
    if (file.type.startsWith('image/') && !error) {
      preview.preview = URL.createObjectURL(file);
    }

    return preview;
  }, [validateFile]);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      setError(`Cannot upload more than ${maxFiles} files`);
      return;
    }

    const newPreviews = fileArray.map(createFilePreview);
    const validFiles = newPreviews.filter(preview => !preview.error).map(preview => preview.file);
    
    setFiles(prev => [...prev, ...newPreviews]);
    setError(null);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [files.length, maxFiles, createFilePreview, onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [disabled, handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const updated = prev.filter(file => file.id !== id);
      // Revoke object URL to prevent memory leaks
      const removedFile = prev.find(file => file.id === id);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updated;
    });
  }, []);

  const clearFiles = useCallback(() => {
    // Revoke all object URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setError(null);
  }, [files]);

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const dropZoneStyles = {
    border: `2px dashed ${isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: isDragOver 
      ? theme.palette.action.hover 
      : disabled 
        ? theme.palette.action.disabledBackground 
        : 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: theme.transitions.create(['border-color', 'background-color']),
    padding: compact ? theme.spacing(2) : theme.spacing(4),
    textAlign: 'center' as const,
    minHeight: compact ? 80 : 120,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
  };

  return (
    <Box>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Drop zone */}
      <Box
        sx={dropZoneStyles}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {children || (
          <>
            <CloudUpload 
              sx={{ 
                fontSize: compact ? 32 : 48, 
                color: disabled ? 'text.disabled' : 'text.secondary',
                mb: 1,
              }} 
            />
            <Typography 
              variant={compact ? "body2" : "body1"} 
              color={disabled ? 'text.disabled' : 'text.primary'}
              fontWeight={500}
            >
              {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
            >
              or click to browse
            </Typography>
            {maxSize && (
              <Typography variant="caption" color="text.secondary">
                Max size: {formatFileSize(maxSize)}
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* File previews */}
      {showPreview && files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2">
              Selected Files ({files.length})
            </Typography>
            <IconButton size="small" onClick={clearFiles}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {files.map((filePreview) => (
              <Paper
                key={filePreview.id}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  bgcolor: filePreview.error ? 'error.light' : 'background.paper',
                  border: filePreview.error ? `1px solid ${theme.palette.error.main}` : 'none',
                }}
              >
                {/* File icon or preview */}
                <Box sx={{ flexShrink: 0 }}>
                  {filePreview.preview ? (
                    <Box
                      component="img"
                      src={filePreview.preview}
                      sx={{
                        width: 40,
                        height: 40,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  ) : (
                    <Box sx={{ color: filePreview.error ? 'error.main' : 'text.secondary' }}>
                      {getFileIcon(filePreview.file)}
                    </Box>
                  )}
                </Box>

                {/* File info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {filePreview.file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(filePreview.file.size)}
                  </Typography>
                  {filePreview.error && (
                    <Typography variant="caption" color="error.main" display="block">
                      {filePreview.error}
                    </Typography>
                  )}
                </Box>

                {/* Status icon */}
                <Box sx={{ flexShrink: 0 }}>
                  {filePreview.error ? (
                    <ErrorIcon color="error" fontSize="small" />
                  ) : (
                    <CheckCircle color="success" fontSize="small" />
                  )}
                </Box>

                {/* Remove button */}
                <IconButton
                  size="small"
                  onClick={() => removeFile(filePreview.id)}
                  sx={{ flexShrink: 0 }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
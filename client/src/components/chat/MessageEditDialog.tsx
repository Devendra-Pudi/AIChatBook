import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Close,
  FormatBold,
  FormatItalic,
  Code,
} from '@mui/icons-material';
import { useResponsive } from '../../hooks';
import type { Message, MessageContent } from '../../types';

interface MessageEditDialogProps {
  open: boolean;
  message: Message | null;
  onClose: () => void;
  onSave: (messageId: string, newContent: MessageContent) => Promise<{ success: boolean; error?: string }>;
}

export const MessageEditDialog: React.FC<MessageEditDialogProps> = ({
  open,
  message,
  onClose,
  onSave,
}) => {
  const [editedText, setEditedText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isMobile } = useResponsive();

  // Initialize text when message changes
  useEffect(() => {
    if (message?.content.text) {
      setEditedText(message.content.text);
    } else {
      setEditedText('');
    }
    setError(null);
  }, [message]);

  const handleSave = async () => {
    if (!message || !editedText.trim()) return;

    try {
      setSaving(true);
      setError(null);

      const newContent: MessageContent = {
        ...message.content,
        text: editedText.trim(),
      };

      const result = await onSave(message.messageId, newContent);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to edit message');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit message');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  const applyFormatting = (format: 'bold' | 'italic' | 'code') => {
    const textarea = document.getElementById('edit-message-input') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selectedText = editedText.slice(start, end);
    
    let formattedText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        cursorOffset = selectedText ? 0 : 1;
        break;
    }

    const newText = editedText.slice(0, start) + formattedText + editedText.slice(end);
    setEditedText(newText);

    // Set cursor position
    setTimeout(() => {
      const newPosition = selectedText 
        ? start + formattedText.length 
        : start + formattedText.length - cursorOffset;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  };

  // Check if message can be edited (within time limit)
  const canEdit = message ? (() => {
    const messageTime = new Date(message.timestamp);
    const now = new Date();
    const timeDiff = now.getTime() - messageTime.getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    return timeDiff <= fifteenMinutes;
  })() : false;

  if (!message) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Edit Message</Typography>
        <IconButton onClick={handleClose} disabled={saving}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {!canEdit ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="error" variant="body1">
              This message can no longer be edited. Messages can only be edited within 15 minutes of sending.
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Formatting toolbar */}
            <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
              <IconButton
                size="small"
                onClick={() => applyFormatting('bold')}
                title="Bold"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <FormatBold fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => applyFormatting('italic')}
                title="Italic"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <FormatItalic fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => applyFormatting('code')}
                title="Code"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <Code fontSize="small" />
              </IconButton>
            </Box>

            {/* Text input */}
            <TextField
              id="edit-message-input"
              fullWidth
              multiline
              rows={4}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Edit your message..."
              disabled={saving}
              error={Boolean(error)}
              helperText={error}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            {/* Character count and shortcuts */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {editedText.length} characters
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ctrl+Enter to save • Esc to cancel
              </Typography>
            </Box>

            {/* Original message preview */}
            {message.content.text && message.content.text !== editedText && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Original message:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {message.content.text}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {canEdit && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !editedText.trim() || editedText.trim() === message.content.text}
            sx={{ minWidth: 80 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
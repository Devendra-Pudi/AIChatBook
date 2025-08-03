import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';
import { useResponsive } from '../../hooks';
import type { Message } from '../../types';

interface MessageDeleteDialogProps {
  open: boolean;
  message: Message | null;
  onClose: () => void;
  onDelete: (messageId: string, chatId: string, deleteForEveryone: boolean) => Promise<{ success: boolean; error?: string }>;
}

export const MessageDeleteDialog: React.FC<MessageDeleteDialogProps> = ({
  open,
  message,
  onClose,
  onDelete,
}) => {
  const [deleteOption, setDeleteOption] = useState<'self' | 'everyone'>('self');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isMobile } = useResponsive();

  const handleDelete = async () => {
    if (!message) return;

    try {
      setDeleting(true);
      setError(null);

      const result = await onDelete(
        message.messageId,
        message.chatId,
        deleteOption === 'everyone'
      );

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to delete message');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!deleting) {
      setDeleteOption('self');
      setError(null);
      onClose();
    }
  };

  // Check if message can be deleted for everyone (within time limit)
  const canDeleteForEveryone = message ? (() => {
    const messageTime = new Date(message.timestamp);
    const now = new Date();
    const timeDiff = now.getTime() - messageTime.getTime();
    const oneHour = 60 * 60 * 1000;
    return timeDiff <= oneHour;
  })() : false;

  if (!message) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6" color="error">
          Delete Message
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this message?
          </Typography>

          {/* Message preview */}
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Message to delete:
            </Typography>
            <Typography variant="body2">
              {message.content.text || 'Media message'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Sent {new Date(message.timestamp).toLocaleString()}
            </Typography>
          </Box>

          {/* Delete options */}
          <RadioGroup
            value={deleteOption}
            onChange={(e) => setDeleteOption(e.target.value as 'self' | 'everyone')}
          >
            <FormControlLabel
              value="self"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body2">Delete for me</Typography>
                  <Typography variant="caption" color="text.secondary">
                    This message will be removed from your chat, but others will still see it.
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="everyone"
              control={<Radio />}
              disabled={!canDeleteForEveryone}
              label={
                <Box>
                  <Typography variant="body2">Delete for everyone</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {canDeleteForEveryone
                      ? 'This message will be removed for all participants in the chat.'
                      : 'Messages can only be deleted for everyone within 1 hour of sending.'
                    }
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>

          {/* Warning for delete for everyone */}
          {deleteOption === 'everyone' && canDeleteForEveryone && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                This action cannot be undone. The message will be permanently removed for all participants.
              </Typography>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={deleting}
          sx={{ minWidth: 80 }}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
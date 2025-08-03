import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  FormatBold,
  FormatItalic,
  Code,
  Close,
} from '@mui/icons-material';
import { useResponsive, useMessageManagement } from '../../hooks';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useChatStore } from '../../store';
import { selectActiveChat } from '../../store/chatStore';
import { MediaUploadDialog } from '../ui/MediaUploadDialog';
import { EmojiPicker } from './EmojiPicker';
import type { MessageContent, UUID } from '../../types';

interface MessageInputProps {
  onSendMessage: (content: MessageContent, replyTo?: UUID) => void;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: {
    messageId: UUID;
    content: string;
    sender: string;
  };
  onCancelReply?: () => void;
}



export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  replyTo,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isMobile, getSpacing } = useResponsive();
  
  // Get active chat for typing indicators
  const activeChat = useChatStore(selectActiveChat);
  const { handleInputChange: handleTypingChange, stopTyping } = useTypingIndicator({
    chatId: activeChat?.chatId || '',
    enabled: Boolean(activeChat?.chatId),
  });

  // Message management for draft functionality
  const { draft, saveDraft, deleteDraft } = useMessageManagement(activeChat?.chatId);

  const handleSendMessage = useCallback(() => {
    if (message.trim() && !disabled) {
      const content: MessageContent = {
        text: message.trim(),
      };
      
      onSendMessage(content, replyTo?.messageId);
      setMessage('');
      stopTyping(); // Stop typing indicator when message is sent
      
      // Clear draft when message is sent
      deleteDraft();
      
      // Clear reply if exists
      if (replyTo && onCancelReply) {
        onCancelReply();
      }
    }
  }, [message, disabled, onSendMessage, replyTo, onCancelReply, stopTyping, deleteDraft]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleEmojiClick = (emoji: string) => {
    const input = textFieldRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      handleTypingChange(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length);
        input.focus();
      }, 0);
    }
    setEmojiAnchor(null);
  };

  const applyFormatting = (format: 'bold' | 'italic' | 'code') => {
    const input = textFieldRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const selectedText = message.slice(start, end);
    
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

    const newMessage = message.slice(0, start) + formattedText + message.slice(end);
    setMessage(newMessage);

    // Set cursor position
    setTimeout(() => {
      const newPosition = selectedText 
        ? start + formattedText.length 
        : start + formattedText.length - cursorOffset;
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    }, 0);
  };

  const handleMediaUpload = useCallback((content: MessageContent) => {
    onSendMessage(content, replyTo?.messageId);
    
    // Clear draft when media is sent
    deleteDraft();
    
    // Clear reply if exists
    if (replyTo && onCancelReply) {
      onCancelReply();
    }
  }, [onSendMessage, replyTo, onCancelReply, deleteDraft]);

  // Auto-save draft with debouncing
  const handleMessageChange = useCallback((newValue: string) => {
    setMessage(newValue);
    handleTypingChange(newValue);

    // Clear existing timeout
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
    }

    // Set new timeout for auto-save
    if (newValue.trim()) {
      draftTimeoutRef.current = setTimeout(() => {
        saveDraft(newValue, replyTo?.messageId);
      }, 1000); // Save after 1 second of inactivity
    } else {
      // Delete draft if message is empty
      deleteDraft();
    }
  }, [handleTypingChange, saveDraft, deleteDraft, replyTo?.messageId]);

  // Load draft when chat changes
  useEffect(() => {
    if (draft && draft.content && !message) {
      setMessage(draft.content);
    }
  }, [draft, message]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ p: getSpacing(1, 2) }}>
      {/* Draft indicator */}
      {draft && draft.content && !message && (
        <Box
          sx={{
            mb: 1,
            p: 1,
            bgcolor: 'warning.light',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="caption" color="warning.dark">
            📝 Draft saved
          </Typography>
          <IconButton size="small" onClick={() => deleteDraft()}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <Box
          sx={{
            mb: 1,
            p: 1.5,
            bgcolor: 'action.hover',
            borderRadius: 1,
            borderLeft: 4,
            borderColor: 'primary.main',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="primary" fontWeight={600}>
              Replying to {replyTo.sender}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              noWrap
              sx={{ mt: 0.5 }}
            >
              {replyTo.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <Close />
          </IconButton>
        </Box>
      )}

      {/* Message Input */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={isMobile ? 3 : 4}
          placeholder={placeholder}
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          size={isMobile ? "small" : "medium"}
          slotProps={{
            input: {
              startAdornment: !isMobile && (
                <InputAdornment position="start">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => applyFormatting('bold')}
                      title="Bold"
                    >
                      <FormatBold fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => applyFormatting('italic')}
                      title="Italic"
                    >
                      <FormatItalic fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => applyFormatting('code')}
                      title="Code"
                    >
                      <Code fontSize="small" />
                    </IconButton>
                  </Box>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <IconButton 
                      size="small" 
                      title="Attach file"
                      onClick={() => setMediaDialogOpen(true)}
                    >
                      <AttachFile fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => setEmojiAnchor(e.currentTarget)}
                      title="Add emoji"
                    >
                      <EmojiEmotions fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={!message.trim() || disabled}
                      title="Send message"
                      sx={{
                        bgcolor: message.trim() ? 'primary.main' : 'transparent',
                        color: message.trim() ? 'white' : 'text.secondary',
                        '&:hover': {
                          bgcolor: message.trim() ? 'primary.dark' : 'action.hover',
                        },
                      }}
                    >
                      <Send fontSize="small" />
                    </IconButton>
                  </Box>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: isMobile ? 2 : 3,
              fontSize: isMobile ? '0.875rem' : '1rem',
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'background.paper',
              },
              '&.Mui-focused': {
                bgcolor: 'background.paper',
              },
            },
          }}
        />
      </Box>

      {/* Enhanced Emoji Picker */}
      <EmojiPicker
        anchorEl={emojiAnchor}
        open={Boolean(emojiAnchor)}
        onClose={() => setEmojiAnchor(null)}
        onEmojiSelect={handleEmojiClick}
      />

      {/* Media Upload Dialog */}
      <MediaUploadDialog
        open={mediaDialogOpen}
        onClose={() => setMediaDialogOpen(false)}
        onUploadComplete={handleMediaUpload}
        chatId={activeChat?.chatId || ''}
        title="Share Media"
      />
    </Box>
  );
};
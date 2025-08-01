import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Popover,
  Typography,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  FormatBold,
  FormatItalic,
  Code,
} from '@mui/icons-material';
import { useResponsive } from '../../hooks';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useChatStore } from '../../store';
import { selectActiveChat } from '../../store/chatStore';
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

// Common emojis for quick access
const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
  '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
  '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
  '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
  '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
  '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋',
  '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️',
  '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
  '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜',
  '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  replyTo,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const textFieldRef = useRef<HTMLInputElement>(null);
  const { isMobile, getSpacing } = useResponsive();
  
  // Get active chat for typing indicators
  const activeChat = useChatStore(selectActiveChat);
  const { handleInputChange: handleTypingChange, stopTyping } = useTypingIndicator({
    chatId: activeChat?.chatId || '',
    enabled: Boolean(activeChat?.chatId),
  });

  const handleSendMessage = useCallback(() => {
    if (message.trim() && !disabled) {
      const content: MessageContent = {
        text: message.trim(),
      };
      
      onSendMessage(content, replyTo?.messageId);
      setMessage('');
      stopTyping(); // Stop typing indicator when message is sent
      
      // Clear reply if exists
      if (replyTo && onCancelReply) {
        onCancelReply();
      }
    }
  }, [message, disabled, onSendMessage, replyTo, onCancelReply, stopTyping]);

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

  return (
    <Box sx={{ p: getSpacing(1, 2) }}>
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
            ×
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
          onChange={(e) => {
            const newValue = e.target.value;
            setMessage(newValue);
            handleTypingChange(newValue); // Handle typing indicator
          }}
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
                    <IconButton size="small" title="Attach file">
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

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            p: 2,
            maxWidth: 320,
            maxHeight: 400,
            overflow: 'auto',
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Choose an emoji
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {COMMON_EMOJIS.map((emoji, index) => (
            <IconButton
              key={index}
              size="small"
              onClick={() => handleEmojiClick(emoji)}
              sx={{
                fontSize: '1.2rem',
                width: 32,
                height: 32,
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'scale(1.2)',
                },
              }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Box>
  );
};
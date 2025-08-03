import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useResponsive } from '../../hooks';
import { useMessageStore, useUserStore } from '../../store';
import { selectMessagesByChatId, selectTypingUsersByChatId } from '../../store/messageStore';
import type { Message, UUID } from '../../types';

interface MessageListProps {
  chatId: UUID;
  onReply?: (messageId: UUID) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  chatId,
  onReply,
  onLoadMore,
  hasMore = false,
  loading = false,
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { getSpacing } = useResponsive();
  const theme = useTheme();

  // Get messages and typing users from store
  const messages = useMessageStore(selectMessagesByChatId(chatId));
  const typingUsers = useMessageStore(selectTypingUsersByChatId(chatId));
  const { users } = useUserStore();

  // Helper functions
  const getUserDisplayName = useCallback((userId: UUID) => {
    return users[userId]?.displayName || 'Unknown User';
  }, [users]);

  const getUserAvatar = useCallback((userId: UUID) => {
    return users[userId]?.photoURL;
  }, [users]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto' 
    });
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollButton(!isNearBottom);
    setAutoScroll(isNearBottom);

    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  // Auto-scroll when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, autoScroll, scrollToBottom]);

  // Group messages by date
  const groupMessagesByDate = useCallback((messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach((message) => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  }, []);

  // Check if messages should be grouped (same sender, within 5 minutes)
  const shouldGroupMessage = useCallback((current: Message, previous?: Message) => {
    if (!previous) return false;
    
    const timeDiff = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (
      current.sender === previous.sender &&
      timeDiff < fiveMinutes &&
      current.type === previous.type
    );
  }, []);

  const formatDateHeader = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }, []);

  const messageGroups = groupMessagesByDate(messages);

  if (messages.length === 0 && !loading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No messages yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start a conversation by sending a message
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* Messages Container */}
      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{
          height: '100%',
          overflow: 'auto',
          p: getSpacing(1, 2),
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.divider,
            borderRadius: 3,
            '&:hover': {
              background: theme.palette.text.secondary,
            },
          },
        }}
      >
        {/* Load More Button */}
        {hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={onLoadMore}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
            >
              {loading ? 'Loading...' : 'Load More Messages'}
            </Button>
          </Box>
        )}

        {/* Messages grouped by date */}
        {Object.entries(messageGroups).map(([dateString, dateMessages]) => (
          <Box key={dateString}>
            {/* Date Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                my: 3,
              }}
            >
              <Divider sx={{ flex: 1 }} />
              <Typography
                variant="caption"
                sx={{
                  mx: 2,
                  px: 2,
                  py: 0.5,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                {formatDateHeader(dateString)}
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            {/* Messages for this date */}
            {dateMessages.map((message, index) => {
              const previousMessage = index > 0 ? dateMessages[index - 1] : undefined;
              const isGrouped = shouldGroupMessage(message, previousMessage);

              return (
                <MessageBubble
                  key={message.messageId}
                  message={message}
                  showAvatar={!isGrouped}
                  showTimestamp={!isGrouped || index === dateMessages.length - 1}
                  onReply={onReply}
                  getUserDisplayName={getUserDisplayName}
                  getUserAvatar={getUserAvatar}
                />
              );
            })}
          </Box>
        ))}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator
            typingUsers={typingUsers.map(userId => ({
              userId,
              displayName: getUserDisplayName(userId),
            }))}
          />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </Box>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            onClick={() => scrollToBottom()}
            sx={{
              minWidth: 'auto',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: 4,
              },
            }}
          >
            <KeyboardArrowDown />
          </Button>
        </Box>
      )}
    </Box>
  );
};
import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Close,
  Search,
  ChatBubble,
  Image,
  AttachFile,
  Person,
} from '@mui/icons-material';
import { SearchInput, Avatar } from '../ui';
import { useResponsive } from '../../hooks';
import { useSupabaseMessages } from '../../hooks/useSupabaseMessages';
import { useUserStore, useChatStore } from '../../store';
import type { Message as MessageType, UUID } from '../../types';

interface MessageSearchProps {
  open: boolean;
  onClose: () => void;
  onMessageSelect?: (message: MessageType) => void;
  chatId?: UUID; // If provided, search only in this chat
}

interface SearchResult extends MessageType {
  chatName?: string;
  senderName?: string;
  highlight?: string;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  open,
  onClose,
  onMessageSelect,
  chatId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  const { searchMessages } = useSupabaseMessages();
  const { users } = useUserStore();
  const { chats } = useChatStore();
  const { isMobile, getSpacing } = useResponsive();
  const theme = useTheme();

  // Available search filters
  const searchFilters = [
    { id: 'text', label: 'Messages', icon: <ChatBubble fontSize="small" /> },
    { id: 'media', label: 'Images', icon: <Image fontSize="small" /> },
    { id: 'files', label: 'Files', icon: <AttachFile fontSize="small" /> },
    { id: 'user', label: 'From User', icon: <Person fontSize="small" /> },
  ];

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const result = await searchMessages(query, chatId);
      
      if (result.success && result.data) {
        // Enhance results with additional information
        const enhancedResults: SearchResult[] = result.data.map((message) => {
          const chat = chats[message.chatId];
          const sender = users[message.sender];
          
          return {
            ...message,
            chatName: chat?.type === 'group' 
              ? chat.groupInfo?.name 
              : chat?.type === 'ai' 
                ? 'AI Assistant'
                : sender?.displayName || 'Unknown Chat',
            senderName: sender?.displayName || 'Unknown User',
            highlight: highlightSearchTerm(message.content.text || '', query),
          };
        });

        // Apply filters
        const filteredResults = applyFilters(enhancedResults, selectedFilters);
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchMessages, chatId, chats, users, selectedFilters]);

  // Highlight search terms in text
  const highlightSearchTerm = (text: string, searchTerm: string): string => {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // Apply search filters
  const applyFilters = (results: SearchResult[], filters: string[]): SearchResult[] => {
    if (filters.length === 0) return results;

    return results.filter((result) => {
      return filters.some((filter) => {
        switch (filter) {
          case 'text':
            return result.content.text;
          case 'media':
            return result.content.media?.type === 'image';
          case 'files':
            return result.content.file || result.content.media?.type !== 'image';
          case 'user':
            // This would need additional logic to filter by specific users
            return true;
          default:
            return true;
        }
      });
    });
  };

  // Handle search input change
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    performSearch(query);
  }, [performSearch]);

  // Handle filter change
  const handleFilterChange = useCallback((filters: string[]) => {
    setSelectedFilters(filters);
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  }, [searchQuery, performSearch]);

  // Handle message selection
  const handleMessageSelect = (message: SearchResult) => {
    onMessageSelect?.(message);
    onClose();
  };

  // Format timestamp for search results
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Get message type icon
  const getMessageTypeIcon = (message: SearchResult) => {
    if (message.content.media) {
      switch (message.content.media.type) {
        case 'image':
          return <Image fontSize="small" color="primary" />;
        case 'video':
          return <Image fontSize="small" color="primary" />;
        case 'audio':
          return <AttachFile fontSize="small" color="primary" />;
      }
    }
    if (message.content.file) {
      return <AttachFile fontSize="small" color="primary" />;
    }
    return <ChatBubble fontSize="small" color="action" />;
  };

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedFilters([]);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100%' : '80vh',
          maxHeight: isMobile ? '100%' : '80vh',
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Typography variant="h6">
          {chatId ? 'Search in Chat' : 'Search Messages'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Search Input */}
        <Box sx={{ p: getSpacing(2, 3), pb: 1 }}>
          <SearchInput
            placeholder="Search messages..."
            value={searchQuery}
            onChange={handleSearchChange}
            showFilters={true}
            filters={selectedFilters}
            onFilterChange={handleFilterChange}
            debounceMs={300}
          />
        </Box>

        {/* Filter Chips */}
        {selectedFilters.length > 0 && (
          <Box sx={{ px: getSpacing(2, 3), pb: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {searchFilters
                .filter(filter => selectedFilters.includes(filter.id))
                .map((filter) => (
                  <Chip
                    key={filter.id}
                    label={filter.label}
                    icon={filter.icon}
                    size="small"
                    color="primary"
                    onDelete={() => {
                      const newFilters = selectedFilters.filter(f => f !== filter.id);
                      handleFilterChange(newFilters);
                    }}
                  />
                ))}
            </Box>
          </Box>
        )}

        <Divider />

        {/* Search Results */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                p: 4,
              }}
            >
              <CircularProgress size={32} />
            </Box>
          )}

          {!loading && searchQuery && searchResults.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                textAlign: 'center',
              }}
            >
              <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No messages found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search terms or filters
              </Typography>
            </Box>
          )}

          {!loading && !searchQuery && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                textAlign: 'center',
              }}
            >
              <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Search Messages
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter keywords to search through your conversations
              </Typography>
            </Box>
          )}

          {!loading && searchResults.length > 0 && (
            <List sx={{ p: 0 }}>
              {searchResults.map((result, index) => (
                <React.Fragment key={result.messageId}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleMessageSelect(result)}
                      sx={{ py: 1.5, px: getSpacing(2, 3) }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={users[result.sender]?.photoURL}
                          size="medium"
                        >
                          {result.senderName?.[0] || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            {getMessageTypeIcon(result)}
                            <Typography variant="subtitle2" noWrap>
                              {result.senderName}
                            </Typography>
                            {!chatId && (
                              <Typography variant="caption" color="text.secondary">
                                in {result.chatName}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {formatTimestamp(result.timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              '& mark': {
                                backgroundColor: theme.palette.primary.main + '30',
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                              },
                            }}
                            dangerouslySetInnerHTML={{
                              __html: result.highlight || result.content.text || 'Media message',
                            }}
                          />
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < searchResults.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
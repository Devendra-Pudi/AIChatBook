import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Checkbox,
  TextField,
  InputAdornment,
  Alert,
  Chip,
} from '@mui/material';
import { Search, Close } from '@mui/icons-material';
import { Avatar } from '../ui';
import { useResponsive } from '../../hooks';
import { useChatStore, useUserStore } from '../../store';
import type { Message, Chat, UUID } from '../../types';

interface MessageForwardDialogProps {
  open: boolean;
  message: Message | null;
  onClose: () => void;
  onForward: (data: { messageId: UUID; targetChatIds: UUID[]; content?: any }) => Promise<{ success: boolean; error?: string }>;
}

export const MessageForwardDialog: React.FC<MessageForwardDialogProps> = ({
  open,
  message,
  onClose,
  onForward,
}) => {
  const [selectedChats, setSelectedChats] = useState<UUID[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [forwarding, setForwarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isMobile } = useResponsive();
  const { chats } = useChatStore();
  const { users, currentUser } = useUserStore();

  // Filter chats based on search query
  const filteredChats = Object.values(chats).filter((chat: Chat) => {
    if (!searchQuery) return true;
    
    if (chat.type === 'group' && chat.groupInfo?.name) {
      return chat.groupInfo.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    if (chat.type === 'private') {
      const otherParticipant = chat.participants.find((p: UUID) => p !== currentUser?.uid);
      if (otherParticipant) {
        const user = users[otherParticipant];
        return user?.displayName.toLowerCase().includes(searchQuery.toLowerCase());
      }
    }
    
    return false;
  });

  const handleChatToggle = (chatId: UUID) => {
    setSelectedChats(prev => 
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = async () => {
    if (!message || selectedChats.length === 0) return;

    try {
      setForwarding(true);
      setError(null);

      const forwardData = {
        messageId: message.messageId,
        targetChatIds: selectedChats,
        content: additionalMessage.trim() ? {
          ...message.content,
          text: additionalMessage.trim() + '\n\n' + (message.content.text || ''),
        } : undefined,
      };

      const result = await onForward(forwardData);

      if (result.success) {
        onClose();
        // Reset state
        setSelectedChats([]);
        setAdditionalMessage('');
        setSearchQuery('');
      } else {
        setError(result.error || 'Failed to forward message');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to forward message');
    } finally {
      setForwarding(false);
    }
  };

  const handleClose = () => {
    if (!forwarding) {
      setSelectedChats([]);
      setAdditionalMessage('');
      setSearchQuery('');
      setError(null);
      onClose();
    }
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'group' && chat.groupInfo?.name) {
      return chat.groupInfo.name;
    }
    
    if (chat.type === 'private') {
      const otherParticipant = chat.participants.find(p => p !== currentUser?.uid);
      if (otherParticipant) {
        const user = users[otherParticipant];
        return user?.displayName || 'Unknown User';
      }
    }
    
    return 'Unknown Chat';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group' && chat.groupInfo?.photoURL) {
      return chat.groupInfo.photoURL;
    }
    
    if (chat.type === 'private') {
      const otherParticipant = chat.participants.find(p => p !== currentUser?.uid);
      if (otherParticipant) {
        const user = users[otherParticipant];
        return user?.photoURL;
      }
    }
    
    return undefined;
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedChats([]);
      setAdditionalMessage('');
      setSearchQuery('');
      setError(null);
    }
  }, [open]);

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
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '80vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Forward Message</Typography>
        <Button onClick={handleClose} disabled={forwarding} sx={{ minWidth: 'auto', p: 1 }}>
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 1 }}>
        {/* Message preview */}
        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Message to forward:
          </Typography>
          <Typography variant="body2">
            {message.content.text || 'Media message'}
          </Typography>
        </Box>

        {/* Additional message input */}
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Add a message (optional)"
          value={additionalMessage}
          onChange={(e) => setAdditionalMessage(e.target.value)}
          disabled={forwarding}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        {/* Selected chats */}
        {selectedChats.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Selected chats ({selectedChats.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedChats.map(chatId => {
                const chat = chats[chatId];
                if (!chat) return null;
                
                return (
                  <Chip
                    key={chatId}
                    label={getChatDisplayName(chat)}
                    onDelete={() => handleChatToggle(chatId)}
                    size="small"
                    variant="outlined"
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={forwarding}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        {/* Chat list */}
        <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 300 }}>
          <List sx={{ p: 0 }}>
            {filteredChats.map((chat: Chat) => {
              const isSelected = selectedChats.includes(chat.chatId);
              const displayName = getChatDisplayName(chat);
              const avatarSrc = getChatAvatar(chat);
              
              return (
                <ListItem key={chat.chatId} disablePadding>
                  <ListItemButton
                    onClick={() => handleChatToggle(chat.chatId)}
                    disabled={forwarding}
                    sx={{ borderRadius: 1 }}
                  >
                    <Checkbox
                      checked={isSelected}
                      tabIndex={-1}
                      disableRipple
                      sx={{ mr: 1 }}
                    />
                    <ListItemAvatar>
                      <Avatar src={avatarSrc} size="medium">
                        {displayName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={displayName}
                      secondary={
                        chat.type === 'group' 
                          ? `${chat.participants.length} members`
                          : chat.type === 'ai' 
                            ? 'AI Assistant'
                            : 'Private chat'
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {filteredChats.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="text.secondary">
                {searchQuery ? 'No chats found' : 'No chats available'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Error message */}
        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={forwarding}>
          Cancel
        </Button>
        <Button
          onClick={handleForward}
          variant="contained"
          disabled={forwarding || selectedChats.length === 0}
          sx={{ minWidth: 80 }}
        >
          {forwarding ? 'Forwarding...' : `Forward${selectedChats.length > 0 ? ` (${selectedChats.length})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
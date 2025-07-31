import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Typography,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Badge,
} from '@mui/material';
import {
  Search,
  Add,
  SmartToy,
  Group,
  MoreVert,
} from '@mui/icons-material';
import { Avatar } from '../ui';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onMobileClose?: () => void;
  onProfileClick?: () => void;
}

// Mock data for demonstration
const mockChats = [
  {
    id: '1',
    name: 'John Doe',
    lastMessage: 'Hey, how are you doing?',
    timestamp: '2 min ago',
    unread: 2,
    avatar: null,
    online: true,
    type: 'private',
  },
  {
    id: '2',
    name: 'AI Assistant',
    lastMessage: 'I can help you with any questions you have.',
    timestamp: '5 min ago',
    unread: 0,
    avatar: null,
    online: true,
    type: 'ai',
  },
  {
    id: '3',
    name: 'Team Project',
    lastMessage: 'Alice: The new feature is ready for testing',
    timestamp: '1 hour ago',
    unread: 5,
    avatar: null,
    online: false,
    type: 'group',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    lastMessage: 'Thanks for the help!',
    timestamp: '2 hours ago',
    unread: 0,
    avatar: null,
    online: false,
    type: 'private',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onMobileClose, onProfileClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const { userProfile, currentUser } = useAuth();

  const filteredChats = mockChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
    onMobileClose?.();
  };



  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User Profile Section */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            cursor: 'pointer',
            borderRadius: 1,
            p: 1,
            mx: -1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={onProfileClick}
        >
          <Avatar
            src={userProfile?.photoURL || currentUser?.photoURL || undefined}
            online={true}
            size="medium"
          >
            {userProfile?.displayName?.[0] || currentUser?.displayName?.[0] || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              {userProfile?.displayName || currentUser?.displayName || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {userProfile?.status || 'Online'}
            </Typography>
          </Box>
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Search and New Chat */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            color="primary"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <Add />
          </IconButton>
          <Typography variant="body2" sx={{ alignSelf: 'center', ml: 1 }}>
            New Chat
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Chat List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ p: 0 }}>
          {filteredChats.map((chat) => (
            <ListItem key={chat.id} disablePadding>
              <ListItemButton
                selected={selectedChat === chat.id}
                onClick={() => handleChatSelect(chat.id)}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemText-secondary': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={chat.avatar || undefined}
                    online={chat.online}
                    size="medium"
                  >
                    {chat.type === 'ai' ? (
                      <SmartToy />
                    ) : chat.type === 'group' ? (
                      <Group />
                    ) : (
                      chat.name[0]
                    )}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                        {chat.name}
                      </Typography>
                      {chat.type === 'ai' && (
                        <Chip
                          label="AI"
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ flex: 1, mr: 1 }}
                      >
                        {chat.lastMessage}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {chat.timestamp}
                        </Typography>
                        {chat.unread > 0 && (
                          <Badge
                            badgeContent={chat.unread}
                            color="primary"
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: '0.7rem',
                                height: 18,
                                minWidth: 18,
                              },
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;
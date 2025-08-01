import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Divider,

} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  MoreVert,
  Phone,
  VideoCall,
} from '@mui/icons-material';
import { Avatar, Dropdown } from '../ui';
import { useResponsive } from '../../hooks';

// Mock messages for demonstration
const mockMessages = [
  {
    id: '1',
    sender: 'John Doe',
    content: 'Hey, how are you doing?',
    timestamp: '10:30 AM',
    isOwn: false,
    avatar: null,
  },
  {
    id: '2',
    sender: 'You',
    content: 'I\'m doing great! Just working on the new chat app.',
    timestamp: '10:32 AM',
    isOwn: true,
    avatar: null,
  },
  {
    id: '3',
    sender: 'John Doe',
    content: 'That sounds exciting! How\'s the progress?',
    timestamp: '10:33 AM',
    isOwn: false,
    avatar: null,
  },
  {
    id: '4',
    sender: 'You',
    content: 'Pretty good! I\'m implementing the UI components right now. The layout is coming together nicely.',
    timestamp: '10:35 AM',
    isOwn: true,
    avatar: null,
  },
];

const ChatArea: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages] = useState(mockMessages);
  const { isMobile, getSpacing } = useResponsive();

  const handleSendMessage = () => {
    if (message.trim()) {
      // TODO: Implement message sending logic
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper
        elevation={1}
        sx={{
          p: getSpacing(1.5, 2),
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: getSpacing(1, 2) }}>
            <Avatar online={true} size={isMobile ? "small" : "medium"}>
              J
            </Avatar>
            <Box>
              <Typography 
                variant={isMobile ? "body1" : "subtitle1"} 
                fontWeight={600}
                noWrap
              >
                John Doe
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
              >
                Online
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {!isMobile && (
              <>
                <IconButton color="primary" size={isMobile ? "small" : "medium"}>
                  <Phone />
                </IconButton>
                <IconButton color="primary" size={isMobile ? "small" : "medium"}>
                  <VideoCall />
                </IconButton>
              </>
            )}
            <Dropdown
              trigger={
                <IconButton size={isMobile ? "small" : "medium"}>
                  <MoreVert />
                </IconButton>
              }
              items={[
                { id: 'call', label: 'Voice Call', icon: <Phone /> },
                { id: 'video', label: 'Video Call', icon: <VideoCall /> },
                { id: 'info', label: 'Contact Info', divider: true },
                { id: 'mute', label: 'Mute Notifications' },
                { id: 'block', label: 'Block Contact' },
              ]}
            />
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: getSpacing(1, 2),
          display: 'flex',
          flexDirection: 'column',
          gap: getSpacing(1, 2),
        }}
        className="scrollbar-thin"
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.isOwn ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: 1,
            }}
          >
            {!msg.isOwn && (
              <Avatar size="small">
                {msg.sender[0]}
              </Avatar>
            )}
            
            <Box
              sx={{
                maxWidth: isMobile ? '85%' : '70%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.isOwn ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  bgcolor: msg.isOwn ? 'primary.main' : 'background.paper',
                  color: msg.isOwn ? 'white' : 'text.primary',
                  borderRadius: 2,
                  borderBottomRightRadius: msg.isOwn ? 0.5 : 2,
                  borderBottomLeftRadius: msg.isOwn ? 2 : 0.5,
                }}
              >
                <Typography variant="body2">
                  {msg.content}
                </Typography>
              </Paper>
              
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, px: 1 }}
              >
                {msg.timestamp}
              </Typography>
            </Box>
            
            {msg.isOwn && (
              <Avatar size="small">
                Y
              </Avatar>
            )}
          </Box>
        ))}
      </Box>

      <Divider />

      {/* Message Input */}
      <Box sx={{ p: getSpacing(1, 2) }}>
        <TextField
          fullWidth
          multiline
          maxRows={isMobile ? 3 : 4}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          size={isMobile ? "small" : "medium"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton size="small">
                  <AttachFile />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {!isMobile && (
                    <IconButton size="small">
                      <EmojiEmotions />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: isMobile ? 2 : 3,
              fontSize: isMobile ? '0.875rem' : '1rem',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default ChatArea;
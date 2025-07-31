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
import { Avatar } from '../ui';

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
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar online={true} size="medium">
              J
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                John Doe
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Online
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton color="primary">
              <Phone />
            </IconButton>
            <IconButton color="primary">
              <VideoCall />
            </IconButton>
            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
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
                maxWidth: '70%',
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
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
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
                  <IconButton size="small">
                    <EmojiEmotions />
                  </IconButton>
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
              borderRadius: 3,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default ChatArea;
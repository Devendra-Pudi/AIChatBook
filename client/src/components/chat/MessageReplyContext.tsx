import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Reply } from '@mui/icons-material';
import { useMessageStore, useUserStore } from '../../store';
import { selectMessageById } from '../../store/messageStore';
import type { UUID } from '../../types';

interface MessageReplyContextProps {
  replyToId: UUID;
  getUserDisplayName?: (userId: UUID) => string;
}

export const MessageReplyContext: React.FC<MessageReplyContextProps> = ({
  replyToId,
  getUserDisplayName,
}) => {
  const originalMessage = useMessageStore(selectMessageById(replyToId));
  const { users } = useUserStore();

  if (!originalMessage) {
    return (
      <Box sx={{ mb: 1, opacity: 0.7 }}>
        <Typography variant="caption" color="text.secondary">
          <Reply fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
          Original message not found
        </Typography>
      </Box>
    );
  }

  const senderName = getUserDisplayName?.(originalMessage.sender) || 
                     users[originalMessage.sender]?.displayName || 
                     'Unknown User';

  const getPreviewText = () => {
    if (originalMessage.content.text) {
      return originalMessage.content.text.length > 50 
        ? originalMessage.content.text.substring(0, 50) + '...'
        : originalMessage.content.text;
    }
    
    if (originalMessage.content.media) {
      const mediaType = originalMessage.content.media.type;
      return `📎 ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`;
    }
    
    if (originalMessage.content.file) {
      return `📎 ${originalMessage.content.file.fileName}`;
    }
    
    return 'Message';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1,
        p: 1,
        bgcolor: 'action.hover',
        borderRadius: 1,
        borderLeft: 3,
        borderColor: 'primary.main',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.selected',
        },
      }}
      onClick={() => {
        // Scroll to original message (could be implemented later)
        console.log('Scroll to message:', replyToId);
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <Reply fontSize="small" color="primary" />
        <Typography variant="caption" color="primary" fontWeight={600}>
          {senderName}
        </Typography>
      </Box>
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          fontSize: '0.875rem',
          lineHeight: 1.2,
        }}
      >
        {getPreviewText()}
      </Typography>
    </Paper>
  );
};
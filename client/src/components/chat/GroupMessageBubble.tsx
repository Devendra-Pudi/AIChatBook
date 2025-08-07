import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import {
  PersonAdd,
  ExitToApp,
  AdminPanelSettings,
  Group,
} from '@mui/icons-material';
import { MessageBubble } from './MessageBubble';
import { useUserStore } from '../../store';
import type { Message, UUID } from '../../types';

interface GroupMessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: (messageId: UUID) => void;
}

export const GroupMessageBubble: React.FC<GroupMessageBubbleProps> = ({
  message,
  showAvatar = true,
  showTimestamp = true,
  onReply,
}) => {
  const { users } = useUserStore();

  // Handle system messages for group events
  if (message.type === 'system') {
    const systemMessage = parseSystemMessage(message.content.text || '');
    
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          my: 2,
        }}
      >
        <Chip
          icon={getSystemMessageIcon(systemMessage.type)}
          label={
            <Typography variant="body2" sx={{ px: 1 }}>
              {formatSystemMessage(systemMessage, users)}
            </Typography>
          }
          variant="outlined"
          size="small"
          sx={{
            bgcolor: 'background.paper',
            borderColor: 'divider',
            '& .MuiChip-icon': {
              color: 'text.secondary',
            },
          }}
        />
      </Box>
    );
  }

  // For regular messages, use the standard MessageBubble with group-specific enhancements
  const sender = users[message.sender];
  
  return (
    <Box sx={{ mb: 1 }}>
      {/* Show sender name for group messages */}
      {showAvatar && message.sender !== useUserStore.getState().currentUser?.uid && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, ml: 1 }}>
          <Avatar
            src={sender?.photoURL}
            sx={{ width: 20, height: 20 }}
          >
            {sender?.displayName?.[0] || 'U'}
          </Avatar>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            {sender?.displayName || 'Unknown User'}
          </Typography>
        </Box>
      )}
      
      <MessageBubble
        message={message}
        showAvatar={showAvatar}
        showTimestamp={showTimestamp}
        onReply={onReply}
      />
    </Box>
  );
};

// Helper functions for system messages
interface SystemMessage {
  type: 'member_added' | 'member_removed' | 'member_left' | 'admin_changed' | 'group_created' | 'group_updated';
  userId?: UUID;
  targetUserId?: UUID;
  data?: any;
}

function parseSystemMessage(content: string): SystemMessage {
  try {
    return JSON.parse(content);
  } catch {
    // Fallback for plain text system messages
    return { type: 'group_updated' };
  }
}

function getSystemMessageIcon(type: SystemMessage['type']) {
  switch (type) {
    case 'member_added':
      return <PersonAdd />;
    case 'member_removed':
    case 'member_left':
      return <ExitToApp />;
    case 'admin_changed':
      return <AdminPanelSettings />;
    case 'group_created':
    case 'group_updated':
      return <Group />;
    default:
      return <Group />;
  }
}

function formatSystemMessage(systemMessage: SystemMessage, users: Record<UUID, any>): string {
  const getUsername = (userId?: UUID) => 
    userId ? (users[userId]?.displayName || 'Unknown User') : 'Unknown User';

  switch (systemMessage.type) {
    case 'member_added':
      return `${getUsername(systemMessage.targetUserId)} was added to the group`;
    case 'member_removed':
      return `${getUsername(systemMessage.targetUserId)} was removed from the group`;
    case 'member_left':
      return `${getUsername(systemMessage.userId)} left the group`;
    case 'admin_changed':
      return `${getUsername(systemMessage.targetUserId)} is now an admin`;
    case 'group_created':
      return `Group was created by ${getUsername(systemMessage.userId)}`;
    case 'group_updated':
      return 'Group settings were updated';
    default:
      return 'Group was updated';
  }
}
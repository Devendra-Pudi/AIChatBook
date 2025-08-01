import type { 
  User, 
  Chat, 
  Message, 
  MessageContent,
  UUID,
  Timestamp 
} from '../types';

// Date and time transformers
export const formatTimestamp = (timestamp: Timestamp): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const formatMessageTime = (timestamp: Timestamp): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

export const formatLastSeen = (timestamp: Timestamp): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Online';
  } else if (diffInMinutes < 60) {
    return `Last seen ${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `Last seen ${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 7) {
    return `Last seen ${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else {
    return `Last seen ${date.toLocaleDateString()}`;
  }
};

// File size transformers
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Message content transformers
export const getMessagePreview = (content: MessageContent): string => {
  if (content.text) {
    return content.text.length > 50 ? `${content.text.substring(0, 50)}...` : content.text;
  } else if (content.media) {
    switch (content.media.type) {
      case 'image':
        return '📷 Photo';
      case 'video':
        return '🎥 Video';
      case 'audio':
        return '🎵 Audio';
      default:
        return '📎 Media';
    }
  } else if (content.file) {
    return `📎 ${content.file.fileName}`;
  }
  return 'Message';
};

export const extractTextFromMessage = (content: MessageContent): string => {
  return content.text || '';
};

export const hasMediaContent = (content: MessageContent): boolean => {
  return !!(content.media || content.file);
};

// User transformers
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Unknown User';
  return user.displayName || user.email.split('@')[0] || 'User';
};

export const getUserInitials = (user: User | null): string => {
  if (!user) return 'U';
  const displayName = getUserDisplayName(user);
  const words = displayName.split(' ');
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return displayName.substring(0, 2).toUpperCase();
};

export const getUserStatusColor = (status: User['status']): string => {
  switch (status) {
    case 'online':
      return '#4CAF50'; // Green
    case 'away':
      return '#FF9800'; // Orange
    case 'busy':
      return '#F44336'; // Red
    case 'offline':
    default:
      return '#9E9E9E'; // Gray
  }
};

export const getUserStatusText = (status: User['status']): string => {
  switch (status) {
    case 'online':
      return 'Online';
    case 'away':
      return 'Away';
    case 'busy':
      return 'Busy';
    case 'offline':
    default:
      return 'Offline';
  }
};

// Chat transformers
export const getChatDisplayName = (chat: Chat, currentUserId: UUID, users: Record<UUID, User>): string => {
  if (chat.type === 'group') {
    return chat.groupInfo?.name || 'Group Chat';
  } else if (chat.type === 'ai') {
    return 'AI Assistant';
  } else {
    // Private chat - find the other participant
    const otherParticipant = chat.participants.find(id => id !== currentUserId);
    if (otherParticipant && users[otherParticipant]) {
      return getUserDisplayName(users[otherParticipant]);
    }
    return 'Private Chat';
  }
};

export const getChatAvatar = (chat: Chat, currentUserId: UUID, users: Record<UUID, User>): string | null => {
  if (chat.type === 'group') {
    return chat.groupInfo?.photoURL || null;
  } else if (chat.type === 'ai') {
    return null; // Will use AI avatar
  } else {
    // Private chat - find the other participant
    const otherParticipant = chat.participants.find(id => id !== currentUserId);
    if (otherParticipant && users[otherParticipant]) {
      return users[otherParticipant].photoURL || null;
    }
    return null;
  }
};

export const getChatParticipantCount = (chat: Chat): number => {
  return chat.participants.length;
};

export const isGroupAdmin = (chat: Chat, userId: UUID): boolean => {
  return chat.type === 'group' && chat.groupInfo?.admin === userId;
};

// Message transformers
export const isMessageFromCurrentUser = (message: Message, currentUserId: UUID): boolean => {
  return message.sender === currentUserId;
};

export const isMessageRead = (message: Message, userId: UUID): boolean => {
  return !!message.readBy[userId];
};

export const getMessageReadCount = (message: Message): number => {
  return Object.keys(message.readBy).length;
};

export const getMessageReactionCount = (message: Message): number => {
  return Object.values(message.reactions).reduce((total, userIds) => total + userIds.length, 0);
};

export const hasUserReacted = (message: Message, userId: UUID, emoji: string): boolean => {
  return message.reactions[emoji]?.includes(userId) || false;
};

export const getTopReactions = (message: Message, limit = 3): Array<{ emoji: string; count: number; users: UUID[] }> => {
  return Object.entries(message.reactions)
    .map(([emoji, users]) => ({ emoji, count: users.length, users }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

// Search and filter transformers
export const normalizeSearchQuery = (query: string): string => {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
};

export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const filterMessagesBySearchTerm = (messages: Message[], searchTerm: string): Message[] => {
  if (!searchTerm) return messages;
  
  const normalizedTerm = normalizeSearchQuery(searchTerm);
  return messages.filter(message => {
    const messageText = extractTextFromMessage(message.content).toLowerCase();
    return messageText.includes(normalizedTerm);
  });
};

// Sorting transformers
export const sortChatsByLastMessage = (chats: Chat[]): Chat[] => {
  return [...chats].sort((a, b) => {
    const aTime = a.lastMessage?.timestamp || a.updatedAt;
    const bTime = b.lastMessage?.timestamp || b.updatedAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
};

export const sortMessagesByTimestamp = (messages: Message[]): Message[] => {
  return [...messages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

export const sortUsersByStatus = (users: User[]): User[] => {
  const statusOrder = { online: 0, away: 1, busy: 2, offline: 3 };
  return [...users].sort((a, b) => {
    const aOrder = statusOrder[a.status];
    const bOrder = statusOrder[b.status];
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    return getUserDisplayName(a).localeCompare(getUserDisplayName(b));
  });
};

// Data structure transformers
export const groupMessagesByDate = (messages: Message[]): Record<string, Message[]> => {
  return messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);
};

export const createMessageGroups = (messages: Message[]): Array<{ sender: UUID; messages: Message[]; timestamp: Timestamp }> => {
  const groups: Array<{ sender: UUID; messages: Message[]; timestamp: Timestamp }> = [];
  let currentGroup: { sender: UUID; messages: Message[]; timestamp: Timestamp } | null = null;

  messages.forEach(message => {
    if (!currentGroup || currentGroup.sender !== message.sender) {
      // Start new group
      currentGroup = {
        sender: message.sender,
        messages: [message],
        timestamp: message.timestamp,
      };
      groups.push(currentGroup);
    } else {
      // Add to current group
      currentGroup.messages.push(message);
    }
  });

  return groups;
};

// URL and link transformers
export const extractUrlsFromText = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

export const replaceUrlsWithLinks = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
};

// Emoji and reaction transformers
export const getEmojiFromReaction = (reaction: string): string => {
  // Map reaction names to emoji
  const emojiMap: Record<string, string> = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😠',
  };
  return emojiMap[reaction] || reaction;
};

export const getReactionName = (emoji: string): string => {
  // Map emoji to reaction names
  const nameMap: Record<string, string> = {
    '👍': 'like',
    '❤️': 'love',
    '😂': 'laugh',
    '😮': 'wow',
    '😢': 'sad',
    '😠': 'angry',
  };
  return nameMap[emoji] || emoji;
};
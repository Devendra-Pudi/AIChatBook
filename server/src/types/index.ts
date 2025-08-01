export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
}

export interface Message {
  messageId: string;
  chatId: string;
  sender: string;
  content: MessageContent;
  timestamp: string;
  readBy: Record<string, string>;
  edited: boolean;
  editedAt?: string;
  replyTo?: string;
  reactions: Record<string, string[]>;
  type: 'user' | 'ai' | 'system';
}

export interface MessageContent {
  text?: string;
  media?: MediaContent;
  file?: FileContent;
}

export interface MediaContent {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
  dimensions?: { width: number; height: number };
}

export interface FileContent {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Chat {
  chatId: string;
  type: 'private' | 'group' | 'ai';
  participants: string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
  groupInfo?: GroupInfo;
  unreadCount: number;
}

export interface GroupInfo {
  name: string;
  description?: string;
  admin: string;
  photoURL?: string;
}

export interface SocketUser {
  userId: string;
  socketId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
}

export interface TypingData {
  chatId: string;
  userId: string;
  displayName: string;
}

export interface MessageData {
  messageId: string;
  chatId: string;
  sender: string;
  content: MessageContent;
  timestamp: string;
  type: 'user' | 'ai' | 'system';
  replyTo?: string;
}

export interface ReadReceiptData {
  messageId: string;
  chatId: string;
  userId: string;
  timestamp: string;
}

export interface UserStatusData {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
}
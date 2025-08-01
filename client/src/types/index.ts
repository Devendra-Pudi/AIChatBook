// TypeScript type definitions

// Base types
export type Timestamp = string; // ISO string format
export type UUID = string;

// User related types
export interface User {
  uid: UUID;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Timestamp;
  createdAt: Timestamp;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  privacy: PrivacySettings;
  aiPreferences: AIPreferences;
}

export interface PrivacySettings {
  showLastSeen: boolean;
  showOnlineStatus: boolean;
  allowGroupInvites: boolean;
  readReceipts: boolean;
}

export interface AIPreferences {
  defaultPersonality: AIPersonality;
  responseLength: 'short' | 'medium' | 'long';
  enableSuggestions: boolean;
  autoTranslate: boolean;
}

// Chat related types
export interface Chat {
  chatId: UUID;
  type: 'private' | 'group' | 'ai';
  participants: UUID[];
  lastMessage?: LastMessage;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  groupInfo?: GroupInfo;
  unreadCount: number;
}

export interface GroupInfo {
  name: string;
  description?: string;
  admin: UUID;
  photoURL?: string;
  settings: GroupSettings;
}

export interface GroupSettings {
  allowMemberInvites: boolean;
  allowMediaSharing: boolean;
  muteNotifications: boolean;
  disappearingMessages: boolean;
  disappearingMessagesDuration?: number; // in hours
}

export interface LastMessage {
  messageId: UUID;
  content: string;
  sender: UUID;
  timestamp: Timestamp;
  type: MessageType;
}

// Message related types
export interface Message {
  messageId: UUID;
  chatId: UUID;
  sender: UUID;
  content: MessageContent;
  timestamp: Timestamp;
  readBy: Record<UUID, Timestamp>;
  edited: boolean;
  editedAt?: Timestamp;
  replyTo?: UUID;
  reactions: Record<string, UUID[]>; // emoji -> userIds
  type: MessageType;
  status: MessageStatus;
}

export type MessageType = 'user' | 'ai' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

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
  size: number; // in bytes
  fileName: string;
}

export interface FileContent {
  type: 'document' | 'archive' | 'other';
  url: string;
  fileName: string;
  size: number; // in bytes
  mimeType: string;
}

// AI related types
export interface AIConversation {
  conversationId: UUID;
  userId: UUID;
  context: ConversationContext;
  personality: AIPersonality;
  createdAt: Timestamp;
  lastInteraction: Timestamp;
}

export interface ConversationContext {
  messages: ContextMessage[];
  topic?: string;
  preferences: AIPreferences;
  tokenCount: number;
}

export interface ContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
}

export interface AIPersonality {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface AIResponse {
  content: string;
  tokenCount: number;
  model: string;
  timestamp: Timestamp;
  conversationId: UUID;
}

// Real-time event types
export interface TypingEvent {
  chatId: UUID;
  userId: UUID;
  isTyping: boolean;
  timestamp: Timestamp;
}

export interface UserPresenceEvent {
  userId: UUID;
  status: User['status'];
  lastSeen: Timestamp;
}

export interface MessageEvent {
  type: 'message_sent' | 'message_read' | 'message_edited' | 'message_deleted';
  messageId: UUID;
  chatId: UUID;
  userId: UUID;
  timestamp: Timestamp;
  data?: any;
}

// Store state types
export interface UserState {
  currentUser: User | null;
  users: Record<UUID, User>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChatState {
  chats: Record<UUID, Chat>;
  activeChat: UUID | null;
  isLoading: boolean;
  error: string | null;
}

export interface MessageState {
  messages: Record<UUID, Message[]>; // chatId -> messages
  typingUsers: Record<UUID, UUID[]>; // chatId -> userIds
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeModal: string | null;
  notifications: NotificationState[];
  isOnline: boolean;
}

export interface NotificationState {
  id: UUID;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  timestamp: Timestamp;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  acceptTerms: boolean;
}

export interface ProfileForm {
  displayName: string;
  bio: string;
  photoURL?: string;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Database operation types
export interface DatabaseOperation<T = any> {
  type: 'create' | 'read' | 'update' | 'delete';
  table: string;
  data?: T;
  id?: UUID;
  filters?: Record<string, any>;
}

// Supabase realtime types
export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  table: string;
  schema: string;
}

export interface SubscriptionConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: RealtimePayload) => void;
}
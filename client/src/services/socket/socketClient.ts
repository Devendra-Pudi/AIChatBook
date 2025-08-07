import * as io from 'socket.io-client';
import type {
  Message,
  UserPresenceEvent
} from '../../types/index.js';

export interface SocketEvents {
  // Connection events
  'user:connect': (userId: string) => void;
  'user:connected': (data: { userId: string; status: string; connectedUsers: string[] }) => void;
  'user:online': (data: UserPresenceEvent) => void;
  'user:offline': (data: UserPresenceEvent) => void;
  'user:status': (data: UserPresenceEvent) => void;

  // Message events
  'message:send': (messageData: MessageData) => void;
  'message:receive': (message: Message) => void;
  'message:read': (readData: ReadReceiptData) => void;
  'message:edit': (data: MessageEditData) => void;
  'message:delete': (data: MessageDeleteData) => void;
  'message:reaction': (data: MessageReactionData) => void;

  // Typing events
  'message:typing:start': (data: TypingData) => void;
  'message:typing:stop': (data: TypingData) => void;

  // Chat events
  'chat:join': (chatId: string) => void;
  'chat:leave': (chatId: string) => void;

  // Error events
  'error': (error: { message: string }) => void;
  'connect_error': (error: Error) => void;
  'disconnect': (reason: string) => void;
}

export interface MessageData {
  messageId: string;
  chatId: string;
  sender: string;
  content: {
    text?: string;
    media?: unknown;
    file?: unknown;
  };
  timestamp: string;
  type: 'user' | 'ai' | 'system';
  replyTo?: string;
}

export interface TypingData {
  chatId: string;
  userId: string;
  displayName: string;
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

export interface MessageEditData {
  messageId: string;
  chatId: string;
  userId: string;
  content: unknown;
  editedAt: string;
}

export interface MessageDeleteData {
  messageId: string;
  chatId: string;
  userId: string;
  deleteForEveryone: boolean;
  deletedAt: string;
}

export interface MessageReactionData {
  messageId: string;
  chatId: string;
  userId: string;
  emoji: string;
  action: 'add' | 'remove';
}

class SocketClient {
  private socket: SocketIOClient.Socket | null = null;
  private serverUrl: string;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentUserId: string | null = null;

  // Event listeners storage
  private eventListeners = new Map<string, Set<(...args: any[]) => void>>();

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  // Initialize socket connection
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.currentUserId = userId;

      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Authenticate user
        this.socket?.emit('user:connect', userId);
        resolve();
      });

      this.socket.on('user:connected', (data: { userId: string; status: string; connectedUsers: string[] }) => {
        console.log('User authenticated:', data);
        this.emitToListeners('user:connected', data);
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
        this.emitToListeners('connect_error', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
        this.emitToListeners('disconnect', reason);

        // Attempt to reconnect if not a manual disconnect
        if (reason !== 'io client disconnect') {
          this.handleReconnection();
        }
      });

      // Set up default event listeners
      this.setupDefaultEventListeners();
    });
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
      this.eventListeners.clear();
    }
  }

  // Check if socket is connected
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Send message
  sendMessage(messageData: MessageData): void {
    if (!this.isSocketConnected()) {
      throw new Error('Socket not connected');
    }
    this.socket?.emit('message:send', messageData);
  }

  // Join chat room
  joinChat(chatId: string): void {
    if (!this.isSocketConnected()) {
      throw new Error('Socket not connected');
    }
    this.socket?.emit('chat:join', chatId);
  }

  // Leave chat room
  leaveChat(chatId: string): void {
    if (!this.isSocketConnected()) {
      throw new Error('Socket not connected');
    }
    this.socket?.emit('chat:leave', chatId);
  }

  // Start typing indicator
  startTyping(chatId: string, displayName: string): void {
    if (!this.isSocketConnected() || !this.currentUserId) {
      return;
    }
    this.socket?.emit('message:typing:start', {
      chatId,
      userId: this.currentUserId,
      displayName
    });
  }

  // Stop typing indicator
  stopTyping(chatId: string): void {
    if (!this.isSocketConnected() || !this.currentUserId) {
      return;
    }
    this.socket?.emit('message:typing:stop', {
      chatId,
      userId: this.currentUserId,
      displayName: '' // Not needed for stop event
    });
  }

  // Mark message as read
  markMessageAsRead(messageId: string, chatId: string): void {
    if (!this.isSocketConnected() || !this.currentUserId) {
      return;
    }
    this.socket?.emit('message:read', {
      messageId,
      chatId,
      userId: this.currentUserId,
      timestamp: new Date().toISOString()
    });
  }

  // Update user status
  updateUserStatus(status: UserStatusData['status']): void {
    if (!this.isSocketConnected() || !this.currentUserId) {
      return;
    }
    this.socket?.emit('user:status', {
      userId: this.currentUserId,
      status,
      lastSeen: new Date().toISOString()
    });
  }

  // Event listener management
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as (...args: any[]) => void);
  }

  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback as (...args: any[]) => void);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  // Emit to registered listeners
  private emitToListeners(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Set up default event listeners
  private setupDefaultEventListeners(): void {
    if (!this.socket) return;

    // Message events
    this.socket.on('message:receive', (message: Message) => {
      console.log('Message received:', message);
      this.emitToListeners('message:receive', message);
    });

    this.socket.on('message:read', (readData: ReadReceiptData) => {
      console.log('Message read receipt:', readData);
      this.emitToListeners('message:read', readData);
    });

    this.socket.on('message:edit', (data: MessageEditData) => {
      console.log('Message edited:', data);
      this.emitToListeners('message:edit', data);
    });

    this.socket.on('message:delete', (data: MessageDeleteData) => {
      console.log('Message deleted:', data);
      this.emitToListeners('message:delete', data);
    });

    this.socket.on('message:reaction', (data: MessageReactionData) => {
      console.log('Message reaction:', data);
      this.emitToListeners('message:reaction', data);
    });

    // Typing events
    this.socket.on('message:typing:start', (data: TypingData) => {
      console.log('User started typing:', data);
      this.emitToListeners('message:typing:start', data);
    });

    this.socket.on('message:typing:stop', (data: TypingData) => {
      console.log('User stopped typing:', data);
      this.emitToListeners('message:typing:stop', data);
    });

    // User presence events
    this.socket.on('user:online', (data: UserPresenceEvent) => {
      console.log('User came online:', data);
      this.emitToListeners('user:online', data);
    });

    this.socket.on('user:offline', (data: UserPresenceEvent) => {
      console.log('User went offline:', data);
      this.emitToListeners('user:offline', data);
    });

    this.socket.on('user:status', (data: UserPresenceEvent) => {
      console.log('User status updated:', data);
      this.emitToListeners('user:status', data);
    });

    // Error events
    this.socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      this.emitToListeners('error', error);
    });
  }

  // Handle reconnection logic
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.currentUserId && !this.isSocketConnected()) {
        this.connect(this.currentUserId).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  // Get current connection status
  getConnectionStatus(): {
    connected: boolean;
    socketId: string | null;
    userId: string | null;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isSocketConnected(),
      socketId: this.socket?.id || null,
      userId: this.currentUserId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
export const socketClient = new SocketClient();

export default socketClient;
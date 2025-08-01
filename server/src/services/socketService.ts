import { Server, Socket } from 'socket.io';
import { UserService } from './userService.js';
import { MessageService } from './messageService.js';
import type { 
  MessageData, 
  TypingData, 
  ReadReceiptData, 
  UserStatusData 
} from '../types/index.js';

export class SocketService {
  private io: Server;
  private userService: UserService;
  private messageService: MessageService;
  private typingUsers = new Map<string, Set<string>>(); // chatId -> Set of userIds

  constructor(io: Server) {
    this.io = io;
    this.userService = new UserService();
    this.messageService = new MessageService();
  }

  handleConnection(socket: Socket): void {
    console.log(`User connected: ${socket.id}`);

    // Handle user authentication and connection
    socket.on('user:connect', async (userId: string) => {
      await this.handleUserConnect(socket, userId);
    });

    // Handle message sending
    socket.on('message:send', async (messageData: MessageData) => {
      await this.handleMessageSend(socket, messageData);
    });

    // Handle typing indicators
    socket.on('message:typing:start', (data: TypingData) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('message:typing:stop', (data: TypingData) => {
      this.handleTypingStop(socket, data);
    });

    // Handle read receipts
    socket.on('message:read', async (readData: ReadReceiptData) => {
      await this.handleMessageRead(socket, readData);
    });

    // Handle user status updates
    socket.on('user:status', async (statusData: UserStatusData) => {
      await this.handleUserStatusUpdate(socket, statusData);
    });

    // Handle chat room joining
    socket.on('chat:join', (chatId: string) => {
      this.handleChatJoin(socket, chatId);
    });

    // Handle chat room leaving
    socket.on('chat:leave', (chatId: string) => {
      this.handleChatLeave(socket, chatId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private async handleUserConnect(socket: Socket, userId: string): Promise<void> {
    try {
      // Connect user and update status
      this.userService.connectUser(userId, socket.id);
      
      // Get user data
      const user = await this.userService.getUserById(userId);
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Join user to their personal room for direct messages
      socket.join(`user:${userId}`);

      // Emit user connected event to all connected users
      socket.broadcast.emit('user:online', {
        userId,
        status: 'online',
        lastSeen: new Date().toISOString()
      });

      // Send confirmation to the connected user
      socket.emit('user:connected', {
        userId,
        status: 'online',
        connectedUsers: this.userService.getConnectedUsers()
      });

      console.log(`User ${userId} connected with socket ${socket.id}`);
    } catch (error) {
      console.error('Error in handleUserConnect:', error);
      socket.emit('error', { message: 'Failed to connect user' });
    }
  }

  private async handleMessageSend(socket: Socket, messageData: MessageData): Promise<void> {
    try {
      // Save message to database
      const savedMessage = await this.messageService.saveMessage(messageData);
      if (!savedMessage) {
        socket.emit('error', { message: 'Failed to save message' });
        return;
      }

      // Get chat participants
      const participants = await this.messageService.getChatParticipants(messageData.chatId);
      
      // Update last message in chat
      await this.messageService.updateLastMessage(messageData.chatId, savedMessage);

      // Emit message to all participants in the chat
      this.io.to(`chat:${messageData.chatId}`).emit('message:receive', savedMessage);

      // Send push notifications to offline users (if needed)
      for (const participantId of participants) {
        if (!this.userService.isUserOnline(participantId)) {
          // Here you could implement push notification logic
          console.log(`User ${participantId} is offline, should send push notification`);
        }
      }

      console.log(`Message sent in chat ${messageData.chatId} by ${messageData.sender}`);
    } catch (error) {
      console.error('Error in handleMessageSend:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private handleTypingStart(socket: Socket, data: TypingData): void {
    try {
      const userId = this.userService.getUserId(socket.id);
      if (!userId || userId !== data.userId) {
        return;
      }

      // Add user to typing users for this chat
      if (!this.typingUsers.has(data.chatId)) {
        this.typingUsers.set(data.chatId, new Set());
      }
      this.typingUsers.get(data.chatId)!.add(data.userId);

      // Broadcast typing indicator to other users in the chat
      socket.to(`chat:${data.chatId}`).emit('message:typing:start', {
        chatId: data.chatId,
        userId: data.userId,
        displayName: data.displayName
      });

      console.log(`User ${data.userId} started typing in chat ${data.chatId}`);
    } catch (error) {
      console.error('Error in handleTypingStart:', error);
    }
  }

  private handleTypingStop(socket: Socket, data: TypingData): void {
    try {
      const userId = this.userService.getUserId(socket.id);
      if (!userId || userId !== data.userId) {
        return;
      }

      // Remove user from typing users for this chat
      const typingSet = this.typingUsers.get(data.chatId);
      if (typingSet) {
        typingSet.delete(data.userId);
        if (typingSet.size === 0) {
          this.typingUsers.delete(data.chatId);
        }
      }

      // Broadcast typing stop to other users in the chat
      socket.to(`chat:${data.chatId}`).emit('message:typing:stop', {
        chatId: data.chatId,
        userId: data.userId
      });

      console.log(`User ${data.userId} stopped typing in chat ${data.chatId}`);
    } catch (error) {
      console.error('Error in handleTypingStop:', error);
    }
  }

  private async handleMessageRead(socket: Socket, readData: ReadReceiptData): Promise<void> {
    try {
      // Update read receipt in database
      await this.messageService.markMessageAsRead(readData);

      // Broadcast read receipt to other users in the chat
      socket.to(`chat:${readData.chatId}`).emit('message:read', readData);

      console.log(`Message ${readData.messageId} marked as read by ${readData.userId}`);
    } catch (error) {
      console.error('Error in handleMessageRead:', error);
    }
  }

  private async handleUserStatusUpdate(socket: Socket, statusData: UserStatusData): Promise<void> {
    try {
      const userId = this.userService.getUserId(socket.id);
      if (!userId || userId !== statusData.userId) {
        return;
      }

      // Update user status in database
      await this.userService.updateUserStatus(statusData.userId, statusData.status);

      // Broadcast status update to all connected users
      socket.broadcast.emit('user:status', statusData);

      console.log(`User ${statusData.userId} status updated to ${statusData.status}`);
    } catch (error) {
      console.error('Error in handleUserStatusUpdate:', error);
    }
  }

  private handleChatJoin(socket: Socket, chatId: string): void {
    try {
      socket.join(`chat:${chatId}`);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    } catch (error) {
      console.error('Error in handleChatJoin:', error);
    }
  }

  private handleChatLeave(socket: Socket, chatId: string): void {
    try {
      socket.leave(`chat:${chatId}`);
      
      // Remove from typing users if they were typing
      const typingSet = this.typingUsers.get(chatId);
      const userId = this.userService.getUserId(socket.id);
      if (typingSet && userId) {
        typingSet.delete(userId);
        if (typingSet.size === 0) {
          this.typingUsers.delete(chatId);
        }
        // Notify others that user stopped typing
        socket.to(`chat:${chatId}`).emit('message:typing:stop', {
          chatId,
          userId
        });
      }

      console.log(`Socket ${socket.id} left chat ${chatId}`);
    } catch (error) {
      console.error('Error in handleChatLeave:', error);
    }
  }

  private handleDisconnect(socket: Socket): void {
    try {
      const userId = this.userService.disconnectUser(socket.id);
      
      if (userId) {
        // Remove from all typing indicators
        for (const [chatId, typingSet] of this.typingUsers.entries()) {
          if (typingSet.has(userId)) {
            typingSet.delete(userId);
            if (typingSet.size === 0) {
              this.typingUsers.delete(chatId);
            }
            // Notify others that user stopped typing
            socket.to(`chat:${chatId}`).emit('message:typing:stop', {
              chatId,
              userId
            });
          }
        }

        // Broadcast user offline status
        socket.broadcast.emit('user:offline', {
          userId,
          status: 'offline',
          lastSeen: new Date().toISOString()
        });

        console.log(`User ${userId} disconnected`);
      }

      console.log(`Socket ${socket.id} disconnected`);
    } catch (error) {
      console.error('Error in handleDisconnect:', error);
    }
  }

  // Utility method to get online users count
  getOnlineUsersCount(): number {
    return this.userService.getConnectedUsers().length;
  }

  // Utility method to get typing users for a chat
  getTypingUsers(chatId: string): string[] {
    const typingSet = this.typingUsers.get(chatId);
    return typingSet ? Array.from(typingSet) : [];
  }
}
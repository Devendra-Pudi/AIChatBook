import { socketClient } from '../socket/socketClient.js';
import { supabase } from '../../config/supabase.js';
import { useMessageStore } from '../../store/messageStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { useUserStore } from '../../store/userStore.js';
import type { Message, Chat, RealtimePayload } from '../../types/index.js';

export class RealtimeService {
  private subscriptions = new Map<string, any>();
  private isInitialized = false;
  private currentUserId: string | null = null;

  constructor() {
    this.setupSupabaseRealtimeListeners();
  }

  // Initialize the service with user ID
  initialize(userId: string): void {
    this.currentUserId = userId;
    if (!this.isInitialized) {
      this.setupMessageSubscriptions();
      this.setupChatSubscriptions();
      this.setupUserSubscriptions();
      this.isInitialized = true;
    }
  }

  // Cleanup subscriptions
  cleanup(): void {
    this.subscriptions.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
    this.isInitialized = false;
    this.currentUserId = null;
  }

  // Setup Supabase realtime listeners for messages
  private setupMessageSubscriptions(): void {
    if (!this.currentUserId) return;

    // Subscribe to messages in chats where user is a participant
    const messageSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload: RealtimePayload<any>) => {
          this.handleMessageInsert(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload: RealtimePayload<any>) => {
          this.handleMessageUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages'
        },
        (payload: RealtimePayload<any>) => {
          this.handleMessageDelete(payload);
        }
      )
      .subscribe();

    this.subscriptions.set('messages', messageSubscription);
  }

  // Setup Supabase realtime listeners for chats
  private setupChatSubscriptions(): void {
    if (!this.currentUserId) return;

    const chatSubscription = supabase
      .channel('chats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats'
        },
        (payload: RealtimePayload<any>) => {
          this.handleChatInsert(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats'
        },
        (payload: RealtimePayload<any>) => {
          this.handleChatUpdate(payload);
        }
      )
      .subscribe();

    this.subscriptions.set('chats', chatSubscription);
  }

  // Setup Supabase realtime listeners for user presence
  private setupUserSubscriptions(): void {
    if (!this.currentUserId) return;

    const userSubscription = supabase
      .channel('users')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users'
        },
        (payload: RealtimePayload<any>) => {
          this.handleUserUpdate(payload);
        }
      )
      .subscribe();

    this.subscriptions.set('users', userSubscription);
  }

  // Setup general Supabase realtime listeners
  private setupSupabaseRealtimeListeners(): void {
    // Handle connection status
    supabase.realtime.onOpen(() => {
      console.log('Supabase realtime connected');
    });

    supabase.realtime.onClose(() => {
      console.log('Supabase realtime disconnected');
    });

    supabase.realtime.onError((error) => {
      console.error('Supabase realtime error:', error);
    });
  }

  // Handle message insert from Supabase
  private handleMessageInsert(payload: RealtimePayload<any>): void {
    try {
      const messageData = payload.new;
      const message: Message = {
        messageId: messageData.message_id,
        chatId: messageData.chat_id,
        sender: messageData.sender,
        content: messageData.content,
        timestamp: messageData.timestamp,
        readBy: messageData.read_by || {},
        edited: messageData.edited || false,
        editedAt: messageData.edited_at,
        replyTo: messageData.reply_to,
        reactions: messageData.reactions || {},
        type: messageData.type,
        status: 'delivered'
      };

      // Only add to store if not from Socket.io (to avoid duplicates)
      if (!this.isFromSocket(message)) {
        const { addMessageToChat } = useMessageStore.getState();
        const { updateChatLastMessage: updateChatLast } = useChatStore.getState();
        
        addMessageToChat(message.chatId, message);
        updateChatLast(message.chatId, {
          messageId: message.messageId,
          content: message.content.text || 'Media',
          sender: message.sender,
          timestamp: message.timestamp,
          type: message.type
        });
      }
    } catch (error) {
      console.error('Error handling message insert:', error);
    }
  }

  // Handle message update from Supabase
  private handleMessageUpdate(payload: RealtimePayload<any>): void {
    try {
      const messageData = payload.new;
      const { updateMessage } = useMessageStore.getState();
      
      updateMessage(messageData.message_id, {
        content: messageData.content,
        edited: messageData.edited,
        editedAt: messageData.edited_at,
        readBy: messageData.read_by || {},
        reactions: messageData.reactions || {}
      });
    } catch (error) {
      console.error('Error handling message update:', error);
    }
  }

  // Handle message delete from Supabase
  private handleMessageDelete(payload: RealtimePayload<any>): void {
    try {
      const messageData = payload.old;
      const { removeMessage } = useMessageStore.getState();
      
      removeMessage(messageData.chat_id, messageData.message_id);
    } catch (error) {
      console.error('Error handling message delete:', error);
    }
  }

  // Handle chat insert from Supabase
  private handleChatInsert(payload: RealtimePayload<any>): void {
    try {
      const chatData = payload.new;
      
      // Check if current user is a participant
      if (chatData.participants && chatData.participants.includes(this.currentUserId)) {
        const chat: Chat = {
          chatId: chatData.chat_id,
          type: chatData.type,
          participants: chatData.participants,
          lastMessage: chatData.last_message,
          createdAt: chatData.created_at,
          updatedAt: chatData.updated_at,
          groupInfo: chatData.group_info,
          unreadCount: 0
        };

        const { addChat } = useChatStore.getState();
        addChat(chat);

        // Join the chat room via Socket.io
        if (socketClient.isSocketConnected()) {
          socketClient.joinChat(chat.chatId);
        }
      }
    } catch (error) {
      console.error('Error handling chat insert:', error);
    }
  }

  // Handle chat update from Supabase
  private handleChatUpdate(payload: RealtimePayload<any>): void {
    try {
      const chatData = payload.new;
      const { updateChat } = useChatStore.getState();
      
      updateChat(chatData.chat_id, {
        participants: chatData.participants,
        lastMessage: chatData.last_message,
        updatedAt: chatData.updated_at,
        groupInfo: chatData.group_info
      });
    } catch (error) {
      console.error('Error handling chat update:', error);
    }
  }

  // Handle user update from Supabase
  private handleUserUpdate(payload: RealtimePayload<any>): void {
    try {
      const userData = payload.new;
      const { updateUser } = useUserStore.getState();
      
      updateUser(userData.uid, {
        displayName: userData.display_name,
        photoURL: userData.photo_url,
        bio: userData.bio,
        status: userData.status,
        lastSeen: userData.last_seen,
        settings: userData.settings
      });
    } catch (error) {
      console.error('Error handling user update:', error);
    }
  }

  // Check if message is from Socket.io to avoid duplicates
  private isFromSocket(message: Message): boolean {
    // Simple heuristic: if message was received very recently via Socket.io,
    // it's likely the same message
    const now = Date.now();
    const messageTime = new Date(message.timestamp).getTime();
    const timeDiff = now - messageTime;
    
    // If message is less than 5 seconds old, consider it might be from Socket.io
    return timeDiff < 5000 && socketClient.isSocketConnected();
  }

  // Send message through both Socket.io and Supabase
  async sendMessage(messageData: any): Promise<void> {
    try {
      // Send via Socket.io for real-time delivery
      if (socketClient.isSocketConnected()) {
        socketClient.sendMessage(messageData);
      }

      // Also save to Supabase as backup (Socket.io server should handle this)
      // This is handled by the Socket.io server, but we could add direct Supabase
      // insertion here as a fallback if Socket.io is not connected
      if (!socketClient.isSocketConnected()) {
        await this.saveMessageToSupabase(messageData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Fallback method to save message directly to Supabase
  private async saveMessageToSupabase(messageData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          message_id: messageData.messageId,
          chat_id: messageData.chatId,
          sender: messageData.sender,
          content: messageData.content,
          timestamp: messageData.timestamp,
          type: messageData.type,
          reply_to: messageData.replyTo,
          read_by: {},
          edited: false,
          reactions: {}
        });

      if (error) {
        console.error('Error saving message to Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveMessageToSupabase:', error);
      throw error;
    }
  }

  // Get connection status
  getConnectionStatus(): {
    socketConnected: boolean;
    supabaseConnected: boolean;
    subscriptionsActive: number;
  } {
    return {
      socketConnected: socketClient.isSocketConnected(),
      supabaseConnected: supabase.realtime.isConnected(),
      subscriptionsActive: this.subscriptions.size
    };
  }
}

// Create singleton instance
export const realtimeService = new RealtimeService();

export default realtimeService;
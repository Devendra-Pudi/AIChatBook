import { useEffect, useCallback, useRef } from 'react';
import { socketClient, MessageData, TypingData, ReadReceiptData, UserStatusData } from '../services/socket/socketClient.js';
import { useUserStore } from '../store/userStore.js';
import { useMessageStore } from '../store/messageStore.js';
import { useChatStore } from '../store/chatStore.js';
import { Message, UserPresenceEvent } from '../types/index.js';

export interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: any) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  
  const { currentUser, updateUserStatusWithTimestamp, setUserOnlineStatus } = useUserStore();
  const { addMessageToChat, markMessageAsReadWithDetails, setTypingUsers } = useMessageStore();
  const { updateChatLastMessage } = useChatStore();
  
  const isInitialized = useRef(false);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize socket connection
  const connect = useCallback(async () => {
    if (!currentUser?.uid || socketClient.isSocketConnected()) {
      return;
    }

    try {
      await socketClient.connect(currentUser.uid);
      console.log('Socket connected successfully');
      onConnect?.();
    } catch (error) {
      console.error('Failed to connect socket:', error);
      onError?.(error);
    }
  }, [currentUser?.uid, onConnect, onError]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    socketClient.disconnect();
    console.log('Socket disconnected');
  }, []);

  // Send message
  const sendMessage = useCallback((messageData: MessageData) => {
    try {
      socketClient.sendMessage(messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, []);

  // Join chat room
  const joinChat = useCallback((chatId: string) => {
    try {
      socketClient.joinChat(chatId);
    } catch (error) {
      console.error('Failed to join chat:', error);
    }
  }, []);

  // Leave chat room
  const leaveChat = useCallback((chatId: string) => {
    try {
      socketClient.leaveChat(chatId);
    } catch (error) {
      console.error('Failed to leave chat:', error);
    }
  }, []);

  // Start typing indicator
  const startTyping = useCallback((chatId: string) => {
    if (!currentUser?.displayName) return;
    
    try {
      socketClient.startTyping(chatId, currentUser.displayName);
    } catch (error) {
      console.error('Failed to start typing indicator:', error);
    }
  }, [currentUser?.displayName]);

  // Stop typing indicator
  const stopTyping = useCallback((chatId: string) => {
    try {
      socketClient.stopTyping(chatId);
    } catch (error) {
      console.error('Failed to stop typing indicator:', error);
    }
  }, []);

  // Mark message as read
  const markAsRead = useCallback((messageId: string, chatId: string) => {
    try {
      socketClient.markMessageAsRead(messageId, chatId);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  // Update user status
  const updateStatus = useCallback((status: UserStatusData['status']) => {
    try {
      socketClient.updateUserStatus(status);
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  }, []);

  // Handle typing with auto-stop
  const handleTyping = useCallback((chatId: string, isTyping: boolean) => {
    const timeoutKey = `${chatId}-typing`;
    
    // Clear existing timeout
    const existingTimeout = typingTimeouts.current.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      typingTimeouts.current.delete(timeoutKey);
    }

    if (isTyping) {
      startTyping(chatId);
      
      // Auto-stop typing after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        stopTyping(chatId);
        typingTimeouts.current.delete(timeoutKey);
      }, 3000);
      
      typingTimeouts.current.set(timeoutKey, timeout);
    } else {
      stopTyping(chatId);
    }
  }, [startTyping, stopTyping]);

  // Set up event listeners
  useEffect(() => {
    if (isInitialized.current) return;

    // Message events
    socketClient.on('message:receive', (message: Message) => {
      addMessageToChat(message.chatId, message);
      updateChatLastMessage(message.chatId, {
        messageId: message.messageId,
        content: message.content.text || 'Media',
        sender: message.sender,
        timestamp: message.timestamp,
        type: message.type
      });
    });

    socketClient.on('message:read', (readData: ReadReceiptData) => {
      markMessageAsReadWithDetails(readData.chatId, readData.messageId, readData.userId, readData.timestamp);
    });

    // Typing events
    socketClient.on('message:typing:start', (data: TypingData) => {
      setTypingUsers(data.chatId, data.userId, true);
    });

    socketClient.on('message:typing:stop', (data: TypingData) => {
      setTypingUsers(data.chatId, data.userId, false);
    });

    // User presence events
    socketClient.on('user:online', (data: UserPresenceEvent) => {
      setUserOnlineStatus(data.userId, 'online');
      updateUserStatusWithTimestamp(data.userId, data.status, data.lastSeen);
    });

    socketClient.on('user:offline', (data: UserPresenceEvent) => {
      setUserOnlineStatus(data.userId, 'offline');
      updateUserStatusWithTimestamp(data.userId, data.status, data.lastSeen);
    });

    socketClient.on('user:status', (data: UserPresenceEvent) => {
      updateUserStatusWithTimestamp(data.userId, data.status, data.lastSeen);
    });

    // Connection events
    socketClient.on('user:connected', (data) => {
      console.log('User connected to socket:', data);
    });

    socketClient.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      onError?.(error);
    });

    socketClient.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      onDisconnect?.(reason);
    });

    socketClient.on('error', (error) => {
      console.error('Socket error:', error);
      onError?.(error);
    });

    isInitialized.current = true;

    // Cleanup function
    return () => {
      // Clear all typing timeouts
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
      typingTimeouts.current.clear();
    };
  }, [
    addMessageToChat, 
    updateChatLastMessage, 
    markMessageAsReadWithDetails, 
    setTypingUsers, 
    setUserOnlineStatus, 
    updateUserStatusWithTimestamp,
    onError,
    onDisconnect
  ]);

  // Auto-connect when user is available
  useEffect(() => {
    if (autoConnect && currentUser?.uid && !socketClient.isSocketConnected()) {
      connect();
    }
  }, [autoConnect, currentUser?.uid, connect]);

  // Handle page visibility changes for status updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!currentUser?.uid) return;

      if (document.hidden) {
        updateStatus('away');
      } else {
        updateStatus('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.uid, updateStatus]);

  // Handle beforeunload for cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUser?.uid) {
        updateStatus('offline');
      }
      disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser?.uid, updateStatus, disconnect]);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return socketClient.getConnectionStatus();
  }, []);

  return {
    // Connection methods
    connect,
    disconnect,
    isConnected: socketClient.isSocketConnected(),
    getConnectionStatus,
    
    // Messaging methods
    sendMessage,
    joinChat,
    leaveChat,
    markAsRead,
    
    // Typing methods
    startTyping,
    stopTyping,
    handleTyping,
    
    // Status methods
    updateStatus
  };
};

export default useSocket;
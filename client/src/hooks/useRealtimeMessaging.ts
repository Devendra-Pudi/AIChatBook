import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket.js';
import { realtimeService } from '../services/realtime/realtimeService.js';
import { useUserStore } from '../store/userStore.js';
import { useUIStore } from '../store/uiStore.js';
import type { MessageData } from '../services/socket/socketClient.js';

export interface UseRealtimeMessagingOptions {
  enableSocket?: boolean;
  enableSupabase?: boolean;
  onConnectionChange?: (status: any) => void;
  onError?: (error: any) => void;
}

export const useRealtimeMessaging = (options: UseRealtimeMessagingOptions = {}) => {
  const {
    enableSocket = true,
    enableSupabase = true,
    onConnectionChange,
    onError
  } = options;

  const { currentUser } = useUserStore();
  const { addNotification } = useUIStore();
  const isInitialized = useRef(false);

  // Socket.io integration
  const socket = useSocket({
    autoConnect: enableSocket,
    onConnect: () => {
      console.log('Socket.io connected');
      onConnectionChange?.(getConnectionStatus());
    },
    onDisconnect: (reason) => {
      console.log('Socket.io disconnected:', reason);
      onConnectionChange?.(getConnectionStatus());
    },
    onError: (error) => {
      console.error('Socket.io error:', error);
      onError?.(error);
    }
  });

  // Initialize realtime services
  useEffect(() => {
    if (!currentUser?.uid || isInitialized.current) return;

    try {
      // Initialize Supabase realtime if enabled
      if (enableSupabase) {
        realtimeService.initialize(currentUser.uid);
        console.log('Supabase realtime initialized');
      }

      isInitialized.current = true;
      onConnectionChange?.(getConnectionStatus());
    } catch (error) {
      console.error('Error initializing realtime services:', error);
      onError?.(error);
    }

    // Cleanup on unmount or user change
    return () => {
      if (enableSupabase) {
        realtimeService.cleanup();
      }
      isInitialized.current = false;
    };
  }, [currentUser?.uid, enableSupabase, onConnectionChange, onError]);

  // Send message with fallback strategy
  const sendMessage = useCallback(async (messageData: MessageData) => {
    try {
      // Try Socket.io first for real-time delivery
      if (enableSocket && socket.isConnected) {
        socket.sendMessage(messageData);
        return;
      }

      // Fallback to direct Supabase if Socket.io is not available
      if (enableSupabase) {
        await realtimeService.sendMessage(messageData);
        return;
      }

      throw new Error('No realtime service available');
    } catch (error) {
      console.error('Error sending message:', error);
      
      addNotification({
        type: 'error',
        title: 'Message Failed',
        message: 'Failed to send message. Please try again.',
        read: false,
      });
      
      throw error;
    }
  }, [enableSocket, enableSupabase, socket, addNotification]);

  // Join chat room
  const joinChat = useCallback((chatId: string) => {
    try {
      if (enableSocket && socket.isConnected) {
        socket.joinChat(chatId);
      }
    } catch (error) {
      console.error('Error joining chat:', error);
      onError?.(error);
    }
  }, [enableSocket, socket, onError]);

  // Leave chat room
  const leaveChat = useCallback((chatId: string) => {
    try {
      if (enableSocket && socket.isConnected) {
        socket.leaveChat(chatId);
      }
    } catch (error) {
      console.error('Error leaving chat:', error);
      onError?.(error);
    }
  }, [enableSocket, socket, onError]);

  // Handle typing indicators
  const handleTyping = useCallback((chatId: string, isTyping: boolean) => {
    try {
      if (enableSocket && socket.isConnected) {
        socket.handleTyping(chatId, isTyping);
      }
    } catch (error) {
      console.error('Error handling typing:', error);
    }
  }, [enableSocket, socket]);

  // Mark message as read
  const markAsRead = useCallback((messageId: string, chatId: string) => {
    try {
      if (enableSocket && socket.isConnected) {
        socket.markAsRead(messageId, chatId);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [enableSocket, socket]);

  // Update user status
  const updateStatus = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    try {
      if (enableSocket && socket.isConnected) {
        socket.updateStatus(status);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, [enableSocket, socket]);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    const socketStatus = socket.getConnectionStatus();
    const realtimeStatus = realtimeService.getConnectionStatus();
    
    return {
      socket: {
        connected: socketStatus.connected,
        socketId: socketStatus.socketId,
        userId: socketStatus.userId,
        reconnectAttempts: socketStatus.reconnectAttempts
      },
      supabase: {
        connected: realtimeStatus.supabaseConnected,
        subscriptionsActive: realtimeStatus.subscriptionsActive
      },
      overall: {
        connected: socketStatus.connected || realtimeStatus.supabaseConnected,
        primaryService: socketStatus.connected ? 'socket' : 'supabase'
      }
    };
  }, [socket]);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getConnectionStatus();
      onConnectionChange?.(status);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [getConnectionStatus, onConnectionChange]);

  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network came online');
      if (currentUser?.uid && enableSocket && !socket.isConnected) {
        socket.connect().catch(error => {
          console.error('Failed to reconnect socket after network recovery:', error);
        });
      }
    };

    const handleOffline = () => {
      console.log('Network went offline');
      addNotification({
        type: 'warning',
        title: 'Network Offline',
        message: 'You are currently offline. Messages will be sent when connection is restored.',
        read: false,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser?.uid, enableSocket, socket, addNotification]);

  return {
    // Connection status
    isConnected: getConnectionStatus().overall.connected,
    connectionStatus: getConnectionStatus(),
    
    // Messaging methods
    sendMessage,
    joinChat,
    leaveChat,
    markAsRead,
    
    // Interaction methods
    handleTyping,
    updateStatus,
    
    // Socket-specific methods (for backward compatibility)
    startTyping: socket.startTyping,
    stopTyping: socket.stopTyping,
    
    // Connection management
    connect: socket.connect,
    disconnect: () => {
      socket.disconnect();
      if (enableSupabase) {
        realtimeService.cleanup();
      }
    }
  };
};

export default useRealtimeMessaging;
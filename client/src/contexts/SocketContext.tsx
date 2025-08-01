import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSocket, UseSocketOptions } from '../hooks/useSocket.js';
import { useUserStore } from '../store/userStore.js';
import { useUIStore } from '../store/uiStore.js';

interface SocketContextType {
  isConnected: boolean;
  connectionStatus: {
    connected: boolean;
    socketId: string | null;
    userId: string | null;
    reconnectAttempts: number;
  };
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (messageData: any) => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  handleTyping: (chatId: string, isTyping: boolean) => void;
  markAsRead: (messageId: string, chatId: string) => void;
  updateStatus: (status: 'online' | 'away' | 'busy' | 'offline') => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
  options?: UseSocketOptions;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ 
  children, 
  options = {} 
}) => {
  const { currentUser } = useUserStore();
  const { setOnlineStatus, addNotification } = useUIStore();
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    reconnecting: false,
    error: null as string | null
  });

  const socketOptions: UseSocketOptions = {
    autoConnect: true,
    onConnect: () => {
      console.log('Socket connected successfully');
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: true, 
        reconnecting: false, 
        error: null 
      }));
      setOnlineStatus(true);
      
      addNotification({
        id: `connection-${Date.now()}`,
        type: 'success',
        title: 'Connected',
        message: 'Real-time messaging is now active',
        timestamp: new Date().toISOString(),
        read: false
      });
    },
    onDisconnect: (reason: string) => {
      console.log('Socket disconnected:', reason);
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: false, 
        reconnecting: reason !== 'io client disconnect' 
      }));
      setOnlineStatus(false);
      
      if (reason !== 'io client disconnect') {
        addNotification({
          id: `disconnection-${Date.now()}`,
          type: 'warning',
          title: 'Connection Lost',
          message: 'Attempting to reconnect...',
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    },
    onError: (error: any) => {
      console.error('Socket error:', error);
      setConnectionState(prev => ({ 
        ...prev, 
        error: error.message || 'Connection error' 
      }));
      
      addNotification({
        id: `error-${Date.now()}`,
        type: 'error',
        title: 'Connection Error',
        message: error.message || 'Failed to connect to real-time services',
        timestamp: new Date().toISOString(),
        read: false
      });
    },
    ...options
  };

  const socket = useSocket(socketOptions);

  // Update connection state when socket connection changes
  useEffect(() => {
    setConnectionState(prev => ({
      ...prev,
      isConnected: socket.isConnected
    }));
  }, [socket.isConnected]);

  // Handle user authentication changes
  useEffect(() => {
    if (currentUser?.uid && !socket.isConnected) {
      socket.connect().catch(error => {
        console.error('Failed to connect socket after user auth:', error);
      });
    } else if (!currentUser?.uid && socket.isConnected) {
      socket.disconnect();
    }
  }, [currentUser?.uid, socket]);

  const contextValue: SocketContextType = {
    isConnected: connectionState.isConnected,
    connectionStatus: socket.getConnectionStatus(),
    connect: socket.connect,
    disconnect: socket.disconnect,
    sendMessage: socket.sendMessage,
    joinChat: socket.joinChat,
    leaveChat: socket.leaveChat,
    startTyping: socket.startTyping,
    stopTyping: socket.stopTyping,
    handleTyping: socket.handleTyping,
    markAsRead: socket.markAsRead,
    updateStatus: socket.updateStatus
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
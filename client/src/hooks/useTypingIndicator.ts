import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useUserStore } from '../store';
import type { UUID } from '../types';

interface UseTypingIndicatorProps {
  chatId: UUID;
  enabled?: boolean;
}

export const useTypingIndicator = ({ chatId, enabled = true }: UseTypingIndicatorProps) => {
  const { isConnected, startTyping: socketStartTyping, stopTyping: socketStopTyping } = useSocket();
  const { currentUser } = useUserStore();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!isConnected || !enabled || !chatId || !currentUser) return;

    // Prevent sending duplicate typing events
    if (isTypingRef.current === isTyping) return;
    
    isTypingRef.current = isTyping;

    if (isTyping) {
      socketStartTyping(chatId);
    } else {
      socketStopTyping(chatId);
    }
  }, [isConnected, enabled, chatId, currentUser, socketStartTyping, socketStopTyping]);

  // Start typing indicator
  const startTyping = useCallback(() => {
    if (!enabled) return;

    sendTypingIndicator(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [enabled, sendTypingIndicator]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (!enabled) return;

    sendTypingIndicator(false);

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [enabled, sendTypingIndicator]);

  // Handle text input changes
  const handleInputChange = useCallback((text: string) => {
    if (!enabled) return;

    if (text.trim().length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [enabled, startTyping, stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Send stop typing when component unmounts
      if (isTypingRef.current) {
        sendTypingIndicator(false);
      }
    };
  }, [sendTypingIndicator]);

  // Stop typing when chat changes
  useEffect(() => {
    stopTyping();
  }, [chatId, stopTyping]);

  return {
    startTyping,
    stopTyping,
    handleInputChange,
    isConnected,
  };
};
import { useEffect, useCallback, useState } from 'react';
import { presenceService, PresenceState } from '../services/presence/presenceService.js';
import { useUserStore } from '../store/userStore.js';
import { User } from '../types/index.js';

export interface UsePresenceOptions {
  autoInitialize?: boolean;
  trackActivity?: boolean;
  onStatusChange?: (status: User['status']) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
}

export const usePresence = (options: UsePresenceOptions = {}) => {
  const {
    autoInitialize = true,
    trackActivity = true,
    onStatusChange
  } = options;

  const { currentUser } = useUserStore();
  const [connectionStatus, setConnectionStatus] = useState(presenceService.getConnectionStatus());

  // Initialize presence service
  const initialize = useCallback(() => {
    if (!currentUser?.uid) return;

    try {
      presenceService.initialize(currentUser.uid);
      setConnectionStatus(presenceService.getConnectionStatus());
      console.log('Presence service initialized');
    } catch (error) {
      console.error('Error initializing presence service:', error);
    }
  }, [currentUser?.uid]);

  // Cleanup presence service
  const cleanup = useCallback(() => {
    presenceService.cleanup();
    setConnectionStatus(presenceService.getConnectionStatus());
    console.log('Presence service cleaned up');
  }, []);

  // Set user status
  const setStatus = useCallback(async (status: User['status']) => {
    try {
      await presenceService.setStatus(status);
      setConnectionStatus(presenceService.getConnectionStatus());
      onStatusChange?.(status);
    } catch (error) {
      console.error('Error setting status:', error);
    }
  }, [onStatusChange]);

  // Get user presence
  const getUserPresence = useCallback(async (userId: string): Promise<PresenceState | null> => {
    try {
      return await presenceService.getUserPresence(userId);
    } catch (error) {
      console.error('Error getting user presence:', error);
      return null;
    }
  }, []);

  // Get multiple users presence
  const getMultipleUserPresence = useCallback(async (userIds: string[]): Promise<PresenceState[]> => {
    try {
      return await presenceService.getMultipleUserPresence(userIds);
    } catch (error) {
      console.error('Error getting multiple user presence:', error);
      return [];
    }
  }, []);

  // Check if user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    return presenceService.isUserOnline(userId);
  }, []);

  // Get online users
  const getOnlineUsers = useCallback((): string[] => {
    return presenceService.getOnlineUsers();
  }, []);

  // Auto-initialize when user is available
  useEffect(() => {
    if (autoInitialize && currentUser?.uid && !connectionStatus.initialized) {
      initialize();
    }
  }, [autoInitialize, currentUser?.uid, connectionStatus.initialized, initialize]);

  // Cleanup on unmount or user change
  useEffect(() => {
    return () => {
      if (connectionStatus.initialized) {
        cleanup();
      }
    };
  }, [cleanup, connectionStatus.initialized]);

  // Update connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newStatus = presenceService.getConnectionStatus();
      setConnectionStatus(newStatus);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle page visibility for status updates
  useEffect(() => {
    if (!trackActivity) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setStatus('away');
      } else {
        setStatus('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackActivity, setStatus]);

  // Handle window focus/blur for status updates
  useEffect(() => {
    if (!trackActivity) return;

    const handleFocus = () => setStatus('online');
    const handleBlur = () => setStatus('away');

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [trackActivity, setStatus]);

  // Handle beforeunload for cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      setStatus('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [setStatus]);

  // Provide status shortcuts
  const goOnline = useCallback(() => setStatus('online'), [setStatus]);
  const goAway = useCallback(() => setStatus('away'), [setStatus]);
  const goBusy = useCallback(() => setStatus('busy'), [setStatus]);
  const goOffline = useCallback(() => setStatus('offline'), [setStatus]);

  return {
    // Connection status
    isInitialized: connectionStatus.initialized,
    currentStatus: connectionStatus.currentStatus,
    lastActivity: connectionStatus.lastActivity,
    onlineUsersCount: connectionStatus.onlineUsers,
    connectionStatus,

    // Control methods
    initialize,
    cleanup,
    setStatus,

    // Status shortcuts
    goOnline,
    goAway,
    goBusy,
    goOffline,

    // Query methods
    getUserPresence,
    getMultipleUserPresence,
    isUserOnline,
    getOnlineUsers
  };
};

export default usePresence;
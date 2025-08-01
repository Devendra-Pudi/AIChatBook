import { socketClient } from '../socket/socketClient.js';
import { supabase } from '../../config/supabase.js';
import { useUserStore } from '../../store/userStore.js';
import { User } from '../../types/index.js';

export interface PresenceState {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  socketId?: string;
}

export class PresenceService {
  private presenceChannel: any = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private awayTimeout: NodeJS.Timeout | null = null;
  private currentUserId: string | null = null;
  private currentStatus: User['status'] = 'offline';
  private lastActivity = Date.now();

  // Initialize presence tracking
  initialize(userId: string): void {
    this.currentUserId = userId;
    this.setupPresenceChannel();
    this.setupActivityTracking();
    this.startHeartbeat();
    this.setStatus('online');
  }

  // Cleanup presence tracking
  cleanup(): void {
    this.setStatus('offline');
    this.stopHeartbeat();
    this.stopActivityTracking();
    
    if (this.presenceChannel) {
      supabase.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }
    
    this.currentUserId = null;
  }

  // Set user status
  async setStatus(status: User['status']): Promise<void> {
    if (!this.currentUserId || this.currentStatus === status) return;

    this.currentStatus = status;
    const timestamp = new Date().toISOString();

    try {
      // Update via Socket.io
      if (socketClient.isSocketConnected()) {
        socketClient.updateUserStatus(status);
      }

      // Update in Supabase
      await this.updateUserStatusInDatabase(status, timestamp);

      // Update local store
      const { updateUserStatusWithTimestamp } = useUserStore.getState();
      updateUserStatusWithTimestamp(this.currentUserId, status, timestamp);

      console.log(`Status updated to ${status} for user ${this.currentUserId}`);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  // Get current status
  getCurrentStatus(): User['status'] {
    return this.currentStatus;
  }

  // Setup Supabase presence channel
  private setupPresenceChannel(): void {
    if (!this.currentUserId) return;

    this.presenceChannel = supabase.channel('presence', {
      config: {
        presence: {
          key: this.currentUserId
        }
      }
    });

    // Track presence state
    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = this.presenceChannel.presenceState();
        this.handlePresenceSync(presenceState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        this.handlePresenceJoin(key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        this.handlePresenceLeave(key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await this.presenceChannel.track({
            userId: this.currentUserId,
            status: this.currentStatus,
            lastSeen: new Date().toISOString(),
            socketId: socketClient.getConnectionStatus().socketId
          });
        }
      });
  }

  // Handle presence sync
  private handlePresenceSync(presenceState: any): void {
    const { setUserOnlineStatus } = useUserStore.getState();
    
    Object.keys(presenceState).forEach(userId => {
      const presence = presenceState[userId][0]; // Get first presence entry
      if (presence && userId !== this.currentUserId) {
        setUserOnlineStatus(userId, presence.status === 'offline' ? 'offline' : 'online');
      }
    });
  }

  // Handle user joining presence
  private handlePresenceJoin(userId: string, presences: any[]): void {
    if (userId === this.currentUserId) return;

    const presence = presences[0];
    if (presence) {
      const { setUserOnlineStatus, updateUserStatusWithTimestamp } = useUserStore.getState();
      setUserOnlineStatus(userId, 'online');
      updateUserStatusWithTimestamp(userId, presence.status, presence.lastSeen);
      
      console.log(`User ${userId} came online`);
    }
  }

  // Handle user leaving presence
  private handlePresenceLeave(userId: string, _presences: any[]): void {
    if (userId === this.currentUserId) return;

    const { setUserOnlineStatus, updateUserStatusWithTimestamp } = useUserStore.getState();
    setUserOnlineStatus(userId, 'offline');
    updateUserStatusWithTimestamp(userId, 'offline', new Date().toISOString());
    
    console.log(`User ${userId} went offline`);
  }

  // Setup activity tracking
  private setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      this.lastActivity = Date.now();
      
      // If user was away, set back to online
      if (this.currentStatus === 'away') {
        this.setStatus('online');
      }
      
      // Reset away timeout
      this.resetAwayTimeout();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.setStatus('away');
      } else {
        this.setStatus('online');
        this.lastActivity = Date.now();
      }
    });

    // Handle window focus/blur
    window.addEventListener('focus', () => {
      this.setStatus('online');
      this.lastActivity = Date.now();
    });

    window.addEventListener('blur', () => {
      this.setStatus('away');
    });

    // Start away timeout
    this.resetAwayTimeout();
  }

  // Stop activity tracking
  private stopActivityTracking(): void {
    if (this.awayTimeout) {
      clearTimeout(this.awayTimeout);
      this.awayTimeout = null;
    }
  }

  // Reset away timeout
  private resetAwayTimeout(): void {
    if (this.awayTimeout) {
      clearTimeout(this.awayTimeout);
    }

    // Set user as away after 5 minutes of inactivity
    this.awayTimeout = setTimeout(() => {
      if (this.currentStatus === 'online') {
        this.setStatus('away');
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Start heartbeat to maintain presence
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (this.currentUserId && this.presenceChannel) {
        try {
          // Update presence with current status
          await this.presenceChannel.track({
            userId: this.currentUserId,
            status: this.currentStatus,
            lastSeen: new Date().toISOString(),
            socketId: socketClient.getConnectionStatus().socketId
          });

          // Also update database periodically
          await this.updateUserStatusInDatabase(this.currentStatus, new Date().toISOString());
        } catch (error) {
          console.error('Error in presence heartbeat:', error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Update user status in database
  private async updateUserStatusInDatabase(status: User['status'], lastSeen: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          status,
          last_seen: lastSeen
        })
        .eq('uid', this.currentUserId);

      if (error) {
        console.error('Error updating user status in database:', error);
      }
    } catch (error) {
      console.error('Error in updateUserStatusInDatabase:', error);
    }
  }

  // Get presence information for a user
  async getUserPresence(userId: string): Promise<PresenceState | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('uid, status, last_seen')
        .eq('uid', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching user presence:', error);
        return null;
      }

      return {
        userId: data.uid,
        status: data.status,
        lastSeen: data.last_seen
      };
    } catch (error) {
      console.error('Error in getUserPresence:', error);
      return null;
    }
  }

  // Get presence for multiple users
  async getMultipleUserPresence(userIds: string[]): Promise<PresenceState[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('uid, status, last_seen')
        .in('uid', userIds);

      if (error) {
        console.error('Error fetching multiple user presence:', error);
        return [];
      }

      return data.map(user => ({
        userId: user.uid,
        status: user.status,
        lastSeen: user.last_seen
      }));
    } catch (error) {
      console.error('Error in getMultipleUserPresence:', error);
      return [];
    }
  }

  // Check if user is currently online
  isUserOnline(userId: string): boolean {
    if (!this.presenceChannel) return false;
    
    const presenceState = this.presenceChannel.presenceState();
    return userId in presenceState;
  }

  // Get all currently online users
  getOnlineUsers(): string[] {
    if (!this.presenceChannel) return [];
    
    const presenceState = this.presenceChannel.presenceState();
    return Object.keys(presenceState);
  }

  // Get connection status
  getConnectionStatus(): {
    initialized: boolean;
    currentStatus: User['status'];
    lastActivity: number;
    presenceChannelConnected: boolean;
    onlineUsers: number;
  } {
    return {
      initialized: !!this.currentUserId,
      currentStatus: this.currentStatus,
      lastActivity: this.lastActivity,
      presenceChannelConnected: !!this.presenceChannel,
      onlineUsers: this.getOnlineUsers().length
    };
  }
}

// Create singleton instance
export const presenceService = new PresenceService();

export default presenceService;
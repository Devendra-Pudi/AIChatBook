import { supabase } from '../config/supabase.js';
import type { User, UserStatusData } from '../types/index.js';

export class UserService {
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, string>(); // socketId -> userId

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  }

  async updateUserStatus(userId: string, status: UserStatusData['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          status,
          last_seen: new Date().toISOString()
        })
        .eq('uid', userId);

      if (error) {
        console.error('Error updating user status:', error);
      }
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
    }
  }

  connectUser(userId: string, socketId: string): void {
    this.connectedUsers.set(userId, socketId);
    this.userSockets.set(socketId, userId);
    this.updateUserStatus(userId, 'online');
  }

  disconnectUser(socketId: string): string | null {
    const userId = this.userSockets.get(socketId);
    if (userId) {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socketId);
      this.updateUserStatus(userId, 'offline');
      return userId;
    }
    return null;
  }

  getUserSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  getUserId(socketId: string): string | undefined {
    return this.userSockets.get(socketId);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
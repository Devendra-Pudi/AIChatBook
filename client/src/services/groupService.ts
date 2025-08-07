import { supabase } from '../config/supabase';
import type { UUID, MessageContent } from '../types';

export class GroupService {
  // Send system message for group events
  static async sendSystemMessage(
    chatId: UUID,
    type: 'member_added' | 'member_removed' | 'member_left' | 'admin_changed' | 'group_created' | 'group_updated',
    userId?: UUID,
    targetUserId?: UUID,
    data?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const systemMessage = {
        type,
        userId,
        targetUserId,
        data,
      };

      const messageContent: MessageContent = {
        text: JSON.stringify(systemMessage),
      };

      const { error } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          sender_id: null, // System messages have no sender
          content: messageContent,
          message_type: 'system',
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send system message';
      return { success: false, error: errorMessage };
    }
  }

  // Send member added notification
  static async notifyMemberAdded(chatId: UUID, addedByUserId: UUID, newMemberIds: UUID[]) {
    for (const memberId of newMemberIds) {
      await this.sendSystemMessage(chatId, 'member_added', addedByUserId, memberId);
    }
  }

  // Send member removed notification
  static async notifyMemberRemoved(chatId: UUID, removedByUserId: UUID, removedMemberIds: UUID[]) {
    for (const memberId of removedMemberIds) {
      await this.sendSystemMessage(chatId, 'member_removed', removedByUserId, memberId);
    }
  }

  // Send member left notification
  static async notifyMemberLeft(chatId: UUID, leftUserId: UUID) {
    await this.sendSystemMessage(chatId, 'member_left', leftUserId);
  }

  // Send admin changed notification
  static async notifyAdminChanged(chatId: UUID, changedByUserId: UUID, newAdminId: UUID) {
    await this.sendSystemMessage(chatId, 'admin_changed', changedByUserId, newAdminId);
  }

  // Send group created notification
  static async notifyGroupCreated(chatId: UUID, createdByUserId: UUID) {
    await this.sendSystemMessage(chatId, 'group_created', createdByUserId);
  }

  // Send group updated notification
  static async notifyGroupUpdated(chatId: UUID, updatedByUserId: UUID, changes?: any) {
    await this.sendSystemMessage(chatId, 'group_updated', updatedByUserId, undefined, changes);
  }

  // Get group statistics
  static async getGroupStats(chatId: UUID): Promise<{
    memberCount: number;
    messageCount: number;
    createdAt: string;
    lastActivity: string;
  } | null> {
    try {
      // Get member count
      const { count: memberCount, error: memberError } = await supabase
        .from('chat_participants')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId);

      if (memberError) {
        console.error('Error getting member count:', memberError);
        return null;
      }

      // Get message count
      const { count: messageCount, error: messageError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId);

      if (messageError) {
        console.error('Error getting message count:', messageError);
        return null;
      }

      // Get chat info
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('created_at, updated_at')
        .eq('id', chatId)
        .single();

      if (chatError) {
        console.error('Error getting chat info:', chatError);
        return null;
      }

      return {
        memberCount: memberCount || 0,
        messageCount: messageCount || 0,
        createdAt: chatData.created_at,
        lastActivity: chatData.updated_at,
      };
    } catch (err) {
      console.error('Error getting group stats:', err);
      return null;
    }
  }

  // Check if user can perform admin actions
  static async canPerformAdminAction(chatId: UUID, userId: UUID): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('created_by')
        .eq('id', chatId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.created_by === userId;
    } catch (err) {
      console.error('Error checking admin permissions:', err);
      return false;
    }
  }

  // Get group member roles
  static async getMemberRoles(chatId: UUID): Promise<Record<UUID, 'admin' | 'member'>> {
    try {
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('created_by')
        .eq('id', chatId)
        .single();

      if (chatError || !chatData) {
        return {};
      }

      const { data: participants, error: participantError } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId);

      if (participantError || !participants) {
        return {};
      }

      const roles: Record<UUID, 'admin' | 'member'> = {};
      participants.forEach(participant => {
        roles[participant.user_id] = participant.user_id === chatData.created_by ? 'admin' : 'member';
      });

      return roles;
    } catch (err) {
      console.error('Error getting member roles:', err);
      return {};
    }
  }

  // Validate group settings
  static validateGroupSettings(settings: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof settings.allowMemberInvites !== 'boolean') {
      errors.push('allowMemberInvites must be a boolean');
    }

    if (typeof settings.allowMediaSharing !== 'boolean') {
      errors.push('allowMediaSharing must be a boolean');
    }

    if (typeof settings.muteNotifications !== 'boolean') {
      errors.push('muteNotifications must be a boolean');
    }

    if (typeof settings.disappearingMessages !== 'boolean') {
      errors.push('disappearingMessages must be a boolean');
    }

    if (settings.disappearingMessages && settings.disappearingMessagesDuration) {
      if (typeof settings.disappearingMessagesDuration !== 'number' || 
          settings.disappearingMessagesDuration <= 0) {
        errors.push('disappearingMessagesDuration must be a positive number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}